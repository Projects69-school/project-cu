import { timingSafeEqual } from 'node:crypto';
import { bangkokDate, hashToken, now, passwordHash, passwordMatches, rowView, token } from './db/store.mjs';

const roles = ['student', 'teacher'];
const requestStates = ['submitted', 'received', 'replied', 'talking', 'appointment', 'caring', 'follow-up', 'referred', 'closed', 'reopened'];
const sessionDuration = 8 * 60 * 60;
const demoDuration = 24 * 60 * 60;
const imageLimit = 2 * 1024 * 1024;
const private404 = 'ไม่พบรายการหรือเธอไม่มีสิทธิ์เข้าถึง';
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function expect(ok, message = 'กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง', status = 400) {
  if (!ok) throw new HttpError(status, message);
}
const text = (value, limit = 3000) => (typeof value === 'string' ? value.trim().slice(0, limit) : '');
const list = (value, limit = 16) => Array.isArray(value) ? [...new Set(value.map(item => text(item, 120)).filter(Boolean))].slice(0, limit) : [];
const pick = (value, options, message) => { expect(options.includes(value), message); return value; };
const isoTime = value => {
  expect(typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value)), 'กรุณาเลือกวันและเวลาที่ถูกต้อง');
  return new Date(value).toISOString();
};
const passwordOK = value => typeof value === 'string' && value.length >= 10 && value.length <= 128;
const emailOK = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 160;
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);
const settingsJSON = (value, previous = {}) => {
  const valid = Object.fromEntries(Object.entries(isObject(value) ? value : {}).filter(([key, field]) => /^[a-zA-Z][\w-]{0,46}$/.test(key) && (field === null || typeof field === 'boolean' || (typeof field === 'string' && field.length < 500) || Number.isSafeInteger(field))));
  return JSON.stringify({ ...previous, ...valid });
};
const configMatches = (actual, expected) => {
  if (!expected || typeof actual !== 'string') return false;
  return timingSafeEqual(Buffer.from(hashToken(actual)), Buffer.from(hashToken(expected)));
};

export function userView(store, user) {
  if (!user) return null;
  const school = store.get('SELECT name, demo FROM schools WHERE id = ?', user.school_id);
  const student = user.role === 'student' && store.get('SELECT grade FROM student_profiles WHERE user_id = ?', user.id);
  const teacher = user.role === 'teacher' && store.get('SELECT * FROM teacher_profiles WHERE user_id = ?', user.id);
  return {
    id: user.id, role: user.role, name: user.name, email: user.email, avatar: user.avatar,
    demo: Boolean(school.demo), verified: Boolean(user.verified), active: Boolean(user.active), grade: student?.grade || '',
    title: teacher?.title || '', training: teacher ? JSON.parse(teacher.training) : [], responseTime: teacher?.response_time || '',
    availability: teacher?.availability || '', schoolName: school.name, settings: JSON.parse(user.settings),
  };
}

export function getSession(store, sessionToken) {
  if (!sessionToken) return null;
  const time = now();
  return store.get(`SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id JOIN schools sc ON sc.id = u.school_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1 AND (u.role <> 'teacher' OR u.verified = 1)
    AND (sc.demo = 0 OR EXISTS (SELECT 1 FROM demo_workspaces d WHERE d.school_id = sc.id AND d.expires_at > ?))`, hashToken(sessionToken), time, time) ?? null;
}

export function removeExpiredWorkspaces(store) {
  const time = now();
  store.run('DELETE FROM sessions WHERE expires_at <= ?', time);
  store.run('DELETE FROM schools WHERE demo = 1 AND id IN (SELECT school_id FROM demo_workspaces WHERE expires_at <= ?)', time);
}

export function bootstrap(store, config) {
  const school = store.get('SELECT * FROM schools WHERE demo = 0 ORDER BY created_at LIMIT 1') ||
    store.add('schools', { demo: 0, name: text(config.schoolName, 120) || 'โรงเรียน MindBridge', settings: '{}' });
  if (config.adminEmail || config.adminPassword) {
    expect(emailOK(config.adminEmail || '') && passwordOK(config.adminPassword), 'ตั้งค่า APP_ADMIN_EMAIL และ APP_ADMIN_PASSWORD ให้ถูกต้องก่อนเปิดระบบ');
    if (!store.get('SELECT id FROM users WHERE school_id = ? AND role = ?', school.id, 'admin')) {
      store.createUser({ schoolId: school.id, role: 'admin', name: 'ผู้ดูแลโรงเรียน', email: config.adminEmail.toLowerCase(), credential: passwordHash(config.adminPassword), verified: true });
    }
  }
  removeExpiredWorkspaces(store);
  return school;
}

function assigned(s, studentId, teacherId) {
  return Boolean(s.get(`SELECT 1 FROM teacher_assignments a
    JOIN users t ON t.id = a.teacher_id AND t.role = 'teacher' AND t.verified = 1 AND t.active = 1
    JOIN users p ON p.id = a.student_id AND p.role = 'student' AND p.school_id = t.school_id AND p.active = 1
    WHERE a.student_id = ? AND a.teacher_id = ?`, studentId, teacherId));
}
function participant(s, user, item) {
  return Boolean(item && ((user.role === 'student' && item.student_id === user.id) ||
    (user.role === 'teacher' && item.teacher_id === user.id && assigned(s, item.student_id, user.id))));
}
function requestFor(s, user, id) {
  const item = s.get('SELECT * FROM support_requests WHERE id = ?', id || '');
  expect(participant(s, user, item), private404, 404);
  return item;
}
function requestView(s, row) {
  const item = rowView(row);
  item.studentName = s.get('SELECT name FROM users WHERE id = ?', row.student_id)?.name;
  item.studentGrade = s.get('SELECT grade FROM student_profiles WHERE user_id = ?', row.student_id)?.grade;
  item.teacherName = s.get('SELECT name FROM users WHERE id = ?', row.teacher_id)?.name;
  item.conversationId = s.get('SELECT id FROM conversations WHERE request_id = ?', row.id)?.id;
  item.events = s.all('SELECT * FROM request_events WHERE request_id = ? ORDER BY rowid', row.id).map(rowView);
  item.timeline = item.events;
  return item;
}
function conversationFor(s, user, id) {
  const conversation = s.get(`SELECT c.*,cm.archived FROM conversations c
    JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = ? WHERE c.id = ?`, user.id, id || '');
  expect(conversation, private404, 404);
  const request = requestFor(s, user, conversation.request_id);
  return { conversation, request, otherId: user.role === 'student' ? request.teacher_id : request.student_id };
}
function conversationView(s, user, row) {
  const other = s.get(`SELECT u.id,u.name,u.avatar FROM conversation_members cm JOIN users u ON u.id = cm.user_id
    WHERE conversation_id = ? AND user_id <> ?`, row.id, user.id);
  const last = s.get('SELECT text,created_at FROM messages WHERE conversation_id = ? ORDER BY rowid DESC LIMIT 1', row.id);
  const unread = s.get('SELECT COUNT(*) amount FROM messages WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL', row.id, user.id).amount;
  return { ...rowView(row), archived: Boolean(row.archived), otherId: other.id, otherName: other.name, otherAvatar: other.avatar, lastText: last?.text || '', lastAt: last?.created_at || row.created_at, unread };
}
function journalView(s, row) {
  const attachments = s.all('SELECT id,name,mime,created_at FROM journal_attachments WHERE journal_id = ? ORDER BY rowid', row.id).map(rowView);
  return { ...rowView(row), attachments };
}
function appointmentView(s, row) {
  const times = s.get('SELECT start_at,end_at FROM teacher_availability WHERE id = ?', row.slot_id);
  return { ...rowView(row), ...rowView(times), teacherName: s.get('SELECT name FROM users WHERE id = ?', row.teacher_id)?.name, studentName: s.get('SELECT name FROM users WHERE id = ?', row.student_id)?.name };
}
const messagesIn = `SELECT m.*,a.id AS attachment_id,a.name AS attachment_name FROM messages m LEFT JOIN message_attachments a ON a.message_id = m.id`;
const thaiNotifications = {
  request: 'มีคำขอความช่วยเหลือใหม่', accepted: 'ครูรับคำขอแล้ว', message: 'มีข้อความใหม่', appointment: 'มีการอัปเดตนัดหมาย',
  'follow-up': 'มีการอัปเดตการติดตามผล', referral: 'มีการอัปเดตการส่งต่อ', support: 'มีการอัปเดตเส้นทางการดูแล',
};
const notificationView = row => ({ ...rowView(row), title: thaiNotifications[row.type] || row.text, message: row.text, read: Boolean(row.read_at) });
const teacherDirectory = `SELECT u.id,u.name,u.avatar,u.verified,t.title,t.training,t.response_time,t.availability
  FROM users u JOIN teacher_profiles t ON t.user_id = u.id`;
const teacherView = row => ({ ...rowView(row), verified: Boolean(row.verified), training: JSON.parse(row.training), role: row.title });

function workspace(s, user) {
  const school = s.get('SELECT id,name,demo,settings FROM schools WHERE id = ?', user.school_id);
  const notifications = s.all('SELECT id,type,text,href,read_at,created_at FROM notifications WHERE user_id = ? ORDER BY rowid DESC LIMIT 120', user.id).map(notificationView);
  const consents = s.all('SELECT id,scope,created_at FROM consent_records WHERE user_id = ? ORDER BY rowid DESC', user.id).map(rowView);
  const base = {
    user: userView(s, user), school: { ...rowView(school), settings: JSON.parse(school.settings) }, teachers: [], students: [],
    checkins: [], journals: [], requests: [], conversations: [], appointments: [], availability: [], plans: [], notes: [],
    followUps: [], referrals: [], notifications, history: [], consents,
  };
  if (user.role === 'admin') {
    const users = s.all(`SELECT u.id,u.name,u.email,u.role,u.active,u.verified,p.grade,p.classroom_id FROM users u
      LEFT JOIN student_profiles p ON p.user_id = u.id WHERE school_id = ? ORDER BY role,name`, school.id)
      .map(row => ({ ...rowView(row), active: Boolean(row.active), verified: Boolean(row.verified) }));
    const classrooms = s.all('SELECT * FROM classrooms WHERE school_id = ? ORDER BY name', school.id).map(rowView);
    const assignments = s.all(`SELECT a.*,p.name AS student_name,t.name AS teacher_name FROM teacher_assignments a
      JOIN users p ON p.id = a.student_id JOIN users t ON t.id = a.teacher_id WHERE p.school_id = ? ORDER BY p.name,t.name`, school.id).map(rowView);
    const audit = s.all(`SELECT a.id,a.actor_id,u.name AS actor_name,a.action,a.entity_id,a.created_at FROM audit_logs a
      LEFT JOIN users u ON u.id = a.actor_id WHERE a.school_id = ? ORDER BY a.rowid DESC LIMIT 160`, school.id).map(rowView);
    const tickets = s.all(`SELECT p.id,p.user_id,p.kind,p.kind AS type,p.reason,p.status,p.created_at,u.name AS user_name FROM privacy_requests p
      JOIN users u ON u.id = p.user_id WHERE u.school_id = ? ORDER BY p.rowid DESC LIMIT 120`, school.id).map(rowView);
    base.consents = s.all(`SELECT c.id,c.scope,c.created_at,u.name AS user_name FROM consent_records c
      JOIN users u ON u.id = c.user_id WHERE u.school_id = ? ORDER BY c.rowid DESC LIMIT 120`, school.id).map(rowView);
    return { ...base, users, classrooms, assignments, audit, tickets, counts: users.length >= 5 ? { users: users.length } : null };
  }
  const student = user.role === 'student';
  const teachers = student ? s.all(`${teacherDirectory}
    JOIN teacher_assignments a ON a.teacher_id = u.id WHERE a.student_id = ? AND u.verified = 1 AND u.active = 1 ORDER BY u.rowid`, user.id).map(teacherView) : [];
  const students = student ? [] : s.all(`SELECT u.id,u.name,u.avatar,p.grade FROM users u
    JOIN student_profiles p ON u.id = p.user_id JOIN teacher_assignments a ON a.student_id = u.id
    WHERE a.teacher_id = ? AND u.active = 1 ORDER BY u.name`, user.id).map(rowView);
  const requests = s.all(`SELECT * FROM support_requests WHERE ${student ? 'student_id' : 'teacher_id'} = ? ORDER BY rowid DESC`, user.id).filter(row => participant(s, user, row));
  const requestIds = new Set(requests.map(row => row.id));
  const children = table => s.all(`SELECT t.* FROM ${table} t JOIN support_requests r ON r.id = t.request_id
    WHERE ${student ? 'r.student_id' : 'r.teacher_id'} = ? ORDER BY t.rowid DESC`, user.id).filter(row => requestIds.has(row.request_id)).map(rowView);
  const conversations = s.all(`SELECT c.*,cm.archived FROM conversations c JOIN conversation_members cm ON cm.conversation_id = c.id
    WHERE cm.user_id = ? ORDER BY c.updated_at DESC`, user.id).filter(row => requestIds.has(row.request_id)).map(row => conversationView(s, user, row));
  const appointments = s.all(`SELECT * FROM appointments WHERE ${student ? 'student_id' : 'teacher_id'} = ? ORDER BY rowid DESC`, user.id)
    .filter(row => participant(s, user, row)).map(row => appointmentView(s, row));
  const availability = (student ? teachers : [user]).flatMap(teacher => s.all(`SELECT a.*,
    NOT EXISTS (SELECT 1 FROM appointments p WHERE p.slot_id = a.id AND p.status IN ('requested','confirmed','suggested')) AS available
    FROM teacher_availability a WHERE a.teacher_id = ? AND a.end_at > ? ORDER BY a.start_at`, teacher.id, now())
    .map(row => ({ ...rowView(row), teacherName: teacher.name, available: Boolean(row.available) })));
  const history = student ? s.all(`SELECT p.id,p.request_id,p.type,p.purpose,p.created_at,u.name AS teacher_name FROM sharing_permissions p
    JOIN users u ON u.id = p.teacher_id WHERE p.student_id = ? ORDER BY p.rowid DESC`, user.id).map(rowView) : [];
  return {
    ...base, teachers, students,
    checkins: student ? s.all('SELECT * FROM emotional_checkins WHERE student_id = ? ORDER BY date DESC', user.id).map(rowView) : [],
    journals: student ? s.all('SELECT * FROM journal_entries WHERE student_id = ? ORDER BY updated_at DESC', user.id).map(row => journalView(s, row)) : [],
    requests: requests.map(row => requestView(s, row)), conversations, appointments, availability, history,
    plans: student ? [] : children('support_plans'), notes: student ? [] : children('support_notes'),
    followUps: children('follow_ups').map(row => student ? { id: row.id, requestId: row.requestId, status: row.status, dueAt: row.dueAt, createdAt: row.createdAt } : row),
    referrals: children('referrals').map(row => student ? { id: row.id, requestId: row.requestId, status: row.status, createdAt: row.createdAt } : row),
  };
}

function image(value, filename = 'ภาพประกอบ') {
  expect(typeof value === 'string' && value.length < 2.8 * 1024 * 1024, 'ภาพมีขนาดเกิน 2 เมกะไบต์', 413);
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  expect(match, 'เลือกรูปภาพชนิด PNG, JPEG, WebP หรือ GIF เท่านั้น');
  const [, mime, encoded] = match;
  const bytes = Buffer.from(encoded, 'base64');
  expect(bytes.length > 12 && bytes.length <= imageLimit, 'ภาพมีขนาดเกิน 2 เมกะไบต์', 413);
  const signature = {
    'image/png': () => bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')),
    'image/jpeg': () => bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex')),
    'image/webp': () => bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP',
    'image/gif': () => ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString()),
  };
  expect(signature[mime](), 'ไฟล์รูปภาพไม่ถูกต้อง');
  return { name: text(filename, 100) || 'ภาพประกอบ', mime, bytes };
}
const imageData = value => {
  if (!value) return '';
  const { mime, bytes } = image(value);
  return `data:${mime};base64,${bytes.toString('base64')}`;
};
const requireRole = (user, role) => expect(user.role === role, 'บัญชีนี้ไม่มีสิทธิ์ดำเนินการ', 403);
const owned = (s, table, user, id) => {
  const item = s.get(`SELECT * FROM ${table} WHERE id = ? AND student_id = ?`, id || '', user.id);
  expect(item, private404, 404);
  return item;
};
const ok = { ok: true };
const result = item => ({ item });

function auth(ctx) {
  const { s, user, action, method, body, cookies, cookie, config, school } = ctx;
  if (action === 'session' && method === 'GET') return { user: userView(s, user) };
  if (!['demo', 'login', 'register', 'logout', 'recover'].includes(action) || method !== 'POST') return undefined;
  function begin(account) {
    const newToken = token();
    if (cookies.mb_session) s.run('DELETE FROM sessions WHERE token_hash = ?', hashToken(cookies.mb_session));
    s.insert('sessions', { token_hash: hashToken(newToken), user_id: account.id, expires_at: new Date(Date.now() + sessionDuration * 1000).toISOString(), created_at: now() });
    cookie('mb_session', newToken, sessionDuration);
    return { user: userView(s, account) };
  }
  if (action === 'logout') {
    if (cookies.mb_session) s.run('DELETE FROM sessions WHERE token_hash = ?', hashToken(cookies.mb_session));
    cookie('mb_session', '', 0);
    return ok;
  }
  if (action === 'demo') {
    const role = pick(body.role || 'student', [...roles, 'admin']);
    expect(config.allowDemo, 'โรงเรียนปิดโหมดสาธิต', 403);
    let existing = cookies.mb_demo && s.get('SELECT * FROM demo_workspaces WHERE token_hash = ? AND expires_at > ?', hashToken(cookies.mb_demo), now());
    if (!existing || body.reset === true) {
      if (existing) s.run('DELETE FROM schools WHERE id = ? AND demo = 1', existing.school_id);
      const next = s.seedDemo();
      cookie('mb_demo', next.demoToken, demoDuration);
      existing = { school_id: next.school.id };
    }
    const persona = { student: 'fa@demo.invalid', teacher: 'ploy@demo.invalid', admin: 'admin@demo.invalid' }[role];
    const account = s.get("SELECT * FROM users WHERE school_id = ? AND role = ? AND email = ? AND active = 1 AND (role <> 'teacher' OR verified = 1)", existing.school_id, role, persona);
    expect(account, 'บัญชีสาธิตนี้ถูกปิดใช้งาน กรุณาเริ่มการสาธิตใหม่', 403);
    return begin(account);
  }
  const role = pick(body.role || 'student', action === 'register' ? roles : [...roles, 'admin']);
  if (action === 'register') {
    expect(configMatches(body.inviteCode ?? body.invitationCode, config.inviteCode), 'รหัสเชิญโรงเรียนไม่ถูกต้อง หรือโรงเรียนยังไม่เปิดรับสมัคร', 403);
    const name = text(body.name, 100);
    const email = text(body.email, 160).toLowerCase();
    const code = text(body.studentCode ?? body.studentId, 40) || null;
    expect(name && emailOK(email) && passwordOK(body.password), 'กรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 10 ตัวอักษร');
    expect(body.consent === true || body.assent === true, 'กรุณาอ่านและยืนยันการรับทราบข้อมูลส่วนตัว');
    expect(!s.get('SELECT id FROM users WHERE school_id = ? AND (email = ? OR student_code = ?)', school.id, email, code), 'ไม่สามารถใช้ข้อมูลลงทะเบียนนี้ได้', 409);
    const account = s.transaction(() => {
      const record = s.createUser({ schoolId: school.id, role, name, email, code: role === 'student' ? code : null, credential: passwordHash(body.password), verified: role === 'student', grade: text(body.grade, 50) });
      s.add('consent_records', { user_id: record.id, scope: 'รับทราบการใช้งานและประกาศความเป็นส่วนตัว (ฉบับท้องถิ่น)' });
      s.audit(record, 'สมัครบัญชี');
      return record;
    });
    return role === 'teacher' ? { user: null, pending: true, message: 'สมัครสำเร็จ โรงเรียนจะตรวจสอบบัญชีครูก่อนให้เข้าใช้งาน' } : begin(account);
  }
  const identifier = text(body.identifier ?? body.email, 160);
  const account = s.get('SELECT * FROM users WHERE school_id = ? AND role = ? AND (email = ? OR student_code = ?)', school.id, role, identifier.toLowerCase(), identifier);
  if (action === 'recover') {
    if (account && !s.get('SELECT id FROM privacy_requests WHERE user_id = ? AND kind = ? AND status = ?', account.id, 'recovery', 'new')) {
      s.add('privacy_requests', { user_id: account.id, kind: 'recovery', reason: 'ขอให้โรงเรียนช่วยกู้บัญชี', status: 'new' });
    }
    return { ...ok, message: 'ติดต่อผู้ดูแลของโรงเรียนเพื่อยืนยันตัวตนและขอความช่วยเหลือในการเข้าบัญชี' };
  }
  const password = typeof body.password === 'string' && body.password.length <= 128 ? body.password : '';
  expect(passwordMatches(password, account?.password_hash) && account?.active, 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง', 401);
  expect(role !== 'teacher' || account.verified, 'บัญชีครูกำลังรอการยืนยันจากโรงเรียน', 403);
  s.audit(account, 'เข้าสู่ระบบ');
  return begin(account);
}

function studentRecords({ s, user, action, id, suffix, method, body }) {
  if (!['checkins', 'journals'].includes(action)) return undefined;
  requireRole(user, 'student');
  const table = action === 'checkins' ? 'emotional_checkins' : 'journal_entries';
  const existing = id ? owned(s, table, user, id) : null;
  const view = row => row && (table === 'journal_entries' ? journalView(s, row) : rowView(row));
  if (suffix === 'attachments' && method === 'POST' && action === 'journals' && existing) {
    expect(s.get('SELECT COUNT(*) amount FROM journal_attachments WHERE journal_id = ?', id).amount < 10, 'เพิ่มภาพได้ไม่เกิน 10 ภาพต่อบันทึก');
    const item = s.add('journal_attachments', { journal_id: id, ...image(body.dataUrl, body.name) });
    return result({ id: item.id, name: item.name, mime: item.mime });
  }
  if (method === 'GET') return existing ? result(view(existing)) : { items: s.all(`SELECT * FROM ${table} WHERE student_id = ? ORDER BY rowid DESC`, user.id).map(view) };
  if (method === 'DELETE' && existing) {
    s.run(`DELETE FROM ${table} WHERE id = ? AND student_id = ?`, id, user.id);
    return ok;
  }
  if (method === 'POST' && !existing || method === 'PATCH' && existing) {
    const previous = existing ? JSON.parse(existing.data) : {};
    const values = { ...previous, ...body };
    let data;
    if (table === 'emotional_checkins') {
      const day = values.date || existing?.date || bangkokDate();
      expect(typeof day === 'string' && /^\d{4}-\d\d-\d\d$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day, 'วันที่ไม่ถูกต้อง');
      const emotions = list(values.emotions, 13);
      expect(emotions.length > 0, 'เลือกความรู้สึกอย่างน้อยหนึ่งรายการ');
      const intensity = values.intensity === undefined || values.intensity === '' || values.intensity === null ? null : Number(values.intensity);
      expect(intensity === null || Number.isInteger(intensity) && intensity >= 1 && intensity <= 5, 'เลือกระดับความชัดเจนจาก 1 ถึง 5');
      expect(!s.get('SELECT id FROM emotional_checkins WHERE student_id = ? AND date = ? AND id <> ?', user.id, day, id || ''), 'มีบันทึกความรู้สึกของวันนี้แล้ว กรุณาแก้ไขรายการเดิม', 409);
      data = { date: day, data: JSON.stringify({ emotions, intensity, topics: list(values.topics), note: text(values.note, 5000) }) };
    } else {
      const journal = { title: text(values.title, 120), body: text(values.body, 20000), emotions: list(values.emotions), draft: values.draft === true, drawing: imageData(values.drawing) };
      expect(journal.title || journal.body || journal.drawing, 'เพิ่มหัวข้อ ข้อความ หรือรูปวาดก่อนบันทึก');
      data = { data: JSON.stringify(journal) };
    }
    return result(view(existing ? s.update(table, id, data) : s.add(table, { student_id: user.id, ...data })));
  }
  return undefined;
}

function requestRoutes({ s, user, action, id, method, body }) {
  if (action !== 'requests') return undefined;
  if (method === 'GET' && id) return result(requestView(s, requestFor(s, user, id)));
  if (method === 'POST' && !id) {
    requireRole(user, 'student');
    expect(body.confirmed === true, 'กรุณายืนยันข้อมูลและผู้รับก่อนส่งคำขอ');
    const teacherId = text(body.teacherId, 64);
    expect(assigned(s, user.id, teacherId), 'เลือกครูที่โรงเรียนอนุญาตให้ดูแลเธอ', 403);
    const data = {
      supportType: text(body.supportType, 120), method: text(body.method, 120), emotion: text(body.emotion, 120),
      topic: text(body.topic, 120), message: text(body.message, 5000), excerpt: text(body.excerpt, 5000), drawing: imageData(body.drawing),
    };
    expect(data.supportType && data.method, 'กรุณาเลือกประเภทและช่องทางการขอความช่วยเหลือ');
    return s.transaction(() => {
      const kinds = ['คำขอความช่วยเหลือ'];
      for (const [key, label] of Object.entries({ emotion: 'อารมณ์ที่เลือก', topic: 'หัวข้อที่เลือก', message: 'ข้อความที่เลือกส่ง', excerpt: 'ข้อความบางส่วนจากบันทึก', drawing: 'ภาพวาดที่เลือกแชร์' })) {
        if (data[key]) kinds.push(label);
      }
      const { item, conversation } = s.createRequest({ studentId: user.id, teacherId, data, kinds });
      if (data.message) s.add('messages', { conversation_id: conversation.id, sender_id: user.id, text: data.message });
      s.notify(teacherId, 'request', 'มีคำขอความช่วยเหลือใหม่', `/teacher/requests?id=${item.id}`);
      s.audit(user, 'ส่งคำขอและยืนยันการแชร์', item.id);
      return result(requestView(s, item));
    });
  }
  if (method === 'PATCH' && id) {
    const current = requestFor(s, user, id);
    const status = body.status ? pick(body.status, requestStates.filter(state => state !== 'submitted')) : null;
    expect(status || body.feedback !== undefined, 'กรุณาเลือกสถานะหรือเพิ่มความคิดเห็น');
    if (user.role === 'student' && status) {
      expect(status === 'closed' || status === 'reopened' && current.status === 'closed', 'นักเรียนเปิดคำขอที่ปิดแล้วใหม่ หรือปิดคำขอของตนเองได้', 403);
    }
    return s.transaction(() => {
      let item = status ? s.setRequestStatus(current, status) : current;
      if (user.role === 'student' && body.feedback !== undefined) {
        const feedback = typeof body.feedback === 'string' ? text(body.feedback, 2000) :
          Array.isArray(body.feedback) ? list(body.feedback, 12) : isObject(body.feedback) ? JSON.parse(settingsJSON(body.feedback)) : '';
        item = s.update('support_requests', id, { data: JSON.stringify({ ...JSON.parse(item.data), feedback }) });
      }
      if (status && status !== current.status) {
        if (user.role === 'teacher') s.notify(item.student_id, status === 'received' ? 'accepted' : 'support', status === 'received' ? 'ครูรับคำขอของเธอแล้ว' : 'สถานะการดูแลของเธอได้รับการอัปเดต', '/student/journey');
        else s.notify(item.teacher_id, 'support', 'สถานะคำขอได้รับการอัปเดต', `/teacher/requests?id=${id}`);
        s.audit(user, 'อัปเดตสถานะคำขอ', id);
      }
      return result(requestView(s, item));
    });
  }
  return undefined;
}

function messagesRoutes({ s, user, action, id, suffix, method, body, query }) {
  if (action === 'attachments' && id && method === 'GET') {
    const journal = s.get(`SELECT a.mime,a.bytes FROM journal_attachments a JOIN journal_entries j ON j.id = a.journal_id
      WHERE a.id = ? AND j.student_id = ?`, id, user.id);
    if (journal && user.role === 'student') return { binary: journal.bytes, contentType: journal.mime };
    const attachment = s.get(`SELECT a.mime,a.bytes,m.conversation_id FROM message_attachments a JOIN messages m ON m.id = a.message_id WHERE a.id = ?`, id);
    expect(attachment, private404, 404);
    conversationFor(s, user, attachment.conversation_id);
    return { binary: attachment.bytes, contentType: attachment.mime };
  }
  if (action !== 'conversations' || !id) return undefined;
  const { conversation, request, otherId } = conversationFor(s, user, id);
  if (suffix === 'messages' && method === 'GET') {
    if (query.get('markRead') !== 'false') s.run('UPDATE messages SET read_at = ?,updated_at = ? WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL', now(), now(), id, user.id);
    return { items: s.all(`${messagesIn} WHERE m.conversation_id = ? ORDER BY m.rowid`, id).map(rowView) };
  }
  if (suffix === 'messages' && method === 'POST') {
    const message = text(body.text, 8000);
    const file = body.dataUrl ? image(body.dataUrl, body.attachmentName || body.name) : null;
    expect(message || file, 'พิมพ์ข้อความหรือเพิ่มรูปก่อนส่ง');
    expect(assigned(s, request.student_id, request.teacher_id), 'บทสนทนานี้ส่งข้อความเพิ่มไม่ได้ กรุณาติดต่อโรงเรียน', 403);
    expect(request.status !== 'closed', 'คำขอนี้ปิดแล้ว เปิดคำขออีกครั้งก่อนส่งข้อความ', 409);
    return s.transaction(() => {
      const item = s.add('messages', { conversation_id: id, sender_id: user.id, text: message });
      if (file) s.add('message_attachments', { message_id: item.id, ...file });
      s.update('conversations', id, {});
      const receiver = user.role === 'teacher' ? 'student' : 'teacher';
      s.notify(otherId, 'message', 'มีข้อความใหม่ใน MindBridge', `/${receiver}/messages?id=${id}`);
      if (user.role === 'teacher' && ['submitted', 'received', 'reopened'].includes(request.status)) s.setRequestStatus(request, 'replied');
      if (user.role === 'student' && request.status === 'replied') s.setRequestStatus(request, 'talking');
      return result(rowView(s.get(`${messagesIn} WHERE m.id = ?`, item.id)));
    });
  }
  if (!suffix && method === 'PATCH') {
    expect(typeof body.archived === 'boolean', 'กรุณาระบุสถานะการเก็บบทสนทนา');
    s.run('UPDATE conversation_members SET archived = ?, updated_at = ? WHERE conversation_id = ? AND user_id = ?', Number(body.archived), now(), id, user.id);
    return result(conversationView(s, user, { ...conversation, archived: Number(body.archived) }));
  }
  return undefined;
}

const activeSlots = ['requested', 'suggested', 'confirmed'];
function slotOpen(s, slotId, teacherId, studentId, excludeId = '') {
  const slot = s.get('SELECT * FROM teacher_availability WHERE id = ? AND teacher_id = ?', slotId || '', teacherId);
  expect(slot && slot.start_at > now(), 'กรุณาเลือกช่วงเวลาที่เปิดให้จอง', 409);
  expect(!s.get(`SELECT a.id FROM appointments a JOIN teacher_availability t ON t.id = a.slot_id
    WHERE a.id <> ? AND a.status IN ('requested','suggested','confirmed') AND (a.teacher_id = ? OR a.student_id = ?)
    AND t.start_at < ? AND t.end_at > ?`, excludeId, teacherId, studentId, slot.end_at, slot.start_at), 'ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น', 409);
  return slot;
}
function calendarRoutes({ s, user, action, id, method, body }) {
  if (action === 'availability') {
    requireRole(user, 'teacher');
    if (method === 'POST' && !id) {
      const start = isoTime(body.startAt);
      const end = isoTime(body.endAt);
      expect(start > now() && end > start && Date.parse(end) - Date.parse(start) <= 8 * 3600000, 'เลือกช่วงเวลาในอนาคตที่ไม่เกิน 8 ชั่วโมง');
      expect(!s.get('SELECT id FROM teacher_availability WHERE teacher_id = ? AND start_at < ? AND end_at > ?', user.id, end, start), 'ช่วงเวลานี้ทับกับเวลาว่างที่ตั้งไว้', 409);
      return result({ ...rowView(s.add('teacher_availability', { teacher_id: user.id, start_at: start, end_at: end })), available: true });
    }
    if (method === 'DELETE' && id) {
      expect(s.get('SELECT 1 FROM teacher_availability WHERE id = ? AND teacher_id = ?', id, user.id), private404, 404);
      expect(!s.get('SELECT id FROM appointments WHERE slot_id = ?', id), 'ช่วงเวลานี้มีประวัติการจอง จึงเก็บไว้ในประวัตินัดหมาย');
      s.run('DELETE FROM teacher_availability WHERE id = ? AND teacher_id = ?', id, user.id);
      return ok;
    }
  }
  if (action !== 'appointments') return undefined;
  expect(roles.includes(user.role), 'บัญชีนี้ไม่มีสิทธิ์จัดการนัดหมาย', 403);
  const student = user.role === 'student';
  if (method === 'POST' && !id) {
    const studentId = student ? user.id : text(body.studentId, 64);
    const teacherId = student ? text(body.teacherId, 64) : user.id;
    expect(assigned(s, studentId, teacherId), 'นัดหมายได้เฉพาะครูหรือนักเรียนที่โรงเรียนมอบหมาย', 403);
    const request = body.requestId ? requestFor(s, user, body.requestId) : s.get(`SELECT * FROM support_requests
      WHERE student_id = ? AND teacher_id = ? AND status <> 'closed' ORDER BY rowid DESC LIMIT 1`, studentId, teacherId);
    expect(!request || request.student_id === studentId && request.teacher_id === teacherId, private404, 404);
    const kind = text(body.kind, 120);
    expect(kind, 'กรุณาเลือกประเภทการนัดหมาย');
    return s.transaction(() => {
      const slot = slotOpen(s, body.slotId, teacherId, studentId);
      const row = s.add('appointments', { slot_id: slot.id, student_id: studentId, teacher_id: teacherId,
        request_id: request?.id ?? null, status: student ? 'requested' : 'suggested', data: JSON.stringify({ kind, note: text(body.note, 2000) }) });
      s.notify(student ? teacherId : studentId, 'appointment', student ? 'มีคำขอนัดหมายใหม่' : 'ครูเสนอเวลานัดหมาย', `/${student ? 'teacher' : 'student'}/appointments`);
      s.audit(user, 'ส่งคำขอนัดหมาย', row.id);
      return result(appointmentView(s, row));
    });
  }
  if (method === 'PATCH' && id) {
    const existing = s.get('SELECT * FROM appointments WHERE id = ?', id);
    expect(participant(s, user, existing), private404, 404);
    expect(activeSlots.includes(existing.status), 'นัดหมายนี้สิ้นสุดแล้ว', 409);
    const options = student ? ['requested', 'cancelled', ...(existing.status === 'suggested' ? ['confirmed'] : [])] : ['confirmed', 'suggested', 'declined', 'cancelled', 'completed'];
    const status = pick(body.status || (student ? 'requested' : 'suggested'), options);
    return s.transaction(() => {
      const slotId = text(body.slotId, 64) || existing.slot_id;
      expect(slotId === existing.slot_id || ['requested', 'suggested', 'confirmed'].includes(status), 'เลือกช่วงเวลาใหม่ได้เมื่อขอเปลี่ยนเวลานัด');
      if (slotId !== existing.slot_id || ['confirmed', 'suggested'].includes(status)) {
        expect(assigned(s, existing.student_id, existing.teacher_id), 'รายการนี้ไม่มีสิทธิ์นัดหมายแล้ว', 403);
        slotOpen(s, slotId, existing.teacher_id, existing.student_id, id);
      }
      const row = s.update('appointments', id, { slot_id: slotId, status });
      if (status === 'confirmed' && row.request_id) {
        const request = s.get('SELECT * FROM support_requests WHERE id = ?', row.request_id);
        if (request && !['closed', 'follow-up', 'referred'].includes(request.status)) s.setRequestStatus(request, 'appointment');
      }
      s.notify(student ? row.teacher_id : row.student_id, 'appointment', status === 'confirmed' ? 'ยืนยันการนัดหมายแล้ว' : 'สถานะนัดหมายได้รับการอัปเดต', `/${student ? 'teacher' : 'student'}/appointments`);
      s.audit(user, 'อัปเดตนัดหมาย', row.id);
      return result(appointmentView(s, row));
    });
  }
  return undefined;
}

const childrenTables = { plans: 'support_plans', notes: 'support_notes', 'follow-ups': 'follow_ups', referrals: 'referrals' };
function careRoutes({ s, user, action, id, method, body }) {
  if (!Object.hasOwn(childrenTables, action) || !['POST', 'PATCH', 'DELETE'].includes(method)) return undefined;
  const table = childrenTables[action];
  requireRole(user, 'teacher');
  const existing = id ? s.get(`SELECT * FROM ${table} WHERE id = ?`, id) : null;
  if (id) expect(existing, private404, 404);
  const request = requestFor(s, user, existing?.request_id || body.requestId);
  if (method === 'DELETE' && existing) {
    s.run(`DELETE FROM ${table} WHERE id = ?`, id);
    s.audit(user, 'ลบรายการดูแล', id);
    return ok;
  }
  if (method === 'POST' && id || method === 'PATCH' && !id) return undefined;
  const values = { ...rowView(existing), ...body };
  let data, extra = {}, requestStatus;
  if (action === 'plans') {
    const title = text(values.title, 200), description = text(values.body, 8000);
    expect(title && description, 'กรอกชื่อและรายละเอียดแผนการดูแล');
    data = { title, body: description, actions: list(values.actions, 20) };
    requestStatus = 'caring';
  } else if (action === 'notes') {
    data = { body: text(values.body, 6000) };
    expect(data.body, 'เพิ่มข้อความก่อนบันทึก');
  } else if (action === 'follow-ups') {
    data = { note: text(values.note, 5000) };
    extra = { due_at: isoTime(values.dueAt), status: pick(values.status || 'pending', ['pending', 'completed']) };
    expect(existing || extra.due_at > now(), 'เลือกเวลาติดตามผลในอนาคต');
    requestStatus = extra.status === 'completed' ? undefined : 'follow-up';
  } else {
    expect(existing || values.authorized === true, 'กรุณายืนยันว่าได้รับอนุญาตให้บันทึกการส่งต่อ');
    const reason = text(values.reason, 4000), destination = text(values.destination, 180);
    expect(reason && destination, 'กรุณาระบุผู้รับและเหตุผลการส่งต่อ');
    data = { reason, destination, shared: text(values.shared, 3000), dueAt: values.dueAt ? isoTime(values.dueAt) : '', authorized: true };
    extra = { status: pick(values.status || 'review', ['review', 'sent', 'completed']) };
    requestStatus = 'referred';
  }
  return s.transaction(() => {
    const fields = { data: JSON.stringify(data), ...extra };
    const item = id ? s.update(table, id, fields) : s.add(table, { request_id: request.id, ...fields });
    if (requestStatus && request.status !== 'closed') s.setRequestStatus(request, requestStatus);
    if (action !== 'notes') s.notify(request.student_id, action === 'follow-ups' ? 'follow-up' : action === 'referrals' ? 'referral' : 'support', 'คุณครูอัปเดตเส้นทางการดูแล', '/student/journey');
    s.audit(user, 'อัปเดตรายการดูแล', item.id);
    return result(rowView(item));
  });
}

function loadNotifications(s, user) {
  if (roles.includes(user.role)) {
    const time = now();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const field = user.role === 'student' ? 'student_id' : 'teacher_id';
    const appointment = s.all(`SELECT a.*,t.start_at FROM appointments a JOIN teacher_availability t ON t.id = a.slot_id
      WHERE a.${field} = ? AND a.status = 'confirmed' AND t.start_at BETWEEN ? AND ?`, user.id, time, tomorrow);
    for (const row of appointment.filter(row => participant(s, user, row))) {
      s.notify(user.id, 'appointment', 'มีนัดหมายที่กำลังจะมาถึง', `/${user.role}/appointments`, `appointment:${row.id}:${row.start_at}`);
    }
    const followUps = s.all(`SELECT f.id,f.due_at,r.student_id,r.teacher_id FROM follow_ups f JOIN support_requests r ON r.id = f.request_id
      WHERE r.${field} = ? AND f.status = 'pending' AND f.due_at BETWEEN ? AND ?`, user.id, time, tomorrow);
    for (const row of followUps.filter(row => participant(s, user, row))) {
      s.notify(user.id, 'follow-up', 'การติดตามผลใกล้ถึงเวลานัด', user.role === 'student' ? '/student/journey' : '/teacher/follow-ups', `follow-up:${row.id}:${row.due_at}`);
    }
  }
  return s.all('SELECT id,type,text,href,read_at,created_at FROM notifications WHERE user_id = ? ORDER BY rowid DESC LIMIT 120', user.id).map(notificationView);
}

function profileRoutes({ s, user, action, id, method, body, cookies }) {
  if (action === 'notifications' && method === 'GET') {
    return { items: loadNotifications(s, user) };
  }
  if (action === 'notifications' && method === 'PATCH' && id) {
    if (id === 'all') {
      loadNotifications(s, user);
      s.run('UPDATE notifications SET read_at = ?,updated_at = ? WHERE user_id = ? AND read_at IS NULL', now(), now(), user.id);
    } else {
      const row = s.get('SELECT id FROM notifications WHERE user_id = ? AND id = ?', user.id, id);
      expect(row, private404, 404);
      s.run('UPDATE notifications SET read_at = ?,updated_at = ? WHERE user_id = ? AND id = ?', now(), now(), user.id, id);
    }
    return ok;
  }
  if (action === 'settings' && method === 'PATCH') {
    const changes = {};
    if (typeof body.name === 'string') {
      expect(text(body.name, 100), 'กรุณากรอกชื่อ');
      changes.name = text(body.name, 100);
    }
    if (typeof body.avatar === 'string') changes.avatar = imageData(body.avatar);
    if (isObject(body.settings)) changes.settings = settingsJSON(body.settings, JSON.parse(user.settings));
    if (body.newPassword !== undefined) {
      expect(user.password_hash, 'บัญชีสาธิตไม่มีรหัสผ่าน');
      const current = typeof body.currentPassword === 'string' && body.currentPassword.length <= 128 ? body.currentPassword : '';
      expect(passwordMatches(current, user.password_hash) && passwordOK(body.newPassword), 'ตรวจสอบรหัสผ่านเดิมและตั้งรหัสผ่านใหม่อย่างน้อย 10 ตัวอักษร');
      changes.password_hash = passwordHash(body.newPassword);
    }
    return s.transaction(() => {
      const item = s.update('users', user.id, changes);
      if (changes.password_hash) s.run('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?', user.id, hashToken(cookies.mb_session));
      if (user.role === 'teacher') {
        const previous = s.get('SELECT * FROM teacher_profiles WHERE user_id = ?', user.id);
        s.run('UPDATE teacher_profiles SET title = ?,training = ?,response_time = ?,availability = ?,updated_at = ? WHERE user_id = ?',
          body.title === undefined ? previous.title : text(body.title, 100), body.training === undefined ? previous.training : JSON.stringify(list(body.training)),
          body.responseTime === undefined ? previous.response_time : text(body.responseTime, 100), body.availability === undefined ? previous.availability : text(body.availability, 100), now(), user.id);
      }
      s.audit(user, 'แก้ไขการตั้งค่าบัญชี');
      const safe = userView(s, item);
      return { user: safe, item: safe };
    });
  }
  if (action === 'privacy-requests' && method === 'POST') {
    const kind = pick(body.kind, ['access', 'deletion', 'privacy', 'report', 'teacher']);
    const item = s.add('privacy_requests', { user_id: user.id, kind, reason: text(body.reason, 2500), status: 'new' });
    s.audit(user, 'ส่งคำขอถึงโรงเรียน', item.id);
    return result(rowView(item));
  }
  return undefined;
}

function adminRoutes({ s, user, action, id: resource, suffix: id, method, body }) {
  if (action !== 'admin') return undefined;
  requireRole(user, 'admin');
  if (resource === 'users' && id && method === 'PATCH') {
    const account = s.get('SELECT * FROM users WHERE id = ? AND school_id = ?', id, user.school_id);
    expect(account, private404, 404);
    expect(account.role !== 'admin', 'บัญชีผู้ดูแลต้องได้รับการจัดการโดยโรงเรียน', 403);
    const fields = {};
    if (typeof body.verified === 'boolean' && account.role === 'teacher') fields.verified = Number(body.verified);
    if (typeof body.active === 'boolean') fields.active = Number(body.active);
    if (text(body.name, 100)) fields.name = text(body.name, 100);
    return s.transaction(() => {
      const item = s.update('users', id, fields);
      if (!item.active || item.role === 'teacher' && !item.verified) s.run('DELETE FROM sessions WHERE user_id = ?', id);
      if (account.role === 'student' && (body.classroomId !== undefined || body.grade !== undefined)) {
        const previous = s.get('SELECT * FROM student_profiles WHERE user_id = ?', id);
        const classroomId = body.classroomId === undefined ? previous.classroom_id : text(body.classroomId, 64) || null;
        const classroom = classroomId && s.get('SELECT * FROM classrooms WHERE id = ? AND school_id = ?', classroomId, user.school_id);
        expect(!classroomId || classroom, private404, 404);
        s.run('UPDATE student_profiles SET classroom_id = ?,grade = ?,updated_at = ? WHERE user_id = ?', classroomId, classroom?.grade || text(body.grade, 50) || previous.grade, now(), id);
      }
      s.audit(user, 'ปรับข้อมูลบัญชีโรงเรียน', id);
      return result(userView(s, item));
    });
  }
  if (resource === 'classrooms' && (method === 'POST' && !id || method === 'PATCH' && id)) {
    const existing = id && s.get('SELECT * FROM classrooms WHERE id = ? AND school_id = ?', id, user.school_id);
    expect(!id || existing, private404, 404);
    const name = text(body.name ?? existing?.name, 120), grade = text(body.grade ?? existing?.grade, 80);
    expect(name && grade, 'กรอกชื่อห้องเรียนและระดับชั้น');
    const item = s.transaction(() => {
      const item = id ? s.update('classrooms', id, { name, grade }) : s.add('classrooms', { school_id: user.school_id, name, grade });
      if (id) s.run('UPDATE student_profiles SET grade = ?,updated_at = ? WHERE classroom_id = ?', grade, now(), id);
      s.audit(user, 'ปรับข้อมูลห้องเรียน', item.id);
      return item;
    });
    return result(rowView(item));
  }
  if (resource === 'assignments' && method === 'POST' && !id) {
    const studentId = text(body.studentId, 64), teacherId = text(body.teacherId, 64);
    const student = s.get('SELECT id FROM users WHERE id = ? AND school_id = ? AND role = ? AND active = 1', studentId, user.school_id, 'student');
    const teacher = s.get('SELECT id FROM users WHERE id = ? AND school_id = ? AND role = ? AND verified = 1 AND active = 1', teacherId, user.school_id, 'teacher');
    expect(student && teacher, 'เลือกนักเรียนและครูที่โรงเรียนยืนยันแล้ว');
    expect(!s.get('SELECT id FROM teacher_assignments WHERE student_id = ? AND teacher_id = ?', studentId, teacherId), 'มอบหมายครูคนนี้ให้กับนักเรียนแล้ว', 409);
    const item = s.add('teacher_assignments', { student_id: studentId, teacher_id: teacherId });
    s.audit(user, 'มอบหมายครูดูแล', item.id);
    return result(rowView(item));
  }
  if (resource === 'assignments' && method === 'DELETE' && id) {
    const assignment = s.get(`SELECT a.id FROM teacher_assignments a JOIN users s ON s.id = a.student_id WHERE a.id = ? AND s.school_id = ?`, id, user.school_id);
    expect(assignment, private404, 404);
    s.run('DELETE FROM teacher_assignments WHERE id = ?', id);
    s.audit(user, 'ถอนการมอบหมายครู', id);
    return ok;
  }
  if (resource === 'school' && method === 'PATCH') {
    const previous = s.get('SELECT * FROM schools WHERE id = ?', user.school_id);
    const item = s.update('schools', user.school_id, { name: text(body.name, 120) || previous.name, settings: settingsJSON(body.settings, JSON.parse(previous.settings)) });
    s.audit(user, 'แก้ไขข้อมูลโรงเรียน', item.id);
    return result({ ...rowView(item), settings: JSON.parse(item.settings) });
  }
  if (resource === 'tickets' && method === 'PATCH' && id) {
    expect(s.get(`SELECT p.id FROM privacy_requests p JOIN users u ON u.id = p.user_id WHERE p.id = ? AND u.school_id = ?`, id, user.school_id), private404, 404);
    const status = pick(body.status, ['new', 'completed']);
    const item = s.update('privacy_requests', id, { status });
    s.audit(user, 'อัปเดตคำขอด้านบัญชีหรือความเป็นส่วนตัว', id);
    return result(rowView(item));
  }
  return undefined;
}

export function routeApi(ctx) {
  const authentication = auth(ctx);
  if (authentication !== undefined) return authentication;
  expect(ctx.user, 'กรุณาเข้าสู่ระบบเพื่อดำเนินการ', 401);
  if (ctx.action === 'workspace' && ctx.method === 'GET') return workspace(ctx.s, ctx.user);
  const routes = [studentRecords, requestRoutes, messagesRoutes, calendarRoutes, careRoutes, profileRoutes, adminRoutes];
  for (const route of routes) {
    const response = route(ctx);
    if (response !== undefined) return response;
  }
  throw new HttpError(404, 'ไม่พบหน้านี้');
}
