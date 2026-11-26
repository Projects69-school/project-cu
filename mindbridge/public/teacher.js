import {
  api, esc, icon, toast, navigate, refresh, pageIntro, statusLabel, showDialog, setUser,
} from './ui.js';

const base = '/teacher';
const adminBase = '/admin';
const timezone = 'Asia/Bangkok';
const dateFormatter = new Intl.DateTimeFormat('th-TH', { timeZone: timezone, dateStyle: 'medium' });
const timeFormatter = new Intl.DateTimeFormat('th-TH', { timeZone: timezone, hour: '2-digit', minute: '2-digit' });
const dayFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
const statusNames = {
  new: 'คำขอใหม่', submitted: 'ส่งคำขอแล้ว', received: 'รับคำขอแล้ว', replied: 'ตอบกลับแล้ว',
  talking: 'กำลังพูดคุย', appointment: 'นัดหมายแล้ว', caring: 'กำลังดูแล', 'follow-up': 'นัดติดตามผล',
  referred: 'ส่งต่อแล้ว', closed: 'สิ้นสุดการดูแล', reopened: 'เปิดคำขออีกครั้ง',
  pending: 'รอยืนยัน', requested: 'รอยืนยัน', confirmed: 'ยืนยันแล้ว', suggested: 'เสนอเวลาใหม่',
  declined: 'ปฏิเสธแล้ว', cancelled: 'ยกเลิกแล้ว', completed: 'เสร็จสิ้น',
  review: 'รอทบทวน', sent: 'บันทึกการส่งต่อแล้ว',
};
const roleNames = { student: 'นักเรียน', teacher: 'ครู', admin: 'ผู้ดูแลระบบ' };
const formatDate = value => value && !Number.isNaN(Date.parse(value)) ? dateFormatter.format(new Date(value)) : '—';
const formatTime = value => value && !Number.isNaN(Date.parse(value)) ? timeFormatter.format(new Date(value)) : '—';
const formatDateTime = value => value && !Number.isNaN(Date.parse(value)) ? `${formatDate(value)} · ${formatTime(value)} น.` : '—';
const isToday = value => value && !Number.isNaN(Date.parse(value)) && dayFormatter.format(new Date(value)) === dayFormatter.format(new Date());
const appointmentDate = row => row.startAt || row.date;
const routePart = path => new URL(path, location.origin).pathname.split('/')[2] || 'dashboard';
const param = (path, key) => new URL(path, location.origin).searchParams.get(key) ?? new URLSearchParams(location.search).get(key);
const rowById = (rows, id) => rows.find(row => row.id === id);
const list = value => Array.isArray(value) ? value.join(' · ') : value || '';
const studentName = (data, row) => row.studentName || rowById(data.students, row.studentId)?.name || rowById(data.requests, row.requestId)?.studentName || 'นักเรียน';
const pill = status => `<span class="pill tc-pill tc-pill-${esc(status)}">${esc(statusNames[status] || statusLabel(status) || '—')}</span>`;
const link = (href, text, style = 'secondary', glyph = '') => `<a class="btn btn-${style}" href="${esc(href)}">${glyph ? icon(glyph, 17) : ''}${esc(text)}</a>`;
const button = (action, id, text, style = 'secondary', glyph = '') => `<button class="btn btn-${style}" type="button" data-tc-action="${esc(action)}" data-id="${esc(id)}">${glyph ? icon(glyph, 17) : ''}${esc(text)}</button>`;
const actionSection = (title, desc = '', action = '') => `<div class="tc-heading"><div><h2>${esc(title)}</h2>${desc ? `<p class="muted">${esc(desc)}</p>` : ''}</div>${action}</div>`;
const empty = (title, desc = '', glyph = 'inbox') => `<div class="tc-empty"><span class="tc-symbol">${icon(glyph, 23)}</span><strong>${esc(title)}</strong>${desc ? `<p>${esc(desc)}</p>` : ''}</div>`;
const avatars = ['lilac', 'mint', 'blue', 'pink'];
const avatar = (name, position = 0) => `<span class="tc-avatar tc-avatar-${avatars[position % avatars.length]}" aria-hidden="true">${esc((String(name || '').replace(/^ครู/, '').trim().match(/\p{L}/u) || ['น'])[0])}</span>`;
const select = (name, label, options, attributes = '') => `<label class="field">${esc(label)}<select name="${esc(name)}" ${attributes}>${options.map(([value, text]) => `<option value="${esc(value)}">${esc(text)}</option>`).join('')}</select></label>`;
const input = (name, label, type = 'text', attributes = '') => `<label class="field">${esc(label)}<input name="${esc(name)}" type="${type}" ${attributes}></label>`;
const textarea = (name, label, placeholder = '', attributes = '') => `<label class="field">${esc(label)}<textarea name="${esc(name)}" placeholder="${esc(placeholder)}" rows="3" ${attributes}></textarea></label>`;
const info = (text, glyph = 'shield') => `<aside class="tc-info">${icon(glyph, 19)}<p>${esc(text)}</p></aside>`;
const newest = rows => [...rows].sort((a, b) => String(b.createdAt || b.lastAt || '').localeCompare(String(a.createdAt || a.lastAt || '')));
const openingStatus = status => ['new', 'submitted', 'reopened'].includes(status);
const upcoming = rows => [...rows].filter(x => ['confirmed', 'pending', 'requested', 'suggested'].includes(x.status)).sort((a, b) => String(a.startAt).localeCompare(String(b.startAt)));
const kindName = kind => ({ private: 'พบครูเป็นส่วนตัว', chat: 'สนทนาผ่านข้อความ', phone: 'นัดโทรพูดคุย', video: 'นัดวิดีโอผ่านช่องทางที่โรงเรียนอนุญาต' }[kind] || kind || 'พูดคุย');
const supportName = kind => ({ listen: 'อยากให้มีคนรับฟัง', advice: 'อยากขอคำแนะนำ', talk: 'อยากพูดคุยกับครู', appointment: 'อยากนัดพูดคุย', unsure: 'ยังไม่แน่ใจ' }[kind] || kind || 'ขอความช่วยเหลือ');
const methodName = method => ({ chat: 'ข้อความส่วนตัว', private: 'พบครูเป็นส่วนตัว', phone: 'นัดโทรพูดคุย', signal: 'ส่งสัญญาณ', appointment: 'นัดหมาย' }[method] || method || 'ยังไม่ได้ระบุ');
let workspace;
let chatRefresh;
let activeChatId;
let pendingDraft = '';

function miniRequests(rows) {
  if (!rows.length) return empty('ยังไม่มีคำขอใหม่', 'คำขอที่นักเรียนส่งถึงคุณครูจะแสดงที่นี่');
  return `<div class="tc-table-wrap"><table class="tc-table"><thead><tr><th>นักเรียน</th><th>ต้องการ</th><th>สถานะ</th><th><span class="sr-only">รายละเอียด</span></th></tr></thead><tbody>${rows.map((row, index) => `<tr><td><div class="tc-person">${avatar(row.studentName, index)}<div><strong>${esc(row.studentName || 'นักเรียน')}</strong><small>${esc(formatDateTime(row.createdAt))}</small></div></div></td><td>${esc(supportName(row.supportType))}</td><td>${pill(row.status)}</td><td><a class="tc-row-arrow" aria-label="ดูคำขอของ ${esc(row.studentName || 'นักเรียน')}" href="${base}/requests?id=${encodeURIComponent(row.id)}">${icon('arrow-right', 18)}</a></td></tr>`).join('')}</tbody></table></div>`;
}

function agenda(rows, data, type) {
  const appointment = type === 'appointment';
  if (!rows.length) return empty(appointment ? 'ยังไม่มีนัดหมาย' : 'ยังไม่มีรายการติดตามผล', '', appointment ? 'calendar' : 'clock');
  return `<div class="tc-agenda">${rows.map(row => `<div class="tc-agenda-row"><span class="tc-symbol">${icon(appointment ? 'calendar' : 'clock', 18)}</span><div><strong>${esc(studentName(data, row))}</strong><small>${esc(formatDateTime(appointment ? appointmentDate(row) : row.dueAt))} · ${esc(appointment ? kindName(row.kind) : 'ติดตามผล')}</small></div>${pill(appointment ? row.status : row.status === 'completed' ? 'completed' : 'follow-up')}</div>`).join('')}</div>`;
}

function activity(data, { hideSmall = false } = {}) {
  if (hideSmall && data.students.length < 5) return empty('ข้อมูลรวมยังไม่ถึงเกณฑ์แสดงผล', 'รายงานจะแสดงเมื่อมีกลุ่มนักเรียนอย่างน้อย 5 คน เพื่อรักษาความเป็นส่วนตัว', 'shield');
  const series = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.now() - (6 - index) * 86400000);
    const day = dayFormatter.format(date);
    return { date, value: data.requests.filter(row => row.createdAt && dayFormatter.format(new Date(row.createdAt)) === day).length };
  });
  const max = Math.max(1, ...series.map(day => day.value));
  const dayName = new Intl.DateTimeFormat('th-TH', { timeZone: timezone, weekday: 'short' });
  return `<div class="tc-chart" role="img" aria-label="${esc(series.map(day => `${formatDate(day.date)} ${day.value} คำขอ`).join(', '))}">${series.map(day => `<div class="tc-chart-group"><span>${day.value}</span><div class="tc-chart-slot"><i style="--tc-bar:${day.value ? Math.max(12, day.value / max * 100) : 3}%"></i></div><small>${esc(dayName.format(day.date))}</small></div>`).join('')}</div>`;
}

function dashboard(data) {
  const newRequests = data.requests.filter(row => openingStatus(row.status));
  const unread = data.conversations.filter(row => row.unread > 0 && !row.archived);
  const today = upcoming(data.appointments).filter(row => isToday(appointmentDate(row)));
  const followUps = data.followUps.filter(row => row.status !== 'completed').sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)));
  const stats = [
    ['นักเรียนในความดูแล', data.students.length, 'users', 'students'], ['คำขอใหม่', newRequests.length, 'inbox', 'requests'],
    ['ข้อความที่ยังไม่ได้อ่าน', unread.length, 'message-circle', 'messages'], ['นัดหมายวันนี้', today.length, 'calendar', 'appointments'],
    ['รายการติดตามผล', followUps.length, 'clock', 'follow-ups'], ['การดูแลที่กำลังดำเนินการ', data.requests.filter(row => !openingStatus(row.status) && row.status !== 'closed').length, 'heart-handshake', 'support'],
  ];
  return `<section class="tc-welcome"><div class="tc-welcome-content"><span class="tc-overline">พื้นที่ทำงานสำหรับครู</span><h1>ยินดีต้อนรับคุณครู</h1><p>ทุกการดูแลที่มีความหมาย เริ่มต้นจากการรับฟัง</p>${link(`${base}/requests`, 'เปิดคำขอความช่วยเหลือ', 'primary', 'arrow-right')}</div><svg class="tc-welcome-art" viewBox="0 0 420 230" fill="none" aria-hidden="true"><circle cx="270" cy="117" r="95" fill="#E3D8F7"/><circle cx="270" cy="117" r="74" stroke="#C4AFE9"/><circle cx="270" cy="117" r="57" fill="#F7F1FD"/><path d="M270 145c-9-5-34-22-34-40 0-18 23-23 34-8 11-15 34-10 34 8 0 18-25 35-34 40Z" fill="#F7DCE8" stroke="#7155B5" stroke-width="2.5"/><path d="M41 198c86 0 95-64 229-64 62 0 94 21 150 32M41 213c86 0 95-64 229-64 62 0 94 21 150 32" stroke="#A48ACF" stroke-width="2"/><path d="M85 204v-15m48 0v-15m48-7v-15m48 4v-15m48 8v-15m48 20v-14m48 29v-15" stroke="#A48ACF" stroke-width="2"/><circle cx="149" cy="90" r="5" fill="#B5A2D9"/><circle cx="393" cy="97" r="3" fill="#B5A2D9"/><path d="M357 35v20m-10-10h20m-209 84v16m-8-8h16" stroke="#9B87D4" stroke-width="2" stroke-linecap="round"/></svg></section>
  <div class="tc-stat-grid">${stats.map(([label, count, glyph, route], index) => `<a class="card tc-stat tc-stat-${index}" href="${base}/${route}"><span class="tc-symbol">${icon(glyph, 20)}</span><strong>${count}</strong><span>${esc(label)}</span></a>`).join('')}</div>
  <div class="tc-dashboard-grid"><section class="card tc-dashboard-main">${actionSection('คำขอล่าสุด', 'คำขอที่ส่งถึงคุณครูโดยตรง', link(`${base}/requests`, 'ดูทั้งหมด'))}${miniRequests(newest(data.requests).slice(0, 4))}</section><section class="card">${actionSection('นัดหมายวันนี้', '', link(`${base}/appointments`, 'ดูนัดหมาย'))}${agenda(today, data, 'appointment')}</section><section class="card">${actionSection('กิจกรรมการดูแล', 'จำนวนคำขอในช่วง 7 วันที่ผ่านมา')}${activity(data)}</section><section class="card">${actionSection('ข้อความที่ยังไม่ได้อ่าน', '', link(`${base}/messages`, 'เปิดข้อความ'))}${unread.length ? `<div class="tc-agenda">${unread.slice(0, 3).map(row => `<a class="tc-agenda-row tc-conversation-link" href="${base}/messages?id=${encodeURIComponent(row.id)}">${avatar(row.otherName)}<div><strong>${esc(row.otherName)}</strong><small>มีข้อความที่ยังไม่ได้อ่าน</small></div><span class="tc-unread">${Number(row.unread)}</span></a>`).join('')}</div>` : empty('อ่านครบทุกข้อความแล้ว', '', 'message-circle')}</section><section class="card">${actionSection('รายการติดตามผลถัดไป', '', link(`${base}/follow-ups`, 'ดูรายการ'))}${agenda(followUps.slice(0, 3), data, 'follow-up')}</section><section class="card">${actionSection('เริ่มจากการรับฟัง', 'เตรียมตัวก่อนตอบข้อความหรือนัดพูดคุย')}${link(`${base}/toolkit`, 'เปิดคู่มือการรับฟัง', 'secondary', 'book-open')}</section></div>`;
}

function filterControl(name, label, choices) {
  return select(name, label, [['', 'ทั้งหมด'], ...choices]);
}

function requestsPage(data, path) {
  const opened = rowById(data.requests, param(path, 'id'));
  if (opened) return requestDetails(data, opened);
  const statuses = [...new Set(data.requests.map(row => row.status))];
  const types = [...new Set(data.requests.map(row => row.supportType).filter(Boolean))];
  const topics = [...new Set(data.requests.map(row => row.topic).filter(Boolean))];
  return `${pageIntro('พื้นที่ทำงานสำหรับครู', 'คำขอความช่วยเหลือ', 'รับคำขอ ดูข้อมูลที่นักเรียนเลือกเปิดเผย และวางแผนการดูแลร่วมกัน')}
  <section class="card"><form class="tc-filter" id="tc-request-filters" aria-label="ค้นหาและกรองคำขอ">${input('query', 'ค้นหานักเรียน', 'search', 'placeholder="พิมพ์ชื่อนักเรียน"')}${filterControl('status', 'สถานะ', statuses.map(value => [value, statusNames[value] || value]))}${filterControl('type', 'ความช่วยเหลือ', types.map(value => [value, supportName(value)]))}${filterControl('topic', 'หัวข้อ', topics.map(value => [value, value]))}${input('date', 'วันที่ส่งคำขอ', 'date')}${select('sort', 'เรียงตาม', [['newest', 'ส่งล่าสุด'], ['waiting', 'รอนานที่สุด']])}</form><div id="tc-request-list" aria-live="polite">${miniRequests(newest(data.requests))}</div></section>`;
}

function requestDetails(data, row) {
  const student = rowById(data.students, row.studentId);
  const records = data.requests.filter(x => x.studentId === row.studentId);
  const history = row.events || row.timeline || [];
  return `${pageIntro('คำขอความช่วยเหลือ', supportName(row.supportType), `นักเรียน ${studentName(data, row)} · ${formatDateTime(row.createdAt)}`, link(`${base}/requests`, 'กลับไปดูคำขอ'))}
    <div class="tc-detail-grid"><section class="card">${actionSection('สิ่งที่นักเรียนเลือกแบ่งปัน', 'แสดงเฉพาะข้อมูลที่นักเรียนส่งมาพร้อมคำขอ', pill(row.status))}<dl class="tc-definition"><div><dt>นักเรียน</dt><dd>${esc(studentName(data, row))}${student?.grade ? ` · ${esc(student.grade)}` : ''}</dd></div><div><dt>ช่องทางที่ต้องการ</dt><dd>${esc(methodName(row.method))}</dd></div><div><dt>หัวข้อ</dt><dd>${esc(row.topic || 'นักเรียนไม่ได้ระบุ')}</dd></div>${row.emotion ? `<div><dt>อารมณ์ที่เลือกแบ่งปัน</dt><dd>${esc(list(row.emotion))}</dd></div>` : ''}${row.message ? `<div><dt>สิ่งที่อยากบอก</dt><dd>${esc(row.message)}</dd></div>` : ''}${row.excerpt ? `<div><dt>ข้อความจากบันทึกที่อนุญาตให้ดู</dt><dd>${esc(row.excerpt)}</dd></div>` : ''}</dl>${sharedDrawing(row.drawing)}${feedback(row.feedback)}${info('ครูจะเห็นข้อมูลที่ได้รับอนุญาตในงานดูแลนี้เท่านั้น ควรเก็บข้อมูลเป็นความลับตามขอบเขตการคุ้มครองของโรงเรียน')}</section>
    <aside class="card">${actionSection('ดำเนินการต่อ')}<div class="tc-action-list">${openingStatus(row.status) ? button('receive', row.id, 'รับคำขอนี้', 'primary', 'check') : ''}${row.conversationId ? link(`${base}/messages?id=${encodeURIComponent(row.conversationId)}`, 'ตอบข้อความนักเรียน', openingStatus(row.status) ? 'secondary' : 'primary', 'message-circle') : ''}${link(`${base}/students?id=${encodeURIComponent(row.studentId)}`, 'เปิดประวัติการดูแล', 'secondary', 'user')}${button('appointment', row.id, 'สร้างนัดหมาย', 'secondary', 'calendar')}${button('plan', row.id, 'สร้างแผนการดูแล', 'secondary', 'list-checks')}${button('follow-up', row.id, 'นัดติดตามผล', 'secondary', 'clock')}${button('referral', row.id, 'บันทึกการส่งต่อ', 'secondary', 'arrow-up-right')}${row.status === 'closed' ? button('reopen', row.id, 'เปิดคำขออีกครั้ง') : button('close', row.id, 'สิ้นสุดการดูแล')}</div></aside></div>
    <section class="card">${actionSection('ประวัติการดำเนินการ')}<ol class="tc-timeline">${history.length ? newest(history).map(item => `<li><span>${icon('check', 14)}</span><div><strong>${esc(item.label || statusNames[item.status] || 'อัปเดตการดูแล')}</strong><small>${esc(formatDateTime(item.createdAt))}</small></div></li>`).join('') : `<li><span>${icon('check', 14)}</span><div><strong>ส่งคำขอความช่วยเหลือแล้ว</strong><small>${esc(formatDateTime(row.createdAt))}</small></div></li>`}</ol>${records.length > 1 ? link(`${base}/students?id=${encodeURIComponent(row.studentId)}`, 'ดูคำขออื่นของนักเรียน') : ''}</section>`;
}

function sharedDrawing(value) {
  return typeof value === 'string' && /^data:image\/(png|jpeg|webp);base64,[\w+/=]+$/.test(value) ? `<figure class="tc-shared-drawing"><img alt="ภาพที่นักเรียนเลือกแบ่งปัน" src="${esc(value)}"><figcaption>ภาพที่นักเรียนเลือกแบ่งปัน</figcaption></figure>` : '';
}

function feedback(value) {
  if (!value) return '';
  const labels = { heard: 'รู้สึกว่าได้รับการรับฟัง', useful: 'การพูดคุยเป็นประโยชน์', more: 'ต้องการความช่วยเหลือเพิ่มเติม', again: 'อยากนัดพูดคุยอีกครั้ง' };
  const entries = typeof value === 'object' ? Object.entries(value).filter(([, answer]) => answer !== null && answer !== '') : [['comment', value]];
  return `<div class="tc-feedback"><strong>ความคิดเห็นที่นักเรียนสมัครใจส่ง</strong>${entries.map(([key, answer]) => `<p>${esc(labels[key] || 'ความคิดเห็น')}: ${esc(answer === true ? 'ใช่' : answer === false ? 'ไม่' : String(answer))}</p>`).join('')}</div>`;
}

function studentsPage(data, path) {
  const selected = rowById(data.students, param(path, 'id'));
  if (!selected) return `${pageIntro('พื้นที่ทำงานสำหรับครู', 'นักเรียนในความดูแล', 'เข้าถึงเฉพาะนักเรียนที่โรงเรียนมอบหมายหรือส่งคำขอถึงคุณครู')}${info('บันทึกส่วนตัวและอารมณ์ที่นักเรียนยังไม่ได้แบ่งปันจะไม่แสดงในพื้นที่นี้')}
    <section class="card"><label class="field tc-search">ค้นหานักเรียน<input type="search" id="tc-student-filter" placeholder="พิมพ์ชื่อนักเรียน"></label><div id="tc-students-list">${studentCards(data.students, data)}</div></section>`;
  const records = newest(data.requests.filter(x => x.studentId === selected.id));
  const appointmentRows = data.appointments.filter(x => x.studentId === selected.id);
  const chatRows = data.conversations.filter(x => x.otherId === selected.id);
  const related = name => data[name].filter(x => records.some(row => row.id === x.requestId));
  const details = [
    ['แผนการดูแล', related('plans'), row => row.title || 'แผนการดูแล', row => row.body, 'list-checks'],
    ['บันทึกการดูแล', related('notes'), () => 'บันทึกการดูแล', row => row.body, 'book-open'],
    ['การติดตามผล', related('followUps'), row => row.status === 'completed' ? 'ติดตามผลแล้ว' : 'นัดติดตามผล', row => `${formatDateTime(row.dueAt)} · ${row.note || ''}`, 'clock'],
    ['ประวัติการส่งต่อ', related('referrals'), row => row.destination, row => `${statusNames[row.status] || ''} · ${formatDate(row.dueAt)}`, 'arrow-up-right'],
  ];
  return `${pageIntro('ประวัติการดูแล', selected.name, selected.grade || 'นักเรียนในความดูแล', link(`${base}/students`, 'ดูรายชื่อนักเรียน'))}${info('ประวัตินี้รวมข้อมูลพื้นฐาน การดูแล และข้อมูลที่นักเรียนเลือกส่งให้ครู บันทึกอารมณ์และสมุดส่วนตัวที่ไม่ได้แบ่งปันจะเก็บไว้กับนักเรียน')}
    <section class="card">${actionSection('คำขอและตัวเลือกที่นักเรียนระบุ')}${miniRequests(records)}${records.filter(row => row.emotion || row.excerpt || row.message).map(row => `<div class="tc-record"><strong>${esc(formatDate(row.createdAt))}</strong><p>${esc([list(row.emotion), row.excerpt, row.message].filter(Boolean).join(' · '))}</p></div>`).join('')}</section>
    <div class="grid-2"><section class="card">${actionSection('บทสนทนาที่ได้รับอนุญาต')}${chatRows.length ? chatRows.map(row => link(`${base}/messages?id=${encodeURIComponent(row.id)}`, `เปิดบทสนทนากับ ${selected.name}`)).join(' ') : empty('ยังไม่มีบทสนทนา', '', 'message-circle')}</section><section class="card">${actionSection('ประวัติการนัดหมาย')}${agenda(appointmentRows, data, 'appointment')}</section>${details.map(([title, rows, heading, body, glyph]) => `<section class="card">${actionSection(title)}${rows.length ? newest(rows).map(row => `<div class="tc-record"><strong>${esc(heading(row))}</strong><small>${esc(formatDate(row.createdAt))}</small><p>${esc(body(row) || '')}</p></div>`).join('') : empty('ยังไม่มีรายการ', '', glyph)}</section>`).join('')}</div>`;
}

function studentCards(students, data) {
  if (!students.length) return empty('ไม่พบรายชื่อนักเรียน', 'นักเรียนที่ได้รับมอบหมายจะแสดงเมื่อมีสิทธิ์เข้าถึง', 'users');
  return `<div class="tc-student-grid">${students.map((row, index) => `<a class="tc-student-card" href="${base}/students?id=${encodeURIComponent(row.id)}">${avatar(row.name, index)}<div><strong>${esc(row.name)}</strong><small>${esc(row.grade || 'นักเรียน')} · ${data.requests.filter(x => x.studentId === row.id).length} คำขอ</small></div>${icon('arrow-right', 18)}</a>`).join('')}</div>`;
}

function chatComposer(selected, request) {
  if (request?.status === 'closed') return `<div class="tc-chat-form">${info('คำขอนี้สิ้นสุดแล้ว เปิดคำขออีกครั้งหากต้องส่งข้อความเพิ่มเติม', 'lock')}</div>`;
  return `<form id="tc-chat-form" class="tc-chat-form"><div class="tc-chat-composer"><label class="field"><span class="sr-only">ข้อความตอบกลับ</span><textarea name="text" id="tc-chat-text" rows="2" maxlength="2500" placeholder="เขียนข้อความถึงนักเรียน…">${esc(pendingDraft)}</textarea></label><button class="btn btn-primary" type="submit">${icon('send', 17)} ส่งข้อความ</button></div><div class="tc-chat-options"><label class="tc-attachment">${icon('paperclip', 17)} แนบภาพ<input name="attachment" type="file" accept="image/png,image/jpeg,image/webp" class="sr-only"></label><button type="button" class="tc-text-button" data-tc-action="emoji" data-id="">${icon('smile', 17)} อีโมจิ</button>${button('phrase', selected.id, 'ใช้ถ้อยคำแนะนำ')}${selected.requestId ? button('appointment', selected.requestId, 'นัดหมาย') : ''}<span id="tc-file-selected" class="muted" aria-live="polite"></span></div></form>`;
}

function chatPage(data, path) {
  const id = param(path, 'id');
  const rows = newest(data.conversations);
  const selected = rowById(rows, id) || rows.find(row => !row.archived);
  const rowLink = (row, index) => `<a class="tc-chat-nav${row.id === selected?.id ? ' tc-chat-selected' : ''}" href="${base}/messages?id=${encodeURIComponent(row.id)}" ${row.id === selected?.id ? 'aria-current="page"' : ''}>${avatar(row.otherName, index)}<div><strong>${esc(row.otherName || 'นักเรียน')}</strong><small>${esc(row.lastText || 'ยังไม่มีข้อความ')}</small></div>${row.unread > 0 ? `<span class="tc-unread" aria-label="${Number(row.unread)} ข้อความที่ยังไม่ได้อ่าน">${Number(row.unread)}</span>` : ''}</a>`;
  return `${pageIntro('พื้นที่ทำงานสำหรับครู', 'ข้อความ', 'รับฟังและตอบกลับนักเรียนในบทสนทนาที่ได้รับอนุญาต', link(`${base}/toolkit`, 'คู่มือการรับฟัง', 'secondary', 'book-open'))}
  ${rows.length ? `<div class="card tc-chat"><aside class="tc-chat-sidebar"><h2>บทสนทนา</h2>${rows.filter(row => !row.archived).map(rowLink).join('') || '<p class="muted">ไม่มีบทสนทนาที่เปิดอยู่</p>'}${rows.some(row => row.archived) ? `<details open><summary>บทสนทนาที่เก็บไว้</summary>${rows.filter(row => row.archived).map(rowLink).join('')}</details>` : ''}</aside>
    ${selected ? `<section class="tc-chat-panel" data-tc-chat="${esc(selected.id)}"><div class="tc-chat-top"><div class="tc-person">${avatar(selected.otherName)}<div><h2>${esc(selected.otherName)}</h2><small>บทสนทนาส่วนตัวในงานดูแลนักเรียน</small></div></div><div class="tc-inline">${selected.requestId ? link(`${base}/requests?id=${encodeURIComponent(selected.requestId)}`, 'ดูคำขอ') : ''}${button('archive', selected.id, selected.archived ? 'นำกลับมาแสดง' : 'เก็บบทสนทนา')}</div></div><div class="tc-chat-search"><label class="field"><span class="sr-only">ค้นหาในข้อความ</span><input id="tc-chat-search" type="search" placeholder="ค้นหาในข้อความ"></label><small>คุณครูควรแจ้งช่วงเวลาที่สะดวกตอบกลับ</small></div><div class="tc-messages" id="tc-chat-log" role="log" aria-label="ประวัติข้อความ" aria-live="polite"><p class="tc-loading">กำลังเปิดบทสนทนา…</p></div>${chatComposer(selected, rowById(data.requests, selected.requestId))}</section>` : empty('เลือกบทสนทนาเพื่อเริ่ม', '', 'message-circle')}
    </div>` : `<section class="card">${empty('ยังไม่มีบทสนทนา', 'เมื่อมีนักเรียนส่งคำขอถึงคุณครู บทสนทนาจะแสดงที่นี่', 'message-circle')}</section>`}
    ${info('ใช้บทสนทนานี้เพื่อการดูแลตามขอบเขตของโรงเรียน และหลีกเลี่ยงการขอข้อมูลส่วนตัวเกินจำเป็น')}`;
}

function messageRows(rows, query) {
  const matches = rows.filter(row => !query || (row.text || '').toLowerCase().includes(query) || (row.attachmentName || '').toLowerCase().includes(query));
  if (!matches.length) return empty(query ? 'ไม่พบข้อความที่ตรงกัน' : 'เริ่มจากคำทักทายได้เลย', query ? 'ลองใช้คำค้นอื่น' : 'ลองใช้ถ้อยคำที่เปิดโอกาสให้นักเรียนเลือกเล่าตามความพร้อม', 'message-circle');
  return matches.map(row => {
    const yours = row.senderId === workspace.user.id;
    return `<div class="tc-bubble-row${yours ? ' tc-bubble-your' : ''}"><div class="tc-bubble">${row.text ? `<p>${esc(row.text)}</p>` : ''}${row.attachmentId ? `<a href="/api/attachments/${encodeURIComponent(row.attachmentId)}" target="_blank" rel="noopener"><img loading="lazy" src="/api/attachments/${encodeURIComponent(row.attachmentId)}" alt="${esc(row.attachmentName || 'ภาพประกอบข้อความ')}"></a>` : ''}<small>${esc(formatDateTime(row.createdAt))}${yours && row.readAt ? ' · อ่านแล้ว' : ''}</small></div></div>`;
  }).join('');
}

function bindChat() {
  const panel = document.querySelector('[data-tc-chat]');
  if (!panel) return;
  const id = panel.dataset.tcChat;
  activeChatId = id;
  pendingDraft = '';
  let rows = [];
  let fingerprint = '';
  const log = panel.querySelector('#tc-chat-log');
  const form = panel.querySelector('#tc-chat-form');
  const search = panel.querySelector('#tc-chat-search');
  const file = form?.elements.attachment;
  function paint({ scroll = false } = {}) {
    log.innerHTML = messageRows(rows, search.value.trim().toLowerCase());
    if (scroll) log.scrollTop = log.scrollHeight;
  }
  async function update(force = false) {
    if (!panel.isConnected) {
      if (activeChatId === id) clearInterval(chatRefresh);
      return;
    }
    if (activeChatId !== id) return;
    try {
      const result = await api(`/conversations/${encodeURIComponent(id)}/messages`);
      if (activeChatId !== id || !panel.isConnected) return;
      panel.closest('.tc-chat')?.querySelector('.tc-chat-selected .tc-unread')?.remove();
      const messages = result.messages || result.items || (Array.isArray(result) ? result : []);
      const next = messages.map(row => `${row.id}:${row.readAt}`).join('|');
      if (force || next !== fingerprint) {
        fingerprint = next;
        rows = messages;
        paint({ scroll: !search.value && (force || log.scrollHeight - log.scrollTop - log.clientHeight < 80) });
      }
    } catch (error) {
      if (force && panel.isConnected) log.innerHTML = empty('เปิดข้อความไม่สำเร็จ', error.message, 'message-circle');
    }
  }
  search.addEventListener('input', () => paint());
  file?.addEventListener('change', () => { panel.querySelector('#tc-file-selected').textContent = file.files[0]?.name || ''; });
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const text = form.elements.text.value.trim();
    const attachment = file.files[0];
    if (!text && !attachment) return toast('พิมพ์ข้อความหรือเลือกภาพก่อนส่ง');
    const send = form.querySelector('[type="submit"]');
    send.disabled = true;
    try {
      const body = { text };
      if (attachment) {
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(attachment.type) || attachment.size > 2 * 1024 * 1024) throw new Error('เลือกภาพ PNG, JPEG หรือ WebP ขนาดไม่เกิน 2 MB');
        body.dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('เปิดไฟล์ภาพไม่สำเร็จ'));
          reader.readAsDataURL(attachment);
        });
        body.attachmentName = attachment.name;
      }
      await api(`/conversations/${encodeURIComponent(id)}/messages`, { method: 'POST', body });
      form.reset();
      form.elements.text.value = '';
      panel.querySelector('#tc-file-selected').textContent = '';
      await update(true);
      form.elements.text.focus();
    } catch (error) { toast(error.message || 'ส่งข้อความไม่สำเร็จ'); }
    finally { send.disabled = false; }
  });
  void update(true);
  chatRefresh = setInterval(() => void update(), 3500);
}

function appointmentRows(data, rows, actions) {
  if (!rows.length) return empty(actions ? 'ยังไม่มีนัดหมายที่กำลังจะมาถึง' : 'ยังไม่มีประวัติการนัดหมาย', actions ? 'นัดหมายที่นักเรียนส่งมาจะแสดงที่นี่' : '', 'calendar');
  return `<div class="tc-item-list">${rows.map((row, index) => `<article class="tc-item"><div class="tc-person">${avatar(studentName(data, row), index)}<div><strong>${esc(studentName(data, row))}</strong><small>${esc(kindName(row.kind))} · ${esc(formatDateTime(appointmentDate(row)))}</small></div></div>${pill(row.status)}${row.note ? `<p class="tc-item-note">${esc(row.note)}</p>` : ''}${actions ? `<div class="tc-inline tc-item-actions">${['requested','pending'].includes(row.status) ? button('appointment-confirmed', row.id, 'ยืนยันนัด', 'primary') + button('appointment-declined', row.id, 'ปฏิเสธ') : ''}${row.status === 'confirmed' ? button('appointment-completed', row.id, 'พบกันแล้ว', 'primary') : ''}${button('suggest-time', row.id, 'เสนอเวลาใหม่')}${button('appointment-cancelled', row.id, 'ยกเลิก')}</div>` : ''}</article>`).join('')}</div>`;
}

function appointmentPage(data) {
  const active = upcoming(data.appointments);
  return `${pageIntro('พื้นที่ทำงานสำหรับครู', 'นัดหมาย', 'ตอบรับคำขอและจัดเวลาพูดคุยกับนักเรียน เวลาแสดงตามประเทศไทย', button('availability', '', 'เพิ่มช่วงเวลาที่สะดวก', 'primary', 'plus'))}
    <section class="card">${actionSection('นัดหมายที่กำลังจะมาถึง', 'การยืนยันหรือเสนอเวลาใหม่จะแสดงให้นักเรียนเห็น')}${appointmentRows(data, active, true)}</section>
    <section class="card">${actionSection('ช่วงเวลาที่เปิดให้นักเรียนเลือก')}${data.availability.length ? `<div class="tc-item-list">${data.availability.map(row => `<article class="tc-item"><div><strong>${esc(formatDateTime(row.startAt))}</strong><small>ถึง ${esc(formatTime(row.endAt))} น.</small></div>${row.available === false ? '<span class="pill">จองแล้ว</span>' : button('remove-slot', row.id, 'ลบช่วงเวลา')}</article>`).join('')}</div>` : empty('ยังไม่ได้เปิดช่วงเวลา', 'เพิ่มช่วงเวลาเพื่อให้นักเรียนส่งคำขอนัดหมายได้', 'calendar')}</section>
    <section class="card">${actionSection('ประวัติการนัดหมาย')}${appointmentRows(data, newest(data.appointments.filter(row => !active.includes(row))), false)}</section>`;
}

const phrases = [
  'ขอบคุณที่ไว้ใจเล่าให้ครูฟังนะ', 'ครูพร้อมรับฟัง', 'ยังไม่ต้องเล่าทุกอย่างก็ได้', 'อยากให้ครูช่วยแบบไหนมากที่สุด?', 'เราลองคิดทางออกด้วยกันไหม?',
];
const guidance = [
  ['ฟังอย่างตั้งใจ', 'ให้เวลานักเรียนพูดจนจบ ถามสั้น ๆ และทวนสิ่งที่ได้ยินเพื่อเช็กความเข้าใจ', 'headphones'],
  ['เข้าใจมุมมองของนักเรียน', 'ลองมองเหตุการณ์จากมุมของเขา แล้วถามว่าสิ่งที่เราเข้าใจตรงกับที่เขารู้สึกไหม', 'heart-handshake'],
  ['ยอมรับความรู้สึก', 'สะท้อนว่าอารมณ์นั้นมีความหมายกับนักเรียน และถามว่าอยากให้คุณครูช่วยอย่างไร', 'heart'],
  ['ให้นักเรียนมีส่วนเลือก', 'คุยถึงสิ่งที่นักเรียนต้องการและขอความเห็นก่อนตกลงแนวทางช่วยเหลือ', 'compass'],
  ['เคารพขอบเขตการเปิดใจ', 'ให้เขาเลือกว่าจะเล่าอะไร เมื่อไร และเปิดเผยกับใคร หากต้องส่งต่อควรอธิบายเหตุผล', 'lock'],
  ['ทำให้การพูดคุยรู้สึกปลอดภัย', 'บอกให้ชัดว่าใครจะเห็นข้อมูล มีขอบเขตความลับอย่างไร และขอพักได้เมื่อใด', 'shield'],
  ['ช่วยให้เริ่มขอความช่วยเหลือง่ายขึ้น', 'ชวนนักเรียนเลือกเริ่มต้นจากข้อความสั้น ๆ สัญญาณ หรือนัดหมายตามความสะดวก', 'message-circle'],
  ['รักษาขอบเขตวิชาชีพ', 'แจ้งเวลาตอบกลับ เก็บข้อมูลเท่าที่จำเป็น และประสานผู้มีหน้าที่ดูแลเมื่อเกินขอบเขตของครู', 'users'],
];
const checklist = ['รับฟังโดยไม่ตัดสิน', 'สะท้อนและยอมรับความรู้สึก', 'ทำความเข้าใจความต้องการ', 'ร่วมกันพิจารณาทางเลือก', 'ตกลงแนวทางช่วยเหลือ', 'นัดหมายติดตามผล'];

function toolkitPage() {
  return `${pageIntro('เครื่องมือสำหรับครู', 'คู่มือการรับฟัง', 'แนวทางชวนพูดคุยอย่างเข้าใจ ให้เกียรติ และเคารพจังหวะของนักเรียน')}
  <div class="grid-2"><section class="card tc-warm-card">${actionSection('ประโยคที่ช่วยเปิดบทสนทนา', 'เลือกประโยคเป็นร่างและปรับให้เหมาะกับนักเรียน')}
  <div class="tc-phrases">${phrases.map((phrase, index) => `<div><p>“${esc(phrase)}”</p>${button('copy-phrase', index, 'ใส่ในร่าง', 'secondary', 'copy')}</div>`).join('')}</div></section>
  <section class="card">${actionSection('เช็กก่อนจบการพูดคุย', 'ใช้ทบทวนขั้นตอนที่สะดวกในแต่ละบทสนทนา')}
  <div class="tc-checklist">${checklist.map((item, index) => `<label><input type="checkbox" data-tc-checklist="${index}"><span>${esc(item)}</span></label>`).join('')}</div><p id="tc-checklist-progress" class="muted" aria-live="polite">เลือกแล้ว 0 จาก 6 ข้อ</p><section class="tc-avoid"><strong>ถ้อยคำที่อาจทำให้นักเรียนรู้สึกถูกตัดสิน</strong><p>“คิดมากไปเอง” · “เรื่องแค่นี้เอง” · “คนอื่นลำบากกว่าเธออีก” · “หยุดคิดแบบนั้นสิ”</p></section></section></div>
  <section>${actionSection('หลักการรับฟังและดูแล') }<div class="grid-2">${guidance.map(([title, description, glyph]) => `<article class="card tc-guidance"><span class="tc-symbol">${icon(glyph, 22)}</span><div><h3>${esc(title)}</h3><p class="muted">${esc(description)}</p></div></article>`).join('')}</div></section>
  ${info('บทบาทครูคือรับฟังและสนับสนุนในขอบเขตของโรงเรียน การวินิจฉัยและการรักษาเป็นหน้าที่ของผู้เชี่ยวชาญที่มีคุณสมบัติเหมาะสม')}`;
}

function supportPage(data) {
  const records = newest(data.requests.filter(row => !openingStatus(row.status)));
  return `${pageIntro('การดูแลต่อเนื่อง', 'การดูแลนักเรียน', 'วางแผนร่วมกัน บันทึกเท่าที่จำเป็น และติดตามว่าการช่วยเหลือตอบโจทย์นักเรียนหรือไม่', link(`${base}/requests`, 'เปิดคำขอ', 'primary'))}
    <section class="card"><ol class="tc-flow">${['รับคำขอ', 'ตอบกลับ', 'พูดคุย', 'วางแผน', 'ติดตามผล', 'ส่งต่อหรือสิ้นสุด'].map((text, index) => `<li><span>${index + 1}</span>${esc(text)}</li>`).join('')}</ol></section>
    ${records.length ? records.map(row => `<section class="card">${actionSection(studentName(data, row), supportName(row.supportType), pill(row.status))}
      ${data.plans.filter(item => item.requestId === row.id).map(item => `<div class="tc-record"><strong>${esc(item.title)}</strong><small>${esc(formatDate(item.createdAt))}</small><p>${esc(item.body)}</p>${item.actions?.length ? `<ul>${item.actions.map(action => `<li>${esc(action)}</li>`).join('')}</ul>` : ''}</div>`).join('')}
      ${data.notes.filter(item => item.requestId === row.id).map(item => `<div class="tc-record"><strong>บันทึกการดูแล</strong><small>${esc(formatDate(item.createdAt))}</small><p>${esc(item.body)}</p></div>`).join('')}
      ${feedback(row.feedback)}<div class="tc-inline">${button('plan', row.id, 'เพิ่มแผน', 'primary', 'plus')}${button('note', row.id, 'เพิ่มบันทึก')}${button('follow-up', row.id, 'นัดติดตามผล')}${link(`${base}/requests?id=${encodeURIComponent(row.id)}`, 'ดูคำขอ')}</div></section>`).join('') : `<section class="card">${empty('ยังไม่มีงานดูแลที่กำลังดำเนินการ', 'เมื่อรับคำขอแล้ว คุณครูสามารถเริ่มวางแผนการดูแลได้ที่นี่', 'heart-handshake')}</section>`}`;
}

function followUpsPage(data) {
  const rows = [...data.followUps].sort((a,b) => String(a.dueAt).localeCompare(String(b.dueAt)));
  const card = row => `<article class="tc-item"><div class="tc-person"><span class="tc-symbol">${icon('clock', 18)}</span><div><strong>${esc(studentName(data, row))}</strong><small>${esc(formatDateTime(row.dueAt))}</small></div></div>${pill(row.status === 'completed' ? 'completed' : 'follow-up')}${row.note ? `<p class="tc-item-note">${esc(row.note)}</p>` : ''}<div class="tc-inline tc-item-actions">${row.status !== 'completed' ? button('complete-follow-up', row.id, 'บันทึกว่าเสร็จแล้ว', 'primary') : ''}${button('follow-up', row.requestId, 'นัดติดตามครั้งถัดไป')}${link(`${base}/requests?id=${encodeURIComponent(row.requestId)}`, 'ดูรายละเอียด')}</div></article>`;
  return `${pageIntro('การดูแลต่อเนื่อง', 'ติดตามผล', 'นัดกลับมาคุยสั้น ๆ ตามที่ตกลงกัน เพื่อดูว่านักเรียนยังต้องการความช่วยเหลือเพิ่มเติมไหม', button('follow-up', '', 'เพิ่มรายการติดตามผล', 'primary', 'plus'))}
    <section class="card">${actionSection('รายการที่กำลังจะมาถึง')}${rows.some(row => row.status !== 'completed') ? `<div class="tc-item-list">${rows.filter(row => row.status !== 'completed').map(card).join('')}</div>` : empty('ยังไม่มีรายการติดตามผล', 'เพิ่มรายการจากคำขอที่รับแล้วได้ทุกเมื่อ', 'clock')}</section>
    <section class="card">${actionSection('ประวัติการติดตามผล')}${rows.some(row => row.status === 'completed') ? `<div class="tc-item-list">${rows.filter(row => row.status === 'completed').map(card).join('')}</div>` : empty('ยังไม่มีรายการที่เสร็จสิ้น', '', 'clock')}</section>`;
}

function referralsPage(data) {
  return `${pageIntro('การดูแลต่อเนื่อง', 'ส่งต่อผู้เชี่ยวชาญ', 'บันทึกการประสานงานกับผู้มีหน้าที่ดูแลที่โรงเรียนกำหนด', button('referral', '', 'เพิ่มบันทึกการส่งต่อ', 'primary', 'plus'))}
  ${info('ทบทวนสิทธิ์ก่อนเปิดเผยข้อมูล เลือกเฉพาะข้อมูลที่จำเป็น และประสานงานกับผู้รับโดยตรงตามขั้นตอนของโรงเรียน ระบบนี้ใช้บันทึกสถานะการประสานงาน')}
  <section class="card">${actionSection('ประวัติและสถานะการส่งต่อ')}${data.referrals.length ? `<div class="tc-item-list">${newest(data.referrals).map(row => `<article class="tc-item"><div class="tc-person"><span class="tc-symbol">${icon('arrow-up-right', 18)}</span><div><strong>${esc(studentName(data, row))} → ${esc(row.destination)}</strong><small>ติดตาม ${esc(formatDate(row.dueAt))}</small></div></div>${pill(row.status)}<p class="tc-item-note">${esc(row.reason)}</p>${row.shared ? `<p class="tc-item-note muted">ข้อมูลที่อนุญาตให้แบ่งปัน · ${esc(list(row.shared))}</p>` : ''}<div class="tc-inline tc-item-actions">${row.status === 'review' ? button('referral-sent', row.id, 'บันทึกว่าประสานงานแล้ว', 'primary') : ''}${row.status !== 'completed' ? button('referral-completed', row.id, 'ปิดรายการส่งต่อ') : ''}${link(`${base}/requests?id=${encodeURIComponent(row.requestId)}`, 'ดูคำขอ')}</div></article>`).join('')}</div>` : empty('ยังไม่มีการส่งต่อ', 'คุณครูสามารถบันทึกการส่งต่อจากคำขอที่ดูแลอยู่', 'arrow-up-right')}</section>`;
}

function settingsPage(data) {
  const user = data.user;
  const profile = rowById(data.teachers, user.id) || user.profile || user;
  const prefs = user.settings || {};
  return `${pageIntro('บัญชีครู', 'ตั้งค่า', 'จัดการข้อมูลที่นักเรียนเห็น และกำหนดช่วงเวลาที่สะดวกดูแล')}
    <div class="grid-2"><section class="card">${actionSection('โปรไฟล์สำหรับนักเรียน')}<form id="tc-teacher-profile" class="stack">${input('name', 'ชื่อที่แสดง', 'text', `required maxlength="80" value="${esc(user.name)}"`)}${input('title', 'หน้าที่ในโรงเรียน', 'text', `maxlength="100" value="${esc(profile.title || prefs.title || '')}"`)}${input('responseTime', 'เวลาที่มักตอบกลับ', 'text', `maxlength="100" value="${esc(profile.responseTime || prefs.responseTime || '')}" placeholder="เช่น ภายใน 1 วันเรียน"`)}${input('availability', 'ช่วงเวลาที่สะดวกรับฟัง', 'text', `maxlength="100" value="${esc(profile.availability || prefs.availability || '')}"`)}<button class="btn btn-primary" type="submit">บันทึกโปรไฟล์</button></form></section>
    <section class="card">${actionSection('โรงเรียนและการยืนยันบัญชี')}<dl class="tc-definition"><div><dt>โรงเรียน</dt><dd>${esc(data.school?.name || 'ยังไม่มีข้อมูลโรงเรียน')}</dd></div><div><dt>อีเมลบัญชี</dt><dd>${esc(user.email || '—')}</dd></div><div><dt>สถานะครู</dt><dd>${user.verified ? '<span class="pill tc-pill-completed">ยืนยันแล้ว</span>' : '<span class="pill">รอการยืนยันจากโรงเรียน</span>'}</dd></div><div><dt>การนัดหมาย</dt><dd>${link(`${base}/appointments`, 'จัดการช่วงเวลาที่เปิด')}</dd></div></dl></section>
    <section class="card">${actionSection('ความต้องการและการแจ้งเตือน')}<form id="tc-teacher-preferences" class="stack"><label class="tc-check"><input type="checkbox" name="notifications" ${prefs.notifications === false ? '' : 'checked'}> แสดงการแจ้งเตือนในแอป</label>${input('preferredAppointment', 'ช่องทางนัดหมายที่สะดวก', 'text', `value="${esc(prefs.preferredAppointment || '')}" maxlength="100"`)}<button class="btn btn-primary" type="submit">บันทึกความต้องการ</button></form></section>
    <section class="card">${actionSection('บัญชีและความปลอดภัย')}<div class="tc-inline">${user.demo || data.school?.demo ? '<p class="muted">บัญชีสาธิตใช้ปุ่มเข้าสาธิตเพื่อกลับมาใช้งาน</p>' : button('password', '', 'เปลี่ยนรหัสผ่าน')}<button type="button" class="btn btn-secondary" data-logout>ออกจากระบบ</button></div></section></div>`;
}

function reportPage(data) {
  return `${pageIntro('พื้นที่ทำงานสำหรับครู', 'รายงาน', 'ติดตามการใช้งานในภาพรวมโดยคำนึงถึงความเป็นส่วนตัวของนักเรียน')}
  ${info('รายงานใช้จำนวนกิจกรรมในการดูแล ไม่มีการจัดอันดับนักเรียนหรือประเมินภาวะทางจิตใจ')}
  <section class="card">${actionSection('จำนวนคำขอในช่วง 7 วันที่ผ่านมา')}${activity(data, { hideSmall: true })}</section>`;
}

function adminDashboard(data) {
  const totals = [
    ['บัญชีในโรงเรียน', data.users.length, 'users', 'users'],
    ['ครูรอการยืนยัน', data.users.filter(row => row.role === 'teacher' && !row.verified).length, 'shield', 'users'],
    ['ห้องเรียน', data.classrooms.length, 'school', 'schools'],
    ['การมอบหมายครู', data.assignments.length, 'link', 'permissions'],
  ];
  return `${pageIntro('ดูแลระบบโรงเรียน', 'ภาพรวมผู้ดูแลระบบ', data.school?.name || 'จัดการการเข้าถึงของโรงเรียน', link(`${adminBase}/users`, 'จัดการบัญชี', 'primary'))}
    ${info('หน้าผู้ดูแลระบบแสดงข้อมูลบัญชี สิทธิ์ และประวัติการดูแลระบบ โดยจำกัดการเข้าถึงข้อมูลส่วนตัวของนักเรียน')}
    <div class="tc-stat-grid tc-stat-admin">${totals.map(([label, count, glyph, route], index) => `<a class="card tc-stat tc-stat-${index}" href="${adminBase}/${route}"><span class="tc-symbol">${icon(glyph, 20)}</span><strong>${count}</strong><span>${esc(label)}</span></a>`).join('')}</div>
    <div class="grid-2"><section class="card">${actionSection('การเข้าถึงและความยินยอม')}<p class="muted">ตรวจสอบการมอบหมายครูและประวัติความยินยอมของบัญชี</p>${link(`${adminBase}/permissions`, 'เปิดหน้าสิทธิ์')}</section><section class="card">${actionSection('ข้อมูลการใช้งานรวม')}${data.users.filter(user => user.role === 'student').length >= 5 ? `<p class="muted">โรงเรียนมีบัญชีนักเรียนที่เปิดใช้งาน ${data.users.filter(user => user.role === 'student' && user.active).length} บัญชี และบัญชีครูที่ยืนยันแล้ว ${data.users.filter(user => user.role === 'teacher' && user.verified && user.active).length} บัญชี</p>` : empty('กลุ่มข้อมูลมีขนาดเล็ก', 'รายงานรวมแสดงเมื่อมีกลุ่มนักเรียนอย่างน้อย 5 คน', 'shield')}</section></div>`;
}

function userTable(rows, currentId) {
  if (!rows.length) return empty('ไม่พบรายการบัญชี', 'ลองเปลี่ยนคำค้นหรือบทบาท', 'users');
  return `<div class="tc-table-wrap"><table class="tc-table"><thead><tr><th>ชื่อผู้ใช้</th><th>บทบาท</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>${rows.map((row, index) => `<tr><td><div class="tc-person">${avatar(row.name, index)}<div><strong>${esc(row.name)}</strong><small>${esc(row.email || '')}</small></div></div></td><td>${esc(roleNames[row.role])}</td><td><span class="pill ${row.active ? 'tc-pill-completed' : ''}">${row.active ? 'เปิดใช้งาน' : 'พักการใช้งาน'}</span>${row.role === 'teacher' ? `<span class="pill ${row.verified ? 'tc-pill-completed' : ''}">${row.verified ? 'ยืนยันแล้ว' : 'รอยืนยัน'}</span>` : ''}</td><td><div class="tc-inline">${row.role === 'student' ? button('edit-student', row.id, 'แก้ไขข้อมูล') : ''}${row.role === 'teacher' ? button('toggle-verified', row.id, row.verified ? 'ยกเลิกการยืนยัน' : 'ยืนยันครู') : ''}${row.id !== currentId ? button('toggle-user', row.id, row.active ? 'พักบัญชี' : 'เปิดบัญชี') : ''}</div></td></tr>`).join('')}</tbody></table></div>`;
}

function adminUsers(data) {
  return `${pageIntro('ดูแลระบบโรงเรียน', 'บัญชีผู้ใช้', 'ยืนยันตัวตนครูและจัดการสถานะบัญชีของโรงเรียน')}
    <section class="card"><form class="tc-filter tc-filter-admin" id="tc-user-filters" aria-label="กรองบัญชีผู้ใช้">${input('query', 'ค้นหาชื่อหรืออีเมล', 'search', 'placeholder="พิมพ์เพื่อค้นหา"')}${filterControl('role', 'บทบาท', Object.entries(roleNames))}</form><div id="tc-user-list" aria-live="polite">${userTable(data.users, data.user.id)}</div></section>`;
}

function adminSchools(data) {
  const settings = data.school?.settings || {};
  return `${pageIntro('ดูแลระบบโรงเรียน', 'โรงเรียนและห้องเรียน', 'ตั้งค่าช่องทางขอความช่วยเหลือของโรงเรียนและจัดการรายการห้องเรียน', button('classroom', '', 'เพิ่มห้องเรียน', 'primary', 'plus'))}
  <div class="grid-2"><section class="card">${actionSection('ข้อมูลโรงเรียน')}<form id="tc-school-settings" class="stack">${input('name', 'ชื่อโรงเรียน', 'text', `required maxlength="100" value="${esc(data.school?.name || '')}"`)}${input('contact', 'ผู้ติดต่อด้านการดูแลนักเรียน', 'text', `maxlength="120" value="${esc(settings.contact || '')}"`)}${input('emergencyPhone', 'หมายเลขติดต่อกรณีเร่งด่วนของโรงเรียน', 'tel', `maxlength="25" value="${esc(settings.emergencyPhone || '')}"`)}${input('retentionDays', 'ระยะเวลาเก็บข้อมูลที่โรงเรียนกำหนด (วัน)', 'number', `min="1" max="3650" value="${esc(settings.retentionDays || '')}"`)}<small class="muted">การตั้งค่านี้บันทึกนโยบาย โรงเรียนต้องกำหนดวิธีทบทวนและลบข้อมูลตามนโยบายก่อนใช้งานจริง</small><button class="btn btn-primary" type="submit">บันทึกข้อมูลโรงเรียน</button></form></section>
  <section class="card">${actionSection('ห้องเรียน')}${data.classrooms.length ? `<div class="tc-item-list">${data.classrooms.map(row => `<div class="tc-item"><div class="tc-person"><span class="tc-symbol">${icon('school', 18)}</span><div><strong>${esc(row.name)}</strong><small>${esc(row.grade || '')}</small></div></div>${button('classroom', row.id, 'แก้ไข')}</div>`).join('')}</div>` : empty('ยังไม่มีห้องเรียน', '', 'school')}</section></div>`;
}

function adminPermissions(data) {
  return `${pageIntro('ดูแลระบบโรงเรียน', 'สิทธิ์และการมอบหมาย', 'กำหนดครูที่ได้รับอนุญาตให้ดูแลนักเรียน และตรวจสอบบันทึกความยินยอม', button('assignment', '', 'มอบหมายครู', 'primary', 'plus'))}
  <section class="card">${actionSection('การมอบหมายครู')}${data.assignments.length ? `<div class="tc-item-list">${data.assignments.map(row => `<article class="tc-item"><div class="tc-person"><span class="tc-symbol">${icon('link', 18)}</span><div><strong>${esc(row.studentName || rowById(data.users, row.studentId)?.name || 'นักเรียน')}</strong><small>${esc(row.teacherName || rowById(data.users, row.teacherId)?.name || 'ครู')}</small></div></div>${button('remove-assignment', row.id, 'ยกเลิกการมอบหมาย')}</article>`).join('')}</div>` : empty('ยังไม่มีการมอบหมาย', 'เลือกนักเรียนและครูที่ยืนยันแล้วเพื่อเพิ่มการมอบหมาย', 'users')}</section>
  <section class="card">${actionSection('บันทึกความยินยอม')}${data.consents.length ? `<div class="tc-table-wrap"><table class="tc-table"><thead><tr><th>บัญชี</th><th>ขอบเขต</th><th>วันที่บันทึก</th></tr></thead><tbody>${data.consents.map(row => `<tr><td>${esc(row.userName || rowById(data.users, row.userId)?.name || 'บัญชีในโรงเรียน')}</td><td>${esc(row.scope || '')}</td><td>${esc(formatDateTime(row.createdAt))}</td></tr>`).join('')}</tbody></table></div>` : empty('ยังไม่มีบันทึกความยินยอม', '', 'shield')}</section>
  <section class="card">${actionSection('คำขอด้านบัญชีและความเป็นส่วนตัว')}${data.tickets.length ? `<div class="tc-item-list">${newest(data.tickets).map(row => `<article class="tc-item"><div><strong>${esc(row.userName || rowById(data.users, row.userId)?.name || 'บัญชีในโรงเรียน')}</strong><small>${esc(ticketName(row))} · ${esc(formatDate(row.createdAt))}</small></div>${button('ticket', row.id, 'ดูรายละเอียด')}${row.status === 'completed' ? '<span class="pill tc-pill-completed">ดำเนินการแล้ว</span>' : ''}</article>`).join('')}</div>` : empty('ยังไม่มีคำขอ', '', 'inbox')}</section>`;
}

const ticketName = row => ({ access: 'ขอสำเนาข้อมูล', deletion: 'ขอลบข้อมูล', report: 'รายงานพฤติกรรม', privacy: 'แจ้งเรื่องความเป็นส่วนตัว', teacher: 'ขอเปลี่ยนครูผู้ดูแล' }[row.kind || row.type] || 'ขอให้ตรวจสอบ');

const auditNames = {
  'user.verify': 'ยืนยันสถานะครู', 'user.update': 'เปลี่ยนสถานะบัญชี', 'school.update': 'แก้ไขข้อมูลโรงเรียน',
  'classroom.create': 'เพิ่มห้องเรียน', 'assignment.add': 'มอบหมายครู', 'assignment.remove': 'ยกเลิกการมอบหมาย',
  'request.create': 'ส่งคำขอความช่วยเหลือ', 'request.update': 'อัปเดตคำขอ', 'request.read': 'เปิดข้อมูลคำขอ',
  'referral.create': 'บันทึกการส่งต่อ', 'conversation.read': 'เปิดบทสนทนาที่ได้รับอนุญาต',
};

function adminAudit(data) {
  return `${pageIntro('ดูแลระบบโรงเรียน', 'ประวัติการเข้าถึง', 'ตรวจสอบเหตุการณ์การจัดการบัญชีและสิทธิ์ในโรงเรียน')}
  <section class="card">${actionSection('เหตุการณ์ล่าสุด')}${data.audit.length ? `<div class="tc-table-wrap"><table class="tc-table"><thead><tr><th>เหตุการณ์</th><th>ผู้ดำเนินการ</th><th>เวลา</th></tr></thead><tbody>${newest(data.audit).map(row => `<tr><td>${esc(auditNames[row.action] || row.action || 'ดำเนินการในระบบ')}</td><td>${esc(row.actorName || rowById(data.users, row.actorId)?.name || 'บัญชีในโรงเรียน')}</td><td>${esc(formatDateTime(row.createdAt))}</td></tr>`).join('')}</tbody></table></div>` : empty('ยังไม่มีเหตุการณ์ที่บันทึกไว้', '', 'clipboard')}</section>`;
}

const teacherPages = {
  dashboard, requests: requestsPage, students: studentsPage, messages: chatPage, appointments: appointmentPage,
  support: supportPage, 'follow-ups': followUpsPage, toolkit: toolkitPage, referrals: referralsPage, reports: reportPage, settings: settingsPage,
};
const adminPages = {
  dashboard: adminDashboard, users: adminUsers, schools: adminSchools, permissions: adminPermissions, 'audit-logs': adminAudit,
};

function normalize(response) {
  const data = { ...response };
  for (const key of ['teachers','students','requests','conversations','appointments','availability','plans','notes','followUps','referrals','history','users','classrooms','assignments','audit','consents','tickets']) data[key] ??= [];
  return data;
}

export async function renderTeacher(path) {
  workspace = normalize(await api('/workspace'));
  return (teacherPages[routePart(path)] || dashboard)(workspace, path);
}

export async function renderAdmin(path) {
  workspace = normalize(await api('/workspace'));
  return (adminPages[routePart(path)] || adminDashboard)(workspace, path);
}

const submit = (text = 'บันทึก') => `<button class="btn btn-primary" type="submit">${esc(text)}</button>`;
const formObject = form => Object.fromEntries(form);
const post = (path, body) => api(path, { method: 'POST', body });
const patch = (path, body) => api(path, { method: 'PATCH', body });
const remove = path => api(path, { method: 'DELETE' });
const bangkokISO = inputValue => new Date(`${inputValue}+07:00`).toISOString();

function complete(message) {
  toast(message);
  void refresh();
}

function confirm(title, description, acceptLabel, work, result) {
  showDialog(title, `<p>${esc(description)}</p>${submit(acceptLabel)}`, async () => {
    await work();
    complete(result);
  });
}

function requestPicker(id) {
  if (id) return `<input type="hidden" name="requestId" value="${esc(id)}">`;
  return select('requestId', 'คำขอที่เกี่ยวข้อง', [['', 'เลือกคำขอ'], ...newest(workspace.requests.filter(row => row.status !== 'closed')).map(row => [row.id, `${studentName(workspace, row)} · ${supportName(row.supportType)} · ${formatDate(row.createdAt)}`])], 'required');
}

function slotPicker() {
  const rows = workspace.availability.filter(row => row.available !== false && row.available !== 0 && Date.parse(row.startAt) > Date.now()).sort((a,b) => a.startAt.localeCompare(b.startAt));
  return rows.length ? select('slotId', 'วันและเวลา (ประเทศไทย)', [['', 'เลือกช่วงเวลา'], ...rows.map(row => [row.id, `${formatDateTime(row.startAt)} ถึง ${formatTime(row.endAt)} น.`])], 'required') : '';
}

function missingSlots() {
  const dialog = showDialog('เพิ่มช่วงเวลาที่สะดวกก่อน', `<p>ไปที่หน้านัดหมายเพื่อเพิ่มช่วงเวลา แล้วกลับมาส่งข้อเสนอนัดหมาย</p>${link(`${base}/appointments`, 'เปิดหน้านัดหมาย', 'primary', 'calendar')}`);
  dialog.querySelector('a').addEventListener('click', () => dialog.close());
  return dialog;
}

const actions = {
  receive: async id => {
    await patch(`/requests/${encodeURIComponent(id)}`, { status:'received' });
    complete('รับคำขอแล้ว นักเรียนจะเห็นการอัปเดต');
  },
  close: id => confirm('สิ้นสุดการดูแล', 'นักเรียนจะเห็นสถานะสิ้นสุดการดูแล และยังขอความช่วยเหลือเพิ่มเติมได้เมื่อพร้อม', 'ยืนยันการสิ้นสุด', () => patch(`/requests/${encodeURIComponent(id)}`, { status:'closed' }), 'อัปเดตสถานะแล้ว'),
  reopen: id => confirm('เปิดคำขออีกครั้ง', 'ระบบจะเปิดคำขอให้ทั้งคุณครูและนักเรียนดูการอัปเดตต่อได้', 'เปิดคำขอ', () => patch(`/requests/${encodeURIComponent(id)}`, { status:'reopened' }), 'เปิดคำขออีกครั้งแล้ว'),
  archive: async id => {
    const row = rowById(workspace.conversations, id);
    await patch(`/conversations/${encodeURIComponent(id)}`, { archived:!row.archived });
    complete(row.archived ? 'นำบทสนทนากลับมาแสดงแล้ว' : 'เก็บบทสนทนาไว้แล้ว');
  },
  emoji: () => {
    const textarea = document.querySelector('#tc-chat-text');
    if (!textarea) return;
    textarea.setRangeText(' 🙂', textarea.selectionStart, textarea.selectionEnd, 'end');
    textarea.focus();
  },
  phrase: () => showDialog('เลือกถ้อยคำเริ่มต้น', `${select('phrase', 'ประโยคที่ต้องการนำไปปรับใช้', phrases.map((value, index) => [index, value]))}${submit('ใส่ในร่างข้อความ')}`, async form => {
    const field = document.querySelector('#tc-chat-text');
    field.value = `${field.value.trim()} ${phrases[Number(form.get('phrase'))]}`.trim();
    requestAnimationFrame(() => field.focus());
  }),
  'copy-phrase': id => {
    const phrase = phrases[Number(id)];
    const active = workspace.conversations.filter(row => !row.archived && rowById(workspace.requests, row.requestId)?.status !== 'closed');
    if (!active.length) {
      if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(phrase).then(() => toast('คัดลอกถ้อยคำแล้ว'));
      return showDialog('ถ้อยคำแนะนำ', `<p>${esc(phrase)}</p>`);
    }
    return showDialog('เปิดร่างเพื่อตอบนักเรียน', `<p>“${esc(phrase)}”</p>${select('conversation', 'เลือกบทสนทนา', active.map(row => [row.id, row.otherName]))}${submit('ใส่ในร่างข้อความ')}`, async form => {
      pendingDraft = phrase;
      await navigate(`${base}/messages?id=${encodeURIComponent(form.get('conversation'))}`);
      requestAnimationFrame(() => document.querySelector('#tc-chat-text')?.focus());
    });
  },
  availability: () => showDialog('เพิ่มช่วงเวลาที่สะดวก', `<div class="form-grid">${input('startAt', 'เวลาเริ่ม (ประเทศไทย)', 'datetime-local', 'required')}${input('endAt', 'เวลาสิ้นสุด (ประเทศไทย)', 'datetime-local', 'required')}</div>${submit('เปิดช่วงเวลา')}`, async form => {
    const startAt = bangkokISO(form.get('startAt'));
    const endAt = bangkokISO(form.get('endAt'));
    if (Date.parse(startAt) <= Date.now()) throw new Error('เลือกเวลาเริ่มในอนาคต');
    if (endAt <= startAt) throw new Error('เลือกเวลาสิ้นสุดหลังเวลาเริ่ม');
    await post('/availability', { startAt, endAt });
    complete('เปิดช่วงเวลาแล้ว');
  }),
  'remove-slot': id => confirm('ลบช่วงเวลา', 'นักเรียนจะเลือกช่วงเวลานี้ไม่ได้อีก', 'ลบช่วงเวลา', () => remove(`/availability/${encodeURIComponent(id)}`), 'ลบช่วงเวลาแล้ว'),
  appointment: id => {
    const slot = slotPicker();
    const request = rowById(workspace.requests, id);
    if (!slot) return missingSlots();
    return showDialog('เสนอเวลานัดหมาย', `<p>นักเรียนสามารถเลือกยืนยันเวลาที่เสนอ</p>${slot}${select('kind', 'รูปแบบการนัดหมาย', ['private','chat','phone','video'].map(kind => [kindName(kind),kindName(kind)]))}${textarea('note', 'ข้อมูลเพิ่มเติม (ไม่บังคับ)', 'ระบุสถานที่ตามที่โรงเรียนอนุญาต', 'maxlength="500"')}${submit('ส่งข้อเสนอนัดหมาย')}`, async form => {
      await post('/appointments', { ...formObject(form), requestId:id, studentId:request.studentId });
      complete('ส่งข้อเสนอนัดหมายแล้ว');
    });
  },
  'suggest-time': id => {
    const slot = slotPicker();
    if (!slot) return missingSlots();
    return showDialog('เสนอเวลาใหม่', `<p>นักเรียนจะเห็นเวลาที่เสนอและเลือกยืนยันได้</p>${slot}${submit('เสนอเวลาใหม่')}`, async form => {
      await patch(`/appointments/${encodeURIComponent(id)}`, { status:'suggested', slotId:form.get('slotId') });
      complete('เสนอเวลาใหม่แล้ว');
    });
  },
  'appointment-confirmed': async id => {
    await patch(`/appointments/${encodeURIComponent(id)}`, { status:'confirmed' });
    complete('ยืนยันนัดหมายแล้ว');
  },
  'appointment-completed': id => confirm('บันทึกการนัดหมายเสร็จสิ้น', 'การนัดหมายจะแสดงในประวัติของคุณครูและนักเรียน', 'บันทึกว่าเสร็จสิ้น', () => patch(`/appointments/${encodeURIComponent(id)}`, { status:'completed' }), 'บันทึกประวัติการนัดหมายแล้ว'),
  'appointment-cancelled': id => confirm('ยกเลิกนัดหมาย', 'นักเรียนจะได้รับการอัปเดตเมื่อยกเลิกนัดหมาย', 'ยกเลิกนัดหมาย', () => patch(`/appointments/${encodeURIComponent(id)}`, { status:'cancelled' }), 'ยกเลิกนัดหมายแล้ว'),
  'appointment-declined': id => confirm('ปฏิเสธเวลาที่ขอนัด', 'นักเรียนสามารถเลือกส่งคำขอนัดหมายใหม่ได้', 'ปฏิเสธนัดหมาย', () => patch(`/appointments/${encodeURIComponent(id)}`, { status:'declined' }), 'ปฏิเสธนัดหมายแล้ว'),
  plan: id => showDialog('สร้างแผนการดูแล', `${requestPicker(id)}${input('title', 'ชื่อแผน', 'text', 'required maxlength="100"')}${textarea('body', 'สิ่งที่ตกลงร่วมกัน', 'เขียนเฉพาะข้อมูลที่จำเป็นต่อการดูแล', 'required maxlength="1500"')}${textarea('actions', 'สิ่งที่ควรทำต่อ (หนึ่งรายการต่อบรรทัด)', '', 'maxlength="800"')}${submit('บันทึกแผนการดูแล')}`, async form => {
    const data = formObject(form);
    data.actions = data.actions.split('\n').map(item => item.trim()).filter(Boolean);
    await post('/plans', data);
    complete('บันทึกแผนการดูแลแล้ว');
  }),
  note: id => showDialog('เพิ่มบันทึกการดูแล', `${requestPicker(id)}${textarea('body', 'รายละเอียดที่จำเป็นต่อการดูแล', '', 'required maxlength="1500"')}${submit('บันทึก')}`, async form => {
    await post('/notes', formObject(form));
    complete('เพิ่มบันทึกการดูแลแล้ว');
  }),
  'follow-up': id => showDialog('นัดติดตามผล', `${requestPicker(id)}${input('dueAt', 'วันและเวลาติดตาม (ประเทศไทย)', 'datetime-local', 'required')}${textarea('note', 'รายละเอียดติดตามผล (ไม่บังคับ)', 'บันทึกประเด็นที่ตกลงจะคุยร่วมกัน', 'maxlength="800"')}${submit('เพิ่มรายการติดตามผล')}`, async form => {
    const data = formObject(form);
    data.dueAt = bangkokISO(data.dueAt);
    if (Date.parse(data.dueAt) <= Date.now()) throw new Error('เลือกวันติดตามผลในอนาคต');
    await post('/follow-ups', { ...data, status:'pending' });
    complete('สร้างรายการติดตามผลแล้ว');
  }),
  'complete-follow-up': id => confirm('บันทึกว่าติดตามผลแล้ว', 'รายการนี้จะย้ายไปยังประวัติการติดตามผล', 'บันทึกว่าเสร็จแล้ว', () => patch(`/follow-ups/${encodeURIComponent(id)}`, { status:'completed' }), 'บันทึกการติดตามผลแล้ว'),
  referral: id => showDialog('บันทึกการส่งต่อ', `${requestPicker(id)}${select('destination', 'ผู้รับผิดชอบที่ประสานงาน', ['ครูแนะแนว','นักจิตวิทยาประจำโรงเรียน','ผู้เชี่ยวชาญด้านสุขภาพจิต','ผู้รับผิดชอบด้านการคุ้มครองนักเรียน'].map(name => [name,name]))}${textarea('reason', 'เหตุผลที่จำเป็นต่อการส่งต่อ', '', 'required maxlength="800"')}${textarea('shared', 'ข้อมูลที่ได้รับอนุญาตให้แบ่งปัน (ถ้ามี)', '', 'maxlength="800"')}${input('dueAt', 'เวลาติดตามการส่งต่อ (ประเทศไทย)', 'datetime-local')}
    <label class="tc-check"><input type="checkbox" name="authorized" required> ฉันตรวจสอบสิทธิ์และขอบเขตข้อมูลตามขั้นตอนของโรงเรียนแล้ว</label>${submit('บันทึกเพื่อทบทวน')}`, async form => {
    const data = formObject(form);
    if (data.dueAt) data.dueAt = bangkokISO(data.dueAt);
    await post('/referrals', { ...data, authorized:true, status:'review' });
    complete('บันทึกรายการส่งต่อเพื่อทบทวนแล้ว');
  }),
  'referral-sent': id => confirm('บันทึกว่าประสานงานแล้ว', 'ยืนยันเมื่อคุณครูได้ติดต่อผู้รับโดยตรงตามขั้นตอนของโรงเรียน', 'ยืนยันการบันทึก', () => patch(`/referrals/${encodeURIComponent(id)}`, { status:'sent' }), 'บันทึกสถานะการประสานงานแล้ว'),
  'referral-completed': id => confirm('ปิดรายการส่งต่อ', 'รายการที่ปิดแล้วจะคงอยู่ในประวัติ', 'ปิดรายการ', () => patch(`/referrals/${encodeURIComponent(id)}`, { status:'completed' }), 'ปิดรายการส่งต่อแล้ว'),
  password: () => showDialog('เปลี่ยนรหัสผ่าน', `${input('currentPassword', 'รหัสผ่านปัจจุบัน', 'password', 'required autocomplete="current-password"')}${input('newPassword', 'รหัสผ่านใหม่', 'password', 'required minlength="10" autocomplete="new-password"')}${submit('บันทึกรหัสผ่าน')}`, async form => {
    await patch('/settings', formObject(form));
    complete('เปลี่ยนรหัสผ่านแล้ว');
  }),
  'toggle-verified': id => {
    const row = rowById(workspace.users, id);
    const title = row.verified ? 'ยกเลิกการยืนยันครู' : 'ยืนยันครู';
    return confirm(title, `${title}สำหรับ ${row.name} โปรดตรวจสอบตัวตนและสิทธิ์การดูแลตามขั้นตอนของโรงเรียน`, 'ยืนยัน', () => patch(`/admin/users/${encodeURIComponent(id)}`, { verified:!row.verified }), 'อัปเดตการยืนยันแล้ว');
  },
  'toggle-user': id => {
    const row = rowById(workspace.users, id);
    const title = row.active ? 'พักการใช้งานบัญชี' : 'เปิดการใช้งานบัญชี';
    return confirm(title, `${title}ของ ${row.name}`, 'ยืนยัน', () => patch(`/admin/users/${encodeURIComponent(id)}`, { active:!row.active }), 'อัปเดตสถานะบัญชีแล้ว');
  },
  'edit-student': id => {
    const student = rowById(workspace.users, id);
    const rooms = [['', 'ไม่ระบุห้อง'], ...workspace.classrooms.map(room => [room.id, `${room.name} · ${room.grade}`])];
    const dialog = showDialog('แก้ไขข้อมูลนักเรียน', `${input('name', 'ชื่อที่แสดง', 'text', `required maxlength="100" value="${esc(student.name)}"`)}${input('grade', 'ระดับชั้น', 'text', `maxlength="50" value="${esc(student.grade || '')}"`)}${select('classroomId', 'ห้องเรียน', rooms)}${submit('บันทึกข้อมูลนักเรียน')}`, async form => {
      await patch(`/admin/users/${encodeURIComponent(id)}`, formObject(form));
      complete('บันทึกข้อมูลนักเรียนแล้ว');
    });
    dialog.querySelector('select').value = student.classroomId || '';
  },
  ticket: id => {
    const row = rowById(workspace.tickets, id);
    return showDialog(ticketName(row), `<p>${esc(row.userName || 'บัญชีในโรงเรียน')} · ${esc(formatDateTime(row.createdAt))}</p><p>${esc(row.reason || 'ผู้ใช้ไม่ได้ระบุรายละเอียดเพิ่มเติม')}</p><p class="muted">ดำเนินการตามขั้นตอนของโรงเรียนและบันทึกผลเมื่อเสร็จ</p>${submit(row.status === 'completed' ? 'เปิดคำขอเพื่อตรวจสอบอีกครั้ง' : 'บันทึกว่าดำเนินการแล้ว')}`, async () => {
      await patch(`/admin/tickets/${encodeURIComponent(id)}`, { status: row.status === 'completed' ? 'new' : 'completed' });
      complete('อัปเดตสถานะคำขอแล้ว');
    });
  },
  classroom: id => {
    const row = rowById(workspace.classrooms, id);
    return showDialog(row ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียน', `${input('name', 'ชื่อห้องเรียน', 'text', `required maxlength="60" value="${esc(row?.name || '')}" placeholder="เช่น ม. 5/1"`)}${input('grade', 'ระดับชั้น', 'text', `required maxlength="60" value="${esc(row?.grade || '')}"`)}${submit('บันทึกห้องเรียน')}`, async form => {
      if (row) await patch(`/admin/classrooms/${encodeURIComponent(id)}`, formObject(form));
      else await post('/admin/classrooms', formObject(form));
      complete('บันทึกห้องเรียนแล้ว');
    });
  },
  assignment: () => {
    const choices = role => [['', role === 'student' ? 'เลือกนักเรียน' : 'เลือกครู'], ...workspace.users.filter(row => row.active && row.role === role && (role === 'student' || row.verified)).map(row => [row.id,row.name])];
    return showDialog('มอบหมายครูดูแลนักเรียน', `${select('studentId', 'นักเรียน', choices('student'), 'required')}${select('teacherId', 'ครูที่ยืนยันแล้ว', choices('teacher'), 'required')}${submit('ยืนยันการมอบหมาย')}`, async form => {
      await post('/admin/assignments', formObject(form));
      complete('บันทึกการมอบหมายแล้ว');
    });
  },
  'remove-assignment': id => confirm('ยกเลิกการมอบหมาย', 'ครูจะเสียสิทธิ์เข้าถึงคำขอและบทสนทนาของนักเรียนคนนี้', 'ยกเลิกการมอบหมาย', () => remove(`/admin/assignments/${encodeURIComponent(id)}`), 'ยกเลิกการมอบหมายแล้ว'),
};

document.addEventListener('click', async event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest('[data-tc-action]');
  if (!button || !Object.hasOwn(actions, button.dataset.tcAction)) return;
  button.disabled = true;
  try { await actions[button.dataset.tcAction](button.dataset.id); }
  catch (error) { toast(error.message || 'ดำเนินการไม่สำเร็จ'); }
  finally { button.disabled = false; }
});

function liveFilter(id, update) {
  const element = document.querySelector(id);
  element?.addEventListener('submit', event => event.preventDefault());
  element?.addEventListener('input', () => update(element));
}

function listenSubmit(id, work) {
  document.querySelector(id)?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.submitter;
    if (button) button.disabled = true;
    try { await work(new FormData(event.currentTarget)); }
    catch (error) { toast(error.message); }
    finally { if (button) button.disabled = false; }
  });
}

export function bindTeacher(path) {
  clearInterval(chatRefresh);
  activeChatId = null;
  if (routePart(path) === 'messages') bindChat();
  liveFilter('#tc-request-filters', form => {
    const { query, status, type, topic, date, sort } = formObject(new FormData(form));
    const normalized = query.trim().toLowerCase();
    const entries = newest(workspace.requests.filter(row => (!normalized || (row.studentName || '').toLowerCase().includes(normalized)) && (!status || row.status === status) && (!type || row.supportType === type) && (!topic || row.topic === topic) && (!date || dayFormatter.format(new Date(row.createdAt)) === date)));
    if (sort === 'waiting') entries.reverse();
    document.querySelector('#tc-request-list').innerHTML = entries.length ? miniRequests(entries) : empty('ไม่พบคำขอที่ตรงกัน', 'ลองปรับคำค้นหรือตัวกรอง');
  });
  liveFilter('#tc-student-filter', field => {
    const query = field.value.trim().toLowerCase();
    document.querySelector('#tc-students-list').innerHTML = studentCards(workspace.students.filter(row => row.name.toLowerCase().includes(query)), workspace);
  });
  for (const item of document.querySelectorAll('[data-tc-checklist]')) item.addEventListener('change', () => {
    const count = document.querySelectorAll('[data-tc-checklist]:checked').length;
    document.querySelector('#tc-checklist-progress').textContent = `เลือกแล้ว ${count} จาก ${checklist.length} ข้อ`;
  });
  listenSubmit('#tc-teacher-profile', async form => {
    const { name, ...profile } = formObject(form);
    const { user } = await patch('/settings', { name, ...profile });
    if (user) setUser(user);
    complete('บันทึกโปรไฟล์แล้ว');
  });
  listenSubmit('#tc-teacher-preferences', async form => {
    const { user } = await patch('/settings', { settings: { notifications:form.has('notifications'), preferredAppointment:form.get('preferredAppointment') } });
    if (user) setUser(user);
    complete('บันทึกความต้องการแล้ว');
  });
}

export function bindAdmin() {
  clearInterval(chatRefresh);
  activeChatId = null;
  liveFilter('#tc-user-filters', form => {
    const { query, role } = formObject(new FormData(form));
    const needle = query.trim().toLowerCase();
    document.querySelector('#tc-user-list').innerHTML = userTable(workspace.users.filter(row => (!role || row.role === role) && `${row.name} ${row.email || ''}`.toLowerCase().includes(needle)), workspace.user.id);
  });
  listenSubmit('#tc-school-settings', async form => {
    const { name, retentionDays, ...settings } = formObject(form);
    await patch('/admin/school', { name, settings: { ...settings, retentionDays:retentionDays ? Number(retentionDays) : '' } });
    complete('บันทึกข้อมูลโรงเรียนแล้ว');
  });
}
