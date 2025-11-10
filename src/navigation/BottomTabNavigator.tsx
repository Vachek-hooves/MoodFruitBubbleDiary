import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RouteProp} from '@react-navigation/native';
import {Image, StyleSheet} from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type BottomTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Settings: undefined;
  RelaxPlay: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({
        route,
      }: {
        route: RouteProp<BottomTabParamList, keyof BottomTabParamList>;
      }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.5)',
          height: 65,
          borderTopWidth: 0,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 0,
          borderTopColor: 'transparent',
        },
        tabBarIcon: ({focused}: {focused: boolean}) => {
          let icon = require('../assets/home_icon.png');

          if (route.name === 'Calendar') {
            icon = require('../assets/calendar_icons.png');
          } else if (route.name === 'Settings') {
            icon = require('../assets/settings_icons.png');
          }

          return (
            <Image
              source={icon}
              style={[styles.icon, {tintColor: focused ? '#5ED0C5' : '#000'}]}
              resizeMode="contain"
            />
          );
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;

const styles = StyleSheet.create({
  icon: {
    width: 30,
    height: 30,
    marginTop: 10,
  },
});
