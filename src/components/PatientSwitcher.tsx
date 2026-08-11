import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { useTheme } from '../theme/ThemeProvider';
import { Card, Row, Text } from './primitives';
import { Button } from './Button';
import { useAppStore } from '../stores/app-store';
import type { Patient } from '../db/repositories';

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase();
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.primarySubtle,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Text variant="label" tone="primary" style={{ fontSize: size * 0.38 }}>
        {initials(name)}
      </Text>
    </View>
  );
}

/**
 * Always-visible patient switcher.
 *
 * Caregivers managing two or more people are the second success metric, and a
 * switcher buried in a settings tab does not get discovered. With a single
 * patient it stays a plain, non-interactive header so it costs nothing.
 */
export function PatientSwitcher() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const patients = useAppStore((s) => s.patients);
  const selectedId = useAppStore((s) => s.selectedPatientId);
  const selectPatient = useAppStore((s) => s.selectPatient);

  const selected: Patient | undefined = patients.find((p) => p.id === selectedId) ?? patients[0];
  if (!selected) return null;

  const single = patients.length === 1;

  return (
    <>
      <Pressable
        onPress={single ? undefined : () => setOpen(true)}
        disabled={single}
        accessibilityRole={single ? 'header' : 'button'}
        accessibilityLabel={selected.name}
        accessibilityHint={single ? undefined : t('profile.people')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          minHeight: theme.touchTarget.min,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radius.pill,
          alignSelf: 'flex-start',
          backgroundColor: single ? 'transparent' : theme.colors.surface,
          borderWidth: single ? 0 : 1,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Avatar name={selected.name} size={36} />
        <View>
          <Text variant="bodyStrong">{selected.name}</Text>
          {selected.relationship ? (
            <Text variant="caption" tone="muted">
              {selected.relationship}
            </Text>
          ) : null}
        </View>
        {single ? null : (
          <Text variant="body" tone="muted">
            ▾
          </Text>
        )}
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
        accessibilityViewIsModal
      >
        <Pressable
          style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' }}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Card
              style={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                paddingBottom: theme.spacing.xxl,
              }}
            >
              <Text variant="heading" accessibilityRole="header">
                {t('profile.people')}
              </Text>

              <ScrollView style={{ maxHeight: 360, marginTop: theme.spacing.lg }}>
                {patients.map((patient) => {
                  const isSelected = patient.id === selected.id;
                  return (
                    <Pressable
                      key={patient.id}
                      onPress={async () => {
                        await selectPatient(patient.id);
                        setOpen(false);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={patient.name}
                      style={({ pressed }) => ({
                        minHeight: theme.touchTarget.comfortable,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: theme.spacing.md,
                        padding: theme.spacing.md,
                        marginBottom: theme.spacing.sm,
                        borderRadius: theme.radius.md,
                        backgroundColor: isSelected
                          ? theme.colors.primarySubtle
                          : theme.colors.surface,
                        borderWidth: 1,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Avatar name={patient.name} />
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong">{patient.name}</Text>
                        {patient.relationship ? (
                          <Text variant="caption" tone="muted">
                            {patient.relationship}
                          </Text>
                        ) : null}
                      </View>
                      {isSelected ? (
                        <Text variant="subheading" tone="primary">
                          ✓
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Row style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
                <Button
                  label={t('profile.addPerson')}
                  variant="secondary"
                  style={{ flex: 1 }}
                  onPress={() => {
                    setOpen(false);
                    router.push('/patient/new');
                  }}
                />
                <Button
                  label={t('common.close')}
                  variant="ghost"
                  onPress={() => setOpen(false)}
                />
              </Row>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
