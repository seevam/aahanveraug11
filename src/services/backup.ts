/**
 * Backup export and import.
 *
 * With no server, the phone is the only copy of a patient's medication
 * history. This turns that history into a file the patient controls — for
 * moving to a new phone, and for handing an adherence record to a doctor.
 *
 * The format is plain JSON with an explicit `formatVersion`. Import refuses a
 * file from a newer version rather than guessing at fields it does not
 * understand, because a partially-understood medication schedule is worse than
 * no import at all.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getDatabase } from '../db/client';
import { patients as patientRepo, settings as settingsRepo } from '../db/repositories';
import type { DoseRow, PatientRow, PrescriptionRow, ReminderRow } from '../db/schema';

export const BACKUP_FORMAT_VERSION = 1;
export const LAST_BACKUP_KEY = 'lastBackupAt';

export type BackupFile = {
  formatVersion: number;
  app: 'ahaan-eye';
  exportedAt: string;
  patients: PatientRow[];
  prescriptions: PrescriptionRow[];
  reminders: ReminderRow[];
  doses: DoseRow[];
};

export async function buildBackup(): Promise<BackupFile> {
  const db = await getDatabase();
  const [patients, prescriptions, reminders, doses] = await Promise.all([
    db.getAllAsync<PatientRow>('SELECT * FROM patients'),
    db.getAllAsync<PrescriptionRow>('SELECT * FROM prescriptions'),
    db.getAllAsync<ReminderRow>('SELECT * FROM reminders'),
    db.getAllAsync<DoseRow>('SELECT * FROM doses'),
  ]);

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    app: 'ahaan-eye',
    exportedAt: new Date().toISOString(),
    patients,
    prescriptions,
    reminders,
    doses,
  };
}

function backupFileName(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `ahaan-eye-backup-${stamp}.json`;
}

export type ExportResult =
  | { ok: true; uri: string; shared: boolean }
  | { ok: false; error: string };

export async function exportBackup(): Promise<ExportResult> {
  try {
    const backup = await buildBackup();
    const directory = FileSystem.Paths.cache;
    const file = new FileSystem.File(directory, backupFileName());

    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify(backup, null, 2));

    await settingsRepo.set(LAST_BACKUP_KEY, new Date().toISOString());

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Ahaan Eye backup',
        UTI: 'public.json',
      });
    }

    return { ok: true, uri: file.uri, shared: canShare };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function isBackupFile(value: unknown): value is BackupFile {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<BackupFile>;
  return (
    candidate.app === 'ahaan-eye' &&
    typeof candidate.formatVersion === 'number' &&
    Array.isArray(candidate.patients) &&
    Array.isArray(candidate.reminders) &&
    Array.isArray(candidate.doses)
  );
}

export type ImportResult =
  | { ok: true; patients: number; reminders: number; doses: number }
  | { ok: false; reason: 'cancelled' | 'unreadable' | 'version' };

/**
 * Replaces everything in the database with the contents of a backup file.
 *
 * All-or-nothing inside one transaction: a half-restored medication schedule
 * would silently drop doses, so a failure leaves the existing data untouched.
 */
export async function importBackup(): Promise<ImportResult> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'public.json', '*/*'],
    copyToCacheDirectory: true,
  });

  if (picked.canceled || !picked.assets?.[0]) {
    return { ok: false, reason: 'cancelled' };
  }

  let parsed: unknown;
  try {
    const file = new FileSystem.File(picked.assets[0].uri);
    parsed = JSON.parse(file.textSync());
  } catch {
    return { ok: false, reason: 'unreadable' };
  }

  if (!isBackupFile(parsed)) {
    return { ok: false, reason: 'unreadable' };
  }

  if (parsed.formatVersion > BACKUP_FORMAT_VERSION) {
    return { ok: false, reason: 'version' };
  }

  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync(`
      DELETE FROM doses;
      DELETE FROM reminders;
      DELETE FROM prescriptions;
      DELETE FROM patients;
    `);

    for (const p of parsed.patients) {
      await tx.runAsync(
        `INSERT INTO patients (id, name, relationship, date_of_birth, timezone, accent, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        p.id,
        p.name,
        p.relationship,
        p.date_of_birth,
        p.timezone,
        p.accent,
        p.created_at,
        p.updated_at,
      );
    }

    for (const rx of parsed.prescriptions ?? []) {
      await tx.runAsync(
        `INSERT INTO prescriptions (id, patient_id, medication_id, medication_name, strength, form, prescriber, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        rx.id,
        rx.patient_id,
        rx.medication_id,
        rx.medication_name,
        rx.strength,
        rx.form,
        rx.prescriber,
        rx.notes,
        rx.created_at,
        rx.updated_at,
      );
    }

    for (const r of parsed.reminders) {
      await tx.runAsync(
        `INSERT INTO reminders (id, patient_id, prescription_id, medication_id, medication_name, dosage, eye,
           mode, config, days_of_week, start_date, end_date, snooze_minutes, snooze_limit,
           sound_enabled, vibrate_enabled, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r.id,
        r.patient_id,
        r.prescription_id,
        r.medication_id,
        r.medication_name,
        r.dosage,
        r.eye,
        r.mode,
        r.config,
        r.days_of_week,
        r.start_date,
        r.end_date,
        r.snooze_minutes,
        r.snooze_limit,
        r.sound_enabled,
        r.vibrate_enabled,
        r.active,
        r.created_at,
        r.updated_at,
      );
    }

    for (const d of parsed.doses) {
      await tx.runAsync(
        `INSERT INTO doses (id, reminder_id, patient_id, medication_name, dosage, eye, local_date,
           scheduled_at, requested_at, shifted_by, status, acted_at, snooze_count, notification_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
        d.id,
        d.reminder_id,
        d.patient_id,
        d.medication_name,
        d.dosage,
        d.eye,
        d.local_date,
        d.scheduled_at,
        d.requested_at,
        d.shifted_by,
        d.status,
        d.acted_at,
        d.snooze_count,
        d.created_at,
      );
    }
  });

  return {
    ok: true,
    patients: parsed.patients.length,
    reminders: parsed.reminders.length,
    doses: parsed.doses.length,
  };
}

/** Human-readable adherence summary for sharing with a doctor. */
export async function shareAdherenceText(patientId: string, text: string): Promise<boolean> {
  try {
    const patient = await patientRepo.get(patientId);
    const name = patient?.name.replace(/[^a-zA-Z0-9]/g, '-') ?? 'patient';
    const file = new FileSystem.File(FileSystem.Paths.cache, `ahaan-eye-report-${name}.txt`);
    if (file.exists) file.delete();
    file.create();
    file.write(text);

    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(file.uri, { mimeType: 'text/plain', dialogTitle: 'Adherence report' });
    return true;
  } catch {
    return false;
  }
}

/** Used by the profile screen's backup section. */
export async function backupStats(): Promise<{ lastBackupAt: string | null }> {
  return { lastBackupAt: await settingsRepo.get(LAST_BACKUP_KEY) };
}
