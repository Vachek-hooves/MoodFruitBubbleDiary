import { useEffect, useRef, useState } from 'react';
import { BackHandler, Linking, Alert, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebView from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { INITIAL_URL,URL_IDENTIFAIRE } from '../../config/credentials';

export default function TargetScreen({ route }) {
  const navigation = useNavigation();
  const webViewRef = useRef(null);
  // const [localOpenWithPush, setLocalOpenWithPush] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState(null);
  const isFirstLoad = useRef(true);
  const { isFirstVisit, timeStamp, oneSignalPermissionStatus, url } =
    route.params;

  useEffect(() => {
    // console.log('HANDLE BACK BTN');
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Get current URL from WebView
        const currentUrl = webViewUrl;

        // If we're already on a blank page, navigate to base URL
        if (currentUrl === 'about:blank') {
          const baseUrl = `${INITIAL_URL}${URL_IDENTIFAIRE}?${URL_IDENTIFAIRE}=1`;
          setWebViewUrl(baseUrl);
          return true;
        }

        // If we can go back, check the previous page after a small delay
        if (webViewRef.current && webViewRef.current.canGoBack) {
          setTimeout(() => {
            const previousUrl = webViewRef.current?.url;
            if (previousUrl === 'about:blank') {
              // If previous page is blank, navigate to base URL
              const baseUrl = `${INITIAL_URL}${URL_IDENTIFAIRE}?${URL_IDENTIFAIRE}=1`;
              setWebViewUrl(baseUrl);
              return true;
            }
            // If previous page is not blank, allow navigation
            webViewRef.current.goBack();
          }, 100);
          return true;
        }

        // If we can't go back anywhere, navigate to base URL
        const baseUrl = `${INITIAL_URL}${URL_IDENTIFAIRE}?${URL_IDENTIFAIRE}=1`;
        setWebViewUrl(baseUrl);
        return true;
      },
    );

    return () => backHandler.remove();
  }, [navigation, webViewUrl]);

  useEffect(() => {
    fetch(
      `${INITIAL_URL}${URL_IDENTIFAIRE}?event=webview_open&timestamp_user_id=${timeStamp}`,
    );
  }, []);

  useEffect(() => {
    if (isFirstVisit && oneSignalPermissionStatus) {
      fetch(
        `${INITIAL_URL}${URL_IDENTIFAIRE}?event=push_subscribe&timestamp_user_id=${timeStamp}`,
      );
    }
  }, [isFirstVisit, oneSignalPermissionStatus]);

  useEffect(() => {
    const sendUniqVisit = async () => {
      if (isFirstVisit) {
        const storedTimeStamp = await AsyncStorage.getItem('timeStamp');

        fetch(
          `${INITIAL_URL}${URL_IDENTIFAIRE}?event=uniq_visit&timestamp_user_id=${storedTimeStamp}`,
        );
      }
    };
    sendUniqVisit();
  }, [isFirstVisit]);

  useEffect(() => {
    const initPushState = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const storedPushState = await AsyncStorage.getItem('openedWithPush');

        const shouldEnablePush =
          storedPushState === 'true' || route.params.openWithPush;
        if (shouldEnablePush) {
          console.log('Setting localOpenWithPush to true');
          // setLocalOpenWithPush(true);
          // Clear the push state immediately after reading
          // await AsyncStorage.removeItem('openedWithPush');
          console.log('Cleared push state from storage');
        }
      } catch (error) {
        console.error('Error checking push state:', error);
      }
    };

    initPushState();
  }, []);

  // Modify the initialization effect
  useEffect(() => {
    const initializeWebView = async () => {
      // if (isFirstLoad.current && isPushStateInitialized) {
      if (isFirstLoad.current) {
        try {
          // console.log('isPushStateInitialized', isPushStateInitialized);
          // console.log('this link insert cause of push???', url);
          setWebViewUrl(url);
          isFirstLoad.current = false;
        } catch (error) {
          console.error('Error initializing WebView:', error);
          Alert.alert('Error', String(error.message));
        }
      }
    };

    initializeWebView();
  }, [url]);

  // Modify the navigation state change handler
  const handleNavigationStateChange = navState => {
    // Update WebView's canGoBack state
    if (webViewRef.current) {
      webViewRef.current.canGoBack = navState.canGoBack;
    }

    // Only handle blank pages if we're not in initial loading
    if (navState.url === 'about:blank' && !isFirstLoad.current) {
      const baseUrl = `${INITIAL_URL}${URL_IDENTIFAIRE}?${URL_IDENTIFAIRE}=1`;
      setWebViewUrl(baseUrl);
    }
  };

  // Modify the URL monitoring effect
  useEffect(() => {
    if (webViewUrl === 'about:blank' && !isFirstLoad.current) {
      const baseUrl = `${INITIAL_URL}${URL_IDENTIFAIRE}?${URL_IDENTIFAIRE}=1`;
      setWebViewUrl(baseUrl);
    }
  }, [webViewUrl]);

  const renderContent = () => {
    // Wrapper function to handle the async nature of handleCustomUrl
    const onShouldStartLoadWithRequest = event => {
      // console.log('onShouldStartLoadWithRequest started');
      const { url } = event;

      // if (url && !url.startsWith('http') && !url.startsWith('https')) {
      //   console.log('UNKNOWN URL !', url);
      //   // return false;
      // }

      // console.log('Intercepted URL:', url);
      // Handle RBC intent URL
      if (url.startsWith('intent://rbcbanking')) {
        console.log('RBC URL detected:', url);
        // Extract the scheme and package from the intent URL
        const scheme = 'rbcbanking';
        const packageName = 'com.rbc.mobile.android';

        try {
          Linking.openURL(
            `${scheme}://${url.split('?')[1].split('#')[0]}`,
          ).catch(() => {
            // If custom scheme fails, try using intent
            Linking.sendIntent('android.intent.action.VIEW', [
              { key: 'package_name', value: packageName },
            ]).catch(error => {
              console.error('Error opening RBC app:', error);
              Alert.alert(
                'App Not Found',
                'The RBC banking app is not installed.',
                [{ text: 'OK' }],
              );
            });
          });
        } catch (error) {
          console.error('Error parsing RBC URL:', error);
        }
        return false;
      }

      if (
        url.startsWith('mailto:') ||
        url.startsWith('intent://') ||
        url.startsWith('scotiabank://') ||
        url.startsWith('cibcbanking://') ||
        url.startsWith('intent://rbcbanking') ||
        url.startsWith('bncmobile:/') ||
        url.startsWith('tdct://') ||
        url.startsWith('bmoolbb://') ||
        url.startsWith('bmo://') ||
        url.startsWith('rbc://') ||
        url.startsWith('https://m.facebook.com/') ||
        url.startsWith('https://www.facebook.com/') ||
        url.startsWith('https://www.instagram.com/') ||
        url.startsWith('https://twitter.com/') ||
        url.startsWith('https://www.whatsapp.com/') ||
        url.startsWith('fb://') ||
        url.startsWith('googlepay://') ||
        url.startsWith('https://t.me/candyspinz') ||
        url.startsWith('https://t.me/') ||
        // Netherlands
        url.startsWith('https://betalen.rabobank.nl/') ||
        url.startsWith('nl-asnbank-sign://') ||
        url.startsWith('nl-snsbank-sign://') ||
        url.startsWith('https://sso.revolut.com/') ||
        url.startsWith('https://myaccount.ing.com/') ||
        url.startsWith('https://oba.revolut.com/') ||
        url.startsWith('nl-abnamro-deeplink.psd2.consent://') ||
        url.startsWith('https://www.abnamro.nl/') ||
        url.startsWith('nl-regiobank-sign://') ||
        url.startsWith('phonepe://') ||
        url.startsWith('upi://') ||
        url.startsWith('paytmmp://') ||
        url.startsWith('paytm://') ||
        // Skrill payment schemes
        url.startsWith('skrill://') ||
        url.startsWith('skrillpayments://') ||
        url.startsWith('com.moneybookers.skrillpayments://') ||
        url.startsWith('com.moneybookers.skrillpayments') ||
        url.startsWith('market://') ||
        url.startsWith('https://www.skrill.com/') ||
        url.startsWith('https://account.skrill.com/') ||
        url.startsWith('https://wallet.skrill.com/') ||
        url.startsWith('monzo://')
      ) {
        // Handle banking apps and crypto wallets
        console.log('app url', url);

        Linking.openURL(url).catch(error => {
          Alert.alert('App Not Found', 'The requested app is not installed.', [
            { text: 'OK' },
          ]);
        });
        return false;
      } else if (url && !url.startsWith('http') && !url.startsWith('https')) {
        console.log('UNKNOWN URL !', url);
        return false;
      }
      // console.log('onShouldStartLoadWithRequest finished');
      // Handle regular web URLs to be opened in the webview ,logic to be added ....
      return true;
    };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar
          barStyle="default" // Options: 'dark-content', 'light-content', 'default'
          backgroundColor="#000000" // Background color for Android
          translucent={true} // Makes status bar transparent on Android
          hidden={true}
        />
        <WebView
          ref={webViewRef}
          // source={{uri: webViewUrl}}
          source={{ uri: url }}
          // source={{uri: 'https://www.dou.ua'}}
          // onLoadStart={handleLoadStart}
          // onLoadEnd={handleLoadEnd}
          // style={{flex: 1, opacity: isLoading ? 0 : 1}}
          style={{ flex: 1 }}
          originWhitelist={[
            '*',
            'http://*',
            'https://*',
            'intent://*',
            'tel:*',
            'mailto:*',
            'scotiabank://',
            'bmo://',
            'td://',
            'nbc://',
            'cibc://',
            'bmoolbb://*',
            'scotiabank://',
            'rbcbanking://',
            'tdct://',
            'cibcbanking://',
            'www.cibconline.cibc.com://',
            'secure.scotiabank.com',
            'rbc://*',
            'monzo://',
            // Skrill schemes
            'skrill://',
            'skrillpayments://*',
            'com.moneybookers.skrillpayments://*',
            'com.moneybookers.skrillpayments',
            'market://',
            // ' https://app.revolut.com',
          ]}
          onLoad={() => {
            // console.log('WebView fully loaded');
            // handleWebViewLoad(); // Uncomment if prefer onLoad over onLoadStart
          }}
          onError={syntheticEvent => {
            // Alert.alert('WebView Error', syntheticEvent.nativeEvent.description);
          }}
          onLoadError={syntheticEvent => {
            // Alert.alert('Load Error', syntheticEvent.nativeEvent.description);
          }}
          thirdPartyCookiesEnabled={true}
          allowsBackForwardNavigationGestures={true}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowFileAccess={true}
          javaScriptCanOpenWindowsAutomatically={true}
          setSupportMultipleWindows={false} // prevent opening external browser
          onMessage={event => {
            console.log('WebView Message:', event.nativeEvent.data);
          }}
          onNavigationStateChange={navState => {
            // Updates webview's canGoBack state
            //   console.log('navState', navState.url);
            if (webViewRef.current) {
              // console.log('webViewRef.current', webViewRef.current);
              webViewRef.current.canGoBack = navState.canGoBack;
            }
            handleNavigationStateChange(navState);
          }}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        />
      </SafeAreaView>
    );
  };

  return renderContent();
}
