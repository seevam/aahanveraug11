import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme/ThemeProvider';
import { Card, Row, Spacer, Text } from './primitives';
import { formatMoney, loadImpact, type ImpactFigures } from '../content/impact';

/**
 * "Donations raised for eye frames" — display only.
 *
 * There is no donate button and no payment flow: fundraising lives outside the
 * app in this phase. Hidden entirely until there is something to report, so a
 * patient never sees a row of zeroes.
 */
export function ImpactCard() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [figures, setFigures] = useState<ImpactFigures | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadImpact().then((result) => {
      if (!cancelled) setFigures(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!figures) return null;
  if (figures.raised <= 0 && figures.framesFunded <= 0) return null;

  const raised = formatMoney(figures.raised, figures.currency, i18n.language);
  const perFrame = formatMoney(figures.costPerFrame, figures.currency, i18n.language);

  return (
    <Card
      style={{
        backgroundColor: theme.colors.primarySubtle,
        borderColor: theme.colors.primary,
      }}
    >
      <Text variant="label" tone="primary">
        {t('impact.heading')}
      </Text>

      <Spacer size="md" />

      <Row style={{ gap: theme.spacing.xl }}>
        <View style={{ flex: 1 }}>
          <Text variant="title" tone="primary">
            {raised}
          </Text>
          <Text variant="caption" tone="muted">
            {t('impact.raisedLabel')}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="title" tone="primary">
            {figures.framesFunded}
          </Text>
          <Text variant="caption" tone="muted">
            {t('impact.framesLabel')}
          </Text>
        </View>
      </Row>

      <Spacer size="md" />
      <Text variant="body" tone="secondary">
        {t('impact.perFrameNote', { amount: perFrame })}
      </Text>

      <Spacer size="sm" />
      <Text variant="caption" tone="muted">
        {t('impact.asOf', { date: figures.asOf })}
      </Text>
    </Card>
  );
}
