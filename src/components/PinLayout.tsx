import React from 'react';
import { View, StyleSheet } from 'react-native';
import PlinkoPin from './PlinkoPin';

interface PinLayoutProps {
  rows: number;
  pinSize?: number;
  pinColor?: string;
  containerWidth: number;
  containerHeight: number;
}

export default function PinLayout({
  rows,
  pinSize = 8,
  pinColor = '#ffffff',
  containerWidth,
  containerHeight,
}: PinLayoutProps) {
  // Calculate spacing between pins
  const horizontalSpacing = containerWidth / (rows + 1);
  const verticalSpacing = (containerHeight * 0.8) / rows; // Use 70% of height for pins

  // Generate pin positions in a triangular pattern
  const generatePinPositions = () => {
    const pins: Array<{ x: number; y: number; row: number; col: number }> = [];
    
    for (let row = 0; row < rows; row++) {
      const pinsInRow = row + 1;
      const startX = (containerWidth - (pinsInRow - 1) * horizontalSpacing) / 2;
      
      for (let col = 0; col < pinsInRow; col++) {
        const x = startX + col * horizontalSpacing;
        const y = 50 + row * verticalSpacing; // Start 50px from top
        
        pins.push({ x, y, row, col });
      }
    }
    
    return pins;
  };

  const pinPositions = generatePinPositions();

  return (
    <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
      {pinPositions.map((pin, index) => (
        <View
          key={`pin-${pin.row}-${pin.col}`}
          style={[
            styles.pinContainer,
            {
              position: 'absolute',
              left: pin.x - pinSize / 2,
              top: pin.y - pinSize / 2,
            },
          ]}
        >
          <PlinkoPin size={pinSize} color={pinColor} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  pinContainer: {
    // Positioned absolutely within the container
  },
}); 