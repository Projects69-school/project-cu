import { api, esc, icon, toast, navigate, refresh, currentUser, pageIntro, statusLabel, showDialog } from './ui.js';
import { renderCare, bindCare } from './student-care.js';

const TH = 'th-TH';
const TZ = 'Asia/Bangkok';
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const date = (value, options = { weekday: 'short', day: 'numeric', month: 'short' }) => value
  ? new Intl.DateTimeFormat(TH, { timeZone: TZ, ...options }).format(new Date(value.length === 10 ? `${value}T12:00:00+07:00` : value)) : '';
const moods = [
  ['มีความสุข', 'joy', '#fff0cc'], ['สบายใจ', 'calm', '#dff0e8'], ['ตื่นเต้น', 'spark', '#f6e3ec'],
  ['เฉย ๆ', 'plain', '#ece7f5'], ['เหนื่อย', 'tired', '#e5e7f5'], ['สับสน', 'confused', '#f8eadb'],
  ['เครียด', 'stress', '#eee3f8'], ['กังวล', 'worry', '#e0eaf8'], ['โกรธ', 'anger', '#f7dce8'],
  ['เหงา', 'lonely', '#e2e9fa'], ['เศร้า', 'sad', '#e4e9fc'], ['รู้สึกหนักใจ', 'heavy', '#e9e4f4'],
  ['ยังไม่แน่ใจ', 'unsure', '#f0edf7'],
];
const topics = ['การเรียน', 'การสอบ', 'ครอบครัว', 'เพื่อน', 'ความสัมพันธ์', 'การถูกกลั่นแกล้ง', 'ความคาดหวัง', 'ความมั่นใจ', 'สุขภาพ', 'อนาคต', 'อื่น ๆ', 'ยังไม่พร้อมระบุ'];

const emotions = [
  { name: 'ความสุข', color: '#ffedc3', details: [['ดีใจ', 'รู้สึกอบอุ่นหรือมีพลังเมื่อมีเรื่องที่ชอบเกิดขึ้น'], ['ภูมิใจ', 'เห็นคุณค่าในสิ่งที่พยายามทำ'], ['ตื่นเต้น', 'รู้สึกมีพลังกับสิ่งที่กำลังจะเกิดขึ้น'], ['ซาบซึ้ง', 'รู้สึกขอบคุณกับสิ่งที่ได้รับ']] },
  { name: 'ความสงบ', color: '#d8efdf', details: [['สบายใจ', 'ใจได้พักและรู้สึกผ่อนคลาย'], ['โล่งใจ', 'รู้สึกเบาลงเมื่อเรื่องที่กังวลคลี่คลาย'], ['ปลอดภัย', 'รู้สึกว่าอยู่ในพื้นที่ที่เป็นตัวเองได้']] },
  { name: 'ความประหลาดใจ', color: '#f5dce9', details: [['แปลกใจ', 'เจอสิ่งที่ต่างจากที่คาดไว้'], ['สงสัย', 'อยากรู้เรื่องที่ยังเข้าใจไม่ครบ'], ['ทึ่ง', 'รู้สึกประทับใจกับสิ่งที่เกินคาด']] },
  { name: 'ความสับสน', color: '#f4e6d7', details: [['ลังเล', 'ยังไม่แน่ใจว่าจะตัดสินใจทางไหน'], ['งง', 'รู้สึกว่ายังจับต้นชนปลายไม่ถูก'], ['ยังไม่แน่ใจ', 'รู้สึกหลายอย่างพร้อมกันหรือยังหาคำไม่เจอ']] },
  { name: 'ความกลัว', color: '#e2eafa', details: [['กังวล', 'ใจวนคิดถึงสิ่งที่อาจเกิดขึ้น'], ['ไม่มั่นใจ', 'ยังไม่แน่ใจว่าจะรับมือไหวไหม'], ['ประหม่า', 'รู้สึกเกร็งเมื่อกำลังเจอสิ่งที่สำคัญ'], ['รู้สึกกดดัน', 'รู้สึกว่ามีความคาดหวังที่รับมือยาก']] },
  { name: 'ความเศร้า', color: '#e4e0f8', details: [['เหงา', 'อยากรู้สึกเชื่อมโยงกับใครสักคน'], ['ผิดหวัง', 'สิ่งที่เกิดขึ้นต่างจากที่หวังไว้'], ['เสียใจ', 'เจ็บปวดกับการสูญเสียหรือเรื่องที่มีความหมาย'], ['รู้สึกถูกทอดทิ้ง', 'รู้สึกว่าไม่ได้รับการดูแลหรือความใส่ใจ'], ['ท้อแท้', 'รู้สึกว่าพลังใจที่จะลองต่อเริ่มลดลง']] },
  { name: 'ความโกรธ', color: '#f3dbea', details: [['หงุดหงิด', 'รู้สึกติดขัดหรือรำคาญง่ายขึ้น'], ['ไม่พอใจ', 'รู้สึกว่าสิ่งที่เกิดขึ้นขัดกับสิ่งที่ต้องการ'], ['รู้สึกไม่เป็นธรรม', 'รู้สึกว่าถูกปฏิบัติอย่างไม่เท่าเทียม'], ['รู้สึกว่าไม่มีใครเข้าใจ', 'อยากให้ผู้อื่นรับรู้มุมมองและความรู้สึกของเรา']] },
];

const reflectionTopics = ['ความเครียดจากการเรียน', 'ความกังวล', 'การพักผ่อน', 'ความสัมพันธ์กับเพื่อน', 'ความสัมพันธ์ในครอบครัว', 'ความมั่นใจในตนเอง', 'ความรู้สึกเป็นส่วนหนึ่งของโรงเรียน', 'การเข้าถึงความช่วยเหลือ'];
const prompts = ['วันนี้เกิดอะไรขึ้นบ้าง?', 'ตอนนี้เธอกำลังรู้สึกอย่างไร?', 'มีอะไรที่อยากให้คนอื่นเข้าใจไหม?', 'ตอนนี้เธอต้องการอะไร?', 'มีเรื่องอะไรที่อยากระบายออกมาไหม?'];
let state;
let emotionTransfer = '';
let emotionDestination = '';
let selectedEmotionGroup = 0;
let selectedEmotionDetail = 0;
let selectedTrust = '';

const href = (name, text, kind = 'secondary', symbol = '') => `<a class="btn btn-${kind}" href="/student/${name}">${symbol ? icon(symbol) : ''}${esc(text)}</a>`;
const empty = (symbol, text, action = '') => `<div class="st-empty"><span class="st-chip">${icon(symbol)}</span><p>${esc(text)}</p>${action}</div>`;
const hint = (text, symbol = 'lock') => `<div class="st-hint">${icon(symbol, 17)}<span>${esc(text)}</span></div>`;
const cardHead = (symbol, title, detail = '') => `<div class="st-card-head"><span class="st-chip">${icon(symbol, 20)}</span><div><h3>${esc(title)}</h3>${detail ? `<p class="muted">${esc(detail)}</p>` : ''}</div></div>`;
const form = (selector, callback) => document.querySelector(selector)?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const element = event.currentTarget;
  const button = element.querySelector('[type="submit"]');
  if (button) button.disabled = true;
  try { await callback(new FormData(element), element, event.submitter); }
  catch (error) { toast(error.message || 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง'); }
  finally { if (button) button.disabled = false; }
});
const confirmAction = (button, title, detail, action) => button?.addEventListener('click', () => showDialog(title, `<p>${esc(detail)}</p><div class="st-actions"><button type="submit" class="btn btn-primary">ยืนยัน</button></div>`, action));
const fileUrl = (file, max = 750_000) => new Promise((resolve, reject) => {
  if (file.size > max) return reject(new Error('ไฟล์มีขนาดเกินกำหนด ลองเลือกไฟล์ที่เล็กลง'));
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return reject(new Error('เลือกรูปภาพ PNG, JPEG, WebP หรือ GIF'));
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
  reader.readAsDataURL(file);
});

function face(name, look, color) {
  const mouth = { joy: 'M14 23 Q20 34 26 23Z', calm: 'M15 23 Q20 28 25 23', spark: 'M15 23 Q20 32 25 23Z', plain: 'M16 25h8', tired: 'M17 26q3-3 6 0', confused: 'M15 26q2-5 5-1t5-1', stress: 'M15 27q5-7 10 0', worry: 'M15 27q5-5 10 0', anger: 'M16 27q4-5 8 0', lonely: 'M17 27q3-4 6 0', sad: 'M15 27q5-6 10 0', heavy: 'M15 27q5-3 10 0', unsure: 'M16 26q4-2 8 0' }[look];
  const eyes = look === 'calm' ? '<path d="M11 18q3 3 6 0m6 0q3 3 6 0"/>' : look === 'tired' ? '<path d="M11 18h6m6 0h6"/>' : look === 'anger' ? '<path d="m11 15 6 3m6 0 6-3"/><circle cx="14" cy="20" r="1"/><circle cx="26" cy="20" r="1"/>' : '<circle cx="14" cy="17" r="1.5"/><circle cx="26" cy="17" r="1.5"/>';
  return `<svg class="st-face" aria-hidden="true" viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="${color}"/><g fill="none" stroke="#5b486d" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${eyes}<path d="${mouth || 'M16 24q4 3 8 0'}"/></g>${look === 'sad' ? '<path d="M28 21q5 6 0 6q-4-1 0-6" fill="#92a9dc"/>' : ''}</svg><span>${esc(name)}</span>`;
}

function moodChoices(options, selected = []) {
  return options.map(([name, look, color]) => `<label class="st-mood"><input type="checkbox" name="emotions" value="${esc(name)}" ${selected.includes(name) ? 'checked' : ''}><span>${face(name, look, color)}</span></label>`).join('');
}

function heroIllustration() {
  return `<svg class="st-hero-art" viewBox="0 0 534 287" role="img" aria-label="นักเรียนกับครูยืนคนละฝั่งของสะพานสีม่วง">
    <defs><pattern id="st-hero-dots" width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#9A7ACD" opacity=".28"/></pattern></defs>
    <path d="M69 227C74 164 131 87 184 64c51-22 74 5 117-11 77-28 145-7 168 50 17 43 1 100-17 132H74Z" fill="#e7dbf8"/>
    <circle cx="394" cy="106" r="61" fill="#f2e9fa"/><path d="M357 76h118v82H357z" fill="url(#st-hero-dots)"/>
    <path d="M10 260c95-29 179-27 267-2 75 21 168 17 251-8M30 279c77-21 147-16 224-1 87 17 169 17 252-1" fill="none" stroke="#bfa6e5" stroke-width="1.5" opacity=".75"/>
    <path d="M43 230c33-19 62-18 111 0 75 27 115 15 150 3 66-22 135-25 205-4" fill="none" stroke="#b5a0d7" stroke-width="1.2" stroke-dasharray="3 6"/>
    <path d="M77 209c48 3 70-5 99-28 31-25 63-61 95-61s61 36 93 61c28 23 56 31 95 28" fill="none" stroke="#a585d5" stroke-width="22" stroke-linecap="round"/>
    <path d="M77 200c48 3 70-5 99-28 31-25 63-61 95-61s61 36 93 61c28 23 56 31 95 28" fill="none" stroke="#d8c4f2" stroke-width="10" stroke-linecap="round"/>
    <path d="M117 210v35m36-45v33m40-63v63m45-102v89m63-89v88m47-47v63m40-35v33m35-25v35" fill="none" stroke="#8b69bc" stroke-width="4" stroke-linecap="round"/>
    <path d="M94 245h46m28-9h43m9-14h40m22 0h38m9 13h37m-3 4h42m0 7h41" fill="none" stroke="#b695e1" stroke-width="5" stroke-linecap="round"/>
    <g transform="translate(253 55)"><path d="M17 34C4 27-4 18 0 9c3-7 13-9 19 0 6-9 17-7 20 0 4 9-5 18-17 25q-3 2-5 0Z" fill="#caa8e9" stroke="#7754ac" stroke-width="2"/><path d="m10 17 5 1 3-6 4 10 4-5h4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g transform="translate(109 101)"><path d="m19 71-4 28m17-28 6 27M14 99h-5m29 0h5" stroke="#59486b" stroke-width="4" stroke-linecap="round"/><path d="M8 58c2-14 11-23 20-23s17 9 18 22l-5 20H12Z" fill="#9274c9"/><path d="M38 44q9 8 21-5m-48 6Q3 53 5 66" fill="none" stroke="#694a9b" stroke-width="4" stroke-linecap="round"/><circle cx="27" cy="22" r="14" fill="#ecc2ad"/><path d="M12 25Q6 4 26 4c12 0 17 11 15 16q-12 2-19-6-1 8-10 11Z" fill="#5b455f"/><path d="M23 24h.1m10 0h.1m-7 6q3 2 5-1" stroke="#5b455f" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M18 46h20L34 65H20z" fill="#dcccf3"/><path d="m22 48 11 1" stroke="#9274c9" stroke-width="1.3"/></g>
    <g transform="translate(379 84)"><path d="m21 80-5 30m20-30 7 30m-27 0h-6m33 0h5" stroke="#5e4a73" stroke-width="4" stroke-linecap="round"/><path d="M11 61c1-16 7-26 20-26 12 0 19 11 21 28l-4 21H13Z" fill="#e9aebe"/><path d="M19 46Q8 54-6 44m50 4q8 7 10 21" fill="none" stroke="#aa647e" stroke-width="4" stroke-linecap="round"/><circle cx="29" cy="21" r="14" fill="#eac0a8"/><path d="M16 24C6 3 32-4 42 7q6 6 2 17-14-2-20-10-2 7-8 10Z" fill="#554264"/><path d="M18 23h24m-19-2h6v6h-6zm11 0h6v6h-6zm-5 9q3 2 5-1" stroke="#61496e" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="m30 36-3 9 4 7 4-7-3-9" fill="#fcf1f5"/></g>
    <path d="M77 123h10m-5-5v10m351-58h11m-5.5-5.5v11m-242 9h8m-4-4v8M471 151h12m-6-6v12" stroke="#aa86d4" stroke-width="1.7" stroke-linecap="round"/><circle cx="68" cy="180" r="3" fill="#be9be8"/><circle cx="457" cy="179" r="4" fill="#d3a7e1"/>
  </svg>`;
}

function dashboard(w) {
  const firstName = (w.user?.name || currentUser()?.name || 'เธอ').trim().split(/\s+/)[0];
  const check = w.checkins.find((row) => row.date === today());
  const latest = [...w.checkins].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).reverse();
  const request = w.requests.find((item) => !['closed', 'declined'].includes(item.status));
  const appointment = w.appointments.filter((item) => ['requested', 'confirmed', 'suggested'].includes(item.status) && new Date(appointmentTime(item, w) || 0) > new Date()).sort((a, b) => String(appointmentTime(a, w)).localeCompare(String(appointmentTime(b, w))))[0];
  const conversation = w.conversations.find((item) => !item.archived);
  const highlights = [
    ['book-open', 'บันทึกส่วนตัว', 'จดหรือวาดเรื่องที่อยากเก็บไว้กับตัวเอง', 'journal', 'pink'],
    ['heart-handshake', 'เปิดใจตามความพร้อม', 'เลือกวิธีเริ่มที่เหมาะกับเธอ', 'trust-ladder', 'lavender'],
    ['leaf', 'กิจกรรมดูแลใจ', 'หาเวลาพักสั้น ๆ ในแบบที่ชอบ', 'wellness', 'mint'],
  ];
  return `<div class="st-home stack">
    <section class="st-hero"><div class="st-hero-copy"><p class="st-date">${icon('calendar-days', 16)} ${date(today(), { weekday: 'long', month: 'long', day: 'numeric' })}</p><h1>สวัสดี ${esc(firstName)} <span class="st-greeting-flower" aria-hidden="true">✿</span></h1><p>วันนี้เป็นอย่างไรบ้าง?<br>ไม่ว่าจะรู้สึกแบบไหน พื้นที่นี้เป็นของเธอ</p>${href('support', 'ขอความช่วยเหลือ', 'primary', 'heart-handshake')}</div>${heroIllustration()}</section>
    <div class="st-home-grid"><section class="card st-check-card"><div class="st-section-line"><div><h2>วันนี้เธอรู้สึกอย่างไร?</h2><p class="muted">เลือกได้มากกว่าหนึ่งความรู้สึก</p></div><span class="st-private-pill">${icon('lock', 14)} ส่วนตัว</span></div><form id="st-home-check"><div class="st-moods st-home-moods">${moodChoices([moods[0], moods[1], moods[3], moods[4], moods[7], moods[10]], check?.emotions)}</div><div class="st-check-actions"><a href="/student/emotions">ดูอารมณ์ทั้งหมด ${icon('arrow-right', 15)}</a><button type="submit" class="btn btn-primary">${check ? 'อัปเดตเช็กอิน' : 'บันทึกความรู้สึก'}</button></div></form></section>
    <section class="card st-timeline-card"><div class="st-section-line"><div><h2>อารมณ์ที่ผ่านมา</h2><p class="muted">ย้อนดูสิ่งที่เธอรู้สึกในแต่ละวัน</p></div><a class="st-icon-link" href="/student/emotions" aria-label="ดูประวัติอารมณ์">${icon('arrow-up-right', 19)}</a></div>${latest.length ? `<div class="st-sparkline">${latest.map((entry) => `<span>${face(...(moods.find((item) => item[0] === entry.emotions[0]) || [entry.emotions[0], 'plain', '#eee2f4']))}<small>${date(entry.date, { day: 'numeric', month: 'short' })}</small></span>`).join('')}</div>` : empty('calendar-heart', 'บันทึกความรู้สึกครั้งแรกเพื่อเริ่มดูประวัติ')}</section></div>
    <div class="st-section-line st-home-next"><h2>วันนี้อยากทำอะไรต่อ?</h2></div><section class="st-shortcuts">${highlights.map(([symbol, title, body, path, shade]) => `<a href="/student/${path}" class="card st-shortcut"><span class="st-chip st-${shade}">${icon(symbol, 22)}</span><div><h3>${title}</h3><p>${body}</p></div>${icon('arrow-up-right', 17)}</a>`).join('')}</section>
    <section class="st-shortcuts st-follow-card"><a class="card" href="/student/journey">${cardHead('route', 'เส้นทางการดูแล', request ? statusLabel(request.status) : 'ดูสถานะคำขอความช่วยเหลือ')}</a><a class="card" href="/student/messages">${cardHead('message-circle', 'ข้อความจากครู', conversation ? `${conversation.otherName}${conversation.unread ? ` · ยังไม่ได้อ่าน ${conversation.unread}` : ''}` : 'เปิดบทสนทนากับครูที่ไว้วางใจ')}</a><a class="card" href="/student/appointments">${cardHead('calendar', 'นัดหมายถัดไป', appointment ? `${date(appointmentTime(appointment, w))} · ${appointment.teacherName || 'ครู'}` : 'ดูเวลาว่างและขอนัดหมาย')}</a></section>
  </div>`;
}

function appointmentTime(item, w) {
  return item.startAt || w.availability.find((slot) => slot.id === item.slotId)?.startAt;
}

function bindDashboard(w) {
  form('#st-home-check', async (data) => {
    const existing = w.checkins.find((entry) => entry.date === today());
    const visible = new Set([moods[0], moods[1], moods[3], moods[4], moods[7], moods[10]].map(([name]) => name));
    const retained = existing?.emotions.filter((emotion) => !visible.has(emotion)) || [];
    const selected = [...data.getAll('emotions'), ...retained];
    if (!selected.length) return toast('เลือกอย่างน้อยหนึ่งความรู้สึกก่อนบันทึก');
    await api(`/checkins${existing ? `/${existing.id}` : ''}`, { method: existing ? 'PATCH' : 'POST', body: { date: today(), emotions: selected, intensity: existing?.intensity ?? 3, topics: existing?.topics || [], note: existing?.note || '' } });
    toast('บันทึกความรู้สึกไว้ให้แล้ว');
    await refresh();
  });
}

export async function renderStudent(path) {
  const route = path.replace(/^\/student\/?/, '').replace(/\/$/, '') || 'dashboard';
  if (route !== emotionDestination) emotionTransfer = '';
  const workspace = await api('/workspace');
  const page = pages[route];
  const html = await (page ? page[0](workspace) : renderCare(route, workspace));
  state = workspace;
  return html;
}

export function bindStudent(path) {
  const route = path.replace(/^\/student\/?/, '').replace(/\/$/, '') || 'dashboard';
  const page = pages[route];
  return page ? page[1](state) : bindCare(route, state);
}

export const studentTools = { date, today, href, hint, empty, cardHead, form, confirmAction, fileUrl, moods, appointmentTime, getEmotion: () => emotionTransfer, clearEmotion: () => { emotionTransfer = ''; } };

function monthCalendar(month, entries, link) {
  const [year, number] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, number - 1, 1));
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const weekday = (start.getUTCDay() + 6) % 7;
  const byDay = new Map(entries.map((item) => [item.date || item.createdAt?.slice(0, 10), item]));
  const days = Array.from({ length: count }, (_, index) => {
    const key = `${month}-${String(index + 1).padStart(2, '0')}`;
    const record = byDay.get(key);
    return record ? `<a href="${link(record)}" title="${esc(record.emotions?.join(', ') || record.title)}" class="st-day st-day-mark" aria-label="${esc(`${date(key)} มีบันทึก`)}">${index + 1}</a>` : `<span class="st-day">${index + 1}</span>`;
  });
  return `<div class="st-calendar">${['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'].map((label) => `<strong>${label}</strong>`).join('')}${'<span></span>'.repeat(weekday)}${days.join('')}</div>`;
}

function emotionPage(w) {
  const query = new URLSearchParams(location.search);
  const current = w.checkins.find((entry) => entry.id === query.get('edit')) || w.checkins.find((entry) => entry.date === today());
  const selected = [...new Set([...(current?.emotions || []), emotionTransfer].filter(Boolean))];
  const options = [...moods, ...selected.filter((emotion) => !moods.some(([name]) => name === emotion)).map((emotion) => [emotion, 'plain', '#eee5f8'])];
  const values = [...new Set(w.checkins.flatMap((entry) => entry.emotions))];
  return `${pageIntro('อารมณ์ของฉัน', 'วันนี้เธอรู้สึกอย่างไร?', 'มีได้มากกว่าหนึ่งความรู้สึก และเปลี่ยนใจได้เสมอ', href('emotion-wheel', 'เปิดวงล้ออารมณ์', 'secondary', 'palette'))}
  <div class="st-two-pane"><section class="card"><div class="st-section-line"><h2>${current ? 'แก้ไขเช็กอิน' : 'เช็กอินความรู้สึก'}</h2><span class="st-private-pill">${icon('lock', 14)} ส่วนตัว</span></div>
    <form id="st-emotion-form" class="stack"><div class="st-moods">${moodChoices(options, selected)}</div>
      <fieldset class="st-fieldset"><legend>ความรู้สึกนี้ชัดเจนแค่ไหน?</legend><div class="st-intensity">${[1, 2, 3, 4, 5].map((level) => `<label><input type="radio" name="intensity" value="${level}" ${(current?.intensity ?? 3) === level ? 'checked' : ''}><span>${level}</span></label>`).join('')}</div><div class="st-range-labels"><span>รู้สึกเล็กน้อย</span><span>รู้สึกชัดมาก</span></div></fieldset>
      <details class="st-details" ${current?.topics?.length || current?.note ? 'open' : ''}><summary>เพิ่มเรื่องที่ส่งผลต่อความรู้สึก <span>ข้ามได้</span></summary><fieldset class="st-fieldset"><legend>วันนี้มีเรื่องอะไรเกิดขึ้นบ้าง?</legend><div class="st-pick-row">${topics.map((topic) => `<label class="st-pick"><input type="checkbox" name="topics" value="${topic}" ${current?.topics?.includes(topic) ? 'checked' : ''}><span>${topic}</span></label>`).join('')}</div></fieldset><label class="field">บันทึกสั้น ๆ<textarea name="note" maxlength="1500" rows="3" placeholder="ถ้าอยากเขียนเพิ่ม เขียนตรงนี้ได้เลย">${esc(current?.note || '')}</textarea></label></details>
      <label class="field st-date-field">วันที่<input type="date" name="date" value="${current?.date || today()}" max="${today()}" required></label>
      ${hint('เก็บไว้เฉพาะเธอ ครูจะไม่เห็นเช็กอินของเธอ')}
      <div class="st-actions"><button type="submit" class="btn btn-primary">บันทึกความรู้สึก</button>${current ? '<button type="button" id="st-delete-checkin" class="btn btn-secondary">ลบเช็กอินนี้</button>' : ''}</div>
    </form></section>
    <section class="card st-history"><h2>ประวัติอารมณ์ของเธอ</h2><p class="muted">อ่านสิ่งที่เคยรู้สึกและสังเกตสิ่งที่อยากดูแล</p><label class="field">เลือกเดือน<input type="month" id="st-mood-month" value="${today().slice(0, 7)}"></label><div id="st-mood-calendar">${monthCalendar(today().slice(0, 7), w.checkins, (entry) => `/student/emotions?edit=${encodeURIComponent(entry.id)}`)}</div><label class="field">กรองอารมณ์<select id="st-mood-filter"><option value="">ทุกความรู้สึก</option>${values.map((mood) => `<option>${esc(mood)}</option>`).join('')}</select></label><h3>ย้อนหลัง 7 วัน</h3><div id="st-mood-records">${checkinRecords(w.checkins)}</div></section>
  </div>`;
}

function checkinRecords(records, filter = '') {
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const filtered = records.filter((entry) => entry.date >= weekAgo && (!filter || entry.emotions.includes(filter))).sort((a, b) => b.date.localeCompare(a.date));
  if (!filtered.length) return empty('calendar-heart', 'ยังไม่มีเช็กอินในช่วงนี้');
  return `<p class="st-insight">บันทึก ${filtered.length} วัน · ความรู้สึกเปลี่ยนได้ในแต่ละวัน</p><div class="st-list">${filtered.map((entry) => `<a class="st-list-row" href="/student/emotions?edit=${encodeURIComponent(entry.id)}"><span><strong>${esc(entry.emotions.join(' · '))}</strong><small>${date(entry.date)}${entry.topics?.length ? ` · ${esc(entry.topics.join(', '))}` : ''}</small></span>${icon('pencil', 15)}</a>`).join('')}</div>`;
}

function bindEmotions(w) {
  const current = w.checkins.find((entry) => entry.id === new URLSearchParams(location.search).get('edit')) || w.checkins.find((entry) => entry.date === today());
  form('#st-emotion-form', async (data) => {
    const selected = data.getAll('emotions');
    if (!selected.length) return toast('เลือกอย่างน้อยหนึ่งความรู้สึกก่อนบันทึก');
    const existing = current || w.checkins.find((entry) => entry.date === data.get('date'));
    await api(`/checkins${existing ? `/${existing.id}` : ''}`, { method: existing ? 'PATCH' : 'POST', body: { date: data.get('date'), emotions: selected, intensity: Number(data.get('intensity')), topics: data.getAll('topics'), note: data.get('note') } });
    emotionTransfer = '';
    toast('บันทึกความรู้สึกไว้ให้แล้ว');
    await refresh();
  });
  confirmAction(document.querySelector('#st-delete-checkin'), 'ลบเช็กอินนี้?', 'ข้อมูลในรายการนี้จะถูกลบออกจากประวัติของเธอ', async () => {
    await api(`/checkins/${current.id}`, { method: 'DELETE' });
    toast('ลบเช็กอินแล้ว');
    navigate('/student/emotions');
  });
  document.querySelector('#st-mood-month').addEventListener('change', ({ target }) => {
    if (target.value) document.querySelector('#st-mood-calendar').innerHTML = monthCalendar(target.value, w.checkins, (entry) => `/student/emotions?edit=${encodeURIComponent(entry.id)}`);
  });
  document.querySelector('#st-mood-filter').addEventListener('change', ({ target }) => {
    document.querySelector('#st-mood-records').innerHTML = checkinRecords(w.checkins, target.value);
  });
}

function point(angle, radius) {
  const rad = angle * Math.PI / 180;
  return [192 + radius * Math.cos(rad), 192 + radius * Math.sin(rad)];
}

function emotionWheel() {
  const slices = emotions.map(({ color }, index) => {
    const start = -90 - 360 / 14 + index * 360 / 7;
    const end = start + 360 / 7;
    const [a, b] = point(start + 1, 172);
    const [c, d] = point(end - 1, 172);
    const [e, f] = point(end - 1, 59);
    const [g, h] = point(start + 1, 59);
    return `<path data-slice="${index}" d="M${a} ${b} A172 172 0 0 1 ${c} ${d} L${e} ${f} A59 59 0 0 0 ${g} ${h}Z" fill="${color}"/>`;
  }).join('');
  return `${pageIntro('อารมณ์ของฉัน', 'วงล้ออารมณ์', 'เริ่มจากกลุ่มที่ใกล้เคียง แล้วลองหาคำที่ตรงกับความรู้สึกของเธอ')}
  <section class="card st-wheel-layout"><div class="st-wheel" role="group" aria-label="กลุ่มอารมณ์"><svg viewBox="0 0 384 384" aria-hidden="true"><circle cx="192" cy="192" r="183" fill="#fcfaff" stroke="#e9def5"/>${slices}<circle cx="192" cy="192" r="53" fill="white" stroke="#e9def5"/><path d="M192 210c-13-6-22-15-16-25 4-7 12-6 16 0 4-6 13-7 17 0 5 10-4 19-17 25Z" fill="#f1e5f7" stroke="#9c78c7" stroke-width="2.2"/></svg>${emotions.map(({ name }, index) => {
    const [x, y] = point(-90 + index * 360 / 7, 120);
    return `<button class="st-wheel-option" data-group="${index}" style="--wheel-x:${x / 3.84}%;--wheel-y:${y / 3.84}%" type="button" aria-pressed="${selectedEmotionGroup === index}">${name}</button>`;
  }).join('')}</div><div id="st-wheel-detail">${wheelDetail()}</div></section>
  ${hint('วงล้อนี้ช่วยสำรวจและเรียกชื่อความรู้สึก ใช้เพื่อสะท้อนใจของเธอได้ตามสบาย', 'info')}`;
}

function wheelDetail() {
  const group = emotions[selectedEmotionGroup];
  const selected = group.details[selectedEmotionDetail];
  return `<h2>${group.name}</h2><div class="st-pick-row" role="group" aria-label="คำที่บอกความรู้สึก">${group.details.map(([name], index) => `<button type="button" data-detail="${index}" class="st-choice" aria-pressed="${index === selectedEmotionDetail}">${esc(name)}</button>`).join('')}</div><div class="st-wheel-meaning"><strong>${esc(selected[0])}</strong><p>${esc(selected[1])}</p></div><p class="muted">อยากใช้คำนี้ที่ไหน?</p><div class="st-actions st-wheel-actions">${[['emotions', 'เพิ่มในเช็กอิน'], ['journal', 'เพิ่มในบันทึก'], ['support', 'ใช้ในคำขอ']].map(([path, label]) => `<button type="button" data-emotion-to="${path}" class="btn btn-secondary">${label}</button>`).join('')}</div>`;
}

function bindWheel() {
  const detail = document.querySelector('#st-wheel-detail');
  document.querySelector('.st-wheel').addEventListener('click', ({ target }) => {
    const button = target.closest('[data-group]');
    if (!button) return;
    selectedEmotionGroup = Number(button.dataset.group);
    selectedEmotionDetail = 0;
    document.querySelectorAll('[data-group]').forEach((element) => element.setAttribute('aria-pressed', String(element === button)));
    detail.innerHTML = wheelDetail();
  });
  detail.addEventListener('click', ({ target }) => {
    const option = target.closest('[data-detail]');
    if (option) {
      selectedEmotionDetail = Number(option.dataset.detail);
      detail.innerHTML = wheelDetail();
      detail.querySelector(`[data-detail="${selectedEmotionDetail}"]`).focus();
    }
    const action = target.closest('[data-emotion-to]');
    if (action) {
      emotionTransfer = emotions[selectedEmotionGroup].details[selectedEmotionDetail][0];
      emotionDestination = action.dataset.emotionTo;
      navigate(`/student/${emotionDestination}`);
    }
  });
}

const trustOptions = [
  { id: 'feel', en: 'FEEL', title: 'เข้าใจความรู้สึก', quote: 'อยากทำความเข้าใจความรู้สึกของตัวเอง', body: 'เริ่มจากการเรียกชื่ออารมณ์ หรือเช็กอินความรู้สึกไว้ดูด้วยตัวเอง', share: 'ไม่มีข้อมูลส่งให้ครู', symbol: 'heart', links: [['emotion-wheel', 'เปิดวงล้ออารมณ์'], ['emotions', 'เช็กอินความรู้สึก']] },
  { id: 'reflect', en: 'REFLECT', title: 'ระบายเป็นส่วนตัว', quote: 'อยากระบาย แต่ยังไม่พร้อมให้ใครรู้', body: 'เขียนเรื่องที่ค้างอยู่ในใจ หรือวาดรูปในพื้นที่ส่วนตัวของเธอ', share: 'บันทึกและภาพวาดเก็บไว้เฉพาะเธอ', symbol: 'pen-line', links: [['journal', 'เปิดบันทึกส่วนตัว'], ['journal?draw=1', 'เปิดพื้นที่วาดรูป']] },
  { id: 'signal', en: 'SIGNAL', title: 'ส่งสัญญาณถึงครู', quote: 'อยากให้ใครสักคนรู้ว่าตอนนี้ต้องการความช่วยเหลือ', body: 'เลือกครูและประเภทความช่วยเหลือที่ต้องการ ส่งสัญญาณได้โดยไม่ต้องเล่ารายละเอียด', share: 'ครูที่เลือกจะเห็นข้อมูลที่เธอยืนยันก่อนส่ง', symbol: 'radio', links: [['support?mode=signal', 'ส่งสัญญาณขอความช่วยเหลือ']] },
  { id: 'express', en: 'EXPRESS', title: 'เล่าเฉพาะที่พร้อม', quote: 'พร้อมเล่าความรู้สึกบางส่วนแล้ว', body: 'เลือกข้อความ อารมณ์ ข้อความบางส่วนจากบันทึก หรือภาพวาดที่อยากให้ครูเห็น', share: 'ตรวจตัวอย่างและผู้รับก่อนแชร์ เวลาไหนก็กลับมาแก้ได้', symbol: 'message-circle', links: [['support?mode=express', 'เลือกสิ่งที่อยากเล่า']] },
  { id: 'connect', en: 'CONNECT', title: 'คุยกับคนที่ไว้วางใจ', quote: 'พร้อมพูดคุยกับคนที่ไว้วางใจ', body: 'เริ่มคุยกับครูที่ดูแลหรือเลือกเวลานัดที่สะดวก แล้วค่อยติดตามกันต่อ', share: 'บทสนทนาและการนัดหมายเปิดให้เฉพาะผู้ที่เกี่ยวข้อง', symbol: 'heart-handshake', links: [['messages', 'เปิดข้อความ'], ['appointments', 'ดูเวลานัดหมาย']] },
];

function trustPage() {
  return `${pageIntro('สะพานใจ', 'Trust Ladder', 'เปิดใจตามความพร้อมของตัวเอง')}
    <section class="st-trust card"><div class="st-bridge-stage"><svg class="st-trust-bridge" aria-hidden="true" viewBox="0 0 1060 245" preserveAspectRatio="none"><path d="M-10 195C127 150 211 157 319 180s167 52 285 19c146-40 208-70 467-20v100H-10Z" fill="#e5d8f7"/><path d="M-8 198c142-37 209-33 326-11 126 24 166 50 295 15 172-46 248-57 457-12M-8 220c142-37 209-33 326-11 126 24 166 50 295 15 172-46 248-57 457-12" fill="none" stroke="#bea5e1" stroke-width="1.4"/><path d="M25 136h1011" stroke="#b292db" stroke-width="10" stroke-linecap="round"/><path d="M25 128h1011" stroke="#e0c9f4" stroke-width="6" stroke-linecap="round"/><path d="M26 144v38m100-38v28m101-28v32m101-32v46m101-46v61m101-61v67m101-67v57m101-57v40m101-40v26m101-26v24m103-24v41" fill="none" stroke="#aa8bd5" stroke-width="3" stroke-linecap="round"/></svg><div class="st-trust-options" role="group" aria-label="ตัวเลือกการเปิดใจ">${trustOptions.map((item) => `<button type="button" class="st-trust-option" data-trust="${item.id}" aria-pressed="${item.id === selectedTrust}"><span class="st-trust-orb">${icon(item.symbol, 23)}</span><small>${item.en}</small><strong>${item.title}</strong></button>`).join('')}</div></div><div class="st-trust-note">${icon('sparkles', 19)}<div><strong>เลือกได้อย่างอิสระ ข้ามระดับได้ และไม่จำเป็นต้องเปิดเผยทุกเรื่อง</strong><p>ทุกตัวเลือกมีคุณค่าเท่ากัน เริ่มตรงไหน กลับมาเลือกใหม่ หรือหยุดเมื่อไรก็ได้</p></div></div><div id="st-trust-detail" aria-live="polite">${trustDetail()}</div></section>`;
}

function trustDetail() {
  const item = trustOptions.find(({ id }) => id === selectedTrust);
  if (!item) return `<p class="st-trust-await">เลือกทางที่รู้สึกว่าเหมาะกับเธอในตอนนี้</p>`;
  return `<div class="st-trust-expanded"><div><h2>${item.quote}</h2><p class="muted">${item.body}</p>${hint(item.share)}</div><div class="st-actions">${item.links.map(([path, label], index) => href(path, label, index ? 'secondary' : 'primary')).join('')}</div></div>`;
}

function bindTrust() {
  document.querySelector('.st-trust-options').addEventListener('click', ({ target }) => {
    const button = target.closest('[data-trust]');
    if (!button) return;
    selectedTrust = button.dataset.trust;
    document.querySelectorAll('[data-trust]').forEach((element) => element.setAttribute('aria-pressed', String(element === button)));
    document.querySelector('#st-trust-detail').innerHTML = trustDetail();
  });
}

function journalPage(w) {
  const params = new URLSearchParams(location.search);
  const current = w.journals.find((entry) => entry.id === params.get('edit'));
  const tagOptions = [...new Set([...moods.map(([name]) => name), ...w.journals.flatMap((entry) => entry.emotions || []), emotionTransfer].filter(Boolean))];
  const tags = [...new Set([...(current?.emotions || []), emotionTransfer].filter(Boolean))];
  return `${pageIntro('บันทึกส่วนตัว', 'พื้นที่เล็ก ๆ สำหรับความรู้สึกของเธอ', 'จด วาด หรือเก็บร่างไว้กลับมาเขียนต่อได้ทุกเมื่อ', current ? href('journal', 'เขียนบันทึกใหม่', 'secondary', 'plus') : '')}
    <div class="st-two-pane"><section class="card st-journal-editor"><div class="st-section-line"><h2>${current ? 'แก้ไขบันทึก' : 'บันทึกของเธอ'}</h2><span class="st-private-pill">${icon('lock', 14)} เฉพาะเธอ</span></div><form class="stack" id="st-journal-form">
      <label class="field">ชื่อบันทึก<input name="title" maxlength="120" value="${esc(current?.title || '')}" placeholder="ตั้งชื่อบันทึกสั้น ๆ"></label>
      <details class="st-details"><summary>ลองใช้คำถามเริ่มเขียน <span>เลือกได้</span></summary><div class="st-pick-row">${prompts.map((prompt) => `<button type="button" class="st-choice" data-prompt="${esc(prompt)}">${prompt}</button>`).join('')}</div></details>
      <div class="st-editor"><div class="st-editor-bar" role="toolbar" aria-label="จัดรูปแบบบันทึก"><button type="button" data-format="bold" aria-label="ตัวหนา">${icon('bold', 18)}</button><button type="button" data-format="italic" aria-label="ตัวเอียง">${icon('italic', 18)}</button><button type="button" data-format="bullets" aria-label="รายการแบบจุด">${icon('list', 18)}</button><span>จัดรูปแบบข้อความที่เลือก</span></div><textarea name="body" aria-label="เนื้อหาบันทึก" rows="8" maxlength="12000" placeholder="เริ่มตรงไหนก็ได้…">${esc(current?.body || '')}</textarea></div>
      <details class="st-details" ${tags.length ? 'open' : ''}><summary>ติดสติกเกอร์อารมณ์ <span>เลือกได้</span></summary><div class="st-pick-row">${tagOptions.map((tag) => `<label class="st-pick"><input type="checkbox" name="emotions" value="${esc(tag)}" ${tags.includes(tag) ? 'checked' : ''}><span>${esc(tag)}</span></label>`).join('')}</div></details>
      <details class="st-details" ${params.has('draw') || current?.drawing ? 'open' : ''}><summary>วาดรูปในบันทึก <span>เลือกได้</span></summary><div class="st-drawing-tools"><label>สี <input type="color" id="st-brush-color" value="#795bb0" aria-label="สีของแปรง"></label><label>ขนาดแปรง <input type="range" id="st-brush-size" value="6" min="1" max="24" aria-label="ขนาดแปรง"></label><button type="button" class="st-tool" id="st-canvas-undo" aria-label="ย้อนกลับ">${icon('undo-2', 18)}</button><button type="button" class="st-tool" id="st-canvas-redo" aria-label="ทำซ้ำ">${icon('redo-2', 18)}</button><button type="button" class="st-tool" id="st-canvas-clear" aria-label="ล้างภาพ">${icon('eraser', 18)}</button></div><canvas id="st-canvas" width="700" height="390" aria-label="พื้นที่วาดรูป" role="img">เธอสามารถเพิ่มรูปด้วยการแนบไฟล์</canvas></details>
      <label class="field">แนบรูปภาพ <input type="file" name="attachment" accept="image/png,image/jpeg,image/webp,image/gif" aria-describedby="st-photo-note"></label><p class="st-small muted" id="st-photo-note">แนบได้ครั้งละ 1 รูป ขนาดไม่เกิน 750 กิโลไบต์</p>
      ${(current?.attachments || []).length ? `<div class="st-attached">${current.attachments.map((attachment) => `<figure><img src="/api/attachments/${encodeURIComponent(attachment.id)}" alt="${esc(attachment.name)}"><figcaption>${esc(attachment.name)}</figcaption></figure>`).join('')}</div>` : ''}
      ${hint('บันทึกและร่างเป็นส่วนตัวเสมอ หากอยากเล่าบางส่วนให้ครู ให้เลือกข้อความที่จะส่งในคำขอช่วยเหลือ')}
      <div class="st-actions"><button type="submit" name="action" value="save" class="btn btn-primary">บันทึกเก็บไว้</button><button type="submit" name="action" value="draft" class="btn btn-secondary">เก็บเป็นร่าง</button>${current ? `<button id="st-delete-journal" class="btn btn-secondary" type="button">ลบบันทึก</button>` : ''}</div></form></section>
    <aside class="card st-history"><h2>บันทึกที่ผ่านมา</h2><label class="field">ค้นหาบันทึก<input id="st-journal-search" type="search" placeholder="ค้นจากชื่อหรือข้อความ"></label><label class="field">กรองอารมณ์<select id="st-journal-filter"><option value="">ทุกความรู้สึก</option>${tagOptions.map((tag) => `<option>${esc(tag)}</option>`).join('')}</select></label><div id="st-journal-records">${journalRecords(w.journals)}</div><label class="field">เลือกเดือน<input type="month" id="st-journal-month" value="${today().slice(0, 7)}"></label><div id="st-journal-calendar">${monthCalendar(today().slice(0, 7), w.journals, (entry) => `/student/journal?edit=${encodeURIComponent(entry.id)}`)}</div></aside></div>`;
}

function richExcerpt(text) {
  return esc(text).replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\n]+)\*/g, '<em>$1</em>').replace(/^- /gm, '• ').replace(/\n/g, '<br>');
}

function journalRecords(records, search = '', tag = '') {
  const filtered = [...records].filter((entry) => (!tag || entry.emotions?.includes(tag)) && (!search || `${entry.title} ${entry.body}`.toLocaleLowerCase(TH).includes(search.toLocaleLowerCase(TH)))).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  if (!filtered.length) return empty('book-open', search || tag ? 'ไม่พบบันทึกที่ตรงกัน' : 'บันทึกแรกของเธอจะอยู่ตรงนี้');
  return `<div class="st-journal-records">${filtered.map((entry) => `<a href="/student/journal?edit=${encodeURIComponent(entry.id)}" class="st-journal-record"><div><strong>${esc(entry.title || 'บันทึกไม่มีชื่อ')}</strong>${entry.draft ? '<span class="pill">ร่าง</span>' : ''}</div><p>${richExcerpt((entry.body || '').slice(0, 115))}</p><small>${date(entry.updatedAt || entry.createdAt)}${entry.emotions?.length ? ` · ${esc(entry.emotions.join(', '))}` : ''}</small></a>`).join('')}</div>`;
}

function bindJournal(w) {
  const current = w.journals.find((entry) => entry.id === new URLSearchParams(location.search).get('edit'));
  const body = document.querySelector('#st-journal-form textarea');
  const drawing = bindDrawing(current?.drawing);
  const search = document.querySelector('#st-journal-search');
  const filter = document.querySelector('#st-journal-filter');
  const update = () => { document.querySelector('#st-journal-records').innerHTML = journalRecords(w.journals, search.value.trim(), filter.value); };
  search.addEventListener('input', update);
  filter.addEventListener('change', update);
  document.querySelector('#st-journal-month').addEventListener('change', ({ target }) => {
    if (target.value) document.querySelector('#st-journal-calendar').innerHTML = monthCalendar(target.value, w.journals, (entry) => `/student/journal?edit=${encodeURIComponent(entry.id)}`);
  });
  document.querySelectorAll('[data-prompt]').forEach((button) => button.addEventListener('click', () => {
    const prefix = body.value ? '\n\n' : '';
    body.setRangeText(`${prefix}${button.dataset.prompt}\n`, body.value.length, body.value.length, 'end');
    body.focus();
  }));
  document.querySelectorAll('[data-format]').forEach((button) => button.addEventListener('click', () => {
    const start = body.selectionStart;
    const end = body.selectionEnd;
    const selected = body.value.slice(start, end) || 'ข้อความ';
    const kind = button.dataset.format;
    body.setRangeText(kind === 'bold' ? `**${selected}**` : kind === 'italic' ? `*${selected}*` : `\n- ${selected}`, start, end, 'select');
    body.focus();
  }));
  form('#st-journal-form', async (data, element, submitter) => {
    const file = data.get('attachment');
    const attachment = file?.size ? { name: file.name, dataUrl: await fileUrl(file) } : null;
    const draft = submitter?.value === 'draft';
    const title = String(data.get('title') || '').trim();
    const content = String(data.get('body') || '').trim();
    const drawingData = drawing();
    if (!title && !content && !drawingData && !attachment && !current?.attachments?.length) return toast('ลองเขียนหรือวาดสักนิดก่อนบันทึก');
    const result = await api(`/journals${current ? `/${current.id}` : ''}`, { method: current ? 'PATCH' : 'POST', body: { title: title || 'บันทึกไม่มีชื่อ', body: content, emotions: data.getAll('emotions'), draft, drawing: drawingData } });
    if (attachment) {
      try { await api(`/journals/${result.item.id}/attachments`, { method: 'POST', body: attachment }); }
      catch (error) {
        toast(`บันทึกข้อความแล้ว แต่แนบภาพไม่สำเร็จ ${error.message}`);
        navigate(`/student/journal?edit=${encodeURIComponent(result.item.id)}`);
        return;
      }
    }
    emotionTransfer = '';
    toast(draft ? 'เก็บร่างส่วนตัวไว้แล้ว' : 'เก็บบันทึกไว้ให้แล้ว');
    navigate(`/student/journal?edit=${encodeURIComponent(result.item.id)}`);
  });
  confirmAction(document.querySelector('#st-delete-journal'), 'ลบบันทึกนี้?', 'ข้อความ รูปวาด และไฟล์แนบในบันทึกนี้จะถูกลบ', async () => {
    await api(`/journals/${current.id}`, { method: 'DELETE' });
    toast('ลบบันทึกแล้ว');
    navigate('/student/journal');
  });
}

function bindDrawing(initial = '') {
  const canvas = document.querySelector('#st-canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const undo = document.querySelector('#st-canvas-undo');
  const redo = document.querySelector('#st-canvas-redo');
  let current = 0;
  let pointer = null;
  let initialized = false;
  let snapshots = [{ pixels: context.getImageData(0, 0, canvas.width, canvas.height), hasInk: false }];
  function updateTools() {
    undo.disabled = current === 0;
    redo.disabled = current >= snapshots.length - 1;
  }
  function save(hasInk) {
    snapshots = [...snapshots.slice(0, current + 1), { pixels: context.getImageData(0, 0, canvas.width, canvas.height), hasInk }].slice(-18);
    current = snapshots.length - 1;
    initialized = true;
    updateTools();
  }
  function toPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return [(event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height];
  }
  canvas.addEventListener('pointerdown', (event) => {
    if ((event.pointerType === 'mouse' && event.button !== 0) || pointer !== null) return;
    pointer = event.pointerId;
    canvas.setPointerCapture(pointer);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = document.querySelector('#st-brush-color').value;
    context.lineWidth = Number(document.querySelector('#st-brush-size').value);
    const [x, y] = toPoint(event);
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 0.02, y + 0.02);
    context.stroke();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointer) return;
    const point = toPoint(event);
    context.lineTo(...point);
    context.stroke();
    context.beginPath();
    context.moveTo(...point);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, (event) => {
    if (event.pointerId !== pointer) return;
    pointer = null;
    save(true);
  });
  function restore(direction) {
    current += direction;
    context.putImageData(snapshots[current].pixels, 0, 0);
    updateTools();
  }
  undo.addEventListener('click', () => restore(-1));
  redo.addEventListener('click', () => restore(1));
  document.querySelector('#st-canvas-clear').addEventListener('click', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    save(false);
  });
  if (/^data:image\/(png|jpeg|webp|gif);base64,/.test(initial)) {
    const image = new Image();
    image.onload = () => { if (!initialized && pointer === null) { context.drawImage(image, 0, 0, canvas.width, canvas.height); save(true); } };
    image.src = initial;
  } else initialized = true;
  updateTools();
  return () => !initialized ? initial : snapshots[current].hasInk ? canvas.toDataURL('image/png') : '';
}

const wellnessCards = [
  ['breathing', 'wind', 'พักด้วยลมหายใจ', 'ลองหายใจช้า ๆ ตามวงกลม ในจังหวะที่สบาย', 'lavender'],
  ['grounding', 'footprints', 'กลับมาอยู่กับตอนนี้', 'สำรวจรอบตัวทีละอย่างด้วยกิจกรรม 5–4–3–2–1', 'mint'],
  ['reflection', 'heart', 'สำรวจสุขภาวะทางใจ', 'ตอบเท่าที่อยากตอบ แล้วลองสะท้อนความรู้สึกของตัวเอง', 'pink'],
  ['study', 'book-open', 'พักจากความกดดันเรื่องเรียน', 'แยกงานใหญ่ให้เป็นก้าวเล็ก ๆ จัดช่วงพักให้ตัวเอง', 'lavender'],
  ['sleep', 'moon', 'เตรียมใจพักผ่อน', 'ชวนสร้างกิจวัตรที่ช่วยให้พักได้สม่ำเสมอ', 'mint'],
  ['kindness', 'flower-2', 'ใจดีกับตัวเอง', 'ลองคุยกับตัวเองเหมือนที่คุยกับเพื่อนสนิท', 'pink'],
  ['timer', 'timer', 'ตั้งเวลาพักสั้น ๆ', 'เลือกเวลาหยุดพักก่อนกลับไปทำสิ่งที่ค้างอยู่', 'lavender'],
];
const grounding = [
  'มองไปรอบ ๆ แล้วสังเกต 5 อย่างที่เห็น เช่น สีของดินสอหรือแสงที่หน้าต่าง',
  'ลองสัมผัส 4 อย่าง เช่น ผิวโต๊ะ เนื้อผ้า หรือพื้นใต้เท้า',
  'ฟัง 3 เสียงที่อยู่รอบตัว เช่น พัดลม เสียงนก หรือเสียงหายใจ',
  'สังเกต 2 กลิ่นที่อยู่ใกล้ ๆ จะนึกถึงกลิ่นที่คุ้นเคยก็ได้',
  'สำรวจ 1 รสที่รับรู้ เช่น รสของน้ำ หรือจินตนาการถึงรสที่ชอบ',
];
const activityPrompts = {
  study: ['เลือกงานที่อยากให้ขยับไปข้างหน้า 1 อย่าง', 'แยกงานนั้นเป็นส่วนเล็กที่สุดที่เริ่มได้', 'ตั้งเวลาทำช่วงสั้น ๆ และกำหนดช่วงพักไว้ด้วย', 'ช่วงก่อนสอบ ลองสรุปทีละหัวข้อแล้วให้ตัวเองนอนพอ'],
  sleep: ['ลองเลือกเวลานอนและเวลาตื่นที่ทำได้สม่ำเสมอ', 'หาอะไรเบา ๆ ทำก่อนนอน เช่น อ่านหนังสือหรือฟังเพลงเบา ๆ', 'ค่อย ๆ ลดความสว่างของห้องและหน้าจอก่อนพัก', 'ถ้ามีเรื่องค้างใจ ลองจดไว้สั้น ๆ แล้วค่อยกลับมาอ่านพรุ่งนี้'],
  kindness: ['เลือกเรื่องที่เธอเคร่งกับตัวเองในวันนี้', 'ถ้าเพื่อนสนิทกำลังเจอเรื่องเดียวกัน เธออยากบอกเขาว่าอะไร?', 'ลองพูดประโยคนั้นให้ตัวเองฟังอย่างอ่อนโยน', 'คิดถึงสิ่งเล็ก ๆ ที่จะช่วยให้ดูแลตัวเองได้ในช่วงนี้'],
};

function wellnessPage() {
  const activity = new URLSearchParams(location.search).get('activity');
  const selected = wellnessCards.find(([id]) => id === activity);
  if (!selected) return `${pageIntro('ดูแลตัวเอง', 'กิจกรรมดูแลใจ', 'เลือกสิ่งที่พอทำไหววันนี้ พักหรือเลิกกลางทางได้เสมอ')}<div class="st-wellness-grid">${wellnessCards.map(([id, symbol, title, detail, tone]) => `<a href="/student/wellness?activity=${id}" class="card st-activity-card"><span class="st-chip st-${tone}">${icon(symbol, 24)}</span><h2>${title}</h2><p>${detail}</p><span class="st-activity-action">ลองทำกิจกรรม ${icon('arrow-right', 16)}</span></a>`).join('')}</div>${hint('กิจกรรมทั้งหมดเลือกทำได้ตามความสบายใจ หากอยากได้คนรับฟัง สามารถขอความช่วยเหลือได้ทุกเมื่อ', 'info')}`;
  const [, , title, detail] = selected;
  const intro = pageIntro('กิจกรรมดูแลใจ', title, detail, href('wellness', 'ดูกิจกรรมทั้งหมด', 'secondary', 'arrow-left'));
  if (['breathing', 'timer'].includes(activity)) return `${intro}<section class="card st-session-card"><div class="st-breathing" data-activity="${activity}"><div class="st-breath-circle"><span id="st-activity-clock" aria-label="เวลาที่เหลือ">01:00</span><span id="st-activity-phase">พร้อมเมื่อไหร่ค่อยเริ่ม</span></div></div><form id="st-timer-form" class="stack"><label class="field">เวลาทำกิจกรรม<select name="duration"><option value="1">1 นาที</option><option value="2">2 นาที</option><option value="3">3 นาที</option><option value="5">5 นาที</option><option value="10">10 นาที</option></select></label><div class="st-actions"><button type="submit" class="btn btn-primary" id="st-timer-start">เริ่ม</button><button type="button" class="btn btn-secondary" id="st-timer-pause" disabled>พักชั่วคราว</button><button type="button" class="btn btn-secondary" id="st-timer-stop" disabled>จบกิจกรรม</button></div></form></section>`;
  if (activity === 'grounding') return `${intro}<section class="card st-session-card st-grounding"><span class="st-chip st-mint">${icon('footprints', 24)}</span><div id="st-grounding-step" aria-live="polite"><p class="muted">ขั้นที่ 1 จาก 5</p><h2>${grounding[0]}</h2></div><div class="st-actions"><button type="button" class="btn btn-secondary" id="st-grounding-back" disabled>ย้อนกลับ</button><button type="button" class="btn btn-primary" id="st-grounding-next">ขั้นถัดไป</button></div></section>`;
  if (activity === 'reflection') return `${intro}<section class="card st-reflection"><h2>ลองสังเกตช่วงที่ผ่านมา</h2>${hint('คำถามเหล่านี้ใช้สะท้อนตัวเอง คำตอบจะไม่ถูกบันทึกหรือแชร์', 'lock')}<form id="st-reflection" class="stack">${reflectionTopics.map((topic, index) => `<label class="field">${topic}<select name="reflection-${index}"><option value="">ข้ามคำถามนี้</option><option value="steady">รู้สึกสบายใจกับเรื่องนี้</option><option value="mixed">มีทั้งวันที่โอเคและวันที่ยาก</option><option value="support">อยากให้ความใส่ใจเรื่องนี้เพิ่ม</option></select></label>`).join('')}<button type="submit" class="btn btn-primary">ดูสิ่งที่สังเกตได้</button></form><div id="st-reflection-result" aria-live="polite"></div></section>`;
  return `${intro}<section class="card st-session-card st-practice"><ol>${activityPrompts[activity].map((prompt) => `<li>${prompt}</li>`).join('')}</ol><div class="st-actions">${href('journal', 'จดสิ่งที่สังเกตได้', 'primary', 'pen-line')}${href('wellness', 'กลับไปเลือกกิจกรรม')}</div></section>`;
}

function bindWellness() {
  const activity = new URLSearchParams(location.search).get('activity');
  if (activity === 'breathing' || activity === 'timer') bindTimer(activity);
  if (activity === 'grounding') {
    let step = 0;
    const content = document.querySelector('#st-grounding-step');
    const next = document.querySelector('#st-grounding-next');
    const back = document.querySelector('#st-grounding-back');
    function update() {
      back.disabled = step === 0;
      next.textContent = step === grounding.length ? 'ดูกิจกรรมอื่น' : step === grounding.length - 1 ? 'จบกิจกรรม' : 'ขั้นถัดไป';
      content.innerHTML = step === grounding.length ? '<h2>ลองสังเกตว่าตอนนี้รู้สึกอย่างไร</h2><p class="muted">พักต่อได้ถ้าอยากอยู่กับช่วงเวลานี้อีกสักนิด</p>' : `<p class="muted">ขั้นที่ ${step + 1} จาก 5</p><h2>${grounding[step]}</h2>`;
    }
    next.addEventListener('click', () => { if (step === grounding.length) navigate('/student/wellness'); else { step += 1; update(); } });
    back.addEventListener('click', () => { step -= 1; update(); });
  }
  form('#st-reflection', (data) => {
    const answered = reflectionTopics.filter((_, index) => data.get(`reflection-${index}`));
    const care = reflectionTopics.filter((_, index) => data.get(`reflection-${index}`) === 'support');
    const result = document.querySelector('#st-reflection-result');
    result.innerHTML = `<section class="st-reflection-result"><h2>สิ่งที่เธอสังเกตได้</h2><p>${!answered.length ? 'วันนี้เธอเลือกข้ามทุกข้อได้ ลองกลับมาอีกครั้งเมื่อพร้อม' : care.length ? `เธออยากใส่ใจเรื่อง ${esc(care.join(' · '))} เพิ่ม ลองเลือกสิ่งเล็ก ๆ ที่พอทำไหว หรือคุยกับครูเมื่อพร้อม` : 'ขอบคุณที่ให้เวลาตัวเองได้หยุดสังเกต เธอเก็บสิ่งที่สังเกตไว้กับตัวเอง หรือเลือกพักต่อได้'}</p><div class="st-actions">${href('journal', 'เขียนบันทึกส่วนตัว')}${href('support', 'คุยกับครู')}${href('wellness', 'เลือกกิจกรรมดูแลใจ')}</div></section>`;
    result.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  });
}

function bindTimer(activity) {
  const timerForm = document.querySelector('#st-timer-form');
  const stage = document.querySelector('.st-breathing');
  const select = timerForm.elements.duration;
  const clock = document.querySelector('#st-activity-clock');
  const phase = document.querySelector('#st-activity-phase');
  const pause = document.querySelector('#st-timer-pause');
  const stop = document.querySelector('#st-timer-stop');
  const start = document.querySelector('#st-timer-start');
  let remaining = 60;
  let limit = 60;
  let end = 0;
  let interval;
  function time() { clock.textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`; }
  function endActivity() {
    clearInterval(interval);
    stage.classList.remove('st-breath-in', 'st-breath-out');
    stage.classList.remove('st-breath-paused');
    select.disabled = false;
    pause.disabled = true;
    stop.disabled = true;
    start.disabled = false;
    start.textContent = 'เริ่มใหม่';
    phase.textContent = 'ค่อย ๆ กลับมาเมื่อพร้อม';
    time();
  }
  function tick() {
    if (!stage.isConnected) return clearInterval(interval);
    remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    time();
    if (remaining <= 0) return endActivity();
    if (activity === 'breathing') {
      const breathingIn = (limit - remaining) % 8 < 4;
      phase.textContent = breathingIn ? 'หายใจเข้าเบา ๆ' : 'ผ่อนลมหายใจออก';
      stage.classList.toggle('st-breath-in', breathingIn);
      stage.classList.toggle('st-breath-out', !breathingIn);
    } else phase.textContent = 'ให้เวลาตัวเองได้พัก';
  }
  function go() {
    select.disabled = true;
    start.disabled = true;
    pause.disabled = false;
    stop.disabled = false;
    pause.textContent = 'พักชั่วคราว';
    stage.classList.remove('st-breath-paused');
    end = Date.now() + remaining * 1000;
    interval = setInterval(tick, 250);
    tick();
  }
  timerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    remaining = limit = Number(select.value) * 60;
    go();
  });
  select.addEventListener('change', () => { remaining = Number(select.value) * 60; time(); });
  pause.addEventListener('click', () => {
    if (stage.classList.contains('st-breath-paused')) return go();
    clearInterval(interval);
    stage.classList.add('st-breath-paused');
    pause.textContent = 'ทำต่อ';
    phase.textContent = 'พักชั่วคราว';
  });
  stop.addEventListener('click', endActivity);
}

const pages = {
  dashboard: [dashboard, bindDashboard],
  emotions: [emotionPage, bindEmotions],
  'emotion-wheel': [emotionWheel, bindWheel],
  journal: [journalPage, bindJournal],
  'trust-ladder': [trustPage, bindTrust],
  wellness: [wellnessPage, bindWellness],
};
