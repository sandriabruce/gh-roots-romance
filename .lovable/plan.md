## GH SUƆMƆ — Roots & Romance (Web App Plan)

A responsive, mobile-first web dating app for Ghanaians 40+ at home and in the diaspora. Built as a React + Vite web app (works in any mobile or desktop browser) using Lovable Cloud for auth/database/storage and Paystack for Mobile Money + card payments.

### Important translation notes from your brief

- **Platform:** Web (React + Vite), not Expo. Same UX, runs in any browser. A native Expo app can be built later against the same Supabase backend.
- **Photos:** Stored in Lovable Cloud Storage (not Cloudinary).
- **Face detection:** Browser-based (TensorFlow.js BlazeFace) instead of `expo-face-detector`. Same goal — reject non-face photos client-side.
- **Trial timer / session:** `localStorage` instead of `AsyncStorage`.
- **Paystack:** Integrated via Paystack Inline JS on the client + a Lovable Cloud edge function for server-side verification using `PAYSTACK_SECRET_KEY`.
- **Anti-screenshot:** Web can only deter (disable right-click, CSS user-select, watermark overlay) — true screenshot blocking isn't possible in any browser.

### Branding

- Name **GH SUƆMƆ** always all-caps, tagline **Roots & Romance** always shown beneath
- Palette: Red `#EE1C25`, Gold `#FCD116`, Green `#006B3F`, Deep Brown `#2C1200`
- Heart logo: red top stripe / gold middle / green bottom with black star centre
- Fonts: Playfair Display (headings), DM Sans (body)
- Two visual modes: **Romance** (gold accents) / **Spark** (red accents)

### Navigation (bottom tab bar on mobile, sidebar on desktop)

Discover · Matches · Chat · Verify · Profile · Safety · Admin (owner only)

### Screens & flows (full scaffold, shallow)

Every screen is built end-to-end with real navigation and styled UI. Logic depth varies — items marked *(stub)* use mock data or placeholder behavior to be deepened in follow-ups.

**Auth & Onboarding (8 steps with progress bar)**
1. Mode picker — Romance vs Spark (Spark gates 18+ with consent checkbox)
2. Age / gender / interested-in
3. Name + location (Ghana cities, UK, USA, Canada, Other)
4. 6-photo grid upload with browser face detection (rejects non-face)
5. Profile prompt (pick one, write answer)
6. Religion & values (Romance) OR discretion preferences (Spark)
7. Interests multi-select grid
8. Notifications + privacy settings

**Discover** — Swipeable card deck (drag + Like/Pass buttons), mode-tinted cards, scam tip strip below deck.

**Matches** — New-matches avatar row + conversation list, inline romance-scam alert.

**Chat** — Message thread with pinned safety notice, report/block in header, gold (Romance) or red (Spark) send button. Premium/Diamond can send; Free/Verified see locked overlay with upgrade CTA. Client-side moderation blocks phone numbers, WhatsApp links, and payment requests.

**Verify (Subscriptions)** — Plan cards with currency switcher (GH₵ / £ / $ / C$):
- Explorer — Free
- Verified — GH₵80/mo
- Premium — GH₵180 / £12 / $15 / C$20
- Diamond — GH₵350 / £22 / $28 / C$38

3-step Paystack MoMo flow: choose MTN/Vodafone/AirtelTigo + phone → confirm summary → enter 6-digit OTP. Card option also available via Paystack.

**Profile** — Photos, prompts, interests, Romance↔Spark toggle, plan badge, trial countdown, edit actions.

**Safety** — Red flags list, how-to-stay-safe guide, reporting info.

**Admin (owner only, gated by `has_role(user,'admin')`)**
- Revenue metrics + plan counts
- Member management table (view, message, verify, flag, ban)
- Manual matchmaking: search two members, see compatibility score, create match, notify both, history list
- Scam detection panel: auto-flagged accounts with HIGH/MED risk, warn/suspend/ban *(detection rules stubbed with sample data)*
- Algorithm weight sliders with live preview
- Charts: members by location, payment-method breakdown, mode split *(recharts with mock-then-real data)*

**Home extras (on Discover or landing)** — Horizontal scroll of 5 illustrated couple cards opening a bottom sheet with full love story; 5 testimonial quote cards; success strip (94+ couples, 21 countries, 2800+ members, 7 weddings).

### Matching algorithm

Romance: Religion 25 / Age 20 / Ethnicity 15 / Location 15 / Values 15 / Lifestyle 10. Verified members get +5 trust bonus. Spark: Age + Location + Lifestyle only. Implemented as a pure TypeScript scoring function used by both Discover and Admin manual-match.

### Security

- Supabase Auth (email/password + Google) with RLS on every table
- Roles in a separate `user_roles` table with `has_role()` security-definer function — admin tab gated server-side
- Client-side rate limit: 30 actions / 60 s
- Chat content filter (regex for phone numbers, WhatsApp links, "send money" patterns) — flagged messages stored with `flagged=true`
- Report (6 categories) + Block flows
- Auto-logout after 30 min inactivity
- Photo deterrence: disable right-click, `user-select:none`, semi-transparent username watermark *(true screenshot blocking impossible on web — explicitly noted to user)*
- Browser face detection rejects non-face uploads before they hit storage
- 7-day trial timer in `localStorage`, validated against `trial_start` in DB
- Zod validation on every form and edge function input

### Scam-warning placements

Discover tip strip · Matches inline alert · Verify safety banner · Profile privacy tip · Pinned notice atop every chat · Full Safety tab.

---

### Technical details

**Stack:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui + React Router + TanStack Query + Lovable Cloud (Supabase) + Paystack Inline JS + TensorFlow.js BlazeFace + Recharts.

**Database tables (with RLS):**
- `users` (extends auth.users): first_name, location, gender, ethnicity, religion, mode, plan, verified, trial_start, created_at
- `profiles`: user_id (FK), bio, prompts (jsonb), interests (jsonb), photos (jsonb url array)
- `matches`: user_a, user_b, score, manual, admin_note, status, created_at
- `messages`: match_id, sender_id, content, flagged, created_at
- `reports`: reporter_id, reported_id, reason, status, created_at
- `subscriptions`: user_id, plan, currency, amount, provider, status, expires_at, paystack_reference
- `admin_matches`: member_a, member_b, score, reason, admin_id, status, created_at
- `user_roles` + `app_role` enum (`admin` | `user`) + `has_role()` security-definer function
- `storage.buckets`: `profile-photos` (public read, owner-write RLS)

**Edge functions:**
- `paystack-initialize` — creates Paystack transaction, returns auth URL/reference
- `paystack-verify` — verifies payment by reference, upgrades subscription row
- `paystack-webhook` — receives Paystack event callbacks, updates `subscriptions`

**Secrets needed (will request after approval):** `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`.

**Folder layout:**
```text
src/
  pages/        Discover, Matches, Chat, Verify, Profile, Safety, Admin, Auth, Onboarding
  components/   nav, cards, plan-cards, paystack-flow, couple-card, testimonial, safety-banner, ui/*
  features/
    matching/   scoring.ts (weighted algorithm)
    moderation/ contentFilter.ts, rateLimit.ts
    face/       detectFace.ts (BlazeFace wrapper)
    trial/      trialTimer.ts
  lib/          supabase client, paystack client, currency, brand tokens
  hooks/        useAuth, useRole, useSubscription, useIdleLogout
```

**Out of scope for this first build (follow-ups):**
- Real-time chat subscriptions (will start with polling, then upgrade)
- Push notifications
- Native Expo app
- True scam-detection ML (rules-based stub first)
