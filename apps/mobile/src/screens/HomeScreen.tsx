import React from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { employee, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Button title="Entrada" onPress={() => navigation.navigate('Scanner', { eventType: 'clock_in' })} />
      <Button title="Início intervalo" onPress={() => navigation.navigate('Scanner', { eventType: 'break_start' })} />
      <Button title="Fim intervalo" onPress={() => navigation.navigate('Scanner', { eventType: 'break_end' })} />
      <Button title="Saída" onPress={() => navigation.navigate('Scanner', { eventType: 'clock_out' })} />
      <Button title="Meu histórico" onPress={() => navigation.navigate('History')} />
      {employee?.isAdmin && <Button title="Admin" onPress={() => navigation.navigate('Admin')} />}
      <Button title="Sair" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center', gap: 12 }
});
