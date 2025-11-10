import React from 'react';
import { View, StyleSheet } from 'react-native';

interface PlinkoBallProps {
  size?: number;
  color?: string;
  x?: number;
  y?: number;
}

export default function PlinkoBall({ 
  size = 20, 
  color = '#FFD700', // Gold color
  x = 0,
  y = 0
}: PlinkoBallProps) {
  return (
    <View
      style={[
        styles.ball,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ball: {
    // Ball styling - will be customized via props
  },
}); 