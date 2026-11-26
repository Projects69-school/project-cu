import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startServer } from '../server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.APP_PLAYWRIGHT || 'playwright');
const { server } = await startServer({ dbPath: ':memory:', host: '127.0.0.1', port: 0, allowDemo: true });
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;

try {
  browser = await chromium.launch({ executablePath: process.env.APP_CHROME || undefined, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(origin);
  const login = await page.request.post(`${origin}/api/demo`, { data: { role: 'admin' } });
  assert.equal(login.ok(), true);
  await page.goto(`${origin}/admin/dashboard`);
  await page.getByRole('heading', { name: 'ภาพรวมผู้ดูแลระบบ' }).waitFor();
  await page.getByRole('link', { name: 'จัดการบัญชี', exact: true }).first().click();
  await page.getByRole('heading', { name: 'บัญชีผู้ใช้' }).waitFor();
  await page.getByRole('searchbox').fill('ครูพลอย');
  await page.getByRole('row').filter({ hasText: 'ครูพลอย' }).waitFor();
  assert.equal(await page.getByRole('row').filter({ hasText: 'ครูต้น' }).count(), 0);

  await page.goto(`${origin}/admin/schools`);
  await page.getByRole('button', { name: 'เพิ่มห้องเรียน' }).click();
  await page.getByRole('dialog').getByLabel('ชื่อห้องเรียน').fill('ม. 5/2');
  await page.getByRole('dialog').getByLabel('ระดับชั้น').fill('มัธยมศึกษาปีที่ 5');
  await page.getByRole('button', { name: 'บันทึกห้องเรียน' }).click();
  await page.getByText('ม. 5/2', { exact: true }).waitFor();

  await page.goto(`${origin}/admin/permissions`);
  await page.getByRole('heading', { name: 'สิทธิ์และการมอบหมาย' }).waitFor();
  const result = await page.request.get(`${origin}/api/workspace`);
  const data = await result.json();
  assert.equal(data.journals.length, 0);
  assert.equal(data.conversations.length, 0);
  assert.equal(data.requests.length, 0);
  assert.equal(await page.request.get(`${origin}/api/journals`).then(response => response.status()), 403);

  await page.goto(`${origin}/admin/audit-logs`);
  await page.getByRole('heading', { name: 'ประวัติการเข้าถึง' }).waitFor();
  await page.getByText('ปรับข้อมูลห้องเรียน', { exact: true }).waitFor();
  const teacher = await page.request.post(`${origin}/api/demo`, { data: { role: 'teacher' } });
  assert.equal(teacher.ok(), true);
  for (const [route, title] of [
    ['dashboard', 'ยินดีต้อนรับคุณครู'], ['requests', 'คำขอความช่วยเหลือ'], ['students', 'นักเรียนในความดูแล'],
    ['messages', 'ข้อความ'], ['appointments', 'นัดหมาย'], ['support', 'การดูแลนักเรียน'], ['follow-ups', 'ติดตามผล'],
    ['toolkit', 'คู่มือการรับฟัง'], ['referrals', 'ส่งต่อผู้เชี่ยวชาญ'], ['reports', 'รายงาน'], ['settings', 'ตั้งค่า'],
  ]) {
    await page.goto(`${origin}/teacher/${route}`);
    await page.getByRole('heading', { name: title, level: 1, exact: true }).waitFor();
  }
  await page.goto(`${origin}/teacher/toolkit`);
  await page.getByRole('checkbox', { name: 'รับฟังโดยไม่ตัดสิน' }).check();
  await page.getByText('เลือกแล้ว 1 จาก 6 ข้อ').waitFor();
  await page.getByRole('button', { name: 'ใส่ในร่าง', exact: true }).first().click();
  await page.getByRole('button', { name: 'ใส่ในร่างข้อความ' }).click();
  await page.waitForURL('**/teacher/messages?id=*');
  await page.locator('#tc-chat-text').waitFor();
  assert.equal(await page.locator('#tc-chat-text').inputValue(), 'ขอบคุณที่ไว้ใจเล่าให้ครูฟังนะ');
  assert.equal(await page.locator('#tc-chat-log').getByText('ขอบคุณที่ไว้ใจเล่าให้ครูฟังนะ', { exact: true }).count(), 0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/teacher/dashboard`);
  await page.getByRole('heading', { name: 'ยินดีต้อนรับคุณครู', level: 1 }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(pageErrors, []);
  console.log('ผ่านการทดสอบผู้ดูแลระบบ สิทธิ์ข้อมูล หน้าครูบนมือถือ และการนำถ้อยคำแนะนำไปปรับเป็นร่าง');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
