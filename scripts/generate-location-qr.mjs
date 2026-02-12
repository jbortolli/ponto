import crypto from 'node:crypto';

const [locationId, secret] = process.argv.slice(2);
if (!locationId || !secret) {
  console.error('Uso: node scripts/generate-location-qr.mjs <location_id> <location_secret>');
  process.exit(1);
}

const ts = Date.now();
const raw = JSON.stringify({ location_id: locationId, ts });
const signature = crypto.createHash('sha256').update(`${raw}.${secret}`).digest('hex');
const payload = JSON.stringify({ location_id: locationId, ts, signature });

console.log(payload);
console.log('\nCole este payload em um gerador de QR (ex.: qrencode/Canva) e imprima na unidade.');
