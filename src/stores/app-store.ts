import { create } from 'zustand';

import { patients as patientRepo, settings as settingsRepo, type Patient } from '../db/repositories';
import { changeLanguage, initI18n, LANGUAGE_SETTING_KEY, type LanguageCode } from '../i18n';
import { getPermissionState, type PermissionState } from '../notifications/service';
import { syncAll } from '../services/schedule-service';

export const SELECTED_PATIENT_KEY = 'selectedPatientId';
export const ONBOARDED_KEY = 'onboarded';

type AppState = {
  ready: boolean;
  onboarded: boolean;
  patients: Patient[];
  selectedPatientId: string | null;
  language: LanguageCode;
  notificationPermission: PermissionState;
  /** Bumped whenever dose data changes, so screens can re-read. */
  dataVersion: number;

  bootstrap: () => Promise<void>;
  reloadPatients: () => Promise<void>;
  selectPatient: (id: string) => Promise<void>;
  setLanguage: (code: LanguageCode) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshPermission: () => Promise<PermissionState>;
  /** Re-materialise doses and re-arm notifications, then notify screens. */
  sync: () => Promise<void>;
  invalidate: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  onboarded: false,
  patients: [],
  selectedPatientId: null,
  language: 'en',
  notificationPermission: 'undetermined',
  dataVersion: 0,

  async bootstrap() {
    const storedLanguage = await settingsRepo.get(LANGUAGE_SETTING_KEY);
    const language = await initI18n(storedLanguage);
    if (!storedLanguage) {
      await settingsRepo.set(LANGUAGE_SETTING_KEY, language);
    }

    const list = await patientRepo.list();
    const storedSelected = await settingsRepo.get(SELECTED_PATIENT_KEY);
    const onboarded = (await settingsRepo.get(ONBOARDED_KEY)) === 'true' && list.length > 0;

    const selectedPatientId =
      storedSelected && list.some((p) => p.id === storedSelected)
        ? storedSelected
        : (list[0]?.id ?? null);

    const permission = await getPermissionState();

    set({
      ready: true,
      onboarded,
      patients: list,
      selectedPatientId,
      language,
      notificationPermission: permission,
    });

    if (list.length > 0) {
      await get().sync();
    }
  },

  async reloadPatients() {
    const list = await patientRepo.list();
    const { selectedPatientId } = get();
    const stillExists = selectedPatientId && list.some((p) => p.id === selectedPatientId);
    const nextSelected = stillExists ? selectedPatientId : (list[0]?.id ?? null);

    if (nextSelected !== selectedPatientId) {
      if (nextSelected) await settingsRepo.set(SELECTED_PATIENT_KEY, nextSelected);
      else await settingsRepo.remove(SELECTED_PATIENT_KEY);
    }

    set({ patients: list, selectedPatientId: nextSelected });
  },

  async selectPatient(id: string) {
    await settingsRepo.set(SELECTED_PATIENT_KEY, id);
    set({ selectedPatientId: id });
  },

  async setLanguage(code: LanguageCode) {
    await changeLanguage(code);
    await settingsRepo.set(LANGUAGE_SETTING_KEY, code);
    set({ language: code });
  },

  async completeOnboarding() {
    await settingsRepo.set(ONBOARDED_KEY, 'true');
    set({ onboarded: true });
  },

  async refreshPermission() {
    const permission = await getPermissionState();
    set({ notificationPermission: permission });
    return permission;
  },

  async sync() {
    await syncAll();
    set((s) => ({ dataVersion: s.dataVersion + 1 }));
  },

  invalidate() {
    set((s) => ({ dataVersion: s.dataVersion + 1 }));
  },
}));

export function useSelectedPatient(): Patient | null {
  return useAppStore(
    (s) => s.patients.find((p) => p.id === s.selectedPatientId) ?? s.patients[0] ?? null,
  );
}
