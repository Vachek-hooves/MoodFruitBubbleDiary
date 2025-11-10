import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

const fruits = [
  {
    id: 'cherry',
    image: require('../assets/cherry.png'),
    title: 'Passion / Tension',
    mood: 'Strong emotions, internal charge. It can be both love, drive, inspiration, and nervous excitement or irritation.',
    description:
      '"Your day is busy. You are passionate, you feel everything to the maximum. Sometimes it’s good, sometimes you should take a deep breath."',
  },
  {
    id: 'watermelon',
    image: require('../assets/watermelon.png'),
    title: 'Joy / Holiday',
    mood: 'Carefree, lightness, a feeling of summer and pleasure.',
    description:
      '"You are like a watermelon in the heat — you refresh everything around you. Your energy is a holiday that you want to share with others."',
  },
  {
    id: 'orange',
    image: require('../assets/orange.png'),
    title: 'Energy / Optimism',
    mood: 'Activity, desire to do something, inspiration. You are charged with movement, change, laughter. This day is your chance to use your energy correctly."',
    description:
      '"The sun is inside you. You are charged with movement, change, laughter. This day is your chance to use your energy correctly."',
  },
  {
    id: 'pineapple',
    image: require('../assets/pineapple.png'),
    title: 'Creativity / Unusualness',
    mood: 'You are in an unconventional state — either joking, or dreaming, or looking for the strange in the ordinary.',
    description:
      '"You are like a pineapple among apples. Today you want something different, unconventional. Embrace your uniqueness."',
  },
  {
    id: 'grape',
    image: require('../assets/grape.png'),
    title: 'Peace / Harmony',
    mood: 'Balance, inner peace, pleasure from the simple.',
    description:
      '"You are in the moment. No rush, no drama. Just a day when it’s good to be yourself."',
  },
];

const MOODS_STORAGE_KEY = '@MoodsByDate';

const CalendarMoodSelector = () => {
  const {width, height} = useWindowDimensions();
  const isSmallScreen = width < 380;

  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedFruit, setSelectedFruit] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(moment());
  const [moodsByDate, setMoodsByDate] = useState<{[key: string]: string}>({});

  const loadMoods = useCallback(async () => {
    try {
      const storedMoods = await AsyncStorage.getItem(MOODS_STORAGE_KEY);
      if (storedMoods !== null) {
        setMoodsByDate(JSON.parse(storedMoods));
      } else {
        setMoodsByDate({});
      }
    } catch (e) {
      console.error('Failed to load moods from storage:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMoods();
      setSelectedDate(null);
      setSelectedFruit(null);
    }, [loadMoods]),
  );

  useEffect(() => {
    const saveMoods = async () => {
      try {
        await AsyncStorage.setItem(
          MOODS_STORAGE_KEY,
          JSON.stringify(moodsByDate),
        );
      } catch (e) {
        console.error('Failed to save moods to storage:', e);
      }
    };

    saveMoods();
  }, [moodsByDate]);

  const daysInMonth = Array.from(
    {length: currentDate.daysInMonth()},
    (_, i) => i + 1,
  );
  const monthYear = currentDate.format('MMMM YYYY');

  const handlePrev = () => {
    setCurrentDate(moment(currentDate).subtract(1, 'month'));
    setSelectedDate(null);
    setSelectedFruit(null);
  };

  const handleNext = () => {
    setCurrentDate(moment(currentDate).add(1, 'month'));
    setSelectedDate(null);
    setSelectedFruit(null);
  };

  const handleFruitSelect = async (fruitId: string) => {
    if (selectedDate) {
      const dateKey = currentDate.date(selectedDate).format('YYYY-MM-DD');

      const selectedFruitDetails = fruits.find(f => f.id === fruitId);
      const moodDataToSave = {
        fruit: fruitId,
        emotion: selectedFruitDetails?.title ?? 'Unknown',
      };

      try {
        await AsyncStorage.setItem(
          `mood_${dateKey}`,
          JSON.stringify(moodDataToSave),
        );
        console.log(`Saved mood for ${dateKey}:`, moodDataToSave);
      } catch (e) {
        console.error(`Failed to save mood for ${dateKey} to storage:`, e);
      }

      setMoodsByDate(prevMoods => ({
        ...prevMoods,
        [dateKey]: fruitId,
      }));
    }
    setSelectedFruit(fruitId);
  };

  const handleBackToFruits = () => setSelectedFruit(null);

  const handleBackToCalendar = () => {
    setSelectedFruit(null);
    setSelectedDate(null);
  };

  const responsiveStyles = StyleSheet.create({
    cardFruits: {
      backgroundColor: 'rgba(11, 10, 10, 0.3)',
      borderRadius: 25,
      padding: isSmallScreen ? 15 : 20,
      margin: isSmallScreen ? 10 : 20,
      borderWidth: 1,
      borderColor: '#fff',
      minHeight: isSmallScreen ? height * 0.5 : 450,
      justifyContent: 'space-between',
    },
    fruitBox: {
      width: isSmallScreen ? '30%' : '45%',
      marginVertical: isSmallScreen ? 5 : 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#fff',
      borderRadius: 16,
      padding: isSmallScreen ? 5 : 10,
      position: 'relative',
    },
    fruitImage: {
      width: isSmallScreen ? 50 : 80,
      height: isSmallScreen ? 50 : 80,
    },
    card: {
      backgroundColor: 'rgba(11, 10, 10, 0.3)',
      borderRadius: 25,
      padding: isSmallScreen ? 15 : 20,
      margin: isSmallScreen ? 10 : 20,
      borderWidth: 1,
      borderColor: '#fff',
      minHeight: isSmallScreen ? height * 0.5 : null,
    },
    fruitDetailImage: {
      width: isSmallScreen ? 50 : 80,
      height: isSmallScreen ? 50 : 80,
      alignSelf: 'center',
      marginBottom: 10,
    },
    title: {
      fontSize: isSmallScreen ? 16 : 22,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
      color: '#fff',
    },
    label: {
      fontWeight: 'bold',
      marginTop: 8,
      color: '#fff',
      textAlign: 'center',
      fontSize: isSmallScreen ? 12 : 16,
    },
    text: {
      textAlign: 'center',
      marginBottom: 8,
      paddingHorizontal: 8,
      color: '#fff',
      fontSize: isSmallScreen ? 10 : 14,
    },
  });

  return (
    <ImageBackground
      source={require('../assets/background_calendar.png')}
      style={styles.background}>
      {}
      <SafeAreaView style={styles.safeAreaContent}>
        {}
        <View style={styles.contentContainer}>
          <Image
            source={require('../assets/calendar_im.png')}
            style={styles.calendarImage}
            resizeMode="contain"
          />

          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handlePrev}>
              <Text style={styles.arrow}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.monthText}>{monthYear}</Text>
            <TouchableOpacity onPress={handleNext}>
              <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          {!selectedDate ? (
            <FlatList
              data={daysInMonth}
              keyExtractor={item => item.toString()}
              numColumns={7}
              contentContainerStyle={styles.calendarGrid}
              renderItem={({item}) => {
                const dateKey = currentDate.date(item).format('YYYY-MM-DD');
                const storedMood = moodsByDate[dateKey];
                const fruitImageSource = storedMood
                  ? fruits.find(f => f.id === storedMood)?.image
                  : null;

                return (
                  <TouchableOpacity
                    style={[
                      styles.dayCircle,
                      selectedDate === item && styles.selectedDayCircle,
                      storedMood && styles.dayCircleWithMood,
                    ]}
                    onPress={() => setSelectedDate(item)}>
                    {fruitImageSource ? (
                      <Image
                        source={fruitImageSource}
                        style={styles.moodFruitImage}
                      />
                    ) : (
                      <Text style={styles.dayText}>{item}</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          ) : !selectedFruit ? (
            <View style={responsiveStyles.cardFruits}>
              <Text style={styles.header}>Choose your mood:</Text>
              <View style={styles.grid}>
                {fruits.map(fruit => (
                  <View key={fruit.id} style={responsiveStyles.fruitBox}>
                    <Image
                      source={fruit.image}
                      style={responsiveStyles.fruitImage}
                    />

                    <TouchableOpacity
                      onPress={() => handleFruitSelect(fruit.id)}
                      style={styles.infoButton}>
                      <Text style={styles.info}>i</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={handleBackToCalendar}
                style={styles.backButton}>
                <Image
                  source={require('../assets/back_icon.png')}
                  style={styles.backIconImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView contentContainerStyle={responsiveStyles.card}>
              <Image
                source={fruits.find(f => f.id === selectedFruit)?.image}
                style={responsiveStyles.fruitDetailImage}
              />
              <Text style={responsiveStyles.title}>
                {fruits.find(f => f.id === selectedFruit)?.title}
              </Text>
              <Text style={responsiveStyles.label}>Mood:</Text>
              <Text style={responsiveStyles.text}>
                {fruits.find(f => f.id === selectedFruit)?.mood}
              </Text>
              <Text style={responsiveStyles.label}>Description:</Text>
              <Text style={responsiveStyles.text}>
                {fruits.find(f => f.id === selectedFruit)?.description}
              </Text>
              <TouchableOpacity
                onPress={handleBackToFruits}
                style={styles.backButton}>
                <Image
                  source={require('../assets/back_icon.png')}
                  style={styles.backIconImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeAreaContent: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 80,
    flex: 1,
  },
  calendarImage: {
    width: 170,
    height: 70,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: -80,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(11, 10, 10, 0.3)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: -20,
  },
  monthText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  arrow: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '700',
    paddingHorizontal: 5,
  },
  calendarGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dayCircle: {
    width: (Dimensions.get('window').width - 60) / 7,
    height: (Dimensions.get('window').width - 60) / 7,
    margin: 2,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: 'rgba(11, 10, 10, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayCircle: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  dayCircleWithMood: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  moodFruitImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  infoButton: {
    position: 'absolute',
    top: 5,
    right: 10,
    padding: 4,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#fff',
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backIconImage: {
    width: 60,
    height: 60,
  },
  backText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CalendarMoodSelector;
