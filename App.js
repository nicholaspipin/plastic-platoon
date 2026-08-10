import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

const DEFAULT_GAME_URL = 'https://nicholaspipin.github.io/plastic-platoon/';

export default function App() {
  const [reloadKey, setReloadKey] = useState(0);
  const [loadError, setLoadError] = useState('');
  const gameUrl = process.env.EXPO_PUBLIC_PLASTIC_PLATOON_URL || DEFAULT_GAME_URL;
  const injectedJavaScript = useMemo(
    () => `
      document.documentElement.style.background = '#1f3323';
      document.body.style.background = '#1f3323';
      true;
    `,
    []
  );

  return (
    <View style={styles.root}>
      <StatusBar hidden style="light" />
      <WebView
        key={reloadKey}
        source={{ uri: gameUrl }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        pullToRefreshEnabled={false}
        bounces={false}
        overScrollMode="never"
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        startInLoadingState
        onLoadStart={() => setLoadError('')}
        onError={(event) => setLoadError(event.nativeEvent.description || 'Unable to load Plastic Platoon.')}
        onHttpError={(event) => setLoadError(`Plastic Platoon returned HTTP ${event.nativeEvent.statusCode}.`)}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color="#f1c956" size="large" />
            <Text style={styles.loadingText}>Loading Plastic Platoon</Text>
          </View>
        )}
      />
      {loadError ? (
        <View style={styles.errorPanel}>
          <Text style={styles.errorTitle}>Could not load the battlefield</Text>
          <Text style={styles.errorCopy}>{loadError}</Text>
          <Text style={styles.errorUrl}>{gameUrl}</Text>
          <Pressable style={styles.retryButton} onPress={() => setReloadKey((value) => value + 1)}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {Platform.OS === 'web' ? <Text style={styles.webHint}>Expo shell preview</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1f3323'
  },
  webview: {
    flex: 1,
    backgroundColor: '#1f3323'
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#1f3323'
  },
  loadingText: {
    color: '#fff8d8',
    fontSize: 16,
    fontWeight: '800'
  },
  errorPanel: {
    position: 'absolute',
    left: 22,
    right: 22,
    top: '34%',
    padding: 18,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#6e431a',
    backgroundColor: '#442915'
  },
  errorTitle: {
    color: '#fff8d8',
    fontSize: 20,
    fontWeight: '900'
  },
  errorCopy: {
    marginTop: 8,
    color: '#ffe1a8',
    fontSize: 14,
    fontWeight: '700'
  },
  errorUrl: {
    marginTop: 10,
    color: '#f1c956',
    fontSize: 12
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#e95a37'
  },
  retryText: {
    color: '#fff8d8',
    fontSize: 15,
    fontWeight: '900'
  },
  webHint: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    color: '#fff8d8',
    fontSize: 11,
    opacity: 0.5
  }
});
