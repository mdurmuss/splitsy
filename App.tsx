import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase } from './src/db/database';
import { RootStackParamList } from './src/navigation/types';
import { ONBOARDING_DONE_KEY } from './src/utils/onboarding';
import OnboardingScreen from './src/screens/OnboardingScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import ManageMembersScreen from './src/screens/ManageMembersScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Onboarding');

  useEffect(() => {
    initDatabase();
    AsyncStorage.getItem(ONBOARDING_DONE_KEY).then((value) => {
      setInitialRoute(value === 'true' ? 'Groups' : 'Onboarding');
      setReady(true);
    });
  }, []);

  if (!ready) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Groups" component={GroupsScreen} options={{ title: 'Splitsy' }} />
        <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: '' }} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'New Group' }} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
        <Stack.Screen name="ManageMembers" component={ManageMembersScreen} options={{ title: 'Members' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
