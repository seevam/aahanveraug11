/**
 * Data access. Every SQL statement in the app lives here, so the screens deal
 * in domain types and the storage shape can change without touching UI.
 */

import { getDatabase, newId } from './client';
import type { DoseRow, PatientRow, PrescriptionRow, ReminderRow } from './schema';
import type { DoseStatus } from '../scheduling/adherence';
import type { Eye, ReminderSpec, ScheduleConfig, Weekday } from '../scheduling/types';
import { deviceTimeZone } from '../scheduling/timezone';

// --------------------------------------------------------------------- types

export type Patient = {
  id: string;
  name: string;
  relationship: string | null;
  dateOfBirth: string | null;
  timezone: string;
  accent: string;
  createdAt: number;
};

export type Reminder = ReminderSpec & {
  prescriptionId: string | null;
  medicationId: string | null;
  snoozeMinutes: number;
  snoozeLimit: number;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  createdAt: number;
};

export type Dose = {
  id: string;
  reminderId: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  eye: Eye;
  localDate: string;
  scheduledAt: number;
  requestedAt: number;
  shiftedBy: number;
  status: DoseStatus;
  actedAt: number | null;
  snoozeCount: number;
  notificationId: string | null;
};

export type Prescription = {
  id: string;
  patientId: string;
  medicationId: string | null;
  medicationName: string;
  strength: string | null;
  form: string | null;
  prescriber: string | null;
  notes: string | null;
};

// -------------------------------------------------------------------- mapping

function parseDays(value: string): Weekday[] {
  return value
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6) as Weekday[];
}

function toPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    name: row.name,
    relationship: row.relationship,
    dateOfBirth: row.date_of_birth,
    timezone: row.timezone,
    accent: row.accent,
    createdAt: row.created_at,
  };
}

function toReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    patientId: row.patient_id,
    prescriptionId: row.prescription_id,
    medicationId: row.medication_id,
    medicationName: row.medication_name,
    dosage: row.dosage,
    eye: row.eye as Eye,
    config: JSON.parse(row.config) as ScheduleConfig,
    daysOfWeek: parseDays(row.days_of_week),
    startDate: row.start_date,
    endDate: row.end_date,
    active: row.active === 1,
    snoozeMinutes: row.snooze_minutes,
    snoozeLimit: row.snooze_limit,
    soundEnabled: row.sound_enabled === 1,
    vibrateEnabled: row.vibrate_enabled === 1,
    createdAt: row.created_at,
  };
}

function toDose(row: DoseRow): Dose {
  return {
    id: row.id,
    reminderId: row.reminder_id,
    patientId: row.patient_id,
    medicationName: row.medication_name,
    dosage: row.dosage,
    eye: row.eye as Eye,
    localDate: row.local_date,
    scheduledAt: row.scheduled_at,
    requestedAt: row.requested_at,
    shiftedBy: row.shifted_by,
    status: row.status as DoseStatus,
    actedAt: row.acted_at,
    snoozeCount: row.snooze_count,
    notificationId: row.notification_id,
  };
}

function toPrescription(row: PrescriptionRow): Prescription {
  return {
    id: row.id,
    patientId: row.patient_id,
    medicationId: row.medication_id,
    medicationName: row.medication_name,
    strength: row.strength,
    form: row.form,
    prescriber: row.prescriber,
    notes: row.notes,
  };
}

// ------------------------------------------------------------------- patients

export const patients = {
  async list(): Promise<Patient[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<PatientRow>(
      'SELECT * FROM patients ORDER BY created_at ASC',
    );
    return rows.map(toPatient);
  },

  async get(id: string): Promise<Patient | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<PatientRow>('SELECT * FROM patients WHERE id = ?', id);
    return row ? toPatient(row) : null;
  },

  async count(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM patients');
    return row?.n ?? 0;
  },

  async create(input: {
    name: string;
    relationship?: string | null;
    dateOfBirth?: string | null;
    timezone?: string;
    accent?: string;
  }): Promise<Patient> {
    const db = await getDatabase();
    const now = Date.now();
    const id = newId('pat');
    await db.runAsync(
      `INSERT INTO patients (id, name, relationship, date_of_birth, timezone, accent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.name.trim(),
      input.relationship ?? null,
      input.dateOfBirth ?? null,
      input.timezone ?? deviceTimeZone(),
      input.accent ?? 'teal',
      now,
      now,
    );
    const created = await this.get(id);
    if (!created) throw new Error('Failed to create patient');
    return created;
  },

  async update(
    id: string,
    input: Partial<Pick<Patient, 'name' | 'relationship' | 'dateOfBirth' | 'timezone' | 'accent'>>,
  ): Promise<void> {
    const db = await getDatabase();
    const existing = await this.get(id);
    if (!existing) return;
    await db.runAsync(
      `UPDATE patients
         SET name = ?, relationship = ?, date_of_birth = ?, timezone = ?, accent = ?, updated_at = ?
       WHERE id = ?`,
      input.name?.trim() ?? existing.name,
      input.relationship !== undefined ? input.relationship : existing.relationship,
      input.dateOfBirth !== undefined ? input.dateOfBirth : existing.dateOfBirth,
      input.timezone ?? existing.timezone,
      input.accent ?? existing.accent,
      Date.now(),
      id,
    );
  },

  async remove(id: string): Promise<void> {
    const db = await getDatabase();
    // Reminders, doses and prescriptions go with it via ON DELETE CASCADE.
    await db.runAsync('DELETE FROM patients WHERE id = ?', id);
  },
};

// ------------------------------------------------------------------ reminders

export const reminders = {
  async listForPatient(patientId: string, includeInactive = true): Promise<Reminder[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ReminderRow>(
      includeInactive
        ? 'SELECT * FROM reminders WHERE patient_id = ? ORDER BY created_at ASC'
        : 'SELECT * FROM reminders WHERE patient_id = ? AND active = 1 ORDER BY created_at ASC',
      patientId,
    );
    return rows.map(toReminder);
  },

  async get(id: string): Promise<Reminder | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ReminderRow>('SELECT * FROM reminders WHERE id = ?', id);
    return row ? toReminder(row) : null;
  },

  async create(input: {
    patientId: string;
    medicationName: string;
    medicationId?: string | null;
    prescriptionId?: string | null;
    dosage: string;
    eye: Eye;
    config: ScheduleConfig;
    daysOfWeek: Weekday[];
    startDate: string;
    endDate?: string | null;
    snoozeMinutes?: number;
    snoozeLimit?: number;
    soundEnabled?: boolean;
    vibrateEnabled?: boolean;
  }): Promise<Reminder> {
    const db = await getDatabase();
    const now = Date.now();
    const id = newId('rem');
    await db.runAsync(
      `INSERT INTO reminders (
         id, patient_id, prescription_id, medication_id, medication_name, dosage, eye,
         mode, config, days_of_week, start_date, end_date,
         snooze_minutes, snooze_limit, sound_enabled, vibrate_enabled, active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      id,
      input.patientId,
      input.prescriptionId ?? null,
      input.medicationId ?? null,
      input.medicationName.trim(),
      input.dosage.trim(),
      input.eye,
      input.config.mode,
      JSON.stringify(input.config),
      input.daysOfWeek.join(','),
      input.startDate,
      input.endDate ?? null,
      input.snoozeMinutes ?? 10,
      input.snoozeLimit ?? 3,
      input.soundEnabled === false ? 0 : 1,
      input.vibrateEnabled === false ? 0 : 1,
      now,
      now,
    );
    const created = await this.get(id);
    if (!created) throw new Error('Failed to create reminder');
    return created;
  },

  async update(
    id: string,
    input: Partial<{
      medicationName: string;
      medicationId: string | null;
      dosage: string;
      eye: Eye;
      config: ScheduleConfig;
      daysOfWeek: Weekday[];
      startDate: string;
      endDate: string | null;
      snoozeMinutes: number;
      snoozeLimit: number;
      soundEnabled: boolean;
      vibrateEnabled: boolean;
      active: boolean;
    }>,
  ): Promise<void> {
    const db = await getDatabase();
    const existing = await this.get(id);
    if (!existing) return;

    const config = input.config ?? existing.config;
    await db.runAsync(
      `UPDATE reminders SET
         medication_name = ?, medication_id = ?, dosage = ?, eye = ?,
         mode = ?, config = ?, days_of_week = ?, start_date = ?, end_date = ?,
         snooze_minutes = ?, snooze_limit = ?, sound_enabled = ?, vibrate_enabled = ?,
         active = ?, updated_at = ?
       WHERE id = ?`,
      input.medicationName?.trim() ?? existing.medicationName,
      input.medicationId !== undefined ? input.medicationId : existing.medicationId,
      input.dosage?.trim() ?? existing.dosage,
      input.eye ?? existing.eye,
      config.mode,
      JSON.stringify(config),
      (input.daysOfWeek ?? existing.daysOfWeek).join(','),
      input.startDate ?? existing.startDate,
      input.endDate !== undefined ? input.endDate : existing.endDate,
      input.snoozeMinutes ?? existing.snoozeMinutes,
      input.snoozeLimit ?? existing.snoozeLimit,
      (input.soundEnabled ?? existing.soundEnabled) ? 1 : 0,
      (input.vibrateEnabled ?? existing.vibrateEnabled) ? 1 : 0,
      (input.active ?? existing.active) ? 1 : 0,
      Date.now(),
      id,
    );
  },

  async remove(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM reminders WHERE id = ?', id);
  },
};

// ---------------------------------------------------------------------- doses

export const doses = {
  async forDate(patientId: string, localDate: string): Promise<Dose[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<DoseRow>(
      'SELECT * FROM doses WHERE patient_id = ? AND local_date = ? ORDER BY scheduled_at ASC',
      patientId,
      localDate,
    );
    return rows.map(toDose);
  },

  async forRange(patientId: string, fromDate: string, toDate: string): Promise<Dose[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<DoseRow>(
      `SELECT * FROM doses
        WHERE patient_id = ? AND local_date >= ? AND local_date <= ?
        ORDER BY scheduled_at ASC`,
      patientId,
      fromDate,
      toDate,
    );
    return rows.map(toDose);
  },

  async get(id: string): Promise<Dose | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<DoseRow>('SELECT * FROM doses WHERE id = ?', id);
    return row ? toDose(row) : null;
  },

  /** Pending or snoozed doses across all patients, soonest first. */
  async upcoming(limit: number, from: number = Date.now()): Promise<Dose[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<DoseRow>(
      `SELECT * FROM doses
        WHERE status IN ('pending', 'snoozed') AND scheduled_at >= ?
        ORDER BY scheduled_at ASC
        LIMIT ?`,
      from,
      limit,
    );
    return rows.map(toDose);
  },

  /**
   * Inserts generated doses, ignoring any that already exist for the same
   * reminder and requested time. Re-running materialisation is therefore safe
   * and never disturbs a dose the patient has already acted on.
   */
  async insertMany(
    rows: Array<{
      reminderId: string;
      patientId: string;
      medicationName: string;
      dosage: string;
      eye: Eye;
      localDate: string;
      scheduledAt: number;
      requestedAt: number;
      shiftedBy: number;
    }>,
  ): Promise<number> {
    if (rows.length === 0) return 0;
    const db = await getDatabase();
    const now = Date.now();
    let inserted = 0;

    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const row of rows) {
        const result = await tx.runAsync(
          `INSERT OR IGNORE INTO doses (
             id, reminder_id, patient_id, medication_name, dosage, eye,
             local_date, scheduled_at, requested_at, shifted_by, status, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
          newId('dos'),
          row.reminderId,
          row.patientId,
          row.medicationName,
          row.dosage,
          row.eye,
          row.localDate,
          row.scheduledAt,
          row.requestedAt,
          row.shiftedBy,
          now,
        );
        inserted += result.changes;
      }
    });

    return inserted;
  },

  async setStatus(
    id: string,
    status: DoseStatus,
    options: { actedAt?: number | null; snoozeCount?: number; scheduledAt?: number } = {},
  ): Promise<void> {
    const db = await getDatabase();
    const existing = await this.get(id);
    if (!existing) return;
    await db.runAsync(
      `UPDATE doses SET status = ?, acted_at = ?, snooze_count = ?, scheduled_at = ? WHERE id = ?`,
      status,
      options.actedAt !== undefined ? options.actedAt : Date.now(),
      options.snoozeCount ?? existing.snoozeCount,
      options.scheduledAt ?? existing.scheduledAt,
      id,
    );
  },

  async setNotificationId(id: string, notificationId: string | null): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE doses SET notification_id = ? WHERE id = ?', notificationId, id);
  },

  /**
   * Marks overdue pending doses as missed. Called on app start and resume —
   * without a server, this sweep is the only thing that closes out a dose the
   * patient never responded to.
   */
  async sweepMissed(graceMinutes: number, now: number = Date.now()): Promise<number> {
    const db = await getDatabase();
    const cutoff = now - graceMinutes * 60_000;
    const result = await db.runAsync(
      `UPDATE doses SET status = 'missed', acted_at = NULL
        WHERE status IN ('pending', 'snoozed') AND scheduled_at < ?`,
      cutoff,
    );
    return result.changes;
  },

  /**
   * Removes future pending doses for a reminder so it can be regenerated.
   * Doses the patient already acted on are left alone — history is never
   * rewritten by an edit.
   */
  async deleteFuturePending(reminderId: string, from: number = Date.now()): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM doses WHERE reminder_id = ? AND status = 'pending' AND scheduled_at >= ?`,
      reminderId,
      from,
    );
  },

  async deleteFuturePendingForPatient(patientId: string, from: number = Date.now()): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM doses WHERE patient_id = ? AND status = 'pending' AND scheduled_at >= ?`,
      patientId,
      from,
    );
  },
};

// -------------------------------------------------------------- prescriptions

export const prescriptions = {
  async listForPatient(patientId: string): Promise<Prescription[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<PrescriptionRow>(
      'SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY created_at DESC',
      patientId,
    );
    return rows.map(toPrescription);
  },

  async create(input: {
    patientId: string;
    medicationName: string;
    medicationId?: string | null;
    strength?: string | null;
    form?: string | null;
    prescriber?: string | null;
    notes?: string | null;
  }): Promise<Prescription> {
    const db = await getDatabase();
    const now = Date.now();
    const id = newId('rx');
    await db.runAsync(
      `INSERT INTO prescriptions (
         id, patient_id, medication_id, medication_name, strength, form, prescriber, notes, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.patientId,
      input.medicationId ?? null,
      input.medicationName.trim(),
      input.strength ?? null,
      input.form ?? null,
      input.prescriber ?? null,
      input.notes ?? null,
      now,
      now,
    );
    const row = await db.getFirstAsync<PrescriptionRow>(
      'SELECT * FROM prescriptions WHERE id = ?',
      id,
    );
    if (!row) throw new Error('Failed to create prescription');
    return toPrescription(row);
  },

  async remove(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM prescriptions WHERE id = ?', id);
  },
};

// ------------------------------------------------------------------- settings

export const settings = {
  async get(key: string): Promise<string | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      key,
    );
    return row?.value ?? null;
  },

  async set(key: string, value: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
      key,
      value,
      value,
    );
  },

  async remove(key: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM settings WHERE key = ?', key);
  },

  async all(): Promise<Record<string, string>> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT * FROM settings');
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },
};
