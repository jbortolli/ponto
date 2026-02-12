import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const { loginWithPin, adminMagicLink } = useAuth();
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');

  const onPinLogin = async () => {
    try {
      await loginWithPin(pin);
    } catch (err) {
      Alert.alert('Erro', (err as Error).message);
    }
  };

  const onMagicLink = async () => {
    try {
      await adminMagicLink(email);
      Alert.alert('OK', 'Magic link enviado para o email do admin.');
    } catch (err) {
      Alert.alert('Erro', (err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cafeteria - Controle de Ponto</Text>
      <Text>Login por PIN (funcionário)</Text>
      <TextInput style={styles.input} keyboardType="numeric" maxLength={6} value={pin} onChangeText={setPin} placeholder="PIN 6 dígitos" />
      <Button title="Entrar com PIN" onPress={onPinLogin} />

      <View style={styles.divider} />
      <Text>Magic link (admin)</Text>
      <TextInput style={styles.input} keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="admin@empresa.com" />
      <Button title="Enviar magic link" onPress={onMagicLink} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  divider: { height: 24 }
});
