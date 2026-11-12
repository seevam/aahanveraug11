import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';

import { Text } from './primitives';
import { Button } from './Button';
import { useTheme } from '../theme/ThemeProvider';
import { isAllowedPlayerUrl, previewUrl, viewUrl } from '../instructions/videos';

/**
 * A Google Drive video, played in Drive's own embeddable player.
 *
 * A video that cannot load — no connection, or Drive refusing — is the normal
 * way for this to fail, so the failure state is a real screen: what went
 * wrong, a retry, and a way out to the browser. Never a blank rectangle.
 */
export function DriveVideo({ driveId }: { driveId: string }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const [failed, setFailed] = useState(false);
  // Remounting the WebView is the only dependable way to retry a failed load.
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setFailed(false);
    setAttempt((n) => n + 1);
  }, []);

  return (
    <View>
      <View
        style={{
          aspectRatio: 16 / 9,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          backgroundColor: '#000',
        }}
      >
        {failed ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.surface,
            }}
          >
            <Text variant="body" tone="secondary" style={{ textAlign: 'center' }}>
              {t('instructions.needsInternet')}
            </Text>
            <View style={{ height: theme.spacing.md }} />
            <Button label={t('common.retry')} variant="secondary" onPress={retry} />
          </View>
        ) : (
          <WebView
            key={`${driveId}-${attempt}`}
            source={{ uri: previewUrl(driveId) }}
            style={{ flex: 1, backgroundColor: '#000' }}
            // The player is Google's own page and needs scripts and storage.
            javaScriptEnabled
            domStorageEnabled
            // Start playing without a second tap, where the OS allows it.
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            // Nothing in a tutorial video needs a second window.
            setSupportMultipleWindows={false}
            scrollEnabled={false}
            originWhitelist={['https://*']}
            onShouldStartLoadWithRequest={(request) =>
              // Frames inside the player are Google's to assemble; only a
              // navigation of the whole view can be steered somewhere else.
              request.isTopFrame === false || isAllowedPlayerUrl(request.url)
            }
            onError={() => setFailed(true)}
            startInLoadingState
            renderLoading={() => (
              <View
                style={{
                  ...{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#000',
                }}
              >
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
            accessibilityLabel={t('instructions.title')}
          />
        )}
      </View>

      {/* Always available: a large video can be clumsy in a small player. */}
      <Pressable
        onPress={() => void Linking.openURL(viewUrl(driveId))}
        accessibilityRole="link"
        style={{ paddingVertical: theme.spacing.md, minHeight: theme.touchTarget.min }}
      >
        <Text variant="caption" tone="primary" style={{ textAlign: 'center', textDecorationLine: 'underline' }}>
          {t('instructions.openInBrowser')}
        </Text>
      </Pressable>
    </View>
  );
}
