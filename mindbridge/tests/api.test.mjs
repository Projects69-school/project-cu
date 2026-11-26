import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server.mjs';

let app;
let base;
const credential = 'MindBridge-Test-Password-23';
const inviteCode = 'school-test-only';
const adminEmail = 'admin@test.invalid';
const picture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/VVEAAAAASUVORK5CYII=';

before(async () => {
  app = await startServer({ port: 0, dbPath: ':memory:', inviteCode, adminEmail, adminPassword: credential });
  base = `http://127.0.0.1:${app.server.address().port}`;
});
after(async () => { if (app) await new Promise((resolve) => app.server.close(resolve)); });

function browser() {
  const cookies = new Map();
  return async (path, method = 'GET', body = undefined, status = 200, options = {}) => {
    const headers = { cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; '), ...options.headers };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${base}${path}`, { method, headers, redirect: 'manual', body: body === undefined ? undefined : JSON.stringify(body) });
    for (const header of response.headers.getSetCookie()) {
      const [pair] = header.split(';');
      const [key, value] = pair.split('=');
      if (value) cookies.set(key, value); else cookies.delete(key);
      assert.match(header, /HttpOnly/);
      assert.match(header, /SameSite=Lax/);
    }
    const data = response.headers.get('Content-Type')?.includes('application/json') ? await response.json() : null;
    assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
    return { data, response };
  };
}

const get = async (client, path, status = 200) => (await client(path, 'GET', undefined, status)).data;
const post = async (client, path, body, status = 200) => (await client(path, 'POST', body, status)).data;
const patch = async (client, path, body, status = 200) => (await client(path, 'PATCH', body, status)).data;

test('demo routes authenticate and the full care workflow synchronizes between roles', async () => {
  const client = browser();
  assert.equal((await get(client, '/api/session')).user, null);
  await get(client, '/api/workspace', 401);
  const protectedPage = await client('/teacher/dashboard', 'GET', undefined, 302);
  assert.equal(protectedPage.response.headers.get('Location'), '/login/teacher');
  const adminPage = await client('/admin/dashboard', 'GET', undefined, 302);
  assert.equal(adminPage.response.headers.get('Location'), '/login/admin');
  const { user: student } = await post(client, '/api/demo', { role: 'student' });
  assert.equal(student.name, 'ฟ้า');
  assert.equal(student.role, 'student');
  await client('/teacher/dashboard', 'GET', undefined, 302);
  const initial = await get(client, '/api/workspace');
  const teacherId = initial.teachers[0].id;
  const checkin = (await post(client, '/api/checkins', { emotions: ['เครียด', 'กังวล'], intensity: 3 })).item;
  assert.deepEqual(checkin.emotions, ['เครียด', 'กังวล']);
  const journal = (await post(client, '/api/journals', { title: 'ส่วนตัว', body: 'ข้อความส่วนตัว มีเฉพาะข้อความช่วงสั้นที่อยากแชร์', emotions: ['กังวล'] })).item;
  const attachment = (await post(client, `/api/journals/${journal.id}/attachments`, { dataUrl: picture, name: 'ส่วนตัว.png' })).item;
  const photo = await client(`/api/attachments/${attachment.id}`);
  assert.equal(photo.response.headers.get('content-type'), 'image/png');
  const requestPayload = { teacherId, supportType: 'อยากให้มีคนรับฟัง', method: 'ส่งสัญญาณขอความช่วยเหลือ', excerpt: 'ข้อความช่วงสั้นที่อยากแชร์' };
  await post(client, '/api/requests', requestPayload, 400);
  const request = (await post(client, '/api/requests', { ...requestPayload, confirmed: true })).item;
  assert.equal(request.status, 'submitted');
  assert.ok(request.conversationId);
  const outsider = browser();
  await post(outsider, '/api/demo', { role: 'student' });
  await get(outsider, `/api/journals/${journal.id}`, 404);
  await patch(outsider, `/api/checkins/${checkin.id}`, { intensity: 4 }, 404);
  await get(outsider, `/api/conversations/${request.conversationId}/messages`, 404);
  await get(outsider, `/api/attachments/${attachment.id}`, 404);

  const { user: teacher } = await post(client, '/api/demo', { role: 'teacher' });
  assert.equal(teacher.id, teacherId);
  assert.equal(teacher.name, 'ครูพลอย');
  const teacherData = await get(client, '/api/workspace');
  assert.equal(teacherData.checkins.length, 0);
  assert.equal(teacherData.journals.length, 0);
  assert.equal(teacherData.requests[0].excerpt, requestPayload.excerpt);
  assert.ok(teacherData.notifications.find(item => item.type === 'request'));
  await get(client, `/api/journals/${journal.id}`, 403);
  await get(client, `/api/attachments/${attachment.id}`, 404);
  await patch(client, `/api/requests/${request.id}`, { status: 'received' });
  const teacherMessage = (await post(client, `/api/conversations/${request.conversationId}/messages`, { text: 'ครูพร้อมรับฟัง' })).item;
  assert.equal(teacherMessage.senderId, teacher.id);

  await post(client, '/api/demo', { role: 'student' });
  const messages = await get(client, `/api/conversations/${request.conversationId}/messages`);
  assert.equal(messages.items[0].text, 'ครูพร้อมรับฟัง');
  assert.ok(messages.items[0].readAt);
  const studentMessage = (await post(client, `/api/conversations/${request.conversationId}/messages`, { text: 'ขอบคุณค่ะ' })).item;
  assert.equal(studentMessage.senderId, student.id);
  const slotId = (await get(client, '/api/workspace')).availability.find(item => item.available).id;
  const appointmentData = { teacherId, slotId, requestId: request.id, kind: 'พบครูเป็นส่วนตัว' };
  const appointment = (await post(client, '/api/appointments', appointmentData)).item;
  assert.equal(appointment.status, 'requested');
  await post(client, '/api/appointments', appointmentData, 409);
  const reserved = initial.appointments.find(item => item.status === 'confirmed');
  await patch(client, `/api/appointments/${appointment.id}`, { status: 'requested', slotId: reserved.slotId }, 409);
  const afterConflict = (await get(client, '/api/workspace')).appointments.find(item => item.id === appointment.id);
  assert.equal(afterConflict.slotId, appointment.slotId);

  await post(client, '/api/demo', { role: 'teacher' });
  const confirmed = await patch(client, `/api/appointments/${appointment.id}`, { status: 'confirmed' });
  assert.equal(confirmed.item.status, 'confirmed');
  const followUp = (await post(client, '/api/follow-ups', { requestId: request.id, dueAt: new Date(Date.now() + 7 * 86400000).toISOString(), note: 'บันทึกสำหรับครูเท่านั้น' })).item;
  await post(client, '/api/notes', { requestId: request.id, body: 'บันทึกครูที่ไม่ควรส่งต่อ' });
  await post(client, '/api/demo', { role: 'student' });
  const final = await get(client, '/api/workspace');
  assert.equal(final.appointments.find(item => item.id === appointment.id).status, 'confirmed');
  assert.equal(final.requests.find(item => item.id === request.id).status, 'follow-up');
  assert.ok(final.followUps.find(item => item.id === followUp.id));
  assert.equal(final.followUps.find(item => item.id === followUp.id).note, undefined);
  assert.equal(final.notes.length, 0);
  assert.ok(final.notifications.find(item => item.type === 'follow-up'));
  await patch(client, '/api/notifications/all', { read: true });
  assert.ok((await get(client, '/api/notifications')).items.every(item => item.read));
  await patch(client, '/api/settings', { settings: { messageNotifications: false } });
  const previousMessageNotifications = (await get(client, '/api/notifications')).items.filter(item => item.type === 'message').length;
  await post(client, '/api/demo', { role: 'teacher' });
  await post(client, `/api/conversations/${request.conversationId}/messages`, { text: 'ข้อความที่ส่งเมื่อปิดการแจ้งเตือน' });
  await post(client, '/api/demo', { role: 'student' });
  assert.equal((await get(client, '/api/notifications')).items.filter(item => item.type === 'message').length, previousMessageNotifications);
  assert.ok((await get(client, `/api/conversations/${request.conversationId}/messages`)).items.some(item => item.text === 'ข้อความที่ส่งเมื่อปิดการแจ้งเตือน'));
  await post(client, '/api/demo', { role: 'admin' });
  assert.equal((await get(client, '/api/workspace')).requests.length, 0);
  await get(client, `/api/conversations/${request.conversationId}/messages`, 404);
  await post(client, '/api/demo', { role: 'student', reset: true });
  assert.notEqual((await get(client, '/api/session')).user.id, student.id);
  await get(client, `/api/requests/${request.id}`, 404);
  await get(client, `/api/journals/${journal.id}`, 404);
});

test('local registration, verification, and admin assignments protect real workspace records', async () => {
  const learner = browser();
  const adult = browser();
  const admin = browser();
  const demo = browser();
  const studentPayload = { role: 'student', name: 'บัญชีนักเรียนทดสอบ', email: 'learner@test.invalid', studentCode: 'T-05', password: credential, inviteCode, consent: true };
  const teacherPayload = { role: 'teacher', name: 'บัญชีครูทดสอบ', email: 'teacher@test.invalid', password: credential, inviteCode, consent: true };
  await post(learner, '/api/register', { ...studentPayload, consent: false }, 400);
  await post(learner, '/api/register', { ...studentPayload, password: 'too-short' }, 400);
  const student = (await post(learner, '/api/register', studentPayload)).user;
  assert.equal(student.demo, false);
  await post(learner, '/api/logout');
  assert.equal((await post(learner, '/api/login', { role: 'student', identifier: 'T-05', password: credential })).user.id, student.id);
  const teacherReg = await post(adult, '/api/register', teacherPayload);
  assert.ok(teacherReg.pending);
  const teacherLogin = { role: 'teacher', identifier: teacherPayload.email, password: credential };
  await post(adult, '/api/login', teacherLogin, 403);
  await get(adult, '/api/workspace', 401);
  await post(admin, '/api/login', { role: 'admin', identifier: adminEmail, password: credential });
  const school = await get(admin, '/api/workspace');
  const teacherId = school.users.find(user => user.email === teacherPayload.email).id;
  await patch(admin, `/api/admin/users/${teacherId}`, { verified: true });
  await post(adult, '/api/login', teacherLogin);
  const baseRequest = { teacherId, confirmed: true, supportType: 'รับฟัง', method: 'ส่งสัญญาณ' };
  await post(learner, '/api/requests', baseRequest, 403);
  const assignment = (await post(admin, '/api/admin/assignments', { studentId: student.id, teacherId })).item;
  const request = (await post(learner, '/api/requests', baseRequest)).item;
  await get(adult, `/api/requests/${request.id}`);
  await post(demo, '/api/demo', { role: 'admin' });
  await patch(demo, `/api/admin/users/${teacherId}`, { verified: false }, 404);
  await get(demo, `/api/requests/${request.id}`, 404);
  await admin(`/api/admin/assignments/${assignment.id}`, 'DELETE');
  await get(adult, `/api/requests/${request.id}`, 404);
  await get(adult, `/api/conversations/${request.conversationId}/messages`, 404);
  await patch(admin, `/api/admin/users/${teacherId}`, { verified: false });
  await get(adult, '/api/workspace', 401);
  await patch(learner, '/api/settings', { currentPassword: credential, newPassword: `${credential}-new` });
  await post(learner, '/api/logout');
  await post(learner, '/api/login', { role: 'student', identifier: 'T-05', password: credential }, 401);
  await post(learner, '/api/login', { role: 'student', identifier: 'T-05', password: `${credential}-new` });
});

test('cross-site changes and unsupported image data are rejected', async () => {
  const client = browser();
  await post(client, '/api/demo', { role: 'student' });
  await client('/api/settings', 'PATCH', { name: 'cross-site' }, 403, { headers: { Origin: 'https://other.invalid' } });
  const journal = (await post(client, '/api/journals', { title: 'ลองบันทึก' })).item;
  await post(client, `/api/journals/${journal.id}/attachments`, { dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+' }, 400);
  await patch(client, '/api/admin/school', { name: 'forbidden' }, 403);
});
