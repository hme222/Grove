import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { colors } from './theme.generated';

// FloraGrove for iPhone: a native shell around the web app. The address comes from EXPO_PUBLIC_APP_URL (see
// .env.example), so no address is written in the code.
//
// What the shell does today: loads the app, shows a retry screen when it cannot, and sends links to other sites to
// Safari. What it does not do yet: native push notifications and anything that talks between the web app and the phone.
// Apple can reject a wrapper that adds nothing native (guideline 4.2), so those come before an App Store submission.

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || '';
const BACKGROUND = colors.forest; // the app's theme color, so there is no white flash while it loads

function originOf(url) {
  try { return new URL(url).origin; } catch { return ''; }
}
const APP_ORIGIN = originOf(APP_URL);

export default function App() {
  const web = useRef(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Anything that is not the app itself opens outside it: another site in Safari, a mail link in Mail.
  const allow = useCallback((request) => {
    const url = request.url;
    if (url === 'about:blank' || originOf(url) === APP_ORIGIN) return true;
    Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  const retry = () => {
    setFailed(false);
    setLoading(true);
    web.current?.reload();
  };

  if (!APP_URL) {
    return (
      <SafeAreaView style={styles.fill}>
        <StatusBar style="light" />
        <View style={styles.center}>
          <Text style={styles.title}>FloraGrove isn’t set up yet</Text>
          <Text style={styles.body}>Set EXPO_PUBLIC_APP_URL to the address of the web app, then build again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.fill}>
      <StatusBar style="light" />
      {failed ? (
        <View style={styles.center}>
          <Text style={styles.title}>Can’t reach FloraGrove</Text>
          <Text style={styles.body}>Check your connection. Nothing you saved is lost.</Text>
          <Pressable accessibilityRole="button" onPress={retry} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          ref={web}
          source={{ uri: APP_URL }}
          style={styles.fill}
          containerStyle={styles.fill}
          originWhitelist={['https://*']}
          onShouldStartLoadWithRequest={allow}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setFailed(true); }}
          onHttpError={(e) => { if (e.nativeEvent.statusCode >= 500) { setLoading(false); setFailed(true); } }}
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          sharedCookiesEnabled
          decelerationRate="normal"
        />
      )}
      {loading && !failed ? (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color={colors.sprout} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: BACKGROUND },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { color: colors.cream, fontSize: 22, fontWeight: '600', textAlign: 'center' },
  body: { color: colors.sage, fontSize: 17, lineHeight: 24, textAlign: 'center' },
  button: { marginTop: 8, minHeight: 48, minWidth: 160, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.lime },
  buttonText: { color: colors.root, fontSize: 17, fontWeight: '700' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: BACKGROUND },
});
