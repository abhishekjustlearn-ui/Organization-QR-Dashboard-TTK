# Project: Org Attribution Dashboard for Talk to Krishna

## Current Architecture (existing system — do not redesign this, just extend it)

We have a multi-language platform called "Talk to Krishna" with the following existing setup:

- **5 websites**: w1, w2, w3, w4, w5 — one per language
- **5 backends**: b1, b2, b3, b4, b5 — one per language, each corresponding to its website
- **5 databases**: d1, d2, d3, d4, d5 — one per language, each corresponding to its backend

On top of this, we built **2 mobile apps**:
- **A1** — iOS app
- **A2** — Android app

Both A1 and A2 cover all 5 languages internally. This means A1 (and A2) each call into all five backends (b1–b5) and their corresponding databases (d1–d5) depending on which language the user selects inside the app. The apps are not separate per language — one app, all languages, routed internally to the right backend/DB pair.

## What We Need Built

A **new, separate dashboard system** for organizations, with the following requirements:

1. An org can be onboarded into the dashboard with basic details (name, contact email, etc.)
2. Each org gets a **unique QR code** generated
3. When someone scans that org's QR code:
   - If the user's device already has A1 (iOS) or A2 (Android) installed → deep link straight into the app
   - If not installed → redirect to the App Store (iOS) or Play Store (Android), and after the user installs and opens the app, the app must know which org's QR led to this install
4. Every downstream action by that user — app install, signup, and payment — must be **tracked and attributed back to the originating org**, and shown in the dashboard's analytics.

## Key Design Decisions Already Made (follow these exactly)

### 1. New components to build (nothing existing gets replaced)
- **Dashboard backend**: new service, call it `b_dash`. Build it using the **same stack as b1–b5** (for consistency — inspect b1–b5's stack/conventions and match them).
- **Dashboard database**: new database, call it `d_dash`.
- **Dashboard frontend**: a new web app for org onboarding, QR display, and analytics (scans, installs, signups, payments, revenue, funnel view per org).

### 2. Attribution approach — Android
Use **Google Play Install Referrer API** (official, reliable). The Play Store install link for the QR redirect must include a `referrer` param encoding the org_id, e.g.:
```
https://play.google.com/store/apps/details?id=com.talktokrishna&referrer=org_id%3D{org_id}
```
A2 reads this via the Play Install Referrer library on first launch and reports it to `b_dash`.

### 3. Attribution approach — iOS
Since Apple has no official install-referrer API, use a **self-built fingerprint matching approach** (accepted trade-off: best-effort, not 100% accurate — no third-party SDK like AppsFlyer/Branch).
- On QR scan (server-side click event), log: org_id, IP address, approximate device type (from User-Agent), timestamp.
- On A1's first launch, collect: device model, OS version, screen resolution, timezone, and send to `b_dash` along with the request (server captures IP from the request itself).
- `b_dash` matches the new fingerprint against unmatched click records using: same IP + within a tight time window (~15–20 minutes) + device type match.
- If matched, create an attribution record. If no match found within the window, mark as unattributed — this is acceptable per our design.

### 4. Signup → Payment attribution
This is **first-touch, permanent attribution**:
- At signup time, if an org_id is available (from Android referrer or iOS fingerprint match), store it once in the user's profile as `attributed_org_id` in the respective d1–d5 database (whichever language backend the user signed up through).
- This value is set once and never overwritten afterward.
- At payment time, the backend (b1–b5) reads the already-stored `attributed_org_id` from the user's profile (no need to pass org_id again) and sends a payment event to `b_dash`.

### 5. Required changes to EXISTING b1–b5 / d1–d5 (minimal, additive only)
- **d1–d5**: add one nullable column to the users/profile table: `attributed_org_id`.
- **b1–b5**:
  - In the signup endpoint: if org_id is present in the request, save it to `attributed_org_id` (one-time set).
  - In the payment-success endpoint: if the user has an `attributed_org_id`, fire an async/background call to `b_dash`'s payment-tracking endpoint (must not block or slow down the payment flow).
- No other existing logic (RAG pipeline, voice agent, TTS, etc.) should be touched.

### 6. Required changes to A1 (iOS) and A2 (Android) — most of the real work is here
- **Android (A2)**:
  - Integrate `com.android.installreferrer:installreferrer` library.
  - On first launch, read the referrer string, parse out org_id, persist locally (DataStore/SharedPreferences).
  - Send org_id to `b_dash` via a tracking endpoint.
  - Pass org_id along at signup to the relevant b1–b5 backend.
- **iOS (A1)**:
  - On first launch, collect device model, OS version, screen resolution, timezone.
  - Send this fingerprint to `b_dash`; if `b_dash` returns a matched org_id, persist it locally.
  - Pass org_id along at signup to the relevant b1–b5 backend.
- **Both apps**: implement Universal Links (iOS) / App Links (Android) so that if the app is already installed, the QR scan deep-links directly into the app instead of round-tripping through the app store.
- Build this as a shared, reusable module (e.g. `AttributionManager`) in each app so the logic is consistent and maintainable.

## Proposed Schema for `d_dash`

- `organizations`: org_id (PK), org_name, contact_email, created_at, status
- `campaigns`: campaign_id (PK), org_id (FK), campaign_name, qr_link, created_at
- `click_events`: click_id (PK), org_id, campaign_id, device_type, ip_address, user_agent, timestamp
- `fingerprint_matches`: match_id (PK), click_id, ip_address, device_model, os_version, screen_resolution, timezone, timestamp, matched (bool), matched_user_id
- `attributions`: attribution_id (PK), user_id, org_id, campaign_id, device_type, matched_via, created_at
- `payment_events`: payment_id (PK), user_id, org_id, amount, currency, status, created_at

## Proposed API Surface for `b_dash`

- `POST /orgs` — create org, generate QR
- `GET /orgs/{org_id}/qr` — return QR image
- `POST /track/click` — log a QR scan (hit by the redirect endpoint)
- `POST /track/fingerprint` — iOS app reports device fingerprint post-install
- `POST /track/referrer` — Android app reports Play Install Referrer data
- `POST /track/signup` — record org attribution against a new user
- `POST /track/payment` — record a payment event against an org
- `GET /orgs/{org_id}/analytics` — scans, installs, signups, payments, revenue, funnel

## Task

Please scaffold this system: `d_dash` schema/migrations, `b_dash` service (matching b1–b5's existing stack/conventions), the dashboard frontend (org CRUD, QR display, analytics views), the minimal additive changes to b1–b5/d1–d5, and the attribution modules for A1 and A2 as described above. Ask me for the actual b1–b5 stack/repo details if you need to inspect conventions before scaffolding `b_dash`.
