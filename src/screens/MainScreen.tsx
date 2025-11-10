import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import React from 'react';
import PlinkoGameScreen from './PlinkoGameScreen';

const MainScreen = () => {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'game'>(
    'welcome',
  );

  const handleStartGame = () => {
    setCurrentScreen('game');
  };

  const handleBackToWelcome = () => {
    setCurrentScreen('welcome');
  };

  return (
    <View style={styles.container}>
      {currentScreen === 'welcome' ? (
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>🎮 Plinko Game</Text>
            <Text style={styles.welcomeSubtitle}>
              Welcome to the Plinko Game! Drop balls and watch them bounce off
              pins to earn points.
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartGame}
            >
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <PlinkoGameScreen onBack={handleBackToWelcome} />
      )}
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
