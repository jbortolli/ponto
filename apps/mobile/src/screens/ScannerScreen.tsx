import React, { useMemo, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { submitPunch } from '../api/backend';
import Constants from 'expo-constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

export function ScannerScreen({ route, navigation }: Props) {
  const { employee } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const deviceId = useMemo(() => Constants.sessionId ?? 'unknown-device', []);

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>Precisamos da permissão da câmera.</Text>
        <Button title="Conceder" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text>Evento: {route.params.eventType}</Text>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={
          scanned
            ? undefined
            : async ({ data }) => {
                try {
                  setScanned(true);
                  await submitPunch({
                    employeeId: employee!.id,
                    eventType: route.params.eventType,
                    qrPayload: data,
                    deviceId
                  });
                  Alert.alert('Sucesso', 'Ponto registrado.');
                  navigation.goBack();
                } catch (err) {
                  Alert.alert('Erro', (err as Error).message);
                  setScanned(false);
                }
              }
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  camera: { flex: 1, borderRadius: 8, overflow: 'hidden' }
});
