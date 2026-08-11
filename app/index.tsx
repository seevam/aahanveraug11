import { Redirect } from 'expo-router';

import { useAppStore } from '../src/stores/app-store';

/** Entry gate: onboarding until there is at least one patient, then the app. */
export default function Index() {
  const onboarded = useAppStore((s) => s.onboarded);
  const patientCount = useAppStore((s) => s.patients.length);

  if (!onboarded || patientCount === 0) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/(tabs)" />;
}
