# VoxOrbit — Full Code Review & Improvement Report

**Project:** AI Voice Agent for Small & Medium Businesses
**Stack:** React 18 · TypeScript · Vite · Supabase · VAPI · Twilio · shadcn/ui · Tailwind CSS
**Review date:** March 2026
**Reviewer:** Claude AI (Anthropic)

---

## Executive Summary

The application has a strong foundation: a well-structured component hierarchy, clean UI using shadcn/ui, and correctly configured Supabase Edge Functions for VAPI integration. However, **five critical bugs** made core functionality completely non-functional out of the box, and **several architectural gaps** prevented the app from serving SMB customers effectively.

All critical and high-priority issues have been resolved. The sections below document what was found, what was fixed, and what remains as future recommendations.

---

## 1. Critical Bugs Fixed

### 1.1 `useCredentials.ts` — Credentials Never Persisted (BLOCKING)

**Severity:** 🔴 Critical — Every Call button was permanently disabled
**File:** `src/hooks/useCredentials.ts`

**Root cause:** `vapiCredentials` state was initialized to empty strings. The `saveVAPICredentials` and `saveSMSCredentials` functions showed a toast message saying "managed server-side" but returned `true` without writing anything to storage. As a result, `hasVAPICredentials` (which gates every call button) was **always `false`**.

```typescript
// BEFORE — broken: never persisted anything
const saveVAPICredentials = async (creds: VAPICredentials) => {
  toast({ title: "Settings Managed Server-Side", ... });
  return true; // ← lie: nothing was saved
};
const hasVAPICredentials = Boolean(vapiCredentials.apiKey); // always false
```

**Fix:** Rewrote the hook to use `localStorage` with a `useEffect` auto-persist pattern. Credentials now survive page reloads, and `hasVAPICredentials` correctly reflects whether all three required keys are present.

```typescript
// AFTER — fixed: localStorage persistence
const VAPI_STORAGE_KEY = "voxorbit_vapi_credentials";

function loadFromStorage<T>(key: string, fallback: T): T { ... }
function saveToStorage<T>(key: string, value: T): void { ... }

const [vapiCredentials, setVapiCredentials] = useState<VAPICredentials>(() =>
  loadFromStorage(VAPI_STORAGE_KEY, defaultCredentials)
);

useEffect(() => {
  saveToStorage(VAPI_STORAGE_KEY, vapiCredentials);
}, [vapiCredentials]);

const hasVAPICredentials = Boolean(
  vapiCredentials.apiKey && vapiCredentials.assistantId && vapiCredentials.phoneNumberId
);
```

---

### 1.2 `vapiService.ts` — Hardcoded Supabase Project URL

**Severity:** 🔴 Critical — Breaks on any project clone or migration
**File:** `src/services/vapiService.ts`

**Root cause:** A raw `fetch()` call to a hardcoded URL `https://scagutbejvgicmllzqge.functions.supabase.co/make-vapi-call` was used instead of the Supabase client. This leaks the project reference ID in source code, breaks for anyone forking the project, and bypasses Supabase auth headers.

**Fix:** Replaced with `supabase.functions.invoke()` which automatically resolves the correct project URL from the initialized client:

```typescript
// AFTER — fixed
const { data, error } = await supabase.functions.invoke('make-vapi-call', {
  body: { customer, customMessage, vapiApiKey, vapiAssistantId, vapiPhoneNumberId },
});
```

---

### 1.3 `make-vapi-call` Edge Function — No Credential Fallback

**Severity:** 🔴 Critical — New users could not make any calls
**File:** `supabase/functions/make-vapi-call/index.ts`

**Root cause:** The edge function read VAPI credentials exclusively from `Deno.env` (Supabase Secrets). For new users who haven't configured secrets yet, every call failed with a generic error.

**Fix:** Added a fallback chain — prefer Supabase Secrets (production), fall back to credentials passed from the client (development / first-time setup):

```typescript
const apiKey = Deno.env.get('VAPI_API_KEY') || sanitizeString(vapiApiKey || '', 200);
const assistantId = Deno.env.get('VAPI_ASSISTANT_ID') || sanitizeString(vapiAssistantId || '', 200);
const phoneNumberId = Deno.env.get('VAPI_PHONE_NUMBER_ID') || sanitizeString(vapiPhoneNumberId || '', 200);
```

---

### 1.4 `App.tsx` — Missing Routes and Floating Widget Scope

**Severity:** 🟡 High — 404 on navigating to /features or /pricing; widget showed on landing page
**File:** `src/App.tsx`

**Issue A:** The navigation linked to `/features` and `/pricing` but neither route was registered in the React Router config → 404.

**Issue B:** `<VapiFloatingWidget />` rendered on every route including the public landing page (`/`), which looked unprofessional and cluttered the homepage.

**Fix:** Added the missing routes and scoped the floating widget to dashboard routes only.

---

### 1.5 `Index.tsx` — "Retailer" Tab Used Conflicting State Mechanism

**Severity:** 🟡 High — Tab navigation broke, Retailer content hijacked the entire page
**File:** `src/pages/Index.tsx`

**Root cause:** The Retailer tab used `onClick={() => setShowRetailerView(true)}` which triggered a completely different render path (a full-page takeover with a custom back button) instead of rendering as a normal `TabsContent`. This conflicted with the Tabs component's value state management.

**Fix:** Removed `showRetailerView` state entirely. The Retailer tab now renders `<RetailerDashboard />` inside a standard `<TabsContent value="retailer">`, consistent with all other tabs.

---

## 2. Hardcoded Personal Content Removed

**Severity:** 🟡 High — Inappropriate for a generic SMB platform
**Files:** `src/hooks/useCredentials.ts`

The `DEFAULT_VAPI_MESSAGE` contained:
```
"Hello Akash Godishala! This is a reminder about tomorrow's meeting..."
```

This personal name was hardcoded directly into the default call script, which would go out to every customer call for any business using the platform.

**Fix:** Replaced with a generic, business-appropriate template:
```
"Hello! This is your AI assistant calling on behalf of {businessName}. How can I help you today?"
```

---

## 3. New Features Added

### 3.1 Order Management (`src/components/orders/OrderManagement.tsx`)

The core missing SMB feature. The VAPI webhook was already capturing orders to the `retailer_orders` Supabase table, but there was no UI to view or manage them.

**What was built:**
- Order stats dashboard (total, pending, confirmed, fulfilled, cancelled, revenue)
- Full order list with search, filter by status, and sort by date/amount
- Inline status transitions (pending → confirmed → fulfilled / cancelled)
- Order detail dialog showing customer info, line items, and notes
- **Supabase Realtime subscription** — new orders from voice calls appear instantly without page refresh
- CSV export capability

### 3.2 Business Setup Wizard (`src/components/setup/BusinessSetup.tsx`)

New SMB users had no guided path to configure their business before making calls. Added a 4-step onboarding wizard:

1. **Business Info** — name, industry, timezone, operating hours, days of week
2. **Credentials** — VAPI API key, Assistant ID, Phone Number ID (with direct links to VAPI dashboard); Twilio Account SID, Auth Token, Phone Number
3. **Agent Voice** — personality selector (Professional / Friendly / Energetic / Calm), greeting message preview
4. **Review & Launch** — summary of all configured settings

Persists to `localStorage` (immediate) and Supabase `user.user_metadata` (long-term). Exposes `isSetupComplete()` and `getBusinessProfile()` helpers for other components.

### 3.3 Improved Dashboard Navigation (`src/pages/Index.tsx`)

Complete rewrite of the dashboard index:

- Removed the broken retailer full-page-takeover pattern
- Added **Orders** and **Setup** as first-class tabs
- Reordered tabs in SMB priority order: Dashboard → Orders → Call Monitor → Customers → Analytics → Meetings → Retailer → PDF Import → Database → Setup
- Setup tab shows an amber dot indicator when onboarding is incomplete
- Amber banner across the top of the dashboard guides new users to complete setup
- "Complete Setup" shortcut button in the header
- Removed the stale "Ready for Voice Integration" placeholder card at the bottom

---

## 4. Architecture Assessment

### ✅ Strengths

| Area | Assessment |
|------|-----------|
| Component structure | Clean separation of concerns; components are focused and single-purpose |
| UI library | shadcn/ui + Tailwind provides excellent consistency and accessibility |
| Supabase Edge Functions | Correct use of Deno runtime, proper CORS headers, input validation |
| Realtime subscriptions | `CallMonitor` and `OrderManagement` both properly use Supabase Realtime channels |
| VAPI webhook handler | Correctly parses VAPI events and writes to `call_sessions` + `meeting_responses` tables |
| Auth provider | Proper Supabase auth context with loading states |
| TypeScript | Well-typed throughout; interfaces defined for all data structures |

### ⚠️ Remaining Concerns (Recommendations)

#### 4.1 Authentication — No Route Guards

The `/dashboard` route is accessible without authentication. The `AuthProvider` wraps the app but there's no `ProtectedRoute` component redirecting unauthenticated users to login.

**Recommendation:**
```tsx
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};
// In App.tsx:
<Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
```

#### 4.2 Fake Analytics Statistics

`AutomationMonitor` computes stats as:
```typescript
const successRate = Math.floor(loadedCustomers.length * 0.7); // ← fabricated
```
This will confuse users who wonder why success rate never changes relative to their actual calls.

**Recommendation:** Derive all analytics from `call_sessions` and `meeting_responses` tables via Supabase queries, not from multiplying the customer count by 0.7.

#### 4.3 Credential Security — localStorage is Client-Visible

Storing VAPI API keys in `localStorage` means they're visible in the browser's developer tools. This is acceptable for a single-user desktop app but is a concern for shared computers.

**Recommendation for production:** Store credentials server-side in a Supabase table with Row Level Security (RLS) keyed to the authenticated user's `auth.uid()`. The `make-vapi-call` edge function then reads credentials from the database, not from the request body.

#### 4.4 Error Handling — Promise Rejections Not Caught in Several Places

Several `async` functions use `try/catch` but the catch blocks only log to console without surfacing errors to the user. For example, in `AutomatedMeetingScheduler.tsx` and `DocumentDatabase.tsx`, silent failures will confuse users.

**Recommendation:** Use the existing `toast` utility to always surface errors:
```typescript
} catch (error) {
  console.error('Error:', error);
  toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
}
```

#### 4.5 VAPI Phone Number Formatting — Only US Numbers

The edge function adds `+1` for 10-digit numbers:
```typescript
if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
  formattedPhone = '1' + formattedPhone;
}
```

This will incorrectly format international numbers (UK, India, etc.) from SMB customers operating globally.

**Recommendation:** Use a library like `libphonenumber-js` for proper E.164 formatting with region detection, or add a country code selector to the customer form.

#### 4.6 Supabase RLS Policies Not Verified

The `retailer_orders`, `call_sessions`, and `meeting_responses` tables are queried without checking whether RLS is enabled. If RLS is off, any authenticated user can read any other user's call data.

**Recommendation:** In the Supabase dashboard, verify that RLS is enabled on all tables and that policies require `auth.uid() = user_id` (or equivalent) for SELECT/INSERT/UPDATE operations.

---

## 5. File-by-File Change Summary

| File | Status | Change |
|------|--------|--------|
| `src/hooks/useCredentials.ts` | ✅ Fixed | Full rewrite — localStorage persistence, `hasVAPICredentials` fix |
| `src/services/vapiService.ts` | ✅ Fixed | Replace hardcoded fetch URL with `supabase.functions.invoke()` |
| `supabase/functions/make-vapi-call/index.ts` | ✅ Fixed | Accept client-passed credentials as fallback to Supabase Secrets |
| `src/App.tsx` | ✅ Fixed | Add `/features` and `/pricing` routes; scope `VapiFloatingWidget` to dashboard |
| `src/pages/Index.tsx` | ✅ Rewritten | Remove broken retailer state, add Orders + Setup tabs, remove stale card |
| `src/components/orders/OrderManagement.tsx` | ✅ Created | Full order management with realtime, stats, filtering, status transitions |
| `src/components/setup/BusinessSetup.tsx` | ✅ Created | 4-step onboarding wizard with localStorage + Supabase metadata persistence |
| `src/components/calls/CallMonitor.tsx` | ✅ Verified | Already has correct Supabase Realtime subscriptions — no changes needed |

---

## 6. Deployment Checklist

Before going to production:

- [ ] Enable **RLS** on `retailer_orders`, `call_sessions`, `meeting_responses` in Supabase
- [ ] Set Supabase Secrets: `VAPI_API_KEY`, `VAPI_ASSISTANT_ID`, `VAPI_PHONE_NUMBER_ID`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- [ ] Configure **VAPI Webhook URL** in the VAPI dashboard: `https://<project>.supabase.co/functions/v1/vapi-webhook`
- [ ] Implement `ProtectedRoute` for `/dashboard`
- [ ] Replace fake analytics calculations with real Supabase queries
- [ ] Test E.164 phone formatting with non-US numbers if serving international customers
- [ ] Enable Supabase Realtime on the `retailer_orders` and `call_sessions` tables (Replication → Tables in Supabase dashboard)

---

*Report generated by Claude AI · VoxOrbit v1.0 Code Review*
