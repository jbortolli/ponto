import React, { useState } from 'react';
import { Alert, Button, Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../api/supabase';

export function AdminScreen() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [unitId, setUnitId] = useState('');
  const [employeeIdToReset, setEmployeeIdToReset] = useState('');
  const [startDate, setStartDate] = useState('2026-02-01');
  const [endDate, setEndDate] = useState('2026-02-29');

  const createEmployee = async () => {
    const { error } = await supabase.functions.invoke('admin-employees', {
      body: {
        action: 'create',
        employee: { name, pin, allowed_location_id: unitId }
      }
    });
    if (error) return Alert.alert('Erro', error.message);
    Alert.alert('OK', 'Funcionário criado');
  };

  const resetDevice = async () => {
    const { error } = await supabase.functions.invoke('admin-employees', {
      body: {
        action: 'reset_device',
        employee_id: employeeIdToReset
      }
    });
    if (error) return Alert.alert('Erro', error.message);
    Alert.alert('OK', 'Device resetado');
  };

  const exportCsv = async () => {
    const { data, error } = await supabase.functions.invoke('report-csv', {
      body: { start_date: startDate, end_date: endDate }
    });
    if (error) return Alert.alert('Erro', error.message);
    if (data?.url) Linking.openURL(data.url);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cadastrar funcionário</Text>
      <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="PIN 6 dígitos" value={pin} onChangeText={setPin} maxLength={6} />
      <TextInput style={styles.input} placeholder="ID da unidade" value={unitId} onChangeText={setUnitId} />
      <Button title="Salvar funcionário" onPress={createEmployee} />

      <View style={styles.block}>
        <Text style={styles.title}>Vincular aparelho</Text>
        <TextInput style={styles.input} placeholder="employee_id" value={employeeIdToReset} onChangeText={setEmployeeIdToReset} />
        <Button title="Resetar device_id" onPress={resetDevice} />
      </View>

      <View style={styles.block}>
        <Text style={styles.title}>Relatório CSV</Text>
        <TextInput style={styles.input} placeholder="Data inicial" value={startDate} onChangeText={setStartDate} />
        <TextInput style={styles.input} placeholder="Data final" value={endDate} onChangeText={setEndDate} />
        <Button title="Exportar CSV" onPress={exportCsv} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  title: { fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  block: { marginTop: 20, gap: 8 }
});
