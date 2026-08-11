/**
 * SQLite schema and migrations.
 *
 * Versioned through `PRAGMA user_version`. Each migration is applied in order
 * inside a transaction; adding a new one means appending to `MIGRATIONS` and
 * never editing an existing entry, because installed apps are already at that
 * version.
 *
 * Times are stored two ways on purpose:
 *  - `scheduled_at` / `acted_at` are UTC epoch milliseconds — unambiguous, and
 *    what notification scheduling and sorting need.
 *  - `local_date` is the patient's `yyyy-MM-dd` — what "today's doses" and the
 *    adherence report mean. Deriving it at query time would need timezone
 *    logic inside SQL, so it is computed once on write.
 */

export const DATABASE_NAME = 'ahaan-eye.db';

export const MIGRATIONS: string[] = [
  // ---------------------------------------------------------------- v1
  `
  CREATE TABLE patients (
    id            TEXT PRIMARY KEY NOT NULL,
    name          TEXT NOT NULL,
    relationship  TEXT,
    date_of_birth TEXT,
    timezone      TEXT NOT NULL,
    accent        TEXT NOT NULL DEFAULT 'teal',
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );

  CREATE TABLE prescriptions (
    id              TEXT PRIMARY KEY NOT NULL,
    patient_id      TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medication_id   TEXT,
    medication_name TEXT NOT NULL,
    strength        TEXT,
    form            TEXT,
    prescriber      TEXT,
    notes           TEXT,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL
  );
  CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);

  CREATE TABLE reminders (
    id              TEXT PRIMARY KEY NOT NULL,
    patient_id      TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    prescription_id TEXT REFERENCES prescriptions(id) ON DELETE SET NULL,
    medication_id   TEXT,
    medication_name TEXT NOT NULL,
    dosage          TEXT NOT NULL DEFAULT '1 drop',
    eye             TEXT NOT NULL DEFAULT 'both',
    mode            TEXT NOT NULL,
    config          TEXT NOT NULL,
    days_of_week    TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6',
    start_date      TEXT NOT NULL,
    end_date        TEXT,
    snooze_minutes  INTEGER NOT NULL DEFAULT 10,
    snooze_limit    INTEGER NOT NULL DEFAULT 3,
    sound_enabled   INTEGER NOT NULL DEFAULT 1,
    vibrate_enabled INTEGER NOT NULL DEFAULT 1,
    active          INTEGER NOT NULL DEFAULT 1,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL
  );
  CREATE INDEX idx_reminders_patient ON reminders(patient_id, active);

  CREATE TABLE doses (
    id              TEXT PRIMARY KEY NOT NULL,
    reminder_id     TEXT NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
    patient_id      TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dosage          TEXT NOT NULL,
    eye             TEXT NOT NULL,
    local_date      TEXT NOT NULL,
    scheduled_at    INTEGER NOT NULL,
    requested_at    INTEGER NOT NULL,
    shifted_by      INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'pending',
    acted_at        INTEGER,
    snooze_count    INTEGER NOT NULL DEFAULT 0,
    notification_id TEXT,
    created_at      INTEGER NOT NULL,
    UNIQUE (reminder_id, requested_at)
  );
  CREATE INDEX idx_doses_patient_date ON doses(patient_id, local_date);
  CREATE INDEX idx_doses_pending ON doses(status, scheduled_at);

  CREATE TABLE settings (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

export type PatientRow = {
  id: string;
  name: string;
  relationship: string | null;
  date_of_birth: string | null;
  timezone: string;
  accent: string;
  created_at: number;
  updated_at: number;
};

export type PrescriptionRow = {
  id: string;
  patient_id: string;
  medication_id: string | null;
  medication_name: string;
  strength: string | null;
  form: string | null;
  prescriber: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

export type ReminderRow = {
  id: string;
  patient_id: string;
  prescription_id: string | null;
  medication_id: string | null;
  medication_name: string;
  dosage: string;
  eye: string;
  mode: string;
  config: string;
  days_of_week: string;
  start_date: string;
  end_date: string | null;
  snooze_minutes: number;
  snooze_limit: number;
  sound_enabled: number;
  vibrate_enabled: number;
  active: number;
  created_at: number;
  updated_at: number;
};

export type DoseRow = {
  id: string;
  reminder_id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  eye: string;
  local_date: string;
  scheduled_at: number;
  requested_at: number;
  shifted_by: number;
  status: string;
  acted_at: number | null;
  snooze_count: number;
  notification_id: string | null;
  created_at: number;
};
