# Sistema de Controle de Ponto por QR Code (Cafeteria com 2 unidades)

Monorepo com:
- **App mobile** em React Native + Expo + TypeScript (`apps/mobile`)
- **Backend** em Supabase Postgres + RLS + Edge Functions (`supabase`)

## Arquitetura

- Funcionário autentica com **PIN de 6 dígitos**.
- Admin pode usar **magic link** por email.
- App escaneia QR da unidade e envia para `POST punch` (Edge Function).
- Backend valida:
  - assinatura/segredo do QR
  - geofence (lat/lon no raio da unidade)
  - sequência de eventos
  - horário do servidor
  - device binding
- Eventos válidos vão para `punch_events` e consolidação diária em `shifts`.
- Falhas e tentativas suspeitas vão para `audit_logs`.

## Estrutura

```txt
apps/mobile                    # app Expo
supabase/migrations            # SQL schema, índices, funções e RLS
supabase/functions             # APIs/Edge Functions
packages/shared                # lógica compartilhada (cálculo de shifts)
tests                          # testes unitários
scripts/generate-location-qr.mjs
```

## 1) Setup local

### Pré-requisitos
- Node 20+
- npm 10+
- Expo CLI (`npx expo` já resolve)
- Supabase CLI (`npm i -g supabase`)
- Docker (para `supabase start` local)

### Instalação

```bash
npm install
```

## 2) Criar projeto Supabase e rodar migrations

### Local

```bash
supabase init
supabase start
supabase db reset
```

As migrations em `supabase/migrations` criam:
- `employees`
- `locations`
- `punch_events`
- `shifts`
- `audit_logs`
- índices, constraints, funções SQL e RLS

### Remoto (opcional)

```bash
supabase link --project-ref <SEU_PROJECT_REF>
supabase db push
```

## 3) Deploy das Edge Functions

```bash
supabase functions deploy punch
supabase functions deploy my-day-summary
supabase functions deploy my-events
supabase functions deploy admin-employees
supabase functions deploy admin-locations
supabase functions deploy report-csv
supabase functions deploy recalculate-shifts
```

## 4) Variáveis de ambiente no app Expo

Crie `apps/mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## 5) Rodar app no celular

```bash
cd apps/mobile
npx expo start
```

Abra no Expo Go e permita câmera e localização.

## 6) Seed inicial (duas unidades + admin)

Exemplo SQL no Supabase SQL Editor:

```sql
insert into public.locations (name, latitude, longitude, radius_meters, qr_secret)
values
('Unidade Centro', -23.5505, -46.6333, 120, 'secret-centro-123'),
('Unidade Jardins', -23.5616, -46.6565, 120, 'secret-jardins-456');

-- Admin: depois associe auth_user_id ao usuário do Supabase Auth
insert into public.employees (name, email, pin_hash, allowed_location_id, is_admin, is_active)
select
  'Admin',
  'admin@cafeteria.com',
  public.generate_pin_hash('123456'),
  l.id,
  true,
  true
from public.locations l
limit 1;
```

### Como criar usuário admin e setar role
1. Crie usuário no **Supabase Auth** (Dashboard > Authentication > Users).
2. Copie `auth.users.id`.
3. Atualize `employees.auth_user_id` para o admin correspondente.
4. Garanta `employees.is_admin = true`.
5. As policies `public.is_admin()` passam a conceder acesso total ao admin.

## 7) Gerar payload QR Code da unidade e imprimir

```bash
node scripts/generate-location-qr.mjs <location_id> <location_secret>
```

Isso gera um JSON assinado. Converta para QR com qualquer ferramenta (online ou local) e imprima em cada unidade.

## Endpoints (Edge Functions)

- `POST punch`
  - body: `employee_id, event_type, qr_payload, lat, lon, device_id`
- `GET/POST my-day-summary`
- `GET/POST my-events`
- Admin:
  - `admin-employees` (CRUD básico + reset device)
  - `admin-locations` (CRUD básico)
  - `report-csv` (retorna CSV por período)
- `recalculate-shifts` (reprocessa período)

## Regras de validação implementadas

- QR com `location_id + ts + signature`
- assinatura validada com segredo da `location`
- geofence no backend com `haversine_meters`
- sequência:
  - sem break_start antes de clock_in
  - sem break_end antes de break_start
  - sem clock_out antes de clock_in
  - sem 2 clock_in seguidos sem clock_out
- `event_time` sempre no backend
- device binding por `employees.device_id`
- antifraude:
  - hash do payload (`qr_payload_hash`)
  - logs de tentativa inválida em `audit_logs`

## Testes

```bash
npm test
```

Testes unitários cobrem cálculo de jornada/intervalos em `packages/shared`.
