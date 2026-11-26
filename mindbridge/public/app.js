import { api, brand, currentUser, esc, icon, navigate, refresh, setRoute, setUser, showDialog, toast } from './ui.js';
import { frameworkDetail, publicFooter, publicHeader, renderPublic, roles } from './public-pages.js';

const app = document.querySelector('#app');
const guide = document.querySelector('#demo-guide');
const navigation = {
  student: [
    ['dashboard','home','หน้าหลัก'], ['emotions','smile','อารมณ์ของฉัน'], ['emotion-wheel','compass','วงล้ออารมณ์'],
    ['journal','journal','บันทึกส่วนตัว'], ['trust-ladder','bridge','สะพานใจ'], ['support','heart','ขอความช่วยเหลือ'],
    ['messages','message','ข้อความ'], ['appointments','calendar','นัดหมาย'], ['wellness','leaf','กิจกรรมดูแลใจ'],
    ['journey','history','เส้นทางการดูแล'], ['settings','settings','ตั้งค่า'],
  ],
  teacher: [
    ['dashboard','grid','ภาพรวม'], ['requests','inbox','คำขอความช่วยเหลือ'], ['students','users','นักเรียนในความดูแล'],
    ['messages','message','ข้อความ'], ['appointments','calendar','นัดหมาย'], ['support','heart','แผนการดูแล'],
    ['follow-ups','history','ติดตามผล'], ['toolkit','book','คู่มือการรับฟัง'], ['referrals','link','ส่งต่อผู้เชี่ยวชาญ'],
    ['reports','chart','รายงาน'], ['settings','settings','ตั้งค่า'],
  ],
  admin: [
    ['dashboard','grid','ภาพรวม'], ['users','users','จัดการบัญชี'], ['schools','school','โรงเรียน'],
    ['permissions','shield','สิทธิ์การเข้าถึง'], ['audit-logs','clipboard','ประวัติการเข้าถึง'],
  ],
};

const mobileNavigation = {
  student: [['dashboard','home','หน้าหลัก'],['emotions','smile','อารมณ์'],['support','heart','ขอความช่วยเหลือ'],['messages','message','ข้อความ'],['settings','user','โปรไฟล์']],
  teacher: [navigation.teacher[0], ['requests','inbox','คำขอ'], ['messages','message','ข้อความ'], ['appointments','calendar','นัดหมาย'], ['settings','user','โปรไฟล์']],
  admin: navigation.admin.slice(0,4),
};

const demoStages = [
  { role:'student', path:'emotions', title:'สำรวจอารมณ์', description:'ลองเลือก “เครียด” และ “กังวล” แล้วบันทึกความรู้สึกวันนี้' },
  { role:'student', path:'emotion-wheel', title:'ค้นคำที่ตรงกับความรู้สึก', description:'เลือกกลุ่มอารมณ์ในวงล้อ แล้วสำรวจคำที่เจาะจงขึ้น' },
  { role:'student', path:'trust-ladder', title:'เลือกส่งสัญญาณ', description:'เลือก SIGNAL เพื่อบอกครูว่าอยากได้รับความช่วยเหลือ' },
  { role:'student', path:'support', title:'ส่งคำขอให้ครูพลอย', description:'เลือก “อยากให้มีคนรับฟัง” และครูพลอย จากนั้นตรวจข้อมูลก่อนกดส่ง' },
  { role:'teacher', path:'requests', title:'รับคำขอในบัญชีครู', description:'เปิดคำขอของฟ้าแล้วกดรับคำขอ' },
  { role:'teacher', path:'toolkit', title:'เตรียมคำตอบด้วยคู่มือการรับฟัง', description:'เลือกตัวอย่างประโยคที่จะใช้กับนักเรียน' },
  { role:'teacher', path:'messages', title:'ตอบกลับฟ้า', description:'เปิดบทสนทนาของฟ้า เขียนข้อความแล้วกดส่ง' },
  { role:'student', path:'messages', title:'อ่านคำตอบของครู', description:'กลับมาเปิดกล่องข้อความของฟ้า แล้วตอบกลับหากต้องการ' },
  { role:'student', path:'appointments', title:'ขอนัดคุยกับครูพลอย', description:'เลือกวันและเวลาที่สะดวก แล้วส่งคำขอนัดหมาย' },
  { role:'teacher', path:'appointments', title:'ยืนยันการนัดหมาย', description:'เปิดนัดหมายของฟ้าแล้วกดยืนยัน' },
  { role:'teacher', path:'follow-ups', title:'สร้างรายการติดตามผล', description:'ผูกการติดตามกับคำขอของฟ้าและระบุวันติดตาม' },
  { role:'student', path:'journey', title:'ดูเส้นทางการดูแล', description:'ตรวจว่าคำตอบ นัดหมาย และการติดตามแสดงอยู่ในเส้นทางเดียวกัน' },
];

let demoIndex = sessionStorage.getItem('mindbridge:guide') == null ? null : Number(sessionStorage.getItem('mindbridge:guide'));
if (!demoStages[demoIndex] || demoIndex === null) demoIndex = null;
let renderCount = 0;
let unread = 0;
let notifications = [];
const privatePath = () => /^\/(student|teacher|admin)(\/|$)/.test(location.pathname);

function locationAfterAuth(user) {
  return '/' + user.role + '/dashboard';
}

function applyPreferences(user) {
  document.documentElement.classList.toggle('larger-text',Boolean(user?.settings?.largerText));
  document.documentElement.classList.toggle('reduced-motion',Boolean(user?.settings?.reducedMotion));
}

function menuLinks(role, items, path) {
  return items.map(([id,symbol,title])=>{
    const target = '/' + role + '/' + id;
    const active = path === target || path.startsWith(target + '/');
    return `<a href="${target}" ${active?'aria-current="page"':''}>${icon(symbol,19)}<span>${title}</span></a>`;
  }).join('');
}

function shell(user, path, html) {
  const role = user.role;
  const title = roles[role].title;
  const currentPage = navigation[role].find(([key])=>path.split('/')[2]===key)?.[2] || 'หน้าหลัก';
  const badge = unread > 9 ? '9+' : unread;
  return `<div class="app-layout" data-role="${role}">
    <aside class="sidebar" id="workspace-nav">${brand(locationAfterAuth(user))}
      <div class="workspace-label"><span class="workspace-icon">${icon(roles[role].icon,19)}</span><div><strong>พื้นที่${title}</strong><small>${user.demo?'โรงเรียนสาธิตสมมติ':'บัญชีโรงเรียน'}</small></div></div>
      <nav aria-label="เมนู${title}">${menuLinks(role,navigation[role],path)}</nav>
      <div class="sidebar-bottom"><button type="button" class="urgent-btn" data-urgent>${icon('phone',17)} ต้องการความช่วยเหลือเร่งด่วน</button><button class="sidebar-signout" type="button" data-logout>${icon('logout',17)} ออกจากระบบ</button></div>
    </aside>
    <div class="app-main">
      <header class="workspace-top">
        <div class="workspace-top-left"><button class="icon-btn sidebar-toggle" type="button" data-sidebar-toggle aria-label="ย่อหรือขยายเมนู" aria-expanded="${!matchMedia('(max-width: 800px)').matches}" aria-controls="workspace-nav">${icon('menu',20)}</button><span class="workspace-breadcrumb"><span>พื้นที่${title}</span><span class="crumb-sep">/</span><strong>${esc(currentPage)}</strong></span><div class="mobile-brand">${brand(locationAfterAuth(user))}</div></div>
        <div class="workspace-actions">${user.demo ? `<button class="demo-chip" type="button" data-switch aria-label="สลับบัญชีสาธิต">${icon('history',16)}<span>สลับบัญชีสาธิต</span></button>` : ''}
          <button class="icon-btn mobile-urgent" type="button" data-urgent aria-label="ต้องการความช่วยเหลือเร่งด่วน">${icon('phone',19)}</button>
          <button class="icon-btn bell-btn" type="button" data-notifications aria-label="การแจ้งเตือน${badge?' '+badge+' รายการ':''}">${icon('bell',21)}<span id="notification-count" class="notification-count" ${badge?'':'hidden'}>${badge}</span></button>
          <a class="profile-chip" href="/${role}/${role==='admin'?'users':'settings'}"><span class="avatar">${esc([...user.name][0] || 'ม')}</span><span>${esc(user.name)}</span></a>
        </div>
      </header>
      <main class="workspace-content" id="main" tabindex="-1">${html}</main>
    </div>
    <nav class="mobile-bottom" aria-label="เมนูหลัก">${menuLinks(role,mobileNavigation[role],path)}</nav>
    <button type="button" class="sidebar-shade" data-sidebar-toggle aria-label="ปิดเมนู" hidden></button>
  </div>`;
}

function pageError(message) {
  return `<div class="card page-error"><span class="icon-tile lavender">${icon('help')}</span><h1>เปิดหน้านี้ไม่ได้</h1><p>${esc(message)}</p><button type="button" class="btn btn-secondary" data-retry>ลองใหม่</button></div>`;
}

async function render({ focus = false } = {}) {
  const id = ++renderCount;
  const path = location.pathname.replace(/\/+$/,'') || '/';
  const role = path.split('/')[1];
  let module;
  let main;
  const privatePage = Object.hasOwn(navigation,role);
  const modulePath = role === 'student' ? path : path + location.search;
  if (privatePage) {
    const user = currentUser();
    if (!user) return navigate('/login/' + role, { replace:true });
    if (user.role !== role) return navigate(locationAfterAuth(user), { replace:true });
    try {
      module = role === 'student' ? await import('./student.js') : await import('./teacher.js');
      const renderer = role === 'student' ? module.renderStudent : role === 'teacher' ? module.renderTeacher : module.renderAdmin;
      main = await renderer(modulePath);
    } catch (error) {
      if (error.status === 401) {
        setUser(null);
        return navigate('/login/' + role, { replace:true });
      }
      console.error(error);
      main = pageError(error.message);
    }
  } else {
    main = renderPublic(path);
  }
  if (id !== renderCount) return;
  app.innerHTML = privatePage ? shell(currentUser(),path,main) : publicHeader(path) + `<main id="main" tabindex="-1">${main}</main>` + publicFooter();
  document.body.classList.toggle('workspace-body',privatePage);
  applyPreferences(privatePage ? currentUser() : null);
  document.title = (privatePage ? navigation[role].find(([key])=>path.split('/')[2]===key)?.[2] + ' · ' : '') + 'MindBridge · สะพานใจ';
  if (privatePage && module) {
    try {
      const binder = role === 'student' ? module.bindStudent : role === 'teacher' ? module.bindTeacher : module.bindAdmin;
      await binder?.(modulePath);
    } catch (error) {
      console.error(error);
      toast(error.message);
    }
  }
  bindPublicForms();
  updateGuide();
  if (privatePage) void readNotifications();
  if (focus) {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else {
      window.scrollTo({ top:0, behavior:'instant' });
      document.querySelector('#main')?.focus({ preventScroll:true });
    }
  }
}
setRoute(render);

function bindPublicForms() {
  function bind(id, submit) {
    const form = document.querySelector(id);
    if (!form) return;
    form.onsubmit = async event => {
      event.preventDefault();
      const button = event.submitter;
      const feedback = form.querySelector('.form-error');
      feedback.hidden = true;
      button.disabled = true;
      try {
        await submit(Object.fromEntries(new FormData(form)), form);
      } catch (error) {
        feedback.textContent = error.message;
        feedback.hidden = false;
      } finally {
        button.disabled = false;
      }
    };
  }
  bind('#login-form', async (values,form) => {
    const { user } = await api('/login',{ body:{...values,role:form.dataset.role} });
    setUser(user);
    await navigate(locationAfterAuth(user));
  });
  bind('#register-form', async values => {
    const { user } = await api('/register',{ body:{...values,consent:values.consent==='on'} });
    if (user?.verified || user?.role === 'student') {
      setUser(user);
      await navigate(locationAfterAuth(user));
    } else {
      await navigate('/login/teacher');
      toast('ส่งข้อมูลสมัครแล้ว รอให้โรงเรียนตรวจสอบบัญชี');
    }
  });
  document.querySelector('#register-role')?.addEventListener('change', event => {
    const form = event.target.form;
    const field = form.querySelector('[name="studentCode"]')?.closest('label');
    if (event.target.value === 'teacher') field?.remove();
    else if (!field) form.querySelector('[name="email"]').closest('label').insertAdjacentHTML('afterend','<label class="field">รหัสนักเรียน<input name="studentCode" maxlength="40"></label>');
    history.replaceState({},'', '/register?role=' + event.target.value);
  });
}

async function demoLogin(role, reset = false, target = '') {
  const { user } = await api('/demo', { body:{ role, reset } });
  setUser(user);
  unread = 0;
  notifications = [];
  document.querySelector('#dialog').close();
  await navigate(target || locationAfterAuth(user));
}

function setGuide(index) {
  demoIndex = index;
  if (index == null) sessionStorage.removeItem('mindbridge:guide');
  else sessionStorage.setItem('mindbridge:guide',String(index));
  updateGuide();
}

function updateGuide() {
  const stage = demoStages[demoIndex];
  const inDemo = stage && currentUser()?.demo && /^\/(student|teacher|admin)\//.test(location.pathname);
  document.body.classList.toggle('has-guide',!!inDemo);
  guide.innerHTML = inDemo ? `<aside class="demo-guide" aria-label="คู่มือสาธิต">
    <div><span class="eyebrow">การสาธิต ${demoIndex+1}/${demoStages.length}</span><strong>${stage.title}</strong><p>${stage.description}</p></div>
    <div class="guide-actions"><button class="btn btn-secondary" type="button" data-demo-step="-1" ${demoIndex===0?'disabled':''}>ย้อนกลับ</button><button class="btn btn-primary" type="button" data-demo-step="1">${demoIndex===demoStages.length-1?'จบการสาธิต':'ขั้นตอนถัดไป'}</button><button class="icon-btn" type="button" data-close-guide aria-label="ซ่อนคู่มือสาธิต">${icon('x',19)}</button></div>
  </aside>` : '';
}

async function goToDemoStep(index, reset = false) {
  if (index >= demoStages.length) { setGuide(null); return toast('จบการสาธิต'); }
  const stage = demoStages[index];
  if (!stage) return;
  setGuide(index);
  const path = '/' + stage.role + '/' + stage.path;
  if (currentUser()?.role !== stage.role || !currentUser()?.demo || reset) await demoLogin(stage.role, reset, path);
  else {
    document.querySelector('#dialog').close();
    await navigate(path);
  }
}

async function readNotifications(force = false) {
  const user = currentUser();
  if (!user || !privatePath() || document.visibilityState==='hidden' && !force) return;
  try {
    const result = await api('/notifications');
    if (user.id !== currentUser()?.id) return;
    notifications = result.items || result.notifications || [];
    unread = notifications.filter(item=>!(item.readAt || item.read_at || item.read)).length;
    const count = document.querySelector('#notification-count');
    if (count) {
      count.hidden = !unread;
      count.textContent = unread > 9 ? '9+' : unread;
      count.parentElement.setAttribute('aria-label','การแจ้งเตือน' + (unread?' '+unread+' รายการ':''));
    }
  } catch (error) {
    if (force) toast('โหลดการแจ้งเตือนไม่สำเร็จ');
  }
}

function notificationDialog() {
  const rows = notifications.map(item=>{
    const read = item.readAt || item.read_at || item.read;
    return `<div class="notification-row"><span class="icon-tile lavender">${icon('bell',18)}</span><div><strong>${esc(item.title || item.message || item.text || 'มีการอัปเดตในพื้นที่ดูแล')}</strong><small>${esc(item.createdAt ? new Date(item.createdAt).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'}) : '')}</small></div>${read?'':`<button type="button" class="link-btn" data-notification-read="${esc(item.id)}">อ่านแล้ว</button>`}</div>`;
  }).join('');
  showDialog('การแจ้งเตือน', `<div class="stack">${rows || '<p>ยังไม่มีการแจ้งเตือนใหม่</p>'}${unread?`<button class="btn btn-secondary" type="button" data-notification-read="all">ทำเครื่องหมายว่าอ่านทั้งหมด</button>`:''}</div>`);
}

function showUrgent() {
  showDialog('ต้องการความช่วยเหลือเร่งด่วน', `<div class="stack urgent-dialog"><p>MindBridge ไม่ใช่บริการฉุกเฉิน และไม่มีเจ้าหน้าที่เฝ้าระวังตลอด 24 ชั่วโมง หากกำลังตกอยู่ในอันตราย ควรติดต่อผู้ใหญ่ที่ไว้วางใจหรือหน่วยงานฉุกเฉินโดยตรง</p><ul><li>ติดต่อผู้ใหญ่ที่ไว้วางใจ</li><li>ติดต่อครูแนะแนวหรือผู้รับผิดชอบของโรงเรียน</li></ul><a class="btn btn-secondary" href="tel:1323?oai_link_source=model_response_hotline">${icon('phone',18)} สายด่วนสุขภาพจิต 1323</a><a class="btn btn-secondary" href="tel:1669">${icon('phone',18)} เหตุฉุกเฉินทางการแพทย์ 1669</a></div>`);
}

document.addEventListener('click', async event => {
  if (!(event.target instanceof Element)) return;
  const element = event.target.closest('button, a');
  if (!element || event.defaultPrevented) return;
  const data = element.dataset;
  try {
    if (data.publicMenu !== undefined) {
      const open = document.querySelector('.site-nav').classList.toggle('menu-open');
      element.setAttribute('aria-expanded', String(open));
    } else if (data.sidebarToggle !== undefined) {
      const layout = document.querySelector('.app-layout');
      const toggle = layout.querySelector('.sidebar-toggle');
      const mobile = matchMedia('(max-width: 800px)').matches;
      const open = mobile ? layout.classList.toggle('sidebar-open') : !layout.classList.toggle('sidebar-collapsed');
      toggle.setAttribute('aria-expanded',String(open));
      layout.querySelector('.sidebar-shade').hidden = !mobile || !open;
    } else if (data.urgent !== undefined) showUrgent();
    else if (data.recovery) {
      showDialog('ลืมรหัสผ่าน', `<p>ติดต่อผู้ดูแลโรงเรียนเพื่อยืนยันตัวตนและขอรหัสผ่านใหม่</p><label class="field">อีเมลหรือรหัสนักเรียน<input required name="identifier"></label><button type="submit" class="btn btn-primary">ตรวจสอบทางเลือก</button>`, async form => {
        await api('/recover',{ body:{ identifier:form.get('identifier'), role:data.recovery } });
        toast('โปรดติดต่อผู้ดูแลโรงเรียนเพื่อกู้คืนบัญชี');
      });
    } else if (data.demoRole) {
      element.disabled = true;
      try { await demoLogin(data.demoRole); } finally { element.disabled = false; }
    } else if (data.demoStart !== undefined) await goToDemoStep(0);
    else if (data.demoReset !== undefined) {
      document.querySelector('#dialog').close();
      showDialog('เริ่มการสาธิตใหม่', `<p>ล้างคำขอและบันทึกในพื้นที่สาธิตนี้แล้วเริ่มใหม่หรือไม่?</p><button type="submit" class="btn btn-primary">ยืนยันการเริ่มใหม่</button>`, async () => { await goToDemoStep(0,true); });
    } else if (data.demoStep) await goToDemoStep(demoIndex + Number(data.demoStep));
    else if (data.closeGuide !== undefined) setGuide(null);
    else if (data.switch !== undefined) {
      const role = currentUser()?.role;
      showDialog('สลับบัญชีสาธิต', `<div class="stack"><p>คำขอและข้อความจะอยู่ในพื้นที่สาธิตเดิม</p>${Object.entries(roles).filter(([key])=>key!==role).map(([key,value])=>`<button class="btn btn-secondary" type="button" data-demo-role="${key}">${icon(value.icon,18)} สลับเป็น${value.title}</button>`).join('')}<button class="btn btn-secondary" type="button" data-demo-start>เริ่มการสาธิต</button><button class="link-btn" type="button" data-demo-reset>เริ่มการสาธิตใหม่</button></div>`);
    } else if (data.logout !== undefined) {
      await api('/logout',{ method:'POST' });
      setUser(null);
      setGuide(null);
      await navigate('/');
    } else if (data.notifications !== undefined) {
      await readNotifications(true);
      notificationDialog();
    } else if (data.notificationRead) {
      await api('/notifications/' + data.notificationRead,{ method:'PATCH',body:{ read:true } });
      await readNotifications(true);
      notificationDialog();
    } else if (data.framework !== undefined) {
      for (const item of document.querySelectorAll('[data-framework]')) item.setAttribute('aria-pressed',String(item===element));
      document.querySelector('#framework-detail').innerHTML = frameworkDetail(Number(data.framework));
    } else if (data.retry !== undefined) await refresh();
    else if (element instanceof HTMLAnchorElement && element.origin === location.origin && element.href.startsWith(location.origin + '/') && !element.download && !element.target && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      if (element.classList.contains('skip')) return;
      event.preventDefault();
      await navigate(element.pathname + element.search + element.hash);
    }
  } catch (error) {
    toast(error.message);
  }
});

addEventListener('popstate', () => { void render({ focus:true }); });
addEventListener('mindbridge:updated', async () => {
  const previous = currentUser();
  if (!previous || !privatePath()) return;
  void readNotifications();
  try {
    const { user } = await api('/session');
    if (user?.id === previous.id && currentUser()?.id === previous.id) {
      setUser(user);
      applyPreferences(user);
    }
  } catch { /* A temporary failure leaves the current preferences in place. */ }
});
addEventListener('visibilitychange', () => { if (document.visibilityState==='visible') void readNotifications(); });
setInterval(() => { void readNotifications(); }, 8000);

try {
  const session = await api('/session');
  setUser(session.user);
} catch { setUser(null); }
await render({ focus:!!location.hash });
