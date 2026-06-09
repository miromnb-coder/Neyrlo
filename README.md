# Neyrlo

Neyrlo is a neighborhood item-sharing app built with Expo, React Native, TypeScript and Supabase.

The first version focuses on a map-first home screen where people can find nearby items to borrow, rent, swap or get for free.

## Tech stack

- Expo SDK 54
- React Native
- TypeScript
- Expo Router
- Supabase Auth, Database and Storage
- Supabase Postgres + PostGIS for location-based item search later

## Getting started

This project is pinned to Node.js `20.19.4` because Expo SDK 54 requires Node `>=20.19.4`.

Install dependencies:

```bash
npm install
npx expo install --fix
```

Create your local environment file:

```bash
cp .env.example .env
```

Fill in these values in `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Start the app:

```bash
npm run start
```

Start with Expo Go tunnel, which is usually best for cloud IDEs like Codeanywhere:

```bash
npm run start:expo-go
```

Run type checking:

```bash
npm run typecheck
```

## Codeanywhere / VS Code task buttons

This project includes VS Code tasks in `.vscode/tasks.json`. In Codeanywhere, open the task picker and choose one of these:

- `🟢 Neyrlo: korjaa Node-versio`
- `📦 Neyrlo: asenna paketit`
- `🚀 Neyrlo: käynnistä Expo Go`
- `🌐 Neyrlo: käynnistä web-esikatselu`
- `✅ Neyrlo: tarkista TypeScript`

Recommended first run:

1. Run `🟢 Neyrlo: korjaa Node-versio`.
2. Run `📦 Neyrlo: asenna paketit`.
3. Run `🚀 Neyrlo: käynnistä Expo Go`.
4. Open Expo Go on your phone.
5. Scan the QR code from the terminal.

## Current first milestone

This repository now contains the first app foundation:

- Expo + React Native + TypeScript setup
- Expo Router bottom tabs
- Map-first home screen mockup
- Reusable UI components
- Supabase client setup for React Native
- Supabase MVP database schema draft

## Project structure

```txt
app/
  _layout.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    browse.tsx
    add.tsx
    messages.tsx
    profile.tsx
components/
constants/
data/
lib/
supabase/
  migrations/
types/
```

## Supabase setup

The initial database draft is in:

```txt
supabase/migrations/0001_initial_schema.sql
```

It creates the first MVP tables:

- `profiles`
- `items`
- `item_images`

It also enables Row Level Security and adds basic ownership policies.

## Next milestone

The next logical milestone is Supabase Auth:

1. Add sign up and login screens.
2. Create a profile row after signup.
3. Route signed-in users to the main tabs.
4. Keep signed-out users in the auth flow.
