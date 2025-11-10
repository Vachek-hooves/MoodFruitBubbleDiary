import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  ImageBackground,
} from 'react-native';
import PinLayout from '../components/PinLayout';
import ScoreSlots from '../components/ScoreSlots';
import PlinkoBall from '../components/PlinkoBall';
import {
  BallState,
  Pin,
  Slot,
  initializeBall,
  updateBallPhysics,
  generatePinPositions,
  generateSlotPositions,
} from '../utils/plinkoPhysics';

// Get screen dimensions for responsive design
const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Game constants
const GAME_WIDTH = screenWidth * 0.99; // 90% of screen width
const GAME_HEIGHT = screenHeight * 0.75; // 60% of screen height
const BALL_SIZE = 16;
const PIN_SIZE = 16;
const PIN_ROWS = 6; // Number of rows of pins

interface PlinkoGameScreenProps {
  onBack?: () => void;
}

export default function PlinkoGameScreen({onBack}: PlinkoGameScreenProps) {
  // Game state
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [balls, setBalls] = useState<BallState[]>([]);
  const [ballCount, setBallCount] = useState(0);

  // Game data
  const pins = useRef<Pin[]>([]);
  const slots = useRef<Slot[]>([]);
  const animationFrameId = useRef<number | undefined>(undefined);

  // Initialize game data
  useEffect(() => {
    pins.current = generatePinPositions(
      PIN_ROWS,
      GAME_WIDTH - 10,
      GAME_HEIGHT - 60,
    );
    slots.current = generateSlotPositions(
      GAME_WIDTH - 10,
      [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.1],
    );
  }, []);

  // Animation loop
  useEffect(() => {
    if (balls.length > 0) {
      const animate = () => {
        setBalls(currentBalls => {
          const newBalls = currentBalls.map(ball => {
            if (!ball.isActive) return ball;

            const result = updateBallPhysics(
              ball,
              pins.current,
              slots.current,
              GAME_WIDTH - 10,
              GAME_HEIGHT - 20,
              BALL_SIZE,
              PIN_SIZE,
            );

            if (result.landedSlot) {
              setScore(prevScore => prevScore + result.landedSlot!.points);
            }

            return result.ball;
          });

          // Remove inactive balls
          const activeBalls = newBalls.filter(ball => ball.isActive);
          if (activeBalls.length === 0) {
            setIsPlaying(false);
          }

          return activeBalls;
        });
      };

      const intervalId = setInterval(animate, 16); // ~60 FPS

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [balls.length]);

  // Function to drop a ball
  const dropBall = () => {
    // Limit to 5 balls at once to prevent performance issues
    if (balls.length >= 5) {
      return;
    }

    const newBall = initializeBall(GAME_WIDTH - 10);
    newBall.isActive = true;
    newBall.vy = 1; // Initial downward velocity
    newBall.vx = (Math.random() - 0.5) * 0.5; // Smaller random horizontal velocity
    newBall.id = ballCount; // Give each ball a unique ID

    setBalls(prevBalls => [...prevBalls, newBall]);
    setBallCount(prev => prev + 1);
    setIsPlaying(true);

    // Safety timeout to prevent ball from getting stuck
    setTimeout(() => {
      setBalls(currentBalls =>
        currentBalls.map(ball =>
          ball.id === newBall.id ? {...ball, isActive: false} : ball,
        ),
      );
    }, 12000); // 12 seconds timeout
  };

  return (
    <ImageBackground
      style={{flex: 1}}
      source={require('../assets/background_loading.png')}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Plinko Game</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Score: {score}</Text>
          </View>
        </View>

        {/* Game Area */}
        <View style={styles.gameContainer}>
          {/* Game Board */}
          <View style={styles.gameBoard}>
            {/* Pin Layout */}
            <PinLayout
              rows={PIN_ROWS}
              pinSize={PIN_SIZE}
              pinColor="#ffffff"
              containerWidth={GAME_WIDTH - 10} // Account for padding
              containerHeight={GAME_HEIGHT - 70} // Leave space for slots
            />

            {/* Balls */}
            {balls.map(ball => (
              <PlinkoBall
                key={ball.id}
                size={BALL_SIZE}
                color="#ea0bccff"
                x={ball.x}
                y={ball.y}
              />
            ))}

            {/* Score Slots */}
            <ScoreSlots containerWidth={GAME_WIDTH - 10} slotHeight={60} />
          </View>

          {/* Drop Button */}
          <TouchableOpacity style={styles.dropButton} onPress={dropBall}>
            <Text style={styles.dropButtonText}>
              Drop Ball ({balls.length} active)
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    // paddingTop: 30,
    flex: 1,
    // backgroundColor: '#1a1a2e', // Dark blue background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    // backgroundColor: '#16213e', // Slightly lighter blue
    paddingTop: '10%',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreContainer: {
    backgroundColor: '#0f3460', // Darker blue for score
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  gameBoard: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    // backgroundColor: '#0f3460', // Game board background
    borderRadius: 15,
    // borderWidth: 3,
    borderColor: '#e94560', // Red border
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  gameBoardText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  gameBoardSubtext: {
    color: '#cccccc',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dropButton: {
    backgroundColor: '#e94560' + 90, // Red button
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
  dropButtonDisabled: {
    backgroundColor: '#666666',
  },
  dropButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  instructionsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionsText: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 20,
  },
});
