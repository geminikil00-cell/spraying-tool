# SprayLog

Farm spraying tracker: record sprayings across greenhouses and open fields, manage materials and plots, get reminders when plots are due for spraying, and package the app as an Android APK.

- **Web**: React 19 + TypeScript + Vite, Tailwind CSS, React Router
- **Backend**: Supabase (Postgres + email/password auth)
- **Mobile**: Capacitor (Android APK)
- **Hosting**: Cloudflare Pages
- **Languages**: English + Arabic (RTL), in-app toggle

## Getting started

```powershell
npm install
copy .env.example .env.local   # then fill in your Supabase values
npm run dev
```

## Supabase setup (one time)

1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run the entire contents of `supabase/schema.sql`.
3. In **Authentication > Providers > Email**, disable **Confirm email** so sign-up logs in immediately (or leave it enabled — the app shows a "check your email" message).
4. Copy the project URL and anon key (Settings > API) into `.env.local`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

The anon key is safe to ship to the browser: all tables are protected with row-level security (authenticated users only).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run typecheck` | TypeScript only |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | Oxlint |

## How the app works

- **Spray**: tap plots on the schematic farm map (red = overdue, amber = due soon, green = OK, gray = unplanned and not sprayable), build the mixture, save. Overdue/due plots are preselected.
- **Records**: all sprayings, filterable per plot, editable and deletable.
- **Parameters**: manage materials, plots (name, kind, spray interval, map position/size with live preview), and the global notification lead time.
- **Planning**: toggle plots planned/unplanned. Only planned plots can be sprayed; past records are preserved.

Due-date math: `next_due = last_sprayed + interval_days`. A planned plot with no spraying history counts as overdue. Reminders fire `lead_hours` before `next_due`.

## Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare dashboard > **Workers & Pages > Create > Pages > Connect to Git**.
3. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. `public/_redirects` makes client-side routing work (`/* /index.html 200`).

## Build the Android APK

Prerequisites: Android Studio, JDK 17.

```powershell
npm run build
npx cap add android      # first time only (capacitor.config.ts is already provided)
npx cap sync android
```

Add notification permissions to `android/app/src/main/AndroidManifest.xml` inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

Build the APK:

```powershell
cd android
./gradlew assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`.

After every web change: `npm run build; npx cap sync android`.

Notifications on Android are local (scheduled by the app when it opens/resumes) and work offline; on the web, reminders appear as in-app banners and the overdue count badge.
