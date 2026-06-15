import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { View, ActivityIndicator } from 'react-native';
import { C } from './theme';

import HomeScreen     from './screens/HomeScreen';
import QuestionScreen from './screens/QuestionScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import HistoryScreen  from './screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  // Load Syne font (used for headings/titles)
  const [fontsLoaded] = useFonts({ Syne_700Bold, Syne_800ExtraBold });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home"     component={HomeScreen}     />
        <Stack.Screen name="Question" component={QuestionScreen} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} />
        <Stack.Screen name="History"  component={HistoryScreen}  />
      </Stack.Navigator>
    </NavigationContainer>
  );
}