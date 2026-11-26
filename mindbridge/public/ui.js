const shapes = {
  home: '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-7h6v7"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8Z"/>',
  sparkle: '<path d="M12 2 9.7 8.9 3 11l6.7 2.1L12 20l2.3-6.9L21 11l-6.7-2.1L12 2zM20 2v4m-2-2h4M3 17v4m-2-2h4"/>',
  journal: '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M8 7H3m5 5H3m5 5H3m8-9h5m-5 4h5"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3"/>',
  shield: '<path d="M12 22s7-3 7-9V5l-7-3-7 3v8c0 6 7 9 7 9z"/><path d="m9 12 2 2 4-4"/>',
  message: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m-12 5h6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4z"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-4m-3-12a4 4 0 0 1 0 8"/><circle cx="9" cy="7" r="4"/>',
  bridge: '<path d="M2 19h20M4 19v-7m16 7v-7M2 15c5 0 6-6 10-6s5 6 10 6m-10-6v10"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8m-8 12a2 2 0 0 0 4 0"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3m0 12v3M3 12h3m12 0h3M6 6l2 2m8 8 2 2M6 18l2-2m8-8 2-2"/>',
  logout: '<path d="M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  phone: '<path d="M7 3H4a1 1 0 0 0-1 1 17 17 0 0 0 17 17 1 1 0 0 0 1-1v-3l-5-2-2 2a12 12 0 0 1-7-7l2-2-2-5Z"/>',
  play: '<path d="M9 5l11 7-11 7V5Z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4m.1 3h.01"/>',
  book: '<path d="M12 6a6 6 0 0 0-5-2H3v15h4a6 6 0 0 1 5 2 6 6 0 0 1 5-2h4V4h-4a6 6 0 0 0-5 2v15"/>',
  school: '<path d="M3 21h18M5 21V9l7-6 7 6v12m-10 0v-5h6v5"/><circle cx="12" cy="10" r="2"/>',
  send: '<path d="m22 2-7 20-4-9-9-4 20-7zM22 2 11 13"/>',
  signal: '<path d="M3 20h18M6 15v-2m6 2V8m6 7V4"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  leaf: '<path d="M20 4C9 3 4 8 4 14a6 6 0 0 0 6 6c6 0 11-5 10-16ZM4 20l9-9"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  edit: '<path d="m14 5 5 5M4 20l5-1L21 7l-4-4L5 15l-1 5Z"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9m-10 4h6"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
  chart: '<path d="M4 3v17h17M9 16v-4m5 4V7m5 9v-6"/>',
  wind: '<path d="M3 8h12a2 2 0 1 0-2-2M3 12h16a2 2 0 1 1-2 2M3 16h9a2 2 0 1 1-2 2"/>',
  flag: '<path d="M5 21V4m0 1c5-4 9 3 15 0v10c-6 3-10-4-15 0"/>',
  history: '<path d="M3 12a9 9 0 1 1 2 6M3 5v7h7m2-5v6l3 2"/>',
  headphones: '<path d="M3 14v-2a9 9 0 0 1 18 0v2M3 14h4v6H5a2 2 0 0 1-2-2zm18 0h-4v6h2a2 2 0 0 0 2-2z"/>',
  link: '<path d="m10 13 4-4m-6 7-2 2a3 3 0 0 1-4-4l4-4a3 3 0 0 1 4 0m6-2 2-2a3 3 0 0 1 4 4l-4 4a3 3 0 0 1-4 0"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  inbox: '<path d="M3 12 6 4h12l3 8v7H3zm0 0h5l2 3h4l2-3h5"/>',
  clipboard: '<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="2" width="6" height="5" rx="1"/><path d="M9 12h6m-6 4h6"/>',
  paperclip: '<path d="m8 15 7-7a2 2 0 0 1 3 3l-8 8a4 4 0 0 1-6-6l9-9"/>',
};

const aliases = { 'arrow-right':'arrow', 'circle-help':'help', 'layout-dashboard':'grid', 'heart-handshake':'heart', 'shield-check':'shield', 'book-open':'book', 'notebook-pen':'journal', 'notebook':'journal', 'pen-line':'edit', 'hand-heart':'heart', 'life-buoy':'help', 'message-circle':'message', 'message-square':'message', 'badge-check':'check', 'arrow-up-right':'arrow', 'calendar-days':'calendar', 'alarm-clock':'clock', 'user-round':'user', 'graduation-cap':'school', 'refresh-cw':'history', 'circle-check':'check', 'house':'home', 'sparkles':'sparkle', 'chart-no-axes-column':'chart', 'triangle-alert':'flag', 'list-checks':'clipboard', 'eye-off':'eye', 'log-out':'logout' };

export function icon(name, size = 22) {
  return `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[aliases[name] || name] || shapes.sparkle}</svg>`;
}

export function esc(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

const subtitles = {
  new:'คำขอใหม่', submitted:'ส่งแล้ว', pending:'รอการตอบรับ', received:'รับคำขอแล้ว', accepted:'รับคำขอแล้ว',
  replied:'ตอบกลับแล้ว', talking:'กำลังพูดคุย', in_progress:'อยู่ระหว่างดูแล', appointment:'มีนัดหมาย',
  caring:'มีแผนดูแล', 'follow-up':'ติดตามผล', follow_up:'ติดตามผล', completed:'เสร็จสิ้น', closed:'ปิดการดูแล',
  referred:'ส่งต่อแล้ว', declined:'ปฏิเสธ', confirmed:'ยืนยันแล้ว', cancelled:'ยกเลิกแล้ว', scheduled:'นัดไว้แล้ว',
  resolved:'จัดการแล้ว', waiting:'รอดำเนินการ', requested:'รอยืนยัน', suggested:'เสนอเวลาใหม่', reopened:'เปิดการดูแลอีกครั้ง',
  active:'เปิดใช้งาน', archived:'เก็บถาวร', draft:'ฉบับร่าง', paused:'พักไว้',
};

export const statusLabel = status => subtitles[status] || String(status ?? '');
let user = null;
let route = null;
let toastTimer;
export const currentUser = () => user;
export function setUser(next) { user = next; }
export function setRoute(renderer) { route = renderer; }

export async function api(path, options = {}) {
  const method = options.method || (options.body == null ? 'GET' : 'POST');
  const config = { ...options, method, headers: { Accept:'application/json', ...options.headers } };
  if (options.body != null && typeof options.body !== 'string' && !(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(options.body);
  }
  let response;
  try {
    response = await fetch(path.startsWith('/api/') ? path : '/api' + path, config);
  } catch {
    throw new Error('เชื่อมต่อไม่ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || 'ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง');
    error.status = response.status;
    throw error;
  }
  if (method !== 'GET') window.dispatchEvent(new CustomEvent('mindbridge:updated'));
  return data;
}

export function navigate(path, { replace = false } = {}) {
  const destination = new URL(path, location.origin);
  if (destination.origin !== location.origin) return;
  history[replace ? 'replaceState' : 'pushState']({}, '', destination.pathname + destination.search + destination.hash);
  return route?.({ focus:true });
}

export const refresh = () => route?.({ focus:false });

export function toast(message) {
  const region = document.querySelector('#toast');
  region.innerHTML = `<div class="toast">${icon('check', 18)}<span>${esc(message)}</span></div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { region.textContent = ''; }, 4200);
}

export function pageIntro(eyebrow, title, desc, actions = '') {
  return `<header class="page-intro"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1>${desc ? `<p>${esc(desc)}</p>` : ''}</div>${actions}</header>`;
}

export function showDialog(title, html, onSubmit) {
  const dialog = document.querySelector('#dialog');
  if (dialog.open) dialog.close();
  dialog.innerHTML = `<div class="dialog-content"><div class="section-heading"><h2 id="dialog-title">${esc(title)}</h2><button class="icon-btn" type="button" data-dialog-close aria-label="ปิด">${icon('x')}</button></div>${onSubmit ? `<form class="stack">${html}<div class="dialog-error form-error" role="alert" hidden></div></form>` : html}</div>`;
  dialog.setAttribute('aria-labelledby','dialog-title');
  dialog.querySelector('[data-dialog-close]').onclick = () => dialog.close();
  dialog.showModal();
  if (onSubmit) dialog.querySelector('form').onsubmit = async event => {
    event.preventDefault();
    const button = event.submitter;
    const error = dialog.querySelector('.dialog-error');
    if (button) button.disabled = true;
    error.hidden = true;
    try {
      if (await onSubmit(new FormData(event.currentTarget), event) !== false) dialog.close();
    } catch (failure) {
      error.textContent = failure.message;
      error.hidden = false;
    } finally {
      if (button) button.disabled = false;
    }
  };
  return dialog;
}

export const brand = (path = '/') => `<a class="brand" href="${path}" aria-label="MindBridge หน้าหลัก"><img src="/assets/logo.svg" width="38" height="38" alt=""><span>MindBridge</span></a>`;
