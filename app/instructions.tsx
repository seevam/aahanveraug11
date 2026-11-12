import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmojiIcon, Row, Screen, SectionHeading, Spacer, Text } from '../src/components/primitives';
import { Button } from '../src/components/Button';
import { DriveVideo } from '../src/components/DriveVideo';
import { useTheme } from '../src/theme/ThemeProvider';
import { useAppStore } from '../src/stores/app-store';
import { SUPPORTED_LANGUAGES } from '../src/i18n';
import { thumbnailUrl, videosFor, type InstructionVideo } from '../src/instructions/videos';

/**
 * How to use eye drops — three short videos, one per language.
 *
 * The one in the patient's own language plays first; the others sit underneath
 * as thumbnails and swap in when tapped, so a caregiver who reads a different
 * language can still find theirs. The videos stream from Google Drive; see
 * `src/instructions/videos.ts` for why they are not bundled.
 */

function endonym(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.endonym ?? code;
}

function Thumbnail({ video, onPress }: { video: InstructionVideo; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [broken, setBroken] = useState(false);
  const name = endonym(video.language);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('instructions.watchIn', { language: name })}
      style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.8 : 1 })}
    >
      <View
        style={{
          aspectRatio: 16 / 9,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceRaised,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {broken ? null : (
          <Image
            source={{ uri: thumbnailUrl(video.driveId, 360) }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            resizeMode="cover"
            onError={() => setBroken(true)}
            accessible={false}
          />
        )}
        {/* A scrim keeps the play mark legible over any frame, and over nothing. */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(0,0,0,0.55)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <EmojiIcon symbol="▶" size={18} color="#fff" />
        </View>
      </View>
      <Text variant="bodyStrong" style={{ textAlign: 'center', marginTop: theme.spacing.sm }}>
        {name}
      </Text>
    </Pressable>
  );
}

export default function InstructionsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);

  // Starts in the app language; tapping a thumbnail swaps it into the player.
  const [selected, setSelected] = useState<string>(language);
  const { main, others } = videosFor(selected);

  return (
    <Screen>
      <Row style={{ justifyContent: 'center', marginTop: theme.spacing.sm }}>
        <EmojiIcon symbol="💧" size={40} />
      </Row>
      <Spacer size="sm" />
      <Text variant="title" accessibilityRole="header" style={{ textAlign: 'center' }}>
        {t('instructions.title')}
      </Text>
      <Spacer size="lg" />

      <DriveVideo key={main.driveId} driveId={main.driveId} />

      <SectionHeading>{t('instructions.otherLanguages')}</SectionHeading>
      <Row style={{ gap: theme.spacing.md, alignItems: 'flex-start' }}>
        {others.map((video) => (
          <Thumbnail key={video.driveId} video={video} onPress={() => setSelected(video.language)} />
        ))}
      </Row>

      <Spacer size="xl" />
      <Button label={t('common.done')} size="large" onPress={() => router.back()} />
    </Screen>
  );
}
