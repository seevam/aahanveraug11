import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme/ThemeProvider';
import { Card, Row, SectionHeading, Spacer, Text } from './primitives';
import { Button } from './Button';
import {
  DayPicker,
  Field,
  OptionList,
  Segmented,
  Stepper,
  TextField,
  TimeField,
  TimeList,
  ToggleRow,
} from './inputs';
import { searchMedications, type MedicationMatch } from '../medications/catalogue';
import { CapSwatch } from './CapSwatch';
import { hhmmToMinutes, minutesForConfig, minutesToHHMM, validateReminder } from '../scheduling/engine';
import { previewSchedule } from '../services/schedule-service';
import { todayIn } from '../scheduling/timezone';
import {
  ALL_WEEKDAYS,
  DEFAULT_GAP_MINUTES,
  type CountConfig,
  type Eye,
  type IntervalConfig,
  type ReminderSpec,
  type ScheduleConfig,
  type ScheduleMode,
  type Weekday,
} from '../scheduling/types';

export type ReminderFormValue = {
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
};

export function emptyFormValue(timezone: string): ReminderFormValue {
  return {
    medicationName: '',
    medicationId: null,
    dosage: '1 drop',
    eye: 'both',
    config: { mode: 'times', minutes: [hhmmToMinutes('08:00'), hhmmToMinutes('20:00')] },
    daysOfWeek: [...ALL_WEEKDAYS],
    startDate: todayIn(timezone),
    endDate: null,
    snoozeMinutes: 10,
    snoozeLimit: 3,
    soundEnabled: true,
    vibrateEnabled: true,
  };
}

/** Sensible defaults when switching mode, so the form is never in a broken state. */
function defaultConfigFor(mode: ScheduleMode, previous: ScheduleConfig): ScheduleConfig {
  const anchor = minutesForConfig(previous)[0] ?? hhmmToMinutes('08:00');
  switch (mode) {
    case 'interval':
      return {
        mode: 'interval',
        startMinute: anchor,
        endMinute: Math.min(1439, anchor + 12 * 60),
        intervalMinutes: 120,
      };
    case 'count':
      return { mode: 'count', startMinute: anchor, count: 4, gapMinutes: 15 };
    case 'times':
      return { mode: 'times', minutes: [anchor] };
  }
}

/**
 * Mode-specific field groups live in their own components so each receives an
 * already-narrowed config type. Inlining them would need a cast: TypeScript
 * discards narrowing of a property path (`value.config`) inside the callbacks,
 * because it cannot know when the callback runs.
 */
function IntervalFields({
  config,
  onChange,
}: {
  config: IntervalConfig;
  onChange: (config: IntervalConfig) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Field label={t('form.startTime')}>
        <TimeField
          minutes={config.startMinute}
          accessibilityLabel={t('form.startTime')}
          onChange={(startMinute) => onChange({ ...config, startMinute })}
        />
      </Field>
      <Field label={t('form.endTime')}>
        <TimeField
          minutes={config.endMinute}
          accessibilityLabel={t('form.endTime')}
          onChange={(endMinute) => onChange({ ...config, endMinute })}
        />
      </Field>
      <Field label={`${t('form.every')} · ${t('form.minutes')}`}>
        <Stepper
          value={config.intervalMinutes}
          min={5}
          max={720}
          step={15}
          suffix={t('form.minutes')}
          accessibilityLabel={t('form.gapBetween')}
          onChange={(intervalMinutes) => onChange({ ...config, intervalMinutes })}
        />
      </Field>
    </>
  );
}

function CountFields({
  config,
  onChange,
}: {
  config: CountConfig;
  onChange: (config: CountConfig) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Field label={t('form.startTime')}>
        <TimeField
          minutes={config.startMinute}
          accessibilityLabel={t('form.startTime')}
          onChange={(startMinute) => onChange({ ...config, startMinute })}
        />
      </Field>
      <Field label={t('form.numberOfDoses')}>
        <Stepper
          value={config.count}
          min={1}
          max={24}
          accessibilityLabel={t('form.numberOfDoses')}
          onChange={(count) => onChange({ ...config, count })}
        />
      </Field>
      <Field label={t('form.gapBetween')}>
        <Stepper
          value={config.gapMinutes}
          min={5}
          max={480}
          step={5}
          suffix={t('form.minutes')}
          accessibilityLabel={t('form.gapBetween')}
          onChange={(gapMinutes) => onChange({ ...config, gapMinutes })}
        />
      </Field>
    </>
  );
}

function MedicationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string, medicationId: string | null, strength?: string) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState(value);
  const [focused, setFocused] = useState(false);

  const matches: MedicationMatch[] = useMemo(
    () => (focused && query.trim().length >= 2 ? searchMedications(query) : []),
    [query, focused],
  );

  return (
    <View>
      <TextField
        value={query}
        onChangeText={(v) => {
          setQuery(v);
          setFocused(true);
          // Free text is always valid — the catalogue only assists.
          onChange(v, null);
        }}
        placeholder={t('form.medicationPlaceholder')}
        accessibilityLabel={t('form.medication')}
      />

      {matches.length > 0 ? (
        <Card style={{ marginTop: theme.spacing.sm, padding: theme.spacing.sm }}>
          {matches.map((match) => (
            <Pressable
              key={match.entry.id}
              onPress={() => {
                setQuery(match.entry.generic);
                setFocused(false);
                onChange(match.entry.generic, match.entry.id, match.entry.strengths[0]);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${match.matchedOn}, ${match.entry.generic}`}
              style={({ pressed }) => ({
                minHeight: theme.touchTarget.min,
                justifyContent: 'center',
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.sm,
                backgroundColor: pressed ? theme.colors.surfaceSunken : 'transparent',
              })}
            >
              <Row style={{ gap: theme.spacing.sm }}>
                <CapSwatch medicationId={match.entry.id} />
                <Text variant="body" style={{ flex: 1 }}>
                  {match.viaBrand ? `${match.matchedOn} · ` : ''}
                  {match.entry.generic}
                </Text>
              </Row>
              <Text variant="caption" tone="muted">
                {t(`medicationClass.${match.entry.medicationClass}`)}
                {match.entry.strengths.length > 0 ? ` · ${match.entry.strengths.join(', ')}` : ''}
              </Text>
            </Pressable>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

export function ReminderForm({
  value,
  onChange,
  onSubmit,
  submitLabel,
  timezone,
  otherReminders,
  reminderId,
  busy,
}: {
  value: ReminderFormValue;
  onChange: (value: ReminderFormValue) => void;
  onSubmit: () => void;
  submitLabel: string;
  timezone: string;
  /** The patient's other reminders, used to preview washout conflicts. */
  otherReminders: ReminderSpec[];
  /** Stable id so the preview can tell this reminder apart from the others. */
  reminderId: string;
  busy?: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [showValidation, setShowValidation] = useState(false);

  const dayLabels: Record<Weekday, string> = {
    0: t('days.sun'),
    1: t('days.mon'),
    2: t('days.tue'),
    3: t('days.wed'),
    4: t('days.thu'),
    5: t('days.fri'),
    6: t('days.sat'),
  };

  const patch = (partial: Partial<ReminderFormValue>) => onChange({ ...value, ...partial });

  const spec: ReminderSpec = {
    id: reminderId,
    patientId: 'preview',
    medicationName: value.medicationName || t('form.medication'),
    dosage: value.dosage,
    eye: value.eye,
    config: value.config,
    daysOfWeek: value.daysOfWeek,
    startDate: value.startDate,
    endDate: value.endDate,
    active: true,
  };

  const issues = validateReminder(spec);
  const nameMissing = value.medicationName.trim().length === 0;

  // Preview on the first day this reminder is actually active, so a
  // weekdays-only schedule does not preview an empty Sunday.
  const previewDate = useMemo(() => {
    const today = todayIn(timezone);
    const start = value.startDate > today ? value.startDate : today;
    for (let offset = 0; offset < 7; offset += 1) {
      const [y, m, d] = start.split('-').map(Number);
      const cursor = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12));
      cursor.setUTCDate(cursor.getUTCDate() + offset);
      const iso = cursor.toISOString().slice(0, 10);
      if (value.daysOfWeek.includes(cursor.getUTCDay() as Weekday)) return iso;
    }
    return start;
  }, [value.startDate, value.daysOfWeek, timezone]);

  const preview = useMemo(() => {
    if (issues.length > 0) return null;
    return previewSchedule(spec, otherReminders, previewDate);
    // `spec` is derived from `value` each render; depending on value is correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, otherReminders, previewDate, issues.length]);

  function submit() {
    setShowValidation(true);
    if (issues.length > 0 || nameMissing) return;
    onSubmit();
  }

  const showIssues = showValidation;

  return (
    <View>
      {/* -------------------------------------------------------- medication */}
      <Field
        label={t('form.medication')}
        hint={t('form.medicationHint')}
        error={showIssues && nameMissing ? t('validation.medicationRequired') : undefined}
      >
        <MedicationPicker
          value={value.medicationName}
          onChange={(name, medicationId, strength) =>
            patch({
              medicationName: name,
              medicationId,
              dosage: strength && value.dosage === '1 drop' ? `1 drop (${strength})` : value.dosage,
            })
          }
        />
      </Field>

      <Field label={t('form.dosage')}>
        <TextField
          value={value.dosage}
          onChangeText={(dosage) => patch({ dosage })}
          placeholder={t('form.dosagePlaceholder')}
          accessibilityLabel={t('form.dosage')}
        />
      </Field>

      <Field label={t('form.whichEye')}>
        <Segmented
          value={value.eye}
          onChange={(eye) => patch({ eye: eye as Eye })}
          options={[
            { value: 'left', label: t('eye.left') },
            { value: 'right', label: t('eye.right') },
            { value: 'both', label: t('eye.both') },
          ]}
        />
      </Field>

      {/* ---------------------------------------------------------- schedule */}
      <SectionHeading>{t('form.schedule')}</SectionHeading>

      <OptionList<ScheduleMode>
        value={value.config.mode}
        onChange={(mode) => patch({ config: defaultConfigFor(mode, value.config) })}
        options={[
          { value: 'interval', label: t('form.modeInterval'), hint: t('form.modeIntervalHint') },
          { value: 'count', label: t('form.modeCount'), hint: t('form.modeCountHint') },
          { value: 'times', label: t('form.modeTimes'), hint: t('form.modeTimesHint') },
        ]}
      />

      <Spacer size="lg" />

      {value.config.mode === 'interval' ? (
        <IntervalFields
          config={value.config}
          onChange={(config) => patch({ config })}
        />
      ) : null}

      {value.config.mode === 'count' ? (
        <CountFields config={value.config} onChange={(config) => patch({ config })} />
      ) : null}

      {value.config.mode === 'times' ? (
        <Field label={t('form.times')}>
          <TimeList
            minutes={value.config.minutes}
            addLabel={t('form.addTime')}
            removeLabel={t('common.delete')}
            onChange={(minutes) => patch({ config: { mode: 'times', minutes } })}
          />
        </Field>
      ) : null}

      <Field label={t('form.days')}>
        <DayPicker
          value={value.daysOfWeek}
          labels={dayLabels}
          onChange={(daysOfWeek) => patch({ daysOfWeek })}
        />
      </Field>

      {/* --------------------------------------------------------- validation */}
      {showIssues && issues.length > 0 ? (
        <Card
          style={{ backgroundColor: theme.colors.dangerSubtle, borderColor: theme.colors.danger }}
          accessibilityLiveRegion="polite"
        >
          {issues.map((issue) => (
            <Text
              key={issue.code}
              variant="body"
              style={{ color: theme.colors.onDangerSubtle, marginBottom: theme.spacing.xs }}
            >
              • {t(`validation.${issue.code}`, issue.params ?? {})}
            </Text>
          ))}
        </Card>
      ) : null}

      {/* ------------------------------------------------------------ preview */}
      {preview ? (
        <>
          <SectionHeading>{t('form.preview')}</SectionHeading>
          <Card>
            <Text variant="bodyStrong">{t('form.previewTitle')}</Text>
            <Spacer size="md" />

            {preview.candidateDoses.length === 0 ? (
              <Text variant="body" tone="muted">
                {t('form.previewNone')}
              </Text>
            ) : (
              preview.candidateDoses.map((dose, index) => (
                <Row key={`${dose.minute}-${index}`} style={{ marginBottom: theme.spacing.sm }}>
                  <Text variant="subheading" tone="primary" style={{ minWidth: 72 }}>
                    {minutesToHHMM(dose.minute)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text variant="body">{value.medicationName || t('form.medication')}</Text>
                    {dose.shifted > 0 ? (
                      <Text variant="caption" tone="warning">
                        {t('form.previewShifted', {
                          from: minutesToHHMM(dose.minute - dose.shifted),
                        })}
                      </Text>
                    ) : null}
                  </View>
                </Row>
              ))
            )}

            {preview.infeasible.length > 0 ? (
              <>
                <Spacer size="md" />
                <Text variant="bodyStrong" tone="danger">
                  {t('validation.infeasibleTitle')}
                </Text>
                {preview.infeasible.map((problem, index) => (
                  <Text
                    key={index}
                    variant="caption"
                    tone="danger"
                    style={{ marginTop: theme.spacing.xs }}
                  >
                    {problem.reason === 'past-midnight'
                      ? t('validation.infeasibleMidnight', {
                          name: problem.medicationName,
                          time: minutesToHHMM(problem.requestedMinute),
                        })
                      : t('validation.infeasibleShift', {
                          name: problem.medicationName,
                          time: minutesToHHMM(problem.requestedMinute),
                          gap: DEFAULT_GAP_MINUTES,
                        })}
                  </Text>
                ))}
              </>
            ) : null}

            {preview.otherDoses.length > 0 ? (
              <>
                <Spacer size="md" />
                <Text variant="caption" tone="muted">
                  {preview.otherDoses
                    .map((d) => `${minutesToHHMM(d.minute)} ${d.medicationName}`)
                    .join('  ·  ')}
                </Text>
              </>
            ) : null}
          </Card>
        </>
      ) : null}

      {/* ------------------------------------------------------------- alerts */}
      <Spacer size="md" />
      <Button
        label={t('instructions.linkLabel')}
        variant="ghost"
        icon="💧"
        onPress={() => router.push('/instructions')}
      />

      <SectionHeading>{t('form.alerts')}</SectionHeading>
      <Card>
        <ToggleRow
          label={t('form.sound')}
          value={value.soundEnabled}
          onChange={(soundEnabled) => patch({ soundEnabled })}
        />
        <ToggleRow
          label={t('form.vibration')}
          value={value.vibrateEnabled}
          onChange={(vibrateEnabled) => patch({ vibrateEnabled })}
        />
      </Card>

      <SectionHeading>{t('form.snoozeSettings')}</SectionHeading>
      <Field label={t('form.snoozeLength')}>
        <Stepper
          value={value.snoozeMinutes}
          min={5}
          max={60}
          step={5}
          suffix={t('form.minutes')}
          accessibilityLabel={t('form.snoozeLength')}
          onChange={(snoozeMinutes) => patch({ snoozeMinutes })}
        />
      </Field>
      <Field label={t('form.snoozeLimit')}>
        <Stepper
          value={value.snoozeLimit}
          min={0}
          max={10}
          accessibilityLabel={t('form.snoozeLimit')}
          onChange={(snoozeLimit) => patch({ snoozeLimit })}
        />
      </Field>

      <Spacer size="xl" />
      <Button label={submitLabel} size="large" loading={busy} onPress={submit} />
    </View>
  );
}
