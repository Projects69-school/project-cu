# MindBridge · สะพานใจ เชื่อมครู เชื่อมนักเรียน

MindBridge is a Thai-language school support prototype for the 2570 educational innovation competition. Students can start with a private check-in, choose what to share through Trust Ladder, and contact a teacher. The teacher can reply, arrange an appointment, and record a follow-up. Both roles see their permitted parts of the same workflow.

## Run locally

Use Node.js 24 or later. The runtime has no npm dependencies, and the local demo needs no external accounts.

```sh
cd mindbridge
node --env-file-if-exists=.env server.mjs
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Use `node --watch --env-file-if-exists=.env server.mjs` for live development. The server binds only to loopback by default. The local service initializes and migrates its SQLite database on startup.

## Three-minute competition demo

1. Open [การสาธิต](http://127.0.0.1:4173/demo) and choose **เริ่มการสาธิต** to follow the guide, or enter **ทดลองใช้งานในฐานะนักเรียน** for the dashboard.
2. As **ฟ้า**, record เครียด and กังวล, explore the emotion wheel, and open **สะพานใจ**. Choose **SIGNAL**, select **อยากให้มีคนรับฟัง** and **ครูพลอย**, skip any optional explanation, review the shared information, and send.
3. Use **สลับบัญชีสาธิต** to become **ครูพลอย**. Open the request, accept it, then write and send a reply. The teacher toolkit offers editable example phrases.
4. Switch back to **ฟ้า**, read the reply and request a time under **นัดหมาย**. Switch to the teacher and confirm the booking. Add a follow-up under **ติดตามผล**.
5. Switch to **ฟ้า** and open **เส้นทางการดูแล** to see the updated timeline. Use **เริ่มการสาธิตใหม่** in the account switcher to replace the browser's demo data with a clean fictional workspace.

Demo personas are seeded automatically and isolated by a browser session cookie. The demo admin is under **ตัวเลือกผู้ดูแลโรงเรียน** on the demo page. A separate browser profile or private window starts a separate demo workspace.

## Structure

| Path | Role |
| --- | --- |
| `public/` | Thai browser interface, route shell, original SVG assets, and local Noto Sans Thai font |
| `public/student*.js` | Student dashboard, emotions, wheel, journal, Trust Ladder and coordination tools |
| `public/teacher.js` | Teacher and school administrator interfaces |
| `server.mjs`, `api.mjs` | HTTP routes, cookie sessions, server-side authorization and input validation |
| `db/001-initial.sql`, `db/store.mjs` | SQLite schema, transactional updates and fictional seed workspace |
| `tests/` | API integration and Playwright browser tests |
| `docs/screenshots/` | Fictional user screenshots captured from the running website |

The application uses Node HTTP and SQLite for a self-contained demo. The browser UI uses native ES modules, CSS and SVG. App-level authorization filters records by account, school, assignment and conversation membership. SQLite foreign keys and transactions maintain relationships. Noto Sans Thai is bundled under the SIL Open Font License alongside its license text.

## Settings and separate local accounts

Use `.env.example` as a reference. Optional variables include `APP_DB` (defaults to `data/mindbridge.sqlite`), `APP_PORT` (4173), `APP_HOST` (127.0.0.1) and `APP_ALLOW_DEMO` (set to 0 to disable demo sign-in).

For testing registered accounts with fictional information, set a private `APP_INVITE_CODE` and create the first local administrator using `APP_ADMIN_EMAIL` and `APP_ADMIN_PASSWORD`. Open **สมัครสมาชิก** and use the same invite code. Students enter the workspace after signup. Teachers must be verified in **จัดการบัญชี** by the school administrator before signing in, and the administrator must assign the teacher to particular students. The password reset form records a request for the school administrator. There is no outbound email service.

`APP_ORIGIN` sets the expected browser origin. `APP_SECURE_COOKIE=1` enables secure cookies when the service is behind an HTTPS proxy. Keep `.env` and SQLite data out of source control.

## Checks and screenshots

```sh
node scripts/check.mjs
node --test tests/api.test.mjs
npm install
npx playwright install chromium
node tests/browser.mjs
node tests/admin-browser.mjs
```

The first two commands need only Node. Playwright can also use an installed Chrome (`APP_CHROME`) or a preinstalled Playwright module (`APP_PLAYWRIGHT`). The browser workflow test starts an isolated SQLite database in memory and creates fictional screenshot data through both accounts. It writes 2× PNG screenshots to `docs/screenshots/`. The separate admin/browser smoke test checks teacher and admin routes, teacher guidance drafts, a mobile teacher view and admin privacy boundaries.

The `build` script checks all distributable sources and bundled assets. There is no transpilation step. To run this build on a local showcase computer, copy the project folder and start Node with the command above.

## Privacy, safety and deployment scope

Use fictional information. The local app does not perform clinical screening or diagnosis, or send referrals or messages to external services. An authorized teacher can record a referral for human review. Urgent support directs the user to people and services outside this app. The medical emergency number in the prototype follows the [National Institute for Emergency Medicine](https://www.niems.go.th/th/Upload/File/255906101538474568_d2Qw9e18HslgFn47.pdf). Check school contacts and approved emergency procedures before an institutional pilot.

An institutional deployment requires decisions about consent and parent/guardian authorization, safeguarding and incident response, encrypted storage and backups, account recovery, retention enforcement, and deployment monitoring. Test the deployment and review privacy and security before collecting student information. The local version does not configure Supabase/PostgreSQL, hosted realtime updates or database row-level security, external email and SMS, or a production monitoring service. A network deployment would need its own authority, managed infrastructure and security review. No external credentials are needed for local demonstration.
