import { QrPayload } from './types.ts';

export async function sha256(input: string) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function parseQrPayload(raw: string): QrPayload {
  const parsed = JSON.parse(raw);
  if (!parsed.location_id || !parsed.ts || !parsed.signature) {
    throw new Error('QR inválido: payload incompleto');
  }
  return parsed as QrPayload;
}

export async function validateQrSignature(rawWithoutSignature: string, signature: string, locationSecret: string) {
  const computed = await sha256(`${rawWithoutSignature}.${locationSecret}`);
  return computed === signature;
}
