import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, Row, Screen, SectionHeading, Spacer, Text } from '../../src/components/primitives';
import { Button } from '../../src/components/Button';
import { Segmented } from '../../src/components/inputs';
import { PatientSwitcher } from '../../src/components/PatientSwitcher';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAppStore, useSelectedPatient } from '../../src/stores/app-store';
import { doses as doseRepo } from '../../src/db/repositories';
import {
  ADHERENCE_TARGET,
  bestStreak,
  currentStreak,
  summarise,
  summariseByDay,
  summariseByMedication,
  type AdherenceSummary,
  type DoseRecord,
  type MedicationBreakdown,
} from '../../src/scheduling/adherence';
import { addDays, todayIn } from '../../src/scheduling/timezone';
import { shareAdherenceText } from '../../src/services/backup';

type Range = '7' | '30' | '90';

/** Horizontal bar. Percentage is always shown as text beside it. */
function AdherenceBar({ rate }: { rate: number }) {
  const theme = useTheme();
  const good = rate >= ADHERENCE_TARGET;
  return (
    <View
      style={{
        height: 14,
        borderRadius: 7,
        backgroundColor: theme.colors.surfaceSunken,
        overflow: 'hidden',
      }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <View
        style={{
          width: `${Math.max(0, Math.min(100, rate))}%`,
          height: '100%',
          borderRadius: 7,
          backgroundColor: good ? theme.colors.success : theme.colors.warning,
        }}
      />
    </View>
  );
}

function StatTile({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'danger' | 'default' }) {
  const theme = useTheme();
  const color =
    tone === 'success' ? theme.colors.success : tone === 'danger' ? theme.colors.danger : theme.colors.text;
  return (
    <View style={{ flex: 1 }}>
      <Text variant="title" style={{ color }}>
        {value}
      </Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

export default function ReportsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const patient = useSelectedPatient();
  const dataVersion = useAppStore((s) => s.dataVersion);

  const [range, setRange] = useState<Range>('30');
  const [summary, setSummary] = useState<AdherenceSummary | null>(null);
  const [byMedication, setByMedication] = useState<MedicationBreakdown[]>([]);
  const [streaks, setStreaks] = useState({ current: 0, best: 0 });
  const [sharing, setSharing] = useState(false);

  const load = useCallback(async () => {
    if (!patient) return;

    const today = todayIn(patient.timezone);
    const from = addDays(today, -(Number(range) - 1));
    const rows = await doseRepo.forRange(patient.id, from, today);

    const records: Array<DoseRecord & { localDate: string }> = rows.map((d) => ({
      id: d.id,
      reminderId: d.reminderId,
      medicationName: d.medicationName,
      scheduledAt: d.scheduledAt,
      status: d.status,
      actedAt: d.actedAt,
      localDate: d.localDate,
    }));

    const days = summariseByDay(records);
    setSummary(summarise(records));
    setByMedication(summariseByMedication(records));
    setStreaks({ current: currentStreak(days), best: bestStreak(days) });
  }, [patient, range]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, dataVersion]),
  );

  async function share() {
    if (!patient || !summary) return;
    setSharing(true);
    try {
      const lines = [
        `Eyedrop Scheduler — adherence report`,
        `Patient: ${patient.name}`,
        `Period: last ${range} days`,
        '',
        `Doses taken: ${summary.taken} of ${summary.evaluated}` +
          (summary.rate !== null ? ` (${summary.rate}%)` : ''),
        `Missed: ${summary.missed}`,
        `Skipped: ${summary.skipped}`,
        `Current streak: ${streaks.current} days`,
        '',
        'By medication:',
        ...byMedication.map(
          (m) =>
            `  ${m.medicationName}: ${m.taken}/${m.evaluated}` +
            (m.rate !== null ? ` (${m.rate}%)` : ' (no data)'),
        ),
        '',
        `Generated ${new Date().toLocaleString()}`,
      ];
      await shareAdherenceText(patient.id, lines.join('\n'));
    } finally {
      setSharing(false);
    }
  }

  if (!patient) return null;

  const hasData = summary !== null && summary.evaluated > 0;

  return (
    <Screen>
      <PatientSwitcher />
      <Spacer size="lg" />
      <Text variant="display" accessibilityRole="header">
        {t('reports.title')}
      </Text>

      <Spacer size="lg" />
      <Segmented
        value={range}
        onChange={setRange}
        options={[
          { value: '7', label: t('reports.range7') },
          { value: '30', label: t('reports.range30') },
          { value: '90', label: t('reports.range90') },
        ]}
      />

      <Spacer size="xl" />

      {!hasData ? (
        <EmptyState icon="📊" title={t('reports.noDataTitle')} body={t('reports.noDataBody')} />
      ) : (
        <>
          <Card>
            <Text variant="label" tone="muted">
              {t('reports.adherence')}
            </Text>
            <Row style={{ alignItems: 'flex-end', gap: theme.spacing.sm }}>
              <Text variant="display" tone={summary.rate! >= ADHERENCE_TARGET ? 'success' : 'warning'}>
                {summary.rate}%
              </Text>
              <Text variant="body" tone="muted" style={{ paddingBottom: 6 }}>
                {summary.rate! >= ADHERENCE_TARGET
                  ? t('reports.onTrack')
                  : t('reports.needsAttention')}
              </Text>
            </Row>

            <Spacer size="sm" />
            <AdherenceBar rate={summary.rate ?? 0} />

            <Spacer size="sm" />
            <Text variant="caption" tone="muted">
              {t('reports.ofEvaluated', { taken: summary.taken, total: summary.evaluated })}
            </Text>
            {summary.outstanding > 0 ? (
              <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
                {t('reports.outstandingNote', { count: summary.outstanding })}
              </Text>
            ) : null}
          </Card>

          <Spacer size="md" />
          <Card>
            <Row>
              <StatTile label={t('reports.taken')} value={String(summary.taken)} tone="success" />
              <StatTile label={t('reports.missed')} value={String(summary.missed)} tone="danger" />
              <StatTile label={t('reports.skipped')} value={String(summary.skipped)} />
            </Row>
            <Spacer size="lg" />
            <Row>
              <StatTile
                label={t('reports.currentStreak')}
                value={t('reports.days', { count: streaks.current })}
              />
              <StatTile
                label={t('reports.bestStreak')}
                value={t('reports.days', { count: streaks.best })}
              />
            </Row>
          </Card>

          <SectionHeading>{t('reports.byMedication')}</SectionHeading>
          {byMedication.map((med) => (
            <Card key={med.medicationName} style={{ marginBottom: theme.spacing.sm }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={2}>
                  {med.medicationName}
                </Text>
                <Text variant="bodyStrong" tone={med.rate === null ? 'muted' : med.rate >= ADHERENCE_TARGET ? 'success' : 'warning'}>
                  {med.rate === null ? '—' : `${med.rate}%`}
                </Text>
              </Row>
              <Spacer size="sm" />
              <AdherenceBar rate={med.rate ?? 0} />
              <Text variant="caption" tone="muted" style={{ marginTop: theme.spacing.xs }}>
                {t('reports.ofEvaluated', { taken: med.taken, total: med.evaluated })}
              </Text>
            </Card>
          ))}

          <Spacer size="lg" />
          <Button
            label={t('reports.share')}
            variant="secondary"
            icon="↗"
            loading={sharing}
            onPress={share}
          />
        </>
      )}
    </Screen>
  );
}
