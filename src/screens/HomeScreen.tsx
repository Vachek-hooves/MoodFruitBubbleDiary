import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  Modal,
  Share,
  Dimensions,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {BottomTabParamList} from '../navigation/BottomTabNavigator';
import moment from 'moment';

type NavigationProp = BottomTabNavigationProp<BottomTabParamList, 'Home'>;

const fruitImages: Record<string, any> = {
  cherry: require('../assets/cherry.png'),
  grape: require('../assets/grape.png'),
  orange: require('../assets/orange.png'),
  pineapple: require('../assets/pineapple.png'),
  watermelon: require('../assets/watermelon.png'),
};

const dailyTips = [
  {
    mood: 'cherry',
    tips: [
      "Take a break today – you need energy, but don't burn out.",
      "Write down the thoughts swirling in your head – it's liberating.",
      'Go for a walk without your phone – just look around.',
      'Allow yourself not to react instantly – calmness is stronger.',
      'Text someone a kind message – it will calm both of you.',
    ],
  },
  {
    mood: 'watermelon',
    tips: [
      'Think of a small reward for yourself.',
      'Do something playful – even just a few dance moves.',
    ],
  },
  {
    mood: 'orange',
    tips: [
      "Use your energy for something you've been putting off.",
      'Make a short plan – and feel the excitement of action.',
      'Come up with a micro-adventure for the day.',
      'Add a bright element to your outfit or space.',
      'Help someone – your drive can be useful right now.',
    ],
  },
  {
    mood: 'pineapple',
    tips: [
      "Do something unusual – even if it's small.",
      'Draw, write, change – let your brain stretch.',
      "Allow yourself to be weird – it's wonderful.",
      'Look at a familiar object from a different perspective.',
      'Listen to unusual music or a new genre.',
    ],
  },
  {
    mood: 'grape',
    tips: [
      "Enjoy slowness – there's no rush.",
      'Brew some tea, sit by the window – just do nothing.',
      'Listen to yourself: what exactly do you want right now?',
      'Spend time with nature – even just a few minutes.',
      'Gratitude heals: recall 3 things you are grateful for today.',
    ],
  },
];

const ideaPicture = require('../assets/picture_idea.png');

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const IS_VERY_SMALL_DEVICE = screenHeight < 600;
const IS_SMALL_DEVICE = screenHeight < 700;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [todayMood, setTodayMood] = useState<{
    fruit: string;
    emotion: string;
  } | null>(null);
  const [currentDateDisplay, setCurrentDateDisplay] = useState('');
  const [dailyTip, setDailyTip] = useState<string>('');
  const [infoVisible, setInfoVisible] = useState(false);

  const getTodayKey = () => {
    return moment().format('YYYY-MM-DD');
  };

  const generateDailyTip = (moodFruitId: string) => {
    let selectedTip = 'Discover new experiences today!';

    const moodTips = dailyTips.find(item => item.mood === moodFruitId);
    if (moodTips && moodTips.tips.length > 0) {
      const randomIndex = Math.floor(Math.random() * moodTips.tips.length);
      selectedTip = moodTips.tips[randomIndex];
    }
    setDailyTip(selectedTip);
  };

  useFocusEffect(
    useCallback(() => {
      const loadMoodAndTip = async () => {
        const key = getTodayKey();
        setCurrentDateDisplay(moment().format('MMMM Do, YYYY'));

        let moodFromStorage = null;
        try {
          const savedMood = await AsyncStorage.getItem(`mood_${key}`);
          if (savedMood) {
            try {
              moodFromStorage = JSON.parse(savedMood);
              setTodayMood(moodFromStorage);
            } catch (parseError) {
              console.error(
                '[HomeScreen] Failed to parse mood JSON:',
                parseError,
              );
              setTodayMood(null);
            }
          } else {
            setTodayMood(null);
          }
        } catch (error) {
          console.error(
            '[HomeScreen] Failed to get mood from AsyncStorage:',
            error,
          );
          setTodayMood(null);
        }

        if (moodFromStorage?.fruit) {
          generateDailyTip(moodFromStorage.fruit);
        } else {
          setDailyTip('');
        }
      };

      loadMoodAndTip();
    }, []),
  );

  const handlePress = () => {
    navigation.navigate('Calendar');
  };

  const navigateRelaxPlay = () => {
    navigation.navigate('RelaxPlay');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          'Check out this amazing app for tracking your daily mood with fruits!',
      });
    } catch (error: any) {
      console.error('Error sharing:', error.message);
    }
  };

  const moodContainerWidth = screenWidth * (IS_VERY_SMALL_DEVICE ? 0.8 : 0.85);
  const moodContainerHeight = moodContainerWidth * (316 / 363);
  const moodImageSize = moodContainerWidth * 0.7;
  const moodEmotionFontSize =
    screenWidth *
    (IS_VERY_SMALL_DEVICE ? 0.055 : IS_SMALL_DEVICE ? 0.065 : 0.08);
  const addIconSize = screenWidth * (IS_VERY_SMALL_DEVICE ? 0.13 : 0.18);
  const addTextFontSize =
    screenWidth *
    (IS_VERY_SMALL_DEVICE ? 0.035 : IS_SMALL_DEVICE ? 0.042 : 0.05);

  const tipContainerWidth = screenWidth * (IS_VERY_SMALL_DEVICE ? 0.75 : 0.85);
  const tipContainerHeight = tipContainerWidth * (139 / 312);
  const tipImageWidth = tipContainerWidth * 0.35;
  const tipImageHeight = tipImageWidth * (165 / 110);
  const tipTextFontSize =
    screenWidth *
    (IS_VERY_SMALL_DEVICE ? 0.03 : IS_SMALL_DEVICE ? 0.035 : 0.04);

  const modalWidth = screenWidth * 0.9;
  const modalMinHeight = screenHeight * (IS_VERY_SMALL_DEVICE ? 0.6 : 0.7);
  const modalLogoSize = modalWidth * 0.35;
  const modalInfoTextSize =
    screenWidth *
    (IS_VERY_SMALL_DEVICE ? 0.028 : IS_SMALL_DEVICE ? 0.032 : 0.038);
  const modalButtonSize = screenWidth * 0.13;

  const headerMarginTop = IS_VERY_SMALL_DEVICE ? 15 : IS_SMALL_DEVICE ? 30 : 70;
  const containerPaddingTop = IS_VERY_SMALL_DEVICE
    ? 5
    : IS_SMALL_DEVICE
    ? 15
    : 30;
  const rectangleMarginBottom = IS_VERY_SMALL_DEVICE
    ? 5
    : IS_SMALL_DEVICE
    ? 10
    : 20;
  const dateTextFontSize = screenWidth * (IS_VERY_SMALL_DEVICE ? 0.045 : 0.055);
  const dateTextMarginBottom = IS_VERY_SMALL_DEVICE ? 5 : 15;

  const headerTitleWidth = screenWidth * (IS_VERY_SMALL_DEVICE ? 0.3 : 0.45);
  const headerTitleHeight = headerTitleWidth * (73 / 173);
  const headerIconSize = screenWidth * (IS_VERY_SMALL_DEVICE ? 0.08 : 0.12);

  return (
    <ImageBackground
      source={require('../assets/background_loading.png')}
      style={styles.background}
      resizeMode="cover">
      {}
      <View style={[styles.header, {marginTop: headerMarginTop}]}>
        <Image
          source={require('../assets/title_home.png')}
          style={[
            styles.titleImage,
            {width: headerTitleWidth, height: headerTitleHeight},
          ]}
          resizeMode="contain"
        />
        {}
        <TouchableOpacity
          onPress={() => setInfoVisible(true)}
          style={styles.iconContainer}>
          <Image
            source={require('../assets/idea_of_icons.png')}
            style={[
              styles.icon,
              {width: headerIconSize, height: headerIconSize},
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {}
      <View
        style={[
          styles.container,
          {
            paddingTop: containerPaddingTop,
            justifyContent: IS_VERY_SMALL_DEVICE
              ? 'space-evenly'
              : 'flex-start',
          },
        ]}>
        <Text
          style={[
            styles.dateText,
            {fontSize: dateTextFontSize, marginBottom: dateTextMarginBottom},
          ]}>
          {currentDateDisplay}
        </Text>

        {}
        <TouchableOpacity
          style={[
            styles.rectangle,
            {
              width: moodContainerWidth,
              height: moodContainerHeight,
              marginBottom: rectangleMarginBottom,
            },
          ]}
          onPress={handlePress}>
          {todayMood ? (
            <>
              <Image
                source={fruitImages[todayMood.fruit]}
                style={[
                  styles.moodImage,
                  {width: moodImageSize, height: moodImageSize},
                ]}
                resizeMode="contain"
              />
              <Text
                style={[
                  styles.moodEmotionText,
                  {fontSize: moodEmotionFontSize},
                ]}>
                {todayMood.emotion}
              </Text>
            </>
          ) : (
            <>
              <Image
                source={require('../assets/add_icon.png')}
                style={[
                  styles.addIcon,
                  {width: addIconSize, height: addIconSize},
                ]}
                resizeMode="contain"
              />
              <Text style={[styles.addText, {fontSize: addTextFontSize}]}>
                Add Your Mood
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={navigateRelaxPlay}
          style={{
            borderWidth: 1,
            borderColor: '#ffffff' + 80,
            borderRadius: 20,
            paddingHorizontal: 30,
            paddingVertical: 10,
            backgroundColor: '#ffffff' + 40,
          }}>
          <Text style={{fontWeight: '500', fontSize: 38}}>Relax Play</Text>
        </TouchableOpacity>

        {}
        {dailyTip ? (
          <View
            style={[
              styles.tipContainer,
              {width: tipContainerWidth, height: tipContainerHeight},
            ]}>
            <Image
              source={ideaPicture}
              style={[
                styles.tipImage,
                {
                  width: tipImageWidth,
                  height: tipImageHeight,
                  left: -tipImageWidth * 0.2,
                },
              ]}
              resizeMode="contain"
            />
            <Text style={[styles.tipText, {fontSize: tipTextFontSize}]}>
              {dailyTip}
            </Text>
          </View>
        ) : null}
      </View>

      {}
      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View
              style={[
                styles.infoModal,
                {width: modalWidth, minHeight: modalMinHeight},
              ]}>
              <TouchableOpacity
                onPress={() => setInfoVisible(false)}
                style={styles.backIcon}>
                <Image
                  source={require('../assets/back_icon.png')}
                  style={{width: modalButtonSize, height: modalButtonSize}}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <Image
                source={require('../assets/image_logo.png')}
                style={[
                  styles.logoImage,
                  {width: modalLogoSize, height: modalLogoSize},
                ]}
                resizeMode="contain"
              />

              <Text style={[styles.infoText, {fontSize: modalInfoTextSize}]}>
                You don't need to write long texts here — just pick a fruit that
                matches your mood and store it in a gentle bubble.
                {'\n\n'}Over time, your mood will create an entire emotional
                garden that you can explore, review, and better understand
                yourself.
                {'\n\n'}We created this app to help you:
                {'\n\n'}• carefully observe your emotions
                {'\n'}• learn to let go of negativity
                {'\n'}• see the beauty in every day — even the simplest one
              </Text>

              <TouchableOpacity
                onPress={handleShare}
                style={styles.shareButton}>
                <Image
                  source={require('../assets/shar.png')}
                  style={{width: modalButtonSize, height: modalButtonSize}}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ImageBackground>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  header: {
    marginHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  titleImage: {
    marginRight: 10,
  },
  iconContainer: {
    position: 'absolute',
    right: 0,
  },
  icon: {},
  container: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontWeight: '700',
    color: '#000',
  },
  rectangle: {
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: 'rgba(240, 239, 239, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    marginBottom: 12,
  },
  moodImage: {
    marginBottom: 1,
  },
  moodEmotionText: {
    color: '#000',
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  addText: {
    color: '#000',
    fontWeight: '600',
  },
  tipContainer: {
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: 'rgba(240, 239, 239, 0.2)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    overflow: 'hidden',
  },
  tipImage: {
    marginRight: 10,
    position: 'relative',
    top: -10,
  },
  tipText: {
    flex: 1,
    color: '#000',
    fontWeight: '500',
    textAlign: 'left',
    paddingRight: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(244, 244, 244, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  infoModal: {
    backgroundColor: 'rgba(247, 202, 202, 0.9)',
    borderColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  backIcon: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  logoImage: {
    marginBottom: 10,
  },
  infoText: {
    color: '#000000',
    textAlign: 'center',
    marginTop: 10,
    flex: 1,
  },
  shareButton: {
    marginTop: 10,
    marginBottom: 20,
  },
});
