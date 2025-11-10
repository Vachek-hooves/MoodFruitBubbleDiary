import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface ScoreSlot {
  id: number;
  points: number;
  color: string;
  width: number;
}

interface ScoreSlotsProps {
  containerWidth: number;
  slotHeight?: number;
}

export default function ScoreSlots({
  containerWidth,
  slotHeight = 40,
}: ScoreSlotsProps) {
  // Define the slots with different point values
  const slots: ScoreSlot[] = [
    {id: 1, points: 10, color: '#4CAF50' + 80, width: 0.13}, // Green - 15% width
    {id: 2, points: 25, color: '#2196F3' + 80, width: 0.12}, // Blue - 15% width
    {id: 3, points: 50, color: '#FF9800' + 80, width: 0.11}, // Orange - 15% width
    {id: 4, points: 100, color: '#F44336' + 80, width: 0.11}, // Red - 15% width
    {id: 5, points: 200, color: '#9C27B0' + 80, width: 0.11}, // Purple - 15% width
    {id: 6, points: 50, color: '#FF9800' + 80, width: 0.12}, // Orange - 15% width
    {id: 7, points: 10, color: '#4CAF50' + 80, width: 0.13}, // Green - 10% width
  ];

  return (
    <View
      style={[styles.container, {width: containerWidth, height: slotHeight}]}>
      {slots.map(slot => (
        <View
          key={slot.id}
          style={[
            styles.slot,
            {
              width: containerWidth * slot.width,
              height: slotHeight,
              backgroundColor: slot.color,
            },
          ]}>
          <Text style={styles.slotText}>{slot.points}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    // borderTopWidth: 2,
    borderTopColor: '#333333',
  },
  slot: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // borderLeftWidth: 1,
    borderLeftColor: '#333333',
    marginHorizontal: 5,
  },
  slotText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
});
