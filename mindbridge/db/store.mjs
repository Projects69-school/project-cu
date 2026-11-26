import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

export const now = () => new Date().toISOString();
export const bangkokDate = (date = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(date);
export const token = () => randomBytes(32).toString('base64url');
export const hashToken = (value) => createHash('sha256').update(value).digest('hex');

export function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function passwordMatches(password, stored) {
  const [salt, key] = stored?.split(':') ?? ['missing-user-verification-salt', '00'.repeat(64)];
  const probe = Buffer.from(passwordHash(password, salt).split(':')[1], 'hex');
  return timingSafeEqual(probe, Buffer.from(key, 'hex')) && Boolean(stored);
}

const convert = (key) => key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
export function rowView(row) {
  if (!row) return null;
  const { data, ...columns } = row;
  return { ...(data ? JSON.parse(data) : {}), ...Object.fromEntries(Object.entries(columns).map(([key, value]) => [convert(key), value])) };
}

export function createStore(filename = ':memory:') {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename, { timeout: 4000 });
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON;');
  db.exec(readFileSync(new URL('./001-initial.sql', import.meta.url), 'utf8'));
  const get = (sql, ...params) => db.prepare(sql).get(...params);
  const all = (sql, ...params) => db.prepare(sql).all(...params);
  const run = (sql, ...params) => db.prepare(sql).run(...params);
  const insert = (table, values) => {
    const columns = Object.keys(values);
    run(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`, ...Object.values(values));
  };
  const add = (table, fields) => {
    const stamp = now();
    const row = { id: randomUUID(), ...fields, created_at: stamp, updated_at: stamp };
    insert(table, row);
    return get(`SELECT * FROM ${table} WHERE id = ?`, row.id);
  };
  const update = (table, id, fields) => {
    const values = { ...fields, updated_at: now() };
    run(`UPDATE ${table} SET ${Object.keys(values).map(key => `${key} = ?`).join(', ')} WHERE id = ?`, ...Object.values(values), id);
    return get(`SELECT * FROM ${table} WHERE id = ?`, id);
  };
  const transaction = (callback) => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = callback();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };
  const createUser = ({ schoolId, role, name, email, code = null, credential = null, verified = false, grade = '', classroomId = null, teacher = {} }) => {
    const user = add('users', { school_id: schoolId, role, name, email, student_code: code, password_hash: credential, verified: Number(verified) });
    const stamp = { created_at: now(), updated_at: now() };
    if (role === 'student') insert('student_profiles', { user_id: user.id, grade, classroom_id: classroomId, ...stamp });
    if (role === 'teacher') insert('teacher_profiles', { user_id: user.id, ...teacher, ...stamp });
    return user;
  };
  const notify = (userId, type, text, href, key = null) => {
    const receiver = get('SELECT settings FROM users WHERE id = ? AND active = 1', userId);
    if (!receiver) return;
    const settings = JSON.parse(receiver.settings);
    if (settings.notifications === false ||
        (type === 'message' && settings.messageNotifications === false) ||
        (type === 'appointment' && settings.appointmentNotifications === false)) return;
    if (key && get('SELECT id FROM notifications WHERE user_id = ? AND event_key = ?', userId, key)) return;
    add('notifications', { user_id: userId, type, text, href, event_key: key });
  };
  const audit = (user, action, entityId = null) => add('audit_logs', { school_id: user.school_id, actor_id: user.id, action, entity_id: entityId });
  const addEvent = (id, status) => insert('request_events', { id: randomUUID(), request_id: id, status, created_at: now() });
  const setRequestStatus = (request, status) => {
    if (request.status === status) return request;
    const row = update('support_requests', request.id, { status });
    addEvent(row.id, status);
    return row;
  };
  const createRequest = ({ studentId, teacherId, status = 'submitted', data, kinds = [] }) => {
    const item = add('support_requests', { student_id: studentId, teacher_id: teacherId, status, data: JSON.stringify(data) });
    addEvent(item.id, status);
    const conversation = add('conversations', { request_id: item.id });
    for (const id of [studentId, teacherId]) insert('conversation_members', { conversation_id: conversation.id, user_id: id, created_at: now(), updated_at: now() });
    for (const type of kinds) add('sharing_permissions', {
      request_id: item.id, student_id: studentId, teacher_id: teacherId, type, purpose: 'ใช้เพื่อพิจารณาและให้การช่วยเหลือตามคำขอ',
    });
    return { item, conversation };
  };
  const seedDemo = () => transaction(() => {
    const school = add('schools', { demo: 1, name: 'โรงเรียนสาธิตสะพานใจ', settings: JSON.stringify({ contact: 'ครูแนะแนวในโรงเรียน' }) });
    const classroom = add('classrooms', { school_id: school.id, name: 'ม. 5/1', grade: 'มัธยมศึกษาปีที่ 5' });
    const role = (name, role, local, extra = {}) => createUser({ schoolId: school.id, name, role, email: `${local}@demo.invalid`, verified: true, ...extra });
    const student = role('ฟ้า', 'student', 'fa', { code: 'DEMO-051', grade: classroom.grade, classroomId: classroom.id });
    const secondStudent = role('ใบหม่อน', 'student', 'baimon', { code: 'DEMO-052', grade: classroom.grade, classroomId: classroom.id });
    const teacher = role('ครูพลอย', 'teacher', 'ploy', { teacher: {
      title: 'ครูแนะแนว', training: JSON.stringify(['ทักษะการรับฟัง', 'ระบบดูแลช่วยเหลือนักเรียน']), response_time: 'ภายใน 1 วันเรียน', availability: 'วันจันทร์–ศุกร์',
    } });
    const alternate = role('ครูต้น', 'teacher', 'ton', { teacher: {
      title: 'ครูที่ปรึกษา', training: JSON.stringify(['การสื่อสารกับวัยรุ่น']), response_time: 'ภายใน 2 วันเรียน', availability: 'ตามเวลานัดหมาย',
    } });
    role('ผู้ดูแลสาธิต', 'admin', 'admin');
    for (const id of [teacher.id, alternate.id]) add('teacher_assignments', { student_id: student.id, teacher_id: id });
    add('teacher_assignments', { student_id: secondStudent.id, teacher_id: alternate.id });
    for (const id of [student.id, secondStudent.id]) add('consent_records', { user_id: id, scope: 'ยินยอมใช้งานข้อมูลสาธิตสมมติ' });
    const day = (offset) => bangkokDate(new Date(Date.now() + offset * 86400000));
    for (const [offset, emotions, intensity] of [[-4, ['สบายใจ'], 2], [-3, ['ตื่นเต้น'], 3], [-2, ['เหนื่อย'], 3], [-1, ['กังวล'], 4]]) {
      add('emotional_checkins', { student_id: student.id, date: day(offset), data: JSON.stringify({ emotions, intensity, topics: ['การเรียน'], note: '' }) });
    }
    add('journal_entries', { student_id: student.id, data: JSON.stringify({ title: 'หลังเลิกเรียนวันหนึ่ง', body: 'วันนี้ได้พักสักนิด แล้วค่อยกลับไปอ่านหนังสือต่อ', emotions: ['เหนื่อย'], draft: false }) });
    add('journal_entries', { student_id: secondStudent.id, data: JSON.stringify({ title: 'บันทึกส่วนตัวของใบหม่อน', body: 'ข้อมูลสมมติสำหรับตรวจสอบสิทธิ์', emotions: [], draft: false }) });
    const old = createRequest({ studentId: student.id, teacherId: teacher.id, status: 'replied', data: {
      supportType: 'อยากให้มีคนรับฟัง', method: 'ส่งข้อความ', topic: 'การเรียน', message: 'ช่วงนี้รู้สึกเหนื่อยจากการเตรียมสอบค่ะ', emotion: 'เหนื่อย',
    }, kinds: ['คำขอความช่วยเหลือ', 'ข้อความที่เลือกส่ง'] });
    add('messages', { conversation_id: old.conversation.id, sender_id: student.id, text: 'ช่วงนี้รู้สึกเหนื่อยจากการเตรียมสอบค่ะ', read_at: now() });
    add('messages', { conversation_id: old.conversation.id, sender_id: teacher.id, text: 'ขอบคุณที่ไว้ใจเล่าให้ครูฟังนะ ฟ้าค่อย ๆ เล่าตามที่พร้อมได้เลย' });
    notify(student.id, 'message', 'ครูส่งข้อความถึงเธอ', '/student/messages');
    let nextSlot;
    for (const [offset, hour] of [[1, '13'], [2, '10'], [3, '15'], [6, '11']]) {
      const slot = add('teacher_availability', { teacher_id: teacher.id, start_at: new Date(`${day(offset)}T${hour}:00:00+07:00`).toISOString(), end_at: new Date(`${day(offset)}T${hour}:30:00+07:00`).toISOString() });
      nextSlot ??= slot;
    }
    add('appointments', { slot_id: nextSlot.id, request_id: old.item.id, student_id: student.id, teacher_id: teacher.id, status: 'confirmed', data: JSON.stringify({ kind: 'พบครูเป็นส่วนตัว', note: '' }) });
    add('follow_ups', { request_id: old.item.id, status: 'pending', due_at: new Date(`${day(7)}T15:00:00+07:00`).toISOString(), data: JSON.stringify({ note: 'คุยกันอีกครั้งหลังสอบ' }) });
    const demoToken = token();
    insert('demo_workspaces', { token_hash: hashToken(demoToken), school_id: school.id, expires_at: new Date(Date.now() + 86400000).toISOString() });
    return { school, demoToken };
  });
  return { db, get, all, run, insert, add, update, transaction, createUser, notify, audit, addEvent, setRequestStatus, createRequest, seedDemo, close: () => db.close() };
}
