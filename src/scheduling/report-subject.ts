/**
 * The subject line when an adherence report is shared by email, e.g.
 * "Adherence Report: Asha". Kept pure so the exact wording is tested.
 */
export function reportSubject(patientName: string | null | undefined): string {
  const name = patientName?.trim();
  return name ? `Adherence Report: ${name}` : 'Adherence Report';
}
