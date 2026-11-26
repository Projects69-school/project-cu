import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { startServer } from '../server.mjs';

const require = createRequire(import.meta.url);
const playwright = require(process.env.APP_PLAYWRIGHT || 'playwright');
const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = process.env.APP_CHROME || (existsSync(localChrome) ? localChrome : undefined);
const out = fileURLToPath(new URL('../docs/screenshots/', import.meta.url));
await mkdir(out, { recursive:true });
const { server } = await startServer({ port:0, dbPath:':memory:' });
const baseURL = 'http://127.0.0.1:' + server.address().port;
let browser;
const faults = [];

try {
  browser = await playwright.chromium.launch({ executablePath, headless:true });
  const context = await browser.newContext({ baseURL,viewport:{width:1440,height:1000},deviceScaleFactor:2,locale:'th-TH',timezoneId:'Asia/Bangkok' });
  const page = await context.newPage();
  page.setDefaultTimeout(7500);
  page.on('pageerror', error => faults.push(error.message));
  page.on('console', message => {
    if (message.type()==='error' && !message.text().includes('Failed to load resource')) faults.push(message.text());
  });

  async function route(path) {
    await page.goto(path);
    await page.locator('#main h1').first().waitFor();
    assert.equal(await page.locator('.page-error').count(),0,'Failed route ' + path);
  }
  async function snapshot(name) {
    await page.evaluate(() => document.fonts.ready);
    assert(await page.evaluate(() => document.fonts.check('500 16px "Noto Thai"','สะพานใจ')));
    await page.mouse.move(0,0);
    await page.screenshot({ path:out+name+'.png',animations:'disabled',style:'#toast { visibility: hidden }' });
  }
  async function choose(selector) {
    const input = page.locator(selector);
    if (!(await input.isChecked())) await page.locator('label').filter({has:input}).click();
    assert(await input.isChecked());
  }
  async function workspace() {
    return (await context.request.get('/api/workspace')).json();
  }
  async function switchRole(role) {
    await page.locator('[data-switch]').click();
    await page.locator('dialog [data-demo-role="'+role+'"]').click();
    await page.waitForURL('/'+role+'/dashboard');
    await page.locator('#main h1').first().waitFor();
  }

  await route('/');
  await snapshot('01-landing');
  await route('/demo');
  await page.locator('[data-demo-role="student"]').click();
  await page.waitForURL('/student/dashboard');
  await page.locator('#main h1').first().waitFor();
  assert.equal((await workspace()).user.role,'student');
  await snapshot('02-student-dashboard');
  await route('/student/emotions');
  await choose('input[name=emotions][value="เครียด"]');
  await choose('input[name=emotions][value="กังวล"]');
  await page.locator('#st-emotion-form button[type=submit]').first().click();
  await page.waitForFunction(async () => (await (await fetch('/api/workspace')).json()).checkins.some(item=>item.emotions.includes('เครียด')));
  await route('/student/emotion-wheel');
  await snapshot('03-emotion-decoder');
  await route('/student/trust-ladder');
  await snapshot('04-trust-ladder');
  await route('/student/journal');
  await page.locator('#st-journal-form input[name=title]').fill('บันทึกจำลอง');
  await page.locator('#st-journal-form textarea[name=body]').fill('ข้อความส่วนตัวที่ไม่แชร์');
  await page.locator('#st-journal-form button[value=save]').click();
  await page.waitForFunction(async () => (await (await fetch('/api/workspace')).json()).journals.some(item=>item.title==='บันทึกจำลอง'));
  await route('/student/support');
  await snapshot('05-support-request');
  const saved = await workspace();
  const teacher = saved.teachers.find(item=>item.name==='ครูพลอย') || saved.teachers[0];
  await choose('input[name=supportType][value="อยากให้มีคนรับฟัง"]');
  const next = page.locator('#st-support-next');
  await next.click();
  await choose('input[name=teacherId][value="'+teacher.id+'"]');
  await next.click();
  await next.click();
  await page.locator('.st-step[data-step="3"] details summary').click();
  await page.locator('textarea[name=excerpt]').fill('พร้อมเล่าเรื่องการเรียนสั้น ๆ');
  await next.click();
  await page.locator('input[name=confirmed]').check();
  await next.click();
  await page.waitForURL('/student/journey?*');
  const requestId = new URL(page.url()).searchParams.get('id');
  const request = (await workspace()).requests.find(item=>item.id===requestId);
  assert(request && request.conversationId);
  await switchRole('teacher');
  assert.equal((await workspace()).user.role,'teacher');
  assert(!(await workspace()).journals.some(item=>item.title==='บันทึกจำลอง'));
  await snapshot('06-teacher-dashboard');
  await route('/teacher/requests?id='+request.id);
  await page.getByRole('button',{name:'รับคำขอนี้',exact:true}).click();
  const receipt = page.locator('dialog button[type=submit]');
  if (await receipt.isVisible()) await receipt.click();
  await page.waitForFunction(async (id) => (await (await fetch('/api/requests/'+id)).json()).item.status==='received',request.id);
  await route('/teacher/messages?id='+request.conversationId);
  await page.locator('#tc-chat-text').fill('ขอบคุณที่ไว้ใจเล่าให้ครูฟังนะ');
  await page.locator('#tc-chat-form button[type=submit]').click();
  await page.getByText('ขอบคุณที่ไว้ใจเล่าให้ครูฟังนะ',{exact:true}).first().waitFor();
  await switchRole('student');
  await route('/student/messages?id='+request.conversationId);
  await page.getByText('ขอบคุณที่ไว้ใจเล่าให้ครูฟังนะ',{exact:true}).first().waitFor();
  await page.locator('#st-send-message textarea').fill('ขอบคุณค่ะ อยากนัดคุยกับครู');
  await page.locator('#st-send-message button[type=submit]').click();
  await page.getByText('ขอบคุณค่ะ อยากนัดคุยกับครู',{exact:true}).first().waitFor();
  await snapshot('07-messaging');
  const slot = (await workspace()).availability.find(item=>item.teacherId===teacher.id && item.available !== false);
  assert(slot,'Fictional teacher has an open slot');
  await route('/student/appointments?teacher='+teacher.id);
  const day = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(slot.startAt));
  await page.locator('#st-slot-date').selectOption(day);
  await page.locator('#st-slot-time').selectOption(slot.id);
  await page.locator('#st-book-appointment').click();
  await page.waitForFunction(async (id) => (await (await fetch('/api/workspace')).json()).appointments.some(item=>item.slotId===id),slot.id);
  const appointment = (await workspace()).appointments.find(item=>item.slotId===slot.id);
  const conflict = await context.request.post('/api/appointments',{ data:{ teacherId:teacher.id,slotId:slot.id,kind:'คุยส่วนตัว',requestId:request.id } });
  assert.equal(conflict.status(),409);
  await switchRole('teacher');
  await route('/teacher/appointments');
  await page.locator(`[data-tc-action="appointment-confirmed"][data-id="${appointment.id}"]`).click();
  await page.waitForFunction(async (id) => (await (await fetch('/api/workspace')).json()).appointments.some(item=>item.id===id && item.status==='confirmed'),appointment.id);
  await snapshot('08-appointments');
  await route('/teacher/follow-ups');
  await page.getByRole('button',{name:'เพิ่มรายการติดตามผล',exact:true}).click();
  await page.locator('dialog select[name=requestId]').selectOption(request.id);
  await page.locator('dialog input[name=dueAt]').fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0,16));
  await page.locator('dialog textarea[name=note]').fill('คุยต่อเรื่องการจัดเวลาอ่านหนังสือ');
  await page.locator('dialog button[type=submit]').click();
  await page.getByText('คุยต่อเรื่องการจัดเวลาอ่านหนังสือ',{exact:true}).first().waitFor();
  await snapshot('09-care-loop');
  await switchRole('student');
  await route('/student/journey?id='+request.id);
  assert((await workspace()).followUps.some(item=>item.requestId===request.id));
  await snapshot('10-support-journey');

  await page.setViewportSize({width:390,height:844});
  await route('/student/dashboard');
  assert(await page.locator('.mobile-bottom').isVisible());
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),'Mobile horizontal overflow');
  await page.locator('.mobile-bottom').getByRole('link',{name:'ขอความช่วยเหลือ',exact:true}).click();
  await page.waitForURL('/student/support');
  await route('/student/dashboard');
  await snapshot('11-student-mobile');
  await page.locator('[data-switch]').click();
  await page.locator('dialog [data-demo-reset]').click();
  await page.locator('dialog button[type=submit]').click();
  await page.waitForURL('/student/emotions');
  assert(!(await workspace()).journals.some(item=>item.title==='บันทึกจำลอง'));
  assert(!(await workspace()).requests.some(item=>item.id===request.id));
  assert.deepEqual(faults,[]);
  console.log('Browser workflow passed. Wrote 11 images from real rendered pages.');
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
