import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getMyDaySummary, getMyEvents } from '../api/backend';
import { DaySummary, PunchEvent } from '../types';

export function HistoryScreen() {
  const { employee } = useAuth();
  const [events, setEvents] = useState<PunchEvent[]>([]);
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [evts, sum] = await Promise.all([getMyEvents(employee!.id), getMyDaySummary(employee!.id)]);
      setEvents(evts);
      setSummary(sum);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumo de hoje</Text>
      <Text>Trabalhado: {summary?.worked_minutes ?? 0} min</Text>
      <Text>Intervalo: {summary?.break_minutes ?? 0} min</Text>
      <Text>Status: {summary?.status ?? 'incomplete'}</Text>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <Text>
            {item.event_type} - {new Date(item.event_time).toLocaleTimeString()}
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  title: { fontWeight: '700', fontSize: 18 }
});
