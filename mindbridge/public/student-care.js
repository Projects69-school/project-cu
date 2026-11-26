import { api, esc, icon, toast, navigate, refresh, setUser, pageIntro, statusLabel, showDialog } from './ui.js';
import { studentTools } from './student.js';

const supportTypes = ['อยากให้มีคนรับฟัง', 'อยากได้รับคำแนะนำ', 'อยากให้ช่วยคิดทางออก', 'อยากนัดพูดคุยเป็นส่วนตัว', 'อยากให้ช่วยประสานงาน', 'ยังไม่แน่ใจว่าต้องการอะไร'];
const methods = ['ส่งข้อความ', 'นัดพบเป็นส่วนตัว', 'นัดโทรพูดคุย', 'ส่งสัญญาณขอความช่วยเหลือ'];
const appointmentKinds = ['พบครูเป็นส่วนตัว', 'สนทนาผ่านข้อความ', 'นัดโทรพูดคุย', 'นัดวิดีโอผ่านช่องทางที่โรงเรียนอนุญาต'];
const steps = ['ความช่วยเหลือ', 'เลือกครู', 'วิธีคุย', 'รายละเอียด', 'ตรวจและส่ง'];
const dtime = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
const htime = { hour: '2-digit', minute: '2-digit' };
const safety = 'ครูจะรักษาความลับตามแนวทางของโรงเรียน หากต้องคุ้มครองความปลอดภัยหรือส่งต่อ อาจแจ้งข้อมูลเท่าที่จำเป็นแก่ผู้รับผิดชอบ';
const dialogButton = (label) => `<div class="st-actions"><button type="submit" class="btn btn-primary">${esc(label)}</button></div>`;
let chatItems = [];

function avatar(person, size = '') {
  const saved = String(person.avatar || '');
  const src = /^(?:\/api\/[^"<>]+|data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+)$/i.test(saved) ? saved : '';
  const label = (person.name || 'ครู').replace(/^ครู\s*/, '').trim();
  return `<span class="st-avatar ${size}" aria-hidden="true">${src ? `<img alt="" src="${esc(src)}">` : saved ? esc(saved.slice(0, 6)) : esc(Array.from(label).slice(0, 2).join(''))}</span>`;
}

function supportPage(w) {
  const { href, hint, empty, getEmotion } = studentTools;
  const query = new URLSearchParams(location.search);
  const signal = query.get('mode') === 'signal';
  const express = query.get('mode') === 'express';
  const initial = getEmotion();
  const intro = pageIntro('ขอความช่วยเหลือ', signal ? 'ส่งสัญญาณให้ครูรู้' : 'เริ่มขอความช่วยเหลือ', 'เริ่มได้โดยยังไม่ต้องเล่าเรื่องทั้งหมด เธอเลือกได้ว่าอยากให้ใครรู้อะไร');
  if (!w.teachers.length) return `${intro}<section class="card">${empty('users', 'ยังไม่มีครูที่โรงเรียนอนุญาตให้ติดต่อ ลองสอบถามครูประจำชั้นหรือผู้ดูแลโรงเรียน')}${href('dashboard', 'กลับหน้าหลัก')}</section>`;
  return `${intro}<section class="card st-wizard"><ol class="st-steps" aria-label="ขั้นตอนขอความช่วยเหลือ">${steps.map((name, index) => `<li ${index === 0 ? 'aria-current="step"' : ''}><span>${index + 1}</span><strong>${name}</strong></li>`).join('')}</ol><form id="st-support-form" class="stack">
    <section class="st-step" data-step="0" tabindex="-1"><h2>ตอนนี้อยากให้ครูช่วยแบบไหน?</h2><p class="muted">เลือกหนึ่งข้อที่ตรงใจที่สุด หรือเลือกว่ายังไม่แน่ใจ</p><div class="st-radio-grid">${supportTypes.map((option, index) => `<label class="st-radio-card"><input type="radio" name="supportType" value="${option}" ${index === 5 ? 'checked' : ''}><span><strong>${option}</strong></span></label>`).join('')}</div></section>
    <section class="st-step" data-step="1" tabindex="-1" hidden><h2>อยากติดต่อครูคนไหน?</h2><p class="muted">เลือกจากครูที่โรงเรียนยืนยันและอนุญาตให้ดูแลเธอ</p><div class="st-teacher-list">${w.teachers.map((teacher) => `<label class="st-radio-card st-teacher-option"><input type="radio" name="teacherId" value="${esc(teacher.id)}" ${w.teachers.length === 1 ? 'checked' : ''}><span>${avatar(teacher, 'st-avatar-lg')}<span><strong>${esc(teacher.name)} ${icon('badge-check', 17)}</strong><small>${esc(teacher.title || 'ครูที่ได้รับมอบหมาย')}</small>${teacher.training?.length ? `<small>การอบรม: ${esc(teacher.training.join(' · '))}</small>` : ''}<small>${esc(teacher.availability || 'เวลาตอบกลับขึ้นอยู่กับครู')} ${teacher.responseTime ? `· ${esc(teacher.responseTime)}` : ''}</small></span></span></label>`).join('')}</div></section>
    <section class="st-step" data-step="2" tabindex="-1" hidden><h2>อยากเริ่มคุยแบบไหน?</h2><div class="st-radio-grid">${methods.map((method, index) => `<label class="st-radio-card"><input type="radio" name="method" value="${method}" ${(signal ? index === 3 : index === 0) ? 'checked' : ''}><span><strong>${method}</strong></span></label>`).join('')}</div></section>
    <section class="st-step" data-step="3" tabindex="-1" hidden><h2>มีอะไรที่อยากเล่าเพิ่มไหม?</h2><p class="muted">ข้ามได้ทั้งหมด เลือกเฉพาะเรื่องที่พร้อมให้ครูคนนี้เห็น</p><div class="form-grid"><label class="field">ความรู้สึก<select name="emotion"><option value="">ยังไม่พร้อมระบุ</option>${[...new Set([initial, ...studentTools.moods.map(([mood]) => mood)].filter(Boolean))].map((mood) => `<option ${mood === initial ? 'selected' : ''}>${esc(mood)}</option>`).join('')}</select></label><label class="field">หัวข้อ<input name="topic" maxlength="120" placeholder="เช่น เรื่องเรียน หรือเพื่อน"></label></div><label class="field">ข้อความสั้น ๆ<textarea name="message" maxlength="5000" rows="4" placeholder="ถ้ามีอะไรอยากให้ครูรู้ พิมพ์เท่าที่อยากเล่า"></textarea></label>
    <details class="st-details" ${express && w.journals.length ? 'open' : ''}><summary>เลือกบางส่วนจากบันทึกของฉัน <span>ข้ามได้</span></summary><label class="field">เลือกบันทึกเพื่อดูเอง<select id="st-support-journal"><option value="">ไม่เลือกบันทึก</option>${w.journals.map((entry) => `<option value="${esc(entry.id)}">${esc(entry.title)}</option>`).join('')}</select></label><div id="st-support-excerpt" hidden><label class="field">ลากเลือกเฉพาะข้อความที่ต้องการส่ง<textarea id="st-journal-source" readonly rows="4"></textarea></label><button type="button" class="btn btn-secondary" id="st-copy-excerpt">เพิ่มเฉพาะข้อความที่เลือก</button><label class="st-inline-check" id="st-support-drawing-label" hidden><input type="checkbox" name="shareDrawing"> ส่งภาพวาดจากบันทึกนี้</label></div><label class="field">ข้อความจากบันทึกที่จะส่ง<textarea name="excerpt" maxlength="5000" rows="3" placeholder="จะไม่มีการส่งข้อความในบันทึก เว้นแต่เธอเลือกมาใส่ตรงนี้"></textarea></label></details></section>
    <section class="st-step" data-step="4" tabindex="-1" hidden><h2>ตรวจข้อมูลก่อนส่ง</h2><p class="muted">นี่คือข้อมูลที่จะไปถึงครูที่เธอเลือก</p><div id="st-support-review"></div><label class="st-inline-check st-confirm"><input type="checkbox" name="confirmed"> ฉันตรวจข้อมูลแล้ว และต้องการส่งข้อมูลตามที่แสดง</label></section>
    <p id="st-support-error" class="form-error" role="alert" hidden></p><div class="st-actions st-wizard-actions"><button id="st-support-back" type="button" class="btn btn-secondary" hidden>ย้อนกลับ</button><button id="st-support-next" class="btn btn-primary" type="submit">ถัดไป ${icon('arrow-right', 17)}</button></div></form></section>${hint('ครูอาจตอบเมื่อพร้อมในเวลาทำการ หากกำลังตกอยู่ในอันตราย ให้ขอความช่วยเหลือจากผู้ใหญ่ที่ไว้วางใจโดยตรง', 'clock')}`;
}

function bindSupport(w) {
  const { form, clearEmotion } = studentTools;
  const root = document.querySelector('#st-support-form');
  if (!root) return;
  let step = 0;
  const back = root.querySelector('#st-support-back');
  const next = root.querySelector('#st-support-next');
  const error = root.querySelector('#st-support-error');
  const journal = root.querySelector('#st-support-journal');
  const source = root.querySelector('#st-journal-source');
  const selectedJournal = () => w.journals.find((entry) => entry.id === journal.value);
  function showError(message) {
    error.textContent = message;
    error.hidden = false;
  }
  function update() {
    root.querySelectorAll('[data-step]').forEach((element) => { element.hidden = Number(element.dataset.step) !== step; });
    document.querySelectorAll('.st-steps li').forEach((element, index) => {
      if (index === step) element.setAttribute('aria-current', 'step');
      else element.removeAttribute('aria-current');
      element.classList.toggle('st-step-done', index < step);
    });
    back.hidden = step === 0;
    next.innerHTML = step === 4 ? `ส่งคำขอความช่วยเหลือ ${icon('send', 17)}` : `ถัดไป ${icon('arrow-right', 17)}`;
    error.hidden = true;
    root.querySelector(`[data-step="${step}"]`).focus({ preventScroll: true });
  }
  function payload(data) {
    const fields = Object.fromEntries(['teacherId', 'supportType', 'method', 'emotion', 'topic', 'message', 'excerpt'].map((key) => [key, String(data.get(key) || '').trim()]));
    return { ...fields, drawing: data.has('shareDrawing') ? selectedJournal()?.drawing || '' : '', confirmed: data.has('confirmed') };
  }
  function review(info) {
    const teacher = w.teachers.find(({ id }) => id === info.teacherId);
    const rows = [['ผู้รับข้อมูล', teacher.name], ['วัตถุประสงค์', 'ขอให้ครูช่วยดูแลตามคำขอนี้'], ['ความช่วยเหลือ', info.supportType], ['วิธีสื่อสาร', info.method], ['ความรู้สึก', info.emotion], ['หัวข้อ', info.topic], ['ข้อความถึงครู', info.message], ['ข้อความจากบันทึก', info.excerpt]];
    root.querySelector('#st-support-review').innerHTML = `<dl class="st-review">${rows.filter(([, value]) => value).map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}${info.drawing ? `<div><dt>ภาพวาดที่เลือก</dt><dd><img class="st-review-image" src="${esc(info.drawing)}" alt="ภาพวาดที่จะส่ง"></dd></div>` : ''}</dl>${studentTools.hint(safety, 'shield')}`;
  }
  back.addEventListener('click', () => { step -= 1; root.elements.confirmed.checked = false; update(); });
  journal.addEventListener('change', () => {
    const entry = selectedJournal();
    source.value = entry?.body || '';
    root.querySelector('#st-support-excerpt').hidden = !entry;
    root.querySelector('#st-support-drawing-label').hidden = !entry?.drawing;
    root.elements.shareDrawing.checked = false;
    root.querySelector('#st-copy-excerpt').disabled = !entry?.body;
  });
  root.querySelector('#st-copy-excerpt').addEventListener('click', () => {
    const selected = source.value.slice(source.selectionStart, source.selectionEnd);
    if (!selected) return toast('ลากเลือกเฉพาะข้อความก่อนเพิ่ม');
    root.elements.excerpt.value = [root.elements.excerpt.value, selected].filter(Boolean).join('\n').slice(0, 5000);
    toast('เพิ่มข้อความที่เลือกไว้สำหรับตรวจทานแล้ว');
  });
  form('#st-support-form', async (data) => {
    error.hidden = true;
    const info = payload(data);
    if (step === 1 && !info.teacherId) return showError('เลือกครูที่อยากติดต่อก่อน');
    if (step < 4) {
      step += 1;
      if (step === 4) review(info);
      update();
      return;
    }
    if (!info.confirmed) return showError('เลือกยืนยันข้อมูลก่อนส่งคำขอ');
    const result = await api('/requests', { method: 'POST', body: info });
    clearEmotion();
    toast('ส่งคำขอให้ครูแล้ว');
    navigate(`/student/journey?id=${encodeURIComponent(result.item.id)}`);
  });
}

function conversationFrom(w) {
  const query = new URLSearchParams(location.search);
  const list = w.conversations.filter((item) => item.archived === query.has('archived'));
  return { list, selected: list.find((item) => item.id === query.get('id')) || list[0], archived: query.has('archived') };
}

async function messagesPage(w) {
  const { href, date, hint, empty } = studentTools;
  const { list, selected, archived } = conversationFrom(w);
  const teacher = w.teachers.find(({ id }) => id === selected?.otherId);
  const request = w.requests.find(({ id }) => id === selected?.requestId);
  chatItems = selected ? (await api(`/conversations/${selected.id}/messages`)).items : [];
  return `${pageIntro('คุยกับครู', 'ข้อความ', 'คุยกับครูที่โรงเรียนอนุญาตให้ดูแลเธอ', href('support', 'ขอความช่วยเหลือ', 'secondary', 'heart'))}
  <section class="card st-message-card"><aside class="st-message-threads"><div class="st-section-line"><h2>บทสนทนา</h2><a class="st-quiet-link" href="/student/messages${archived ? '' : '?archived=1'}">${archived ? 'กลับกล่องข้อความ' : 'เก็บถาวร'}</a></div>${list.length ? `<div class="st-list">${list.map((thread) => `<a class="st-thread ${thread.id === selected?.id ? 'st-current' : ''}" href="/student/messages?id=${encodeURIComponent(thread.id)}${archived ? '&amp;archived=1' : ''}" ${thread.id === selected?.id ? 'aria-current="page"' : ''}>${avatar({ name: thread.otherName, avatar: thread.otherAvatar })}<span><strong>${esc(thread.otherName)}</strong><small>${esc(thread.lastText || 'เริ่มบทสนทนาได้เมื่อพร้อม')}</small></span>${thread.unread && thread.id !== selected?.id ? `<em>${thread.unread}</em>` : ''}</a>`).join('')}</div>` : empty('message', archived ? 'ไม่มีบทสนทนาที่เก็บถาวร' : 'ส่งคำขอความช่วยเหลือเพื่อเริ่มบทสนทนา')}</aside>
  <section class="st-chat">${selected ? `<div class="st-chat-heading">${avatar({ name: selected.otherName, avatar: selected.otherAvatar })}<div><h2>${esc(selected.otherName)}</h2><p class="muted">${esc(teacher?.availability || 'ครูอาจไม่ตอบกลับทันที')}${teacher?.responseTime ? ` · ${esc(teacher.responseTime)}` : ''}</p></div><details class="st-chat-menu"><summary aria-label="ตัวเลือกบทสนทนา">${icon('settings', 20)}</summary><div><button type="button" id="st-archive-thread">${archived ? 'ย้ายกลับกล่องข้อความ' : 'เก็บบทสนทนา'}</button><button type="button" id="st-report-thread">รายงานพฤติกรรม</button><a href="/student/support">ขอคุยกับครูคนอื่น</a><a href="/student/settings#st-notifications">ตั้งค่าการแจ้งเตือน</a></div></details></div>
  <div class="st-chat-search"><label class="field"><span class="st-visually-hidden">ค้นข้อความในบทสนทนา</span><input type="search" id="st-chat-find" placeholder="ค้นข้อความในบทสนทนา"></label></div><div id="st-chat-log" class="st-chat-log" role="log" aria-label="ข้อความ">${messageRows(chatItems, w.user.id)}</div><div class="st-chat-composer">${request?.status === 'closed' ? `${hint('คำขอนี้ปิดแล้ว เปิดคำขออีกครั้งเพื่อเริ่มคุยต่อ', 'lock')}${href(`journey?id=${encodeURIComponent(request.id)}`, 'เปิดเส้นทางการดูแล')}` : `<form id="st-send-message" class="stack"><div class="st-compose-tools"><details><summary aria-label="เพิ่มอีโมจิ">${icon('smile', 19)} อีโมจิ</summary><div class="st-emojis">${['🙂', '💜', '🌷', '🫶', '😔', '💭', '🌱'].map((symbol) => `<button type="button" data-emoji="${symbol}">${symbol}</button>`).join('')}</div></details><button type="button" id="st-share-in-chat" class="st-text-button">${icon('eye', 17)} แชร์สิ่งที่เลือก</button><a class="st-quiet-link" href="/student/appointments?teacher=${encodeURIComponent(selected.otherId)}">${icon('calendar', 17)} ขอนัดหมาย</a></div><div class="st-compose-row"><label class="st-chat-file" aria-label="แนบรูปภาพ">${icon('paperclip', 20)}<input name="attachment" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label><textarea name="text" rows="1" maxlength="8000" aria-label="ข้อความถึงครู" placeholder="พิมพ์สิ่งที่อยากบอก…"></textarea><button class="btn btn-primary" type="submit">${icon('send', 18)} ส่ง</button></div><small class="muted" id="st-chat-filename"></small></form>`}</div>` : empty('message-circle', 'ไม่จำเป็นต้องรู้ว่าจะเริ่มอย่างไร แค่ส่งข้อความว่า “สวัสดีค่ะ/ครับ” ก็ได้', href('support', 'เลือกครูและส่งคำขอ', 'primary'))}</section></section>
  ${hint('ครูอาจไม่ตอบทันที หากต้องการความช่วยเหลือเร่งด่วน ให้ติดต่อผู้ใหญ่ที่ไว้วางใจหรือช่องทางฉุกเฉินโดยตรง', 'clock')}`;
}

function messageRows(items, userId, filter = '') {
  const { date, empty } = studentTools;
  const list = items.filter(({ text, attachmentName }) => !filter || `${text} ${attachmentName || ''}`.toLocaleLowerCase('th').includes(filter));
  if (!list.length) return empty('message', filter ? 'ไม่พบข้อความที่ตรงกัน' : 'ไม่จำเป็นต้องรู้ว่าจะเริ่มต้นอย่างไร แค่ส่งข้อความว่า “สวัสดีค่ะ/ครับ” ก็ได้');
  return list.map((message) => `<article class="st-bubble ${message.senderId === userId ? 'st-bubble-mine' : ''}">${message.text ? `<p>${esc(message.text)}</p>` : ''}${message.attachmentId ? `<a href="/api/attachments/${encodeURIComponent(message.attachmentId)}" target="_blank" rel="noopener"><img src="/api/attachments/${encodeURIComponent(message.attachmentId)}" alt="${esc(message.attachmentName || 'รูปภาพแนบ')}"></a>` : ''}<small>${date(message.createdAt, htime)}${message.senderId === userId ? message.readAt ? ' · อ่านแล้ว' : ' · ส่งแล้ว' : ''}</small></article>`).join('');
}

function bindMessages(w) {
  const { form, fileUrl } = studentTools;
  const { selected, archived } = conversationFrom(w);
  if (!selected) return;
  const path = `/conversations/${selected.id}/messages`;
  const log = document.querySelector('#st-chat-log');
  const find = document.querySelector('#st-chat-find');
  const composer = document.querySelector('#st-send-message');
  let pending = false;
  const render = (bottom = false) => {
    log.innerHTML = messageRows(chatItems, w.user.id, find.value.trim().toLocaleLowerCase('th'));
    if (bottom) log.scrollTop = log.scrollHeight;
  };
  async function poll(force = false) {
    if (!log.isConnected || pending) return;
    pending = true;
    try {
      const response = await api(path);
      if (!log.isConnected || !force && JSON.stringify(response.items) === JSON.stringify(chatItems)) return;
      const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 100;
      chatItems = response.items;
      render(force || nearBottom);
    } catch (error) {
      if (force) toast(error.message);
    } finally { pending = false; }
  }
  log.scrollTop = log.scrollHeight;
  find.addEventListener('input', () => render());
  const poller = setInterval(() => {
    if (!log.isConnected) clearInterval(poller);
    else if (document.visibilityState !== 'hidden') poll();
  }, 3500);
  document.querySelector('#st-archive-thread').addEventListener('click', async () => {
    try {
      await api(`/conversations/${selected.id}`, { method: 'PATCH', body: { archived: !archived } });
      toast(archived ? 'ย้ายกลับกล่องข้อความแล้ว' : 'เก็บบทสนทนาแล้ว');
      navigate('/student/messages');
    } catch (error) { toast(error.message); }
  });
  document.querySelector('#st-report-thread').addEventListener('click', () => requestPrivacy('report', 'รายงานพฤติกรรมในบทสนทนา', `บทสนทนากับ ${selected.otherName}`));
  if (!composer) return;
  composer.elements.attachment.addEventListener('change', () => { document.querySelector('#st-chat-filename').textContent = composer.elements.attachment.files[0]?.name || ''; });
  composer.querySelectorAll('[data-emoji]').forEach((button) => button.addEventListener('click', () => {
    const input = composer.elements.text;
    input.setRangeText(button.dataset.emoji, input.selectionStart, input.selectionEnd, 'end');
    input.focus();
  }));
  form('#st-send-message', async (data) => {
    const text = String(data.get('text') || '').trim();
    const attachment = data.get('attachment');
    if (!text && !attachment?.size) return toast('พิมพ์ข้อความหรือเพิ่มรูปก่อนส่ง');
    const result = await api(path, { method: 'POST', body: { text, ...(attachment?.size ? { dataUrl: await fileUrl(attachment), attachmentName: attachment.name } : {}) } });
    if (!chatItems.some(({ id }) => id === result.item.id)) chatItems.push(result.item);
    composer.reset();
    document.querySelector('#st-chat-filename').textContent = '';
    render(true);
  });
  document.querySelector('#st-share-in-chat').addEventListener('click', () => {
    showDialog('แชร์เฉพาะสิ่งที่เลือก', `<p>ส่งในบทสนทนากับ <strong>${esc(selected.otherName)}</strong> เพื่อให้ครูเข้าใจสิ่งที่เธออยากเล่า</p><label class="field">เลือกความรู้สึก<select name="emotion"><option value="">ไม่เลือก</option>${studentTools.moods.map(([mood]) => `<option>${mood}</option>`).join('')}</select></label><label class="field">ข้อความส่วนที่อยากส่ง<textarea name="excerpt" rows="4" maxlength="5000" placeholder="คัดลอกเฉพาะคำจากบันทึกที่เธอพร้อมแชร์"></textarea></label>${studentTools.hint(safety, 'shield')}<label class="st-inline-check"><input type="checkbox" name="confirm" required> ส่งเฉพาะข้อมูลข้างต้นให้ครูคนนี้</label>${dialogButton('ยืนยันและส่ง')}`, async (data) => {
      const text = [data.get('emotion') ? `ความรู้สึกที่อยากแชร์: ${data.get('emotion')}` : '', String(data.get('excerpt') || '').trim()].filter(Boolean).join('\n');
      if (!text) throw new Error('เพิ่มความรู้สึกหรือข้อความก่อนส่ง');
      const result = await api(path, { method: 'POST', body: { text } });
      if (!chatItems.some(({ id }) => id === result.item.id)) chatItems.push(result.item);
      render(true);
      toast('ส่งสิ่งที่เลือกให้ครูแล้ว');
    });
  });
}

function appointmentPage(w) {
  const { empty, href, date, hint } = studentTools;
  const query = new URLSearchParams(location.search);
  const edit = w.appointments.find((item) => item.id === query.get('reschedule') && ['requested', 'confirmed', 'suggested'].includes(item.status));
  const teacher = w.teachers.find((item) => item.id === (edit?.teacherId || query.get('teacher'))) || w.teachers[0];
  const upcoming = w.appointments.filter((item) => ['requested', 'confirmed', 'suggested'].includes(item.status) && new Date(item.startAt || 0) >= new Date()).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const old = w.appointments.filter((item) => !upcoming.includes(item)).sort((a, b) => String(b.startAt).localeCompare(String(a.startAt)));
  const renderItems = (items, active) => items.length ? items.map((item) => `<article class="st-appointment"><div class="st-section-line"><h3>${esc(item.teacherName || 'ครู')}</h3><span class="pill">${esc(statusLabel(item.status))}</span></div><p>${esc(item.kind)}</p><p class="muted">${item.startAt ? `${date(item.startAt, dtime)}${item.endAt ? `–${date(item.endAt, htime)}` : ''} น.` : 'ยังไม่กำหนดเวลา'}</p>${active ? `<div class="st-actions">${item.status === 'suggested' ? `<button type="button" class="btn btn-primary" data-appt-confirm="${esc(item.id)}">ยืนยันเวลาที่ครูเสนอ</button>` : ''}${href(`appointments?reschedule=${encodeURIComponent(item.id)}`, 'ขอเลื่อนนัด')}<button type="button" class="btn btn-secondary" data-appt-cancel="${esc(item.id)}">ยกเลิกนัด</button></div>` : ''}</article>`).join('') : empty('calendar', active ? 'ยังไม่มีนัดหมายที่กำลังจะมาถึง' : 'ยังไม่มีประวัตินัดหมาย');
  return `${pageIntro('คุยกับครู', 'นัดหมาย', 'เลือกเวลาที่สะดวกเพื่อพูดคุยกับครูที่ไว้วางใจ')}
    <div class="st-two-pane"><section class="card st-booking"><div class="st-section-line"><h2>${edit ? 'เลือกเวลาใหม่' : 'ขอนัดหมาย'}</h2>${edit ? href('appointments', 'กลับหน้าการนัดหมาย') : ''}</div>${teacher ? `<form id="st-appointment-form" class="stack" data-edit="${esc(edit?.id || '')}"><label class="field">ครูที่ต้องการนัด<select id="st-slot-teacher" name="teacherId" ${edit ? 'disabled' : ''}>${w.teachers.map((item) => `<option value="${esc(item.id)}" ${item.id === teacher.id ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label><div class="form-grid"><label class="field">เลือกวัน<select id="st-slot-date" required>${bookingDates(w, teacher.id)}</select></label><label class="field">เลือกเวลา <span class="muted">เวลาไทย</span><select id="st-slot-time" name="slotId" required></select></label></div><label class="field">ประเภทการนัดหมาย<select name="kind" ${edit ? 'disabled' : ''}>${appointmentKinds.map((item) => `<option ${item === edit?.kind ? 'selected' : ''}>${item}</option>`).join('')}</select></label>${edit ? '' : '<label class="field">ฝากข้อความถึงครู <span class="muted">ข้ามได้</span><textarea rows="3" name="note" maxlength="2000" placeholder="เขียนเท่าที่อยากบอก"></textarea></label>'}${hint('ครูจะเห็นวัน เวลา ประเภทนัด และข้อความที่เธอใส่ไว้ จากนั้นครูจะยืนยันเวลา', 'calendar')}<button type="submit" class="btn btn-primary" id="st-book-appointment">${edit ? 'ส่งคำขอเลื่อนนัด' : 'ส่งคำขอนัดหมาย'}</button></form>` : empty('calendar', 'ยังไม่มีครูที่โรงเรียนอนุญาตให้เธอนัดหมาย')}</section>
    <section class="card st-appointments"><h2>นัดหมายที่กำลังจะมาถึง</h2>${renderItems(upcoming, true)}<details class="st-details"><summary>ประวัตินัดหมาย <span>${old.length} รายการ</span></summary>${renderItems(old, false)}</details></section></div>`;
}

function localDay(value) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}

function bookingDates(w, teacherId) {
  const days = [...new Set(w.availability.filter((item) => item.available && item.teacherId === teacherId && new Date(item.startAt) > new Date()).map((item) => localDay(item.startAt)))];
  return days.length ? days.map((day) => `<option value="${day}">${studentTools.date(day, { weekday: 'long', month: 'long', day: 'numeric' })}</option>`).join('') : '<option value="">ยังไม่มีช่วงที่เปิดให้จอง</option>';
}

function bindAppointments(w) {
  const { form, date, confirmAction } = studentTools;
  const teacher = document.querySelector('#st-slot-teacher');
  const day = document.querySelector('#st-slot-date');
  const slot = document.querySelector('#st-slot-time');
  const button = document.querySelector('#st-book-appointment');
  function updateSlots() {
    const slots = w.availability.filter((item) => item.available && item.teacherId === teacher.value && localDay(item.startAt) === day.value && new Date(item.startAt) > new Date());
    slot.innerHTML = slots.length ? slots.map((item) => `<option value="${esc(item.id)}">${date(item.startAt, htime)}${item.endAt ? `–${date(item.endAt, htime)}` : ''} น.</option>`).join('') : '<option value="">เลือกวันที่มีเวลาว่าง</option>';
    button.disabled = !slots.length;
  }
  if (teacher) {
    teacher.addEventListener('change', () => { day.innerHTML = bookingDates(w, teacher.value); updateSlots(); });
    day.addEventListener('change', updateSlots);
    updateSlots();
  }
  form('#st-appointment-form', async (data, element) => {
    const id = element.dataset.edit;
    if (!data.get('slotId')) return toast('เลือกวันที่และเวลาที่ต้องการก่อน');
    if (id) await api(`/appointments/${id}`, { method: 'PATCH', body: { status: 'requested', slotId: data.get('slotId') } });
    else await api('/appointments', { method: 'POST', body: { teacherId: data.get('teacherId'), slotId: data.get('slotId'), kind: data.get('kind'), note: data.get('note') } });
    toast(id ? 'ส่งคำขอเลื่อนนัดแล้ว' : 'ส่งคำขอนัดหมายให้ครูแล้ว');
    navigate('/student/appointments');
  });
  document.querySelectorAll('[data-appt-cancel]').forEach((element) => confirmAction(element, 'ยกเลิกนัดนี้?', 'ครูจะได้รับแจ้งว่าเธอยกเลิกนัดหมาย', async () => {
    await api(`/appointments/${element.dataset.apptCancel}`, { method: 'PATCH', body: { status: 'cancelled' } });
    toast('ยกเลิกนัดหมายแล้ว');
    await refresh();
  }));
  document.querySelectorAll('[data-appt-confirm]').forEach((element) => confirmAction(element, 'ยืนยันเวลาที่ครูเสนอ?', 'ยืนยันว่าเธอสะดวกตามวันและเวลาที่แสดง', async () => {
    await api(`/appointments/${element.dataset.apptConfirm}`, { method: 'PATCH', body: { status: 'confirmed' } });
    toast('ยืนยันนัดหมายแล้ว');
    await refresh();
  }));
}

function journeyPage(w) {
  const { href, empty, date } = studentTools;
  const selected = w.requests.find((item) => item.id === new URLSearchParams(location.search).get('id')) || w.requests[0];
  const intro = pageIntro('การดูแลของเธอ', 'เส้นทางการดูแล', 'ติดตามคำขอ ดูสิ่งที่เกิดขึ้น และเลือกก้าวต่อไปได้ตามที่พร้อม', href('support', 'ขอความช่วยเหลือเพิ่ม', 'primary', 'heart'));
  if (!selected) return `${intro}<section class="card">${empty('history', 'เมื่อส่งคำขอแล้ว เธอจะกลับมาดูสถานะได้ที่นี่', href('support', 'เริ่มขอความช่วยเหลือ', 'primary'))}</section>`;
  const timeline = selected.timeline || selected.events || [];
  const appointments = w.appointments.filter((item) => item.requestId === selected.id && ['requested', 'suggested', 'confirmed'].includes(item.status));
  const followUps = w.followUps.filter((item) => item.requestId === selected.id);
  const referrals = w.referrals.filter((item) => item.requestId === selected.id);
  return `${intro}<div class="st-journey-layout"><aside class="card st-request-list"><h2>คำขอของฉัน</h2><div class="st-list">${w.requests.map((item) => `<a class="st-list-row ${item.id === selected.id ? 'st-current' : ''}" href="/student/journey?id=${encodeURIComponent(item.id)}" ${item.id === selected.id ? 'aria-current="page"' : ''}><span><strong>${esc(item.supportType)}</strong><small>${esc(item.teacherName)} · ${date(item.createdAt)}</small></span><span class="pill">${esc(statusLabel(item.status))}</span></a>`).join('')}</div></aside><section class="card st-journey-card"><div class="st-section-line"><div><h2>${esc(selected.supportType)}</h2><p class="muted">ครูที่รับคำขอ: ${esc(selected.teacherName)}</p></div><span class="pill">${esc(statusLabel(selected.status))}</span></div><ol class="st-journey-timeline">${(timeline.length ? [...timeline].reverse() : [{ status: selected.status, createdAt: selected.createdAt }]).map((event, index) => `<li>${icon(index === 0 ? 'check' : 'clock', 17)}<span><strong>${esc(statusLabel(event.status || event.state || selected.status))}</strong><small>${date(event.createdAt, dtime)}</small></span></li>`).join('')}</ol>
  ${appointments.length ? `<section class="st-journey-sub"><h3>นัดหมายสำหรับคำขอนี้</h3>${appointments.map((item) => `<p>${date(item.startAt, dtime)} น. · ${esc(statusLabel(item.status))}</p>`).join('')}${href('appointments', 'ดูนัดหมายทั้งหมด')}</section>` : ''}${followUps.length ? `<section class="st-journey-sub"><h3>สิ่งที่ครูจะติดตาม</h3>${followUps.map((item) => `<p>${item.dueAt ? `${date(item.dueAt, dtime)} น. · ` : ''}${esc(statusLabel(item.status))}</p>`).join('')}</section>` : ''}${referrals.length ? `<section class="st-journey-sub"><h3>การส่งต่อ</h3>${referrals.map((item) => `<p>${date(item.createdAt)} · ${esc(statusLabel(item.status))}</p>`).join('')}</section>` : ''}
  <div class="st-actions">${selected.conversationId && selected.status !== 'closed' ? href(`messages?id=${encodeURIComponent(selected.conversationId)}`, 'คุยกับครู', 'primary', 'message') : ''}${selected.status === 'closed' ? '<button type="button" class="btn btn-primary" id="st-reopen">เปิดคำขอนี้อีกครั้ง</button>' : '<button type="button" class="btn btn-secondary" id="st-close-request">ปิดคำขอของฉัน</button>'}${href('support', 'ขอคุยกับครูคนอื่น')}</div><details class="st-details"><summary>เล่าความคิดเห็นเกี่ยวกับการดูแล <span>ข้ามได้</span></summary><form id="st-feedback-form" class="stack"><label class="field">ความคิดเห็น<textarea rows="3" name="feedback" maxlength="2000" placeholder="มีอะไรที่ครูควรทราบเพื่อช่วยดูแลเธอได้ดีขึ้นไหม?">${esc(typeof selected.feedback === 'string' ? selected.feedback : '')}</textarea></label><button type="submit" class="btn btn-secondary">ส่งความคิดเห็นให้ครู</button></form></details></section></div>`;
}

function bindJourney(w) {
  const { form, confirmAction } = studentTools;
  const selected = w.requests.find((item) => item.id === new URLSearchParams(location.search).get('id')) || w.requests[0];
  if (!selected) return;
  const path = `/requests/${selected.id}`;
  form('#st-feedback-form', async (data) => {
    const feedback = String(data.get('feedback')).trim();
    if (!feedback) return toast('เขียนความคิดเห็นก่อนส่ง หรือข้ามได้เลย');
    await api(path, { method: 'PATCH', body: { feedback } });
    toast('ส่งความคิดเห็นแล้ว');
  });
  confirmAction(document.querySelector('#st-reopen'), 'เปิดคำขอนี้อีกครั้ง?', 'ครูจะได้รับแจ้งว่าเธออยากกลับมาคุยต่อ', async () => {
    await api(path, { method: 'PATCH', body: { status: 'reopened' } });
    toast('เปิดคำขออีกครั้งแล้ว');
    await refresh();
  });
  confirmAction(document.querySelector('#st-close-request'), 'ปิดคำขอนี้?', 'กลับมาเปิดคำขอนี้หรือขอความช่วยเหลือใหม่ได้เมื่อต้องการ', async () => {
    await api(path, { method: 'PATCH', body: { status: 'closed' } });
    toast('ปิดคำขอแล้ว');
    await refresh();
  });
}

function settingsPage(w) {
  const { date, href, hint, empty } = studentTools;
  const settings = w.user.settings || {};
  return `${pageIntro('บัญชีของเธอ', 'ตั้งค่า', 'จัดการโปรไฟล์ ความเป็นส่วนตัว และรูปแบบการใช้งานที่สบายใจ')}
    <div class="st-two-pane"><div class="stack"><section class="card"><div class="st-profile-heading">${avatar(w.user, 'st-avatar-lg')}<div><h2>โปรไฟล์ของฉัน</h2><p class="muted">${esc(w.user.schoolName || '')}</p></div></div><form id="st-profile-form" class="stack"><label class="field">ชื่อที่ใช้ในแอป<input name="name" required maxlength="120" value="${esc(w.user.name)}"></label><label class="field">อีเมลที่ใช้เข้าระบบ<input value="${esc(w.user.email)}" readonly></label><label class="field">เปลี่ยนรูปโปรไฟล์<input name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label>${w.user.avatar ? '<label class="st-inline-check"><input type="checkbox" name="clearAvatar"> ลบรูปโปรไฟล์ปัจจุบัน</label>' : ''}<button type="submit" class="btn btn-primary">บันทึกโปรไฟล์</button></form></section>
    <section class="card"><h2>เปลี่ยนรหัสผ่าน</h2><form id="st-password-form" class="stack"><label class="field">รหัสผ่านปัจจุบัน<input type="password" name="currentPassword" required autocomplete="current-password"></label><label class="field">รหัสผ่านใหม่<input type="password" name="newPassword" required minlength="8" maxlength="128" autocomplete="new-password" placeholder="อย่างน้อย 8 ตัวอักษร"></label><button type="submit" class="btn btn-secondary">เปลี่ยนรหัสผ่าน</button></form></section>
    <section class="card" id="st-notifications"><h2>การแจ้งเตือนและการเข้าถึง</h2><form id="st-preferences-form" class="stack"><label class="st-inline-check"><input type="checkbox" name="messageNotifications" ${settings.messageNotifications !== false ? 'checked' : ''}> แจ้งเตือนเมื่อมีข้อความจากครู</label><label class="st-inline-check"><input type="checkbox" name="appointmentNotifications" ${settings.appointmentNotifications !== false ? 'checked' : ''}> แจ้งเตือนเมื่อมีการเปลี่ยนแปลงนัดหมาย</label><label class="st-inline-check"><input type="checkbox" name="reducedMotion" ${settings.reducedMotion ? 'checked' : ''}> ลดการเคลื่อนไหวในหน้าจอ</label><label class="st-inline-check"><input type="checkbox" name="largerText" ${settings.largerText ? 'checked' : ''}> แสดงข้อความขนาดใหญ่ขึ้น</label><button type="submit" class="btn btn-secondary">บันทึกการตั้งค่า</button></form></section></div>
    <div class="stack"><section class="card"><h2>ความเป็นส่วนตัว</h2>${hint('เช็กอินและบันทึกเก็บไว้เฉพาะเธอ เธอเป็นคนเลือกสิ่งที่จะส่งให้ครู')}${href('support', 'ขอคุยกับครูคนอื่น')}<div class="st-privacy-actions"><button type="button" class="btn btn-secondary" data-privacy="access">ขอเข้าถึงข้อมูลของฉัน</button><button type="button" class="btn btn-secondary" data-privacy="deletion">ขอลบข้อมูลของฉัน</button><button type="button" class="btn btn-secondary" data-privacy="privacy">แจ้งปัญหาความเป็นส่วนตัว</button></div><p class="muted st-small">ส่งคำขอให้ผู้รับผิดชอบของโรงเรียนดำเนินการ เธอจะเห็นข้อความยืนยันเมื่อส่งสำเร็จ</p></section>
    <section class="card"><h2>ประวัติข้อมูลที่แชร์</h2>${w.history.length ? `<div class="st-list">${w.history.map((row) => `<div class="st-list-row"><span><strong>${esc(row.type)}</strong><small>${esc(row.teacherName)} · ${date(row.createdAt, dtime)}</small>${row.purpose ? `<small>${esc(row.purpose)}</small>` : ''}</span></div>`).join('')}</div>` : empty('shield', 'ยังไม่มีประวัติการแชร์')}
    <details class="st-details"><summary>ประวัติการให้ความยินยอม</summary>${w.consents?.length ? `<ul class="st-consents">${w.consents.map((row) => `<li>${esc(consentLabel(row.scope))} · ${date(row.createdAt)}</li>`).join('')}</ul>` : '<p class="muted">ยังไม่มีประวัติการให้ความยินยอม</p>'}</details></section><section class="card st-profile-signout"><button type="button" id="st-signout" class="btn btn-secondary">${icon('logout', 17)} ออกจากระบบ</button></section></div></div>`;
}

function consentLabel(scope) {
  return { registration: 'ยินยอมสร้างบัญชี', 'account-registration': 'ยินยอมสร้างบัญชี', 'school-consent': 'ยินยอมตามแนวทางโรงเรียน', 'support-sharing': 'ยินยอมแชร์ข้อมูลให้ครู', 'demo-consent': 'ยอมรับการใช้งานบัญชีทดลอง' }[scope] || 'การให้ความยินยอมในการใช้งาน';
}

function requestPrivacy(kind, title, context = '') {
  showDialog(title, `<p>ผู้รับผิดชอบของโรงเรียนจะได้รับคำขอนี้ ${esc(context)}</p><label class="field">รายละเอียดเพิ่มเติม <span class="muted">ข้ามได้</span><textarea rows="4" name="reason" maxlength="1500" placeholder="เขียนเฉพาะข้อมูลที่อยากให้ผู้รับผิดชอบทราบ"></textarea></label>${dialogButton('ยืนยันและส่งคำขอ')}`, async (data) => {
    await api('/privacy-requests', { method: 'POST', body: { kind, reason: [context, String(data.get('reason') || '').trim()].filter(Boolean).join('\n') } });
    toast('ส่งให้ผู้รับผิดชอบของโรงเรียนแล้ว');
  });
}

function bindSettings() {
  const { form, fileUrl, confirmAction } = studentTools;
  form('#st-profile-form', async (data) => {
    const body = { name: data.get('name') };
    const file = data.get('avatar');
    if (file?.size) body.avatar = await fileUrl(file);
    else if (data.has('clearAvatar')) body.avatar = '';
    const response = await api('/settings', { method: 'PATCH', body });
    setUser(response.user || response.item);
    toast('บันทึกโปรไฟล์แล้ว');
    await refresh();
  });
  form('#st-password-form', async (data, element) => {
    await api('/settings', { method: 'PATCH', body: { currentPassword: data.get('currentPassword'), newPassword: data.get('newPassword') } });
    element.reset();
    toast('เปลี่ยนรหัสผ่านแล้ว');
  });
  form('#st-preferences-form', async (data) => {
    const settings = Object.fromEntries(['messageNotifications', 'appointmentNotifications', 'reducedMotion', 'largerText'].map((name) => [name, data.has(name)]));
    const response = await api('/settings', { method: 'PATCH', body: { settings } });
    setUser(response.user || response.item);
    toast('บันทึกการตั้งค่าแล้ว');
    await refresh();
  });
  document.querySelectorAll('[data-privacy]').forEach((element) => element.addEventListener('click', () => requestPrivacy(element.dataset.privacy, element.textContent)));
  confirmAction(document.querySelector('#st-signout'), 'ออกจากระบบ?', 'กลับเข้าระบบได้เมื่อต้องการใช้พื้นที่ของเธออีกครั้ง', async () => {
    await api('/logout', { method: 'POST' });
    setUser(null);
    navigate('/login');
  });
}

const carePages = {
  support: [supportPage, bindSupport],
  messages: [messagesPage, bindMessages],
  appointments: [appointmentPage, bindAppointments],
  journey: [journeyPage, bindJourney],
  settings: [settingsPage, bindSettings],
};

export function renderCare(route, workspace) {
  return carePages[route]?.[0](workspace) || `${pageIntro('MindBridge', 'ไม่พบหน้านี้', 'กลับไปที่หน้าหลักเพื่อเลือกเมนูที่ต้องการ', studentTools.href('dashboard', 'กลับหน้าหลัก', 'primary'))}`;
}

export function bindCare(route, workspace) {
  carePages[route]?.[1](workspace);
}
