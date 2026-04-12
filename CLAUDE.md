# UTenancy — Project Instructions

You are the developer for **UTenancy**, a student housing platform built by Cris (cmiguelf13@icloud.com). Move fast, iterate quickly, and always lint before pushing.

---

## Stack

- **Framework:** Next.js 14 App Router (`'use client'` components throughout)
- **Database / Auth / Storage:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel → `utenancy.com`
- **Payments:** Stripe (subscriptions for landlord tiers)
- **Styling:** Tailwind CSS with custom brand tokens

---

## Repo & File Structure

**CRITICAL:** Vercel builds from `UTenancy-Next/` as the root directory.

- ✅ All code changes go inside `UTenancy-Next/` (e.g. `UTenancy-Next/app/page.tsx`)
- ❌ The root-level `app/`, `lib/` etc. folders exist but are NOT used by Vercel — editing them has zero effect on the live site

```
cmiguelf13-maker/UTenancy (GitHub)
├── UTenancy-Next/          ← Vercel builds from here (root)
│   ├── app/
│   ├── lib/
│   ├── components/
│   └── ...
└── (other root files — ignored by Vercel)
```

---

## Vercel Deployment

Always use **project-xvv7q** — never the "utenancy" project.

| Key | Value |
|---|---|
| Project ID | `prj_jDR2xZUV6IAzZZkmGuEIjDOFjxAx` |
| Team ID | `team_lnrOo8nvDzNm9agzUR1wBIBw` |
| Live domain | `utenancy.com`, `www.utenancy.com` |

The project named "utenancy" (`prj_Qn1JqxBjPFOCjwwo81itZ9Q5YGAg`) is a separate unused project — do not deploy there.

---

## Pushing Code — GitHub API Only

**Never use `git add` / `git commit` / `git push`.** The `.git/index.lock` file is stuck and cannot be removed on this filesystem.

Always push via the **GitHub REST API**:
1. Read the modified file(s)
2. GET current blob SHA: `GET /repos/cmiguelf13-maker/UTenancy/contents/UTenancy-Next/path/to/file`
3. PUT updated content (base64): same endpoint with `{ message, content, sha }`

**GitHub PAT** is embedded in `.git/config` remote URL inside `UTenancy-Next/.git/config`.

---

## Pre-Push Checklist (always do this)

```bash
cd UTenancy-Next
npx next lint 2>&1 | grep "Error:"
```

If any `Error:` lines appear → fix them before pushing. Warnings are fine and can be ignored.

---

## Supabase

- **Project URL:** `https://dzoigotkcaghqjyrotgp.supabase.co`
- **Project ID:** `dzoigotkcaghqjyrotgp`
- **Storage bucket:** `listing-images` (public). Images stored as `{listing_id}/{timestamp}_{index}.{ext}`

**Roles** are stored in both `user_metadata.role` (Supabase Auth) and `profiles.role`. Two roles: `student` and `landlord`.

**Subscription tiers** (landlord only): `free` → `starter` → `growth` → `pro`. Also: `past_due`, `cancelled`. Synced via Stripe webhooks → `profiles.subscription_status` + `profiles.subscription_tier`.

**Admin account:** `cfernandez@utenancy.com` — use Supabase MCP to update this account's data directly rather than hardcoding bypasses in the code.

---

## Key Pages

| Route | Description |
|---|---|
| `/` | Homepage — GMock + DB listings, filtering, pricing section, waitlist |
| `/auth` | Auth (login/signup) |
| `/profile` | Role-aware profile editor (student: lifestyle + university; landlord: contact + messenger) |
| `/landlord` | Landlord dashboard — listing management, applicant review, subscription gating |
| `/listings/[slug]` | Detail page — supports both mock slugs and DB UUIDs |
| `/interested` | Student saved/interested properties |
| `/messages` / `/messages/[id]` | Messaging system |
| `/admin/waitlist` | Admin-only waitlist management (cfernandez@utenancy.com) |

Nav hides on `/landlord` — that portal has its own header.

---

## Listing Logic

- Missing required fields or no photos → saved as `draft`
- All required fields + photos → saved as `active`
- Statuses: `active`, `draft`, `rented`, `archived`
- Listing limits by tier: Starter = 3, Growth = 10, Pro = unlimited

---

## Brand Colors

| Token | Hex | Use |
|---|---|---|
| Clay | `#6b4c3b` | Primary dark brand color |
| Terracotta | `#9c7060` | Main brand / backgrounds |
| Sand | `#c4a090` | Secondary warm accent |
| Linen | `#ede0d8` | Light backgrounds / cards |
| Cream | `#faf5f2` | Off-white backgrounds |
| Espresso | `#2e1e18` | Dark text / headings |
| Stone | `#1e1410` | Darkest text |

**Logo files** in `/Tenancy/Logo assets/`:
- `logo-white.png` — white logo for dark/Terracotta backgrounds
- `Header logo.png` — color logo on white
- `logo-transparent.png` — color logo, transparent bg
- `Icon.png` — icon only (U + house)

---

## Code Rules (hard-won — don't break these)

### 1. No `matchAll()` or iterator-based `for...of` loops
The tsconfif does not enable `downlevelIteration`. This will break the build.

```ts
// ❌ BAD — build failure
for (const match of str.matchAll(/pattern/g)) { ... }

// ✅ GOOD
const re = /pattern/g
let m: RegExpExecArray | null
while ((m = re.exec(str)) !== null) { ... }
```

Also avoid `for...of` on `Map.entries()`, `Set.values()` etc. Use `Array.from()` or traditional loops.

### 2. Use `<img>` for Supabase Storage URLs, not `<Image>`
Next.js `<Image>` requires all domains to be whitelisted. Supabase Storage URLs cause silent white-page failures.

```tsx
// ❌ BAD — white page on DB images
<Image src={listing.img} ... />

// ✅ GOOD
ca src={listing.img} ... />

// ✅ Fine for known static domains (Unsplash, etc.)
<Image src="https://images.unsplash.com/..." ... />
```

### 3. Never place early returns before React hooks
Hooks must always be called — early returns must come *after* all `useState` / `useEffect` / `useRef` calls.

```tsx
// ❌ BAD — react-hooks/rules-of-hooks build failure
if (condition) return null
const [state, setState] = useState(...)

// ✅ GOOD
const [state, setState] = useState(...)
if (condition) return null
```

---

## Distance Calculation

`lib/distance.ts` — Haversine formula + OpenStreetMap Nominatim geocoding. No API key needed. University coordinates are hardcoded for supported schools.
