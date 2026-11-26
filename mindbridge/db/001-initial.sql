PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, demo INTEGER NOT NULL CHECK(demo IN (0, 1)),
  settings TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS classrooms (
  id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL, grade TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')), name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE, student_code TEXT, password_hash TEXT,
  verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
  avatar TEXT NOT NULL DEFAULT '', settings TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  UNIQUE(school_id, email), UNIQUE(school_id, student_code)
);
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  classroom_id TEXT REFERENCES classrooms(id) ON DELETE SET NULL, grade TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS teacher_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'ครู', training TEXT NOT NULL DEFAULT '[]',
  response_time TEXT NOT NULL DEFAULT 'ตามเวลาทำการของโรงเรียน',
  availability TEXT NOT NULL DEFAULT 'ตามนัดหมาย',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(student_id, teacher_id)
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS demo_workspaces (
  token_hash TEXT PRIMARY KEY, school_id TEXT NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS emotional_checkins (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  UNIQUE(student_id, date)
);
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS journal_attachments (
  id TEXT PRIMARY KEY, journal_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  name TEXT NOT NULL, mime TEXT NOT NULL, bytes BLOB NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS support_requests (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('submitted','received','replied','talking','appointment','caring','follow-up','referred','closed','reopened')),
  data TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS request_events (
  id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sharing_permissions (
  id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, purpose TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE REFERENCES support_requests(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0, 1)),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  PRIMARY KEY(conversation_id, user_id)
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL, text TEXT NOT NULL, read_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  FOREIGN KEY(conversation_id, sender_id) REFERENCES conversation_members(conversation_id, user_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS message_attachments (
  id TEXT PRIMARY KEY, message_id TEXT NOT NULL UNIQUE REFERENCES messages(id) ON DELETE CASCADE,
  name TEXT NOT NULL, mime TEXT NOT NULL, bytes BLOB NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS teacher_availability (
  id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_at TEXT NOT NULL, end_at TEXT NOT NULL CHECK(end_at > start_at),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(teacher_id, start_at)
);
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY, slot_id TEXT NOT NULL REFERENCES teacher_availability(id) ON DELETE CASCADE,
  request_id TEXT REFERENCES support_requests(id) ON DELETE SET NULL,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('requested','confirmed','suggested','cancelled','declined','completed')),
  data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS appointment_slot_reserved ON appointments(slot_id)
  WHERE status IN ('requested','confirmed','suggested');
CREATE TABLE IF NOT EXISTS support_plans (
  id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
  data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS support_notes (
  id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
  data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS follow_ups (
  id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('pending','completed')), due_at TEXT NOT NULL,
  data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('review','sent','completed')),
  data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, text TEXT NOT NULL, href TEXT NOT NULL, read_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, event_key TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS notification_event ON notifications(user_id, event_key) WHERE event_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS consent_records (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, entity_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS privacy_requests (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('access','deletion','privacy','report','teacher','recovery')),
  reason TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('new','completed')),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS assignments_by_teacher ON teacher_assignments(teacher_id, student_id);
CREATE INDEX IF NOT EXISTS requests_by_student ON support_requests(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS requests_by_teacher ON support_requests(teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_by_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS journal_by_student ON journal_entries(student_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS notifications_by_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS appointments_by_student ON appointments(student_id, status);
CREATE INDEX IF NOT EXISTS appointments_by_teacher ON appointments(teacher_id, status);
CREATE INDEX IF NOT EXISTS audit_by_school ON audit_logs(school_id, created_at DESC);

CREATE TRIGGER IF NOT EXISTS assignment_scope BEFORE INSERT ON teacher_assignments
WHEN NOT EXISTS (
  SELECT 1 FROM users s JOIN users t ON s.school_id = t.school_id
  WHERE s.id = NEW.student_id AND s.role = 'student' AND s.active = 1
    AND t.id = NEW.teacher_id AND t.role = 'teacher' AND t.active = 1 AND t.verified = 1
)
BEGIN
  SELECT RAISE(ABORT, 'invalid teacher assignment');
END;

CREATE TRIGGER IF NOT EXISTS request_scope BEFORE INSERT ON support_requests
WHEN NOT EXISTS (SELECT 1 FROM teacher_assignments a JOIN users t ON t.id = a.teacher_id
  WHERE a.student_id = NEW.student_id AND a.teacher_id = NEW.teacher_id AND t.verified = 1 AND t.active = 1)
BEGIN
  SELECT RAISE(ABORT, 'request requires assignment');
END;

CREATE TRIGGER IF NOT EXISTS conversation_member_scope BEFORE INSERT ON conversation_members
WHEN NOT EXISTS (SELECT 1 FROM conversations c JOIN support_requests r ON c.request_id = r.id
  WHERE c.id = NEW.conversation_id AND NEW.user_id IN (r.student_id, r.teacher_id))
BEGIN
  SELECT RAISE(ABORT, 'invalid conversation member');
END;

CREATE TRIGGER IF NOT EXISTS share_scope BEFORE INSERT ON sharing_permissions
WHEN NOT EXISTS (SELECT 1 FROM support_requests r
  WHERE r.id = NEW.request_id AND r.student_id = NEW.student_id AND r.teacher_id = NEW.teacher_id)
BEGIN
  SELECT RAISE(ABORT, 'invalid share scope');
END;

CREATE TRIGGER IF NOT EXISTS appointment_scope BEFORE INSERT ON appointments
WHEN NOT EXISTS (
  SELECT 1 FROM teacher_assignments a JOIN teacher_availability t ON t.teacher_id = a.teacher_id
  WHERE a.student_id = NEW.student_id AND a.teacher_id = NEW.teacher_id AND t.id = NEW.slot_id
) OR (NEW.request_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM support_requests r WHERE r.id = NEW.request_id AND r.student_id = NEW.student_id AND r.teacher_id = NEW.teacher_id
))
BEGIN
  SELECT RAISE(ABORT, 'invalid appointment scope');
END;

CREATE TRIGGER IF NOT EXISTS appointment_slot_scope BEFORE UPDATE OF slot_id ON appointments
WHEN NOT EXISTS (SELECT 1 FROM teacher_availability t WHERE t.id = NEW.slot_id AND t.teacher_id = NEW.teacher_id)
BEGIN
  SELECT RAISE(ABORT, 'invalid appointment slot');
END;

PRAGMA user_version = 1;
