import { brand, icon, esc } from './ui.js';

export const roles = {
  student: { title:'นักเรียน', icon:'smile', text:'พื้นที่สำหรับทำความเข้าใจความรู้สึกและขอความช่วยเหลือ', demo:'ทดลองใช้งานในฐานะนักเรียน', person:'ฟ้า · นักเรียน ม.5' },
  teacher: { title:'ครู', icon:'school', text:'พื้นที่สำหรับรับฟัง เข้าใจ และดูแลนักเรียน', demo:'ทดลองใช้งานในฐานะครู', person:'ครูพลอย · ครูแนะแนว' },
  admin: { title:'ผู้ดูแลโรงเรียน', icon:'shield', text:'จัดการบัญชี การยืนยันครู และสิทธิ์ระดับโรงเรียน', demo:'ทดลองใช้งานในฐานะผู้ดูแลโรงเรียน', person:'ฝ่ายดูแลระบบโรงเรียนสมมติ' },
};

const framework = [
  ['FEEL','สำรวจอารมณ์','heart','เลือกคำที่ใกล้กับความรู้สึกผ่านวงล้ออารมณ์','การตระหนักรู้ถึงอารมณ์','มีภาษาสำหรับอธิบายความรู้สึกของตน'],
  ['TRUST','เลือกความพร้อม','bridge','เปิด Trust Ladder และเลือกวิธีที่สบายใจ','การเปิดเผยตามความสมัครใจ','เริ่มต้นตามจังหวะของแต่ละคน'],
  ['EXPRESS','สื่อสารความรู้สึก','edit','เขียนบันทึก เลือกส่งสัญญาณ หรือส่งบางส่วน','การให้ผู้รับความช่วยเหลือเป็นศูนย์กลาง','มีวิธีสื่อสารหลายแบบ'],
  ['CONNECT','เชื่อมต่อกับครู','users','เลือกครูและช่องทางที่รู้สึกสบายใจ','พฤติกรรมการขอความช่วยเหลือ','ลดอุปสรรคในการเริ่มต้นติดต่อ'],
  ['SUPPORT','รับความช่วยเหลือ','headphones','ครูใช้คู่มือการรับฟัง ประสานแผนกับนักเรียน','การรับฟังอย่างตั้งใจและความเข้าอกเข้าใจ','ช่วยให้การสื่อสารเป็นรูปธรรม'],
  ['FOLLOW-UP','ติดตามผล','calendar','นัดติดตามความต้องการหรือประสานการส่งต่อ','ขอบเขตวิชาชีพและการดูแลต่อเนื่อง','การประสานงานที่ติดตามได้'],
];

const ladder = [
  ['FEEL','เข้าใจความรู้สึก','เลือกคำที่ตรงกับอารมณ์ของเธอ','heart'],
  ['REFLECT','ทบทวนเป็นส่วนตัว','เขียนหรือวาดเพื่อทบทวนในพื้นที่ส่วนตัว','journal'],
  ['SIGNAL','ส่งสัญญาณ','บอกครูว่าอยากได้ความช่วยเหลือ','signal'],
  ['EXPRESS','เลือกสิ่งที่อยากเล่า','ตรวจและเลือกข้อมูลที่พร้อมส่ง','message'],
  ['CONNECT','ติดต่อครูที่ไว้ใจ','เริ่มต้นพูดคุยหรือนัดหมาย','users'],
];

const features = [
  ['heart','ตั้งชื่อให้ความรู้สึก','วงล้ออารมณ์และการสำรวจรายวัน ช่วยให้เธอค่อย ๆ เข้าใจสิ่งที่เกิดขึ้นกับตัวเอง','lavender'],
  ['bridge','เปิดใจเท่าที่พร้อม','Trust Ladder ให้เลือกตั้งแต่ทบทวนส่วนตัว ไปจนถึงส่งสัญญาณหรือคุยกับครู','pink'],
  ['calendar','ดูแลกันอย่างต่อเนื่อง','ครูรับคำขอ ตอบกลับ นัดหมาย และติดตามได้ในพื้นที่เดียว','mint'],
];

const faqs = [
  ['ครูเห็นบันทึกส่วนตัวของฉันไหม?','บันทึกส่วนตัวอยู่ในบัญชีของนักเรียน นักเรียนตรวจดูและเลือกข้อมูลที่จะส่งในคำขอแต่ละครั้ง'],
  ['ยังไม่พร้อมเล่าเรื่อง ขอความช่วยเหลือได้ไหม?','ได้ เลือกส่งสัญญาณว่าอยากให้มีคนรับฟัง แล้วเลือกครูที่ไว้วางใจ รายละเอียดเพิ่มเติมข้ามได้'],
  ['จะทดลองกับข้อมูลแบบไหน?','เลือกบัญชีฟ้าหรือครูพลอยเพื่อทดลอง ระบบใช้ข้อมูลสมมติในพื้นที่สาธิตของเบราว์เซอร์'],
  ['จะทำอย่างไรหากต้องการความช่วยเหลือทันที?','ติดต่อผู้ใหญ่ที่ไว้วางใจหรือหน่วยงานฉุกเฉินโดยตรง ปุ่มความช่วยเหลือเร่งด่วนแสดงช่องทางติดต่อ'],
];

export function publicHeader(path) {
  return `<header class="site-header"><div class="site-nav container">
    ${brand()}<nav id="public-menu" aria-label="เมนูเว็บไซต์"><a href="/" ${path==='/'?'aria-current="page"':''}>หน้าหลัก</a><a href="/about">เกี่ยวกับเรา</a><a href="/#features">ฟีเจอร์</a><a href="/innovation">นวัตกรรม</a><a href="/privacy">ความปลอดภัย</a></nav>
    <div class="nav-actions"><a class="login-link" href="/login">เข้าสู่ระบบ</a><a class="btn btn-primary header-start" href="/register">เริ่มต้นใช้งาน</a><button class="icon-btn public-menu-toggle" type="button" aria-expanded="false" aria-controls="public-menu" data-public-menu aria-label="เมนู">${icon('menu')}</button></div>
  </div></header>`;
}

export function publicFooter() {
  return `<footer class="site-footer"><div class="container footer-inner"><div>${brand()}<p>ทุกความรู้สึกมีความหมาย ทุกเรื่องราวมีคนพร้อมรับฟัง</p></div><div class="footer-links"><a href="/innovation">นวัตกรรม</a><a href="/privacy">ความเป็นส่วนตัว</a><button data-urgent class="link-btn" type="button">ความช่วยเหลือเร่งด่วน</button></div><p class="footer-note">ต้นแบบประกวดนวัตกรรมทางการศึกษา 2570 · ใช้ข้อมูลสมมติในการสาธิต</p></div></footer>`;
}

function featureCards() {
  return features.map(([symbol,title,body,tone]) => `<article class="card feature-card"><span class="icon-tile ${tone}">${icon(symbol, 26)}</span><h3>${title}</h3><p>${body}</p></article>`).join('');
}

function ladderPreview() {
  return `<div class="public-ladder">${ladder.map(([en,th,copy,symbol])=>`<article><span class="icon-tile">${icon(symbol)}</span><div><small lang="en">${en}</small><h3>${th}</h3><p>${copy}</p></div></article>`).join('')}</div>`;
}

function landing() {
  return `<section class="landing-hero container">
    <div class="hero-copy">
      <p class="hero-kicker"><span></span> สะพานใจ เชื่อมครู เชื่อมนักเรียน</p>
      <h1>บางความรู้สึก<br>พูดออกมายาก<br><em>แต่ไม่จำเป็นต้อง<br>เก็บไว้คนเดียว</em></h1>
      <p class="hero-desc">MindBridge พื้นที่เชื่อมโยงความรู้สึกระหว่างนักเรียนกับครู เพื่อให้ทุกการขอความช่วยเหลือเริ่มต้นได้ง่ายขึ้น</p>
      <div class="hero-actions"><a class="btn btn-primary" href="/register">เริ่มต้นใช้งาน</a><a class="btn btn-secondary" href="/demo">${icon('play',16)} ทดลองใช้งานระบบ</a></div>
      <p class="hero-privacy">${icon('lock',16)} เริ่มต้นได้ตามความพร้อม ข้อมูลที่แชร์เลือกได้เอง</p>
    </div>
    <figure class="hero-figure"><img src="/assets/bridge.svg" alt="นักเรียนและครูหันเข้าหากันบนสะพานสีลาเวนเดอร์" width="690" height="540"><figcaption><span class="caption-heart">${icon('heart',18)}</span><span>ทุกเรื่องราวมีคนพร้อมรับฟัง</span></figcaption></figure>
  </section>
  <div class="landing-promise"><div class="container"><div>${icon('heart',20)} ทุกความรู้สึกมีความหมาย</div><div>${icon('shield',20)} เลือกสิ่งที่พร้อมแชร์</div><div>${icon('users',20)} เชื่อมต่อกับครูที่ไว้วางใจ</div></div></div>
  <section id="features" class="container content-section"><header class="section-lead"><span class="eyebrow">จากความรู้สึกสู่การดูแล</span><h2>การขอความช่วยเหลือ<br>เริ่มได้หลายแบบ</h2><p>ความกังวลว่าจะถูกตัดสินหรือความไม่แน่ใจว่าจะเริ่มคุยอย่างไร ทำให้เรื่องที่อยากเล่าค้างอยู่ในใจ MindBridge ช่วยให้นักเรียนเลือกก้าวแรกได้ด้วยตัวเอง</p></header><div class="grid-3">${featureCards()}</div></section>
  <section id="trust" class="container content-section ladder-section"><div class="ladder-panel"><header class="section-lead"><span class="eyebrow">นวัตกรรมหลัก</span><h2>Trust Ladder</h2><p>เปิดใจตามความพร้อมของตนเอง เลือกได้อย่างอิสระ ข้ามระดับได้ และหยุดเมื่อพร้อม</p></header>${ladderPreview()}</div></section>
  <section class="container content-section"><header class="section-lead"><span class="eyebrow">ประสบการณ์การใช้งาน</span><h2>พื้นที่ของนักเรียน<br>และพื้นที่ของคุณครู</h2></header><div class="grid-2">
    <article class="card feature-card"><span class="icon-tile pink">${icon('smile',26)}</span><h3>สำหรับนักเรียน</h3><p>สำรวจอารมณ์ เก็บบันทึกส่วนตัว และขอให้ครูรับฟังเท่าที่พร้อม</p><a class="btn btn-secondary" href="/login/student">เข้าสู่พื้นที่นักเรียน</a></article>
    <article class="card feature-card"><span class="icon-tile mint">${icon('school',26)}</span><h3>สำหรับครู</h3><p>รับคำขอ ฟังด้วยความเข้าใจ และติดตามเฉพาะนักเรียนที่มีสิทธิ์ดูแล</p><a class="btn btn-secondary" href="/login/teacher">เข้าสู่พื้นที่ครู</a></article>
  </div></section>
  <section class="container content-section faq-section"><header class="section-lead"><span class="eyebrow">ก่อนเริ่มต้น</span><h2>คำถามที่พบบ่อย</h2></header><div class="stack">${faqs.map(([title,copy])=>`<details class="card"><summary>${title}</summary><p>${copy}</p></details>`).join('')}</div></section>`;
}

function roleCard(role, isDemo = false) {
  const data = roles[role];
  return `<article class="card role-card"><span class="icon-tile ${role==='student'?'pink':role==='admin'?'mint':'lavender'}">${icon(data.icon, 27)}</span><h2>${data.title}</h2><p>${isDemo ? data.person : data.text}</p>${isDemo ? `<button type="button" class="btn btn-primary" data-demo-role="${role}">${data.demo}</button>` : `<a class="btn btn-primary" href="/login/${role}">เข้าสู่ระบบสำหรับ${data.title}</a>`}</article>`;
}

function loginChoice() {
  return `<div class="container access-page"><div class="access-heading"><span class="eyebrow">เข้าสู่ระบบ MindBridge</span><h1>เลือกบัญชีของเธอ</h1><p>ใช้ข้อมูลเข้าสู่ระบบที่โรงเรียนกำหนด หรือเลือกบัญชีสาธิตเพื่อทดลองได้ทันที</p></div><div class="grid-2">${roleCard('student')}${roleCard('teacher')}</div><div class="access-links"><a href="/demo">ทดลองใช้งานด้วยข้อมูลสมมติ</a><a href="/login/admin">เข้าสู่ระบบสำหรับผู้ดูแลโรงเรียน</a></div></div>`;
}

function loginForm(role) {
  const item = roles[role];
  return `<div class="container access-page access-narrow"><div class="card sign-in"><span class="icon-tile lavender">${icon(item.icon,27)}</span><div class="access-heading"><span class="eyebrow">ยินดีต้อนรับสู่ MindBridge</span><h1>เข้าสู่ระบบสำหรับ${item.title}</h1><p>${item.text}</p></div><form id="login-form" class="stack" data-role="${role}">
    <label class="field">${role==='student'?'รหัสนักเรียนหรืออีเมลโรงเรียน':'อีเมลโรงเรียน'}<input name="identifier" ${role==='student'?'type="text"':'type="email"'} autocomplete="username" required></label>
    <label class="field">รหัสผ่าน<input name="password" type="password" autocomplete="current-password" required></label>
    <div class="form-error" role="alert" hidden></div><button class="btn btn-primary" type="submit">เข้าสู่ระบบ</button></form>
    <div class="access-links">${role!=='admin'?`<a href="/register?role=${role}">สมัครสมาชิก</a>`:''}<button class="link-btn" type="button" data-recovery="${role}">ลืมรหัสผ่าน</button></div>
    ${role!=='admin'? `<button class="btn btn-secondary full-width" type="button" data-demo-role="${role}">${item.demo}</button>`:''}
    <a class="return-link" href="/">กลับหน้าหลัก</a></div></div>`;
}

function registerForm(role) {
  const teacher = role==='teacher';
  return `<div class="container access-page access-narrow"><div class="card sign-in"><span class="icon-tile lavender">${icon('school',26)}</span><div class="access-heading"><span class="eyebrow">เข้าร่วม MindBridge</span><h1>สมัครสมาชิก</h1><p>เตรียมรหัสเชิญของโรงเรียนก่อนเริ่มต้น ใช้ข้อมูลสมมติในเครื่องนี้</p></div><form id="register-form" class="stack">
    <label class="field">ประเภทบัญชี<select name="role" id="register-role"><option value="student" ${teacher?'':'selected'}>นักเรียน</option><option value="teacher" ${teacher?'selected':''}>ครู</option></select></label>
    <label class="field">ชื่อที่ต้องการให้แสดง<input name="name" autocomplete="name" maxlength="80" required></label>
    <label class="field">อีเมลโรงเรียน<input name="email" type="email" autocomplete="email" required></label>
    ${teacher?'':`<label class="field">รหัสนักเรียน<input name="studentCode" maxlength="40"></label>`}
    <label class="field">รหัสเชิญจากโรงเรียน<input name="inviteCode" required maxlength="80"></label>
    <label class="field">รหัสผ่านอย่างน้อย 10 ตัวอักษร<input name="password" type="password" minlength="10" autocomplete="new-password" required></label>
    <label class="check-field"><input name="consent" type="checkbox" required><span>ฉันเข้าใจว่าใครเห็นข้อมูลของฉัน และยินยอมทดลองใช้ด้วยข้อมูลสมมติ <a href="/privacy">อ่านวิธีดูแลข้อมูล</a></span></label>
    ${teacher?'<p>ผู้ดูแลโรงเรียนต้องตรวจสอบบัญชีก่อนเข้าถึงงานดูแลนักเรียน</p>':''}<div class="form-error" role="alert" hidden></div><button class="btn btn-primary" type="submit">สมัครสมาชิก</button></form><div class="access-links"><a href="/login">เข้าสู่ระบบ</a><a href="/demo">ใช้บัญชีสาธิต</a></div></div></div>`;
}

function demoPage() {
  return `<div class="container access-page demo-page"><div class="access-heading"><span class="eyebrow">การสาธิตด้วยข้อมูลสมมติ</span><h1>ลองใช้สะพานใจ</h1><p>เริ่มจากบัญชีนักเรียน แล้วสลับเป็นครูเพื่อรับคำขอจากพื้นที่สาธิตเดียวกัน</p><button class="btn btn-primary" type="button" data-demo-start>${icon('play',18)} เริ่มการสาธิต</button></div><div class="grid-2">${roleCard('student',true)}${roleCard('teacher',true)}</div><details class="card demo-admin"><summary>ตัวเลือกผู้ดูแลโรงเรียน</summary>${roleCard('admin',true)}</details></div>`;
}

function frameworkPanel() {
  return `<div class="framework-panel card"><div class="framework-bridge" aria-label="แนวคิดทั้งหก">${framework.map(([en,th,symbol],i)=>`<button class="framework-node" type="button" data-framework="${i}" aria-pressed="${i===0}"><span class="icon-tile">${icon(symbol)}</span><small lang="en">${en}</small><strong>${th}</strong></button>`).join('')}</div><div id="framework-detail" class="framework-detail">${frameworkDetail(0)}</div></div>`;
}

function frameworkPage() {
  return `<article class="container content-section case-study"><header class="section-lead"><span class="eyebrow">วิธีการทำงาน</span><h1>MindBridge Framework</h1><p>เลือกแต่ละจุดบนสะพานเพื่อดูหน้าที่ ฟีเจอร์ และแนวคิดที่ใช้ในการออกแบบ กรอบนี้เป็นข้อเสนอของโครงงานสำหรับบริบทสถานศึกษา</p></header>${frameworkPanel()}<div class="case-part"><a class="btn btn-secondary" href="/innovation">กลับไปที่ภาพรวมนวัตกรรม</a></div></article>`;
}

export function frameworkDetail(index) {
  const [en,th,,feature,concept,benefit] = framework[index] || framework[0];
  return `<div><span class="eyebrow" lang="en">${en}</span><h3>${th}</h3><p>${feature}</p></div><div><strong>หลักจิตวิทยาที่ประยุกต์ใช้</strong><p>${concept}</p><strong>ประโยชน์ที่คาดหวัง</strong><p>${benefit}</p></div>`;
}

function innovation() {
  return `<article class="container content-section case-study"><header class="section-lead">
    <span class="eyebrow">โครงงานนวัตกรรมทางการศึกษา</span><h1>รู้จักนวัตกรรม<br><em>MindBridge</em></h1><p>นักเรียนบางคนอยากให้ครูช่วย แต่ยังไม่พร้อมอธิบายปัญหาทั้งหมด ครูอาจไม่รู้ว่าควรเริ่มเข้าหานักเรียนคนไหน MindBridge ออกแบบก้าวแรกของการขอความช่วยเหลือให้เลือกได้ตามความพร้อม</p>
  </header><div class="grid-3">${featureCards()}</div>
  <section class="case-part"><header class="section-lead"><span class="eyebrow">วิธีการทำงาน</span><h2>MindBridge Framework</h2><p>กรอบการออกแบบที่โครงงานเสนอสำหรับบริบทสถานศึกษา ยังไม่มีการรับรองความใช้ได้เชิงคลินิก</p></header>${frameworkPanel()}<p class="case-link"><a href="/framework">เปิดหน้ากรอบการทำงาน</a></p></section>
  <section class="case-part ladder-panel"><header class="section-lead"><span class="eyebrow">ความใหม่ของนวัตกรรม</span><h2>Trust Ladder</h2><p>เลือกอย่างอิสระ ข้ามระดับได้ และไม่จำเป็นต้องเปิดเผยทุกเรื่อง ตัวเลือกมีความสำคัญเท่าเทียมกัน</p></header>${ladderPreview()}</section>
  <section class="case-part grid-2">
    <article class="card feature-card"><span class="icon-tile lavender">${icon('message')}</span><h3>เปรียบเทียบกับแอปสนทนาทั่วไป</h3><p>แอปสนทนาทั่วไปเริ่มจากการพิมพ์ข้อความ MindBridge เพิ่มการส่งสัญญาณสั้น ๆ การเลือกครู การตรวจข้อมูลก่อนส่ง และการนัดติดตาม</p></article>
    <article class="card feature-card"><span class="icon-tile mint">${icon('school')}</span><h3>การใช้ประโยชน์ในสถานศึกษา</h3><p>นักเรียนเลือกวิธีเริ่มสื่อสาร ครูแนะแนวติดตามคำขอในขอบเขตสิทธิ์ โรงเรียนสามารถทดลองใช้เป็นช่องทางเสริมของระบบดูแลนักเรียน</p></article>
    <article class="card feature-card"><span class="icon-tile pink">${icon('clipboard')}</span><h3>แผนการประเมิน</h3><p>เสนอทดสอบการใช้งาน วัดการทำงานสำเร็จและเวลาส่งคำขอ เก็บแบบสอบถามความเต็มใจก่อนและหลัง และสัมภาษณ์ครูเกี่ยวกับการติดตามผล</p></article>
    <article class="card feature-card"><span class="icon-tile lavender">${icon('bridge')}</span><h3>การต่อยอด</h3><p>สำรวจรูปแบบสมาชิกหรือสิทธิ์ใช้งานสำหรับสถานศึกษา การอบรมครู และความร่วมมือกับหน่วยงานการศึกษา โดยคุ้มครองข้อมูลส่วนบุคคลของนักเรียน</p></article>
  </section><section class="case-part card feature-card"><h2>เอกสารอ้างอิงโครงงาน</h2><p>พื้นที่สำหรับเพิ่มรายการอ้างอิงทางวิชาการที่ตรวจสอบแล้ว</p><a href="/privacy">รายละเอียดความปลอดภัยและจริยธรรม</a></section>
  <div class="case-part"><a class="btn btn-primary" href="/demo">ทดลองดูขั้นตอนการช่วยเหลือ</a></div></article>`;
}

function policy() {
  return `<article class="container content-section case-study legal-page"><header class="section-lead"><span class="eyebrow">ความปลอดภัยและจริยธรรม</span><h1>ข้อมูลของเธอ<br>เลือกเองได้</h1><p>ก่อนส่งคำขอ ระบบจะแสดงข้อมูลและครูผู้รับ เพื่อให้เธอตรวจดูและแก้ไขได้</p></header>
  <div class="grid-2">
  <section class="card feature-card"><span class="icon-tile lavender">${icon('lock')}</span><h2>พื้นที่ส่วนตัว</h2><p>บันทึกและอารมณ์ที่เก็บไว้เป็นส่วนตัวเปิดได้จากบัญชีเจ้าของ นักเรียนเลือกข้อความที่พร้อมส่งให้ครูในแต่ละครั้ง</p></section>
  <section class="card feature-card"><span class="icon-tile mint">${icon('users')}</span><h2>ขอบเขตของผู้ดูแล</h2><p>ครูเห็นข้อมูลของนักเรียนเฉพาะตามสิทธิ์และเมื่อมีคำขอที่เกี่ยวข้อง ผู้ดูแลโรงเรียนจัดการบัญชีและสิทธิ์โดยแยกจากข้อความส่วนตัว</p></section>
  <section class="card feature-card"><span class="icon-tile pink">${icon('flag')}</span><h2>เมื่อเกิดความกังวล</h2><p>แจ้งเรื่องผ่านการตั้งค่า หรือติดต่อผู้ใหญ่ที่ไว้ใจได้ ครูอาจประสานผู้รับผิดชอบตามขั้นตอนของโรงเรียนหากมีเหตุด้านความปลอดภัย</p></section>
  <section class="card feature-card"><span class="icon-tile lavender">${icon('heart')}</span><h2>ขอบเขตของต้นแบบ</h2><p>MindBridge ใช้สำหรับสื่อสารและสนับสนุนการดูแล เครื่องมือนี้ไม่มีการวินิจฉัยหรือรักษาทางจิตเวช พื้นที่สาธิตใช้ข้อมูลสมมติเท่านั้น</p></section>
  </div><div class="case-part"><button class="btn btn-secondary" type="button" data-urgent>${icon('phone',18)} ต้องการความช่วยเหลือเร่งด่วน</button></div></article>`;
}

function about() {
  return `<article class="container content-section case-study"><header class="section-lead"><span class="eyebrow">เกี่ยวกับโครงงาน</span><h1>สะพานใจ เชื่อมครู<br>เชื่อมนักเรียน</h1><p>ทุกความรู้สึกมีความหมาย ทุกเรื่องราวมีคนพร้อมรับฟัง</p></header><div class="grid-2 about-content"><div class="card feature-card"><h2>ที่มาและวัตถุประสงค์</h2><p>MindBridge เกิดจากแนวคิดว่าการเริ่มต้นสื่อสารเป็นส่วนสำคัญของการขอความช่วยเหลือ โครงงานมุ่งส่งเสริมการเข้าใจอารมณ์ ลดอุปสรรคในการเริ่มคุย และเพิ่มทางเลือกในการรับฟังและติดตามในโรงเรียน</p><a class="btn btn-secondary" href="/innovation">รู้จักนวัตกรรม</a></div><img width="690" height="540" src="/assets/bridge.svg" alt="ภาพประกอบสะพานใจ"></div></article>`;
}

export function renderPublic(path) {
  if (path === '/') return landing();
  if (path === '/login') return loginChoice();
  if (path.startsWith('/login/')) {
    const role = path.split('/')[2];
    if (Object.hasOwn(roles,role)) return loginForm(role);
  }
  if (path === '/register') return registerForm(new URLSearchParams(location.search).get('role'));
  if (path === '/demo') return demoPage();
  if (path === '/innovation') return innovation();
  if (path === '/framework') return frameworkPage();
  if (path === '/privacy') return policy();
  if (path === '/about') return about();
  return `<div class="container access-page"><div class="card"><h1>ไม่พบหน้านี้</h1><p>ตรวจสอบลิงก์ ${esc(path)} หรือกลับไปหน้าหลัก</p><a class="btn btn-primary" href="/">กลับหน้าหลัก</a></div></div>`;
}
