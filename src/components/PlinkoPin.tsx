import React from 'react';
import { View, StyleSheet } from 'react-native';

interface PlinkoPinProps {
  size?: number;
  color?: string;
}

export default function PlinkoPin({ 
  size = 8, 
  color = '#ffffff' 
}: PlinkoPinProps) {
  return (
    <View
      style={[
        styles.pin,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  pin: {
    // Pin styling - will be customized via props
  },
}); 