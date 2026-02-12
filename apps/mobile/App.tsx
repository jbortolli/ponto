import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { AdminScreen } from './src/screens/AdminScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Scanner: { eventType: 'clock_in' | 'break_start' | 'break_end' | 'clock_out' };
  History: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { employee } = useAuth();

  return (
    <Stack.Navigator>
      {!employee ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Ponto' }} />
          <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Escanear QR' }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Meu histórico' }} />
          {employee.isAdmin && <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin' }} />}
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
