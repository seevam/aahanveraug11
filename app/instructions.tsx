import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, EmojiIcon, Row, Screen, SectionHeading, Spacer, Text } from '../src/components/primitives';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeProvider';
import { capColours } from '../src/theme/tokens';
import { DEFAULT_GAP_MINUTES } from '../src/scheduling/types';

/**
 * How to use eye drops.
 *
 * General technique guidance, not personalised advice — the disclaimer at the
 * top says so plainly and is not dismissible. Every step is numbered and
 * written as one short instruction, because this is read by someone who may be
 * holding a bottle in the other hand with one eye already wet.
 *
 * The content should be reviewed by an ophthalmologist before public launch,
 * and the Hindi and Tamil translations by a native speaker. Technique guidance
 * that is subtly wrong is worse than none.
 */

const STEP_COUNT = 10;
const TIP_COUNT = 6;

/**
 * The cap colours worth explaining, each paired with the medication class it
 * signals. Only the classes the convention actually covers appear here —
 * lubricants, anti-allergy drops and antivirals have no assigned colour, so
 * listing them would imply a rule that does not exist.
 */
const CAP_COLOUR_LEGEND = [
  { colour: 'teal', classKey: 'glaucoma' },
  { colour: 'pink', classKey: 'steroid' },
  { colour: 'tan', classKey: 'antibiotic' },
  { colour: 'red', classKey: 'mydriatic' },
] as const;

function Step({ number, text }: { number: number; text: string }) {
  const theme = useTheme();
  return (
    <Row style={{ alignItems: 'flex-start', marginBottom: theme.spacing.lg }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Text variant="label" style={{ color: theme.colors.onPrimary }}>
          {number}
        </Text>
      </View>
      <Text variant="body" style={{ flex: 1, paddingTop: 3 }}>
        {text}
      </Text>
    </Row>
  );
}

export default function InstructionsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const steps = Array.from({ length: STEP_COUNT }, (_, i) => t(`instructions.step${i + 1}`));
  const tips = Array.from({ length: TIP_COUNT }, (_, i) => t(`instructions.tip${i + 1}`));

  return (
    <Screen>
      <View style={{ alignItems: 'center' }}>
        <EmojiIcon symbol="💧" size={52} />
      </View>

      <Spacer size="md" />
      <Text variant="title" accessibilityRole="header" style={{ textAlign: 'center' }}>
        {t('instructions.title')}
      </Text>

      <Spacer size="md" />
      <Text variant="body" tone="secondary">
        {t('instructions.intro')}
      </Text>

      <Spacer size="lg" />
      <Card
        style={{
          backgroundColor: theme.colors.warningSubtle,
          borderColor: theme.colors.warning,
        }}
      >
        <Text variant="caption" style={{ color: theme.colors.onWarningSubtle }}>
          {t('instructions.disclaimer')}
        </Text>
      </Card>

      <SectionHeading>{t('instructions.stepsHeading')}</SectionHeading>
      {steps.map((text, index) => (
        <Step key={index} number={index + 1} text={text} />
      ))}

      <Card
        style={{
          backgroundColor: theme.colors.primarySubtle,
          borderColor: theme.colors.primary,
        }}
      >
        <Text variant="bodyStrong" tone="primary">
          {t('instructions.gapHeading')}
        </Text>
        <Spacer size="sm" />
        <Text variant="body" tone="secondary">
          {t('instructions.gapBody', { minutes: DEFAULT_GAP_MINUTES })}
        </Text>
      </Card>

      {/* The cap-colour convention, with its caveat stated where people see it
          rather than buried in a code comment. */}
      <SectionHeading>{t('capColour.heading')}</SectionHeading>
      <Card>
        <Text variant="body" tone="secondary">
          {t('capColour.note')}
        </Text>
        <Spacer size="md" />
        <View style={{ gap: theme.spacing.sm }}>
          {CAP_COLOUR_LEGEND.map(({ colour, classKey }) => (
            <Row key={colour}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: capColours[colour],
                  borderWidth: 1,
                  borderColor: theme.colors.borderStrong,
                }}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
                {t(`capColour.${colour}`)} — {t(`medicationClass.${classKey}`)}
              </Text>
            </Row>
          ))}
        </View>
      </Card>

      <SectionHeading>{t('instructions.tipsHeading')}</SectionHeading>
      {tips.map((text, index) => (
        <Row key={index} style={{ alignItems: 'flex-start', marginBottom: theme.spacing.md }}>
          <Text variant="body" tone="primary">
            •
          </Text>
          <Text variant="body" tone="secondary" style={{ flex: 1 }}>
            {text}
          </Text>
        </Row>
      ))}

      <Spacer size="xl" />
      <Button label={t('common.done')} size="large" onPress={() => router.back()} />
    </Screen>
  );
}
