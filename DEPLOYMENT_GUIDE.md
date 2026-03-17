# Wisefunnel Lead Overhaul - Deployment Guide

This document provides step-by-step instructions to deploy the lead submission overhaul.

**Status:** Ready for Deployment  
**Date:** 2026-03-16  
**Files Modified:**

- `pages/PublicFunnel.tsx` (refactored)
- `services/leadService.ts` (new)
- `supabase/functions/upsert-lead/` (new Edge Function)
- `database/migrations/001_add_lead_constraints.sql` (new)

---

## Prerequisites

1. Access to Supabase project: `https://iwvlmpgeodctctmaacja.supabase.co`
2. Supabase CLI installed (`supabase`)
3. Access to run database migrations
4. Production build environment for Wisefunnel frontend

---

## Phase 1: Database Migration (Zero Downtime)

### 1.1 Backup First

```bash
# Take a full backup of the leads table
pg_dump -h your-db-host -U your-user -d your-db -t leads -f leads_backup_20260316.sql
```

### 1.2 Apply Migration

The migration file adds:
- Unique index on `(funnel_id, email)`
- Missing columns: `email_verified_status`, `phone_verified_status`, `domain`, `source_funnel_name`

**Option A: Via Supabase SQL Editor**
1. Go to Supabase Dashboard → Database → SQL Editor
2. Paste contents of `database/migrations/001_add_lead_constraints.sql`
3. Click "Run"

**Option B: Via Supabase CLI**
```bash
supabase db push --file database/migrations/001_add_lead_constraints.sql
```

### 1.3 Verify Migration

```sql
-- Check unique index
SELECT * FROM pg_indexes WHERE tablename = 'leads' AND indexname = 'unique_lead_per_funnel';

-- Check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;
```

Expected columns: `id`, `created_at`, `funnel_id`, `workspace_id`, `name`, `email`, `phone`, `quiz_answers`, `status`, `email_verified_status`, `phone_verified_status`, `domain`, `source_funnel_name`

---

## Phase 2: Edge Function Deployment

### 2.1 Deploy `upsert-lead` Function

```bash
cd wisefunnel_38_zip_Mar3/supabase/functions/upsert-lead
supabase functions deploy upsert-lead --no-verify-jwt
```

### 2.2 Set Environment Variables

The Edge Function reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` automatically from Supabase's internal environment. No external secrets needed.

### 2.3 Test the Endpoint

```bash
curl -X POST https://iwvlmpgeodctctmaacja.supabase.co/functions/v1/upsert-lead \
  -H "Content-Type: application/json" \
  -d '{
    "funnel_id": "test-funnel-id",
    "email": "test@example.com",
    "name": "Test User",
    "phone": "+1234567890",
    "quiz_answers": {"q1": "a"},
    "session_id": "test-session"
  }'
```

Expected response (200 OK):
```json
{
  "success": true,
  "lead": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "status": "new",
    "email_verified_status": "pending",
    "phone_verified_status": "pending"
  }
}
```

---

## Phase 3: Frontend Deployment

### 3.1 Build & Test Locally

```bash
cd wisefunnel_38_zip_Mar3
npm install
npm run build
npm run preview
```

Test a funnel end-to-end:
1. Navigate to a public funnel URL
2. Fill contact form (name, email, phone)
3. Answer quiz questions
4. Verify lead appears in Supabase `leads` table with proper columns

### 3.2 Deploy to Production

Standard Vercel/Netlify/Cloudflare deployment. Ensure environment variables:
- No changes needed; the app uses existing Supabase client keys.

---

## Phase 4: Data Migration (Existing Leads)

If existing leads were stored in a `form_data` column or with mixed schema, migrate them:

### 4.1 Audit Current Data

```sql
-- Count total leads
SELECT COUNT(*) FROM leads;

-- Sample current structure
SELECT id, form_data, quiz_answers, name, email, phone 
FROM leads 
LIMIT 5;

-- Find leads missing name/email
SELECT COUNT(*) FROM leads WHERE name = '' OR email = '';
```

### 4.2 Migration Script

If `form_data` column exists and contains the full payload:

```sql
-- Migrate from form_data to proper columns
UPDATE leads 
SET 
  name = COALESCE(form_data->>'name', form_data->>'fullName', ''),
  email = COALESCE(form_data->>'email', ''),
  phone = COALESCE(form_data->>'phone', form_data->>'phoneNumber', ''),
  quiz_answers = form_data - 'name' - 'email' - 'phone' - 'fullName' - 'phoneNumber'
WHERE form_data IS NOT NULL;
```

### 4.3 Handle Duplicates

After migration, check for duplicates that violate the new index:

```sql
SELECT funnel_id, email, COUNT(*) as cnt
FROM leads
GROUP BY funnel_id, email
HAVING COUNT(*) > 1;
```

If duplicates exist, resolve manually (merge or delete) before the index enforces uniqueness.

### 4.4 Clean Up (Optional, 30 days later)

Once confident the new system works:

```sql
-- Drop old form_data column if present
ALTER TABLE leads DROP COLUMN IF EXISTS form_data;
```

---

## Phase 5: Monitoring

### 5.1 Edge Function Logs

In Supabase Dashboard → Edge Functions → `upsert-lead` → Logs:
- Look for `400` errors: validation failures
- Look for `409` errors: unique constraint violations (should only happen if index missing)

### 5.2 Database Health

```sql
-- Recent lead submissions
SELECT COUNT(*) FROM leads 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Index usage
SELECT * FROM pg_stat_user_indexes 
WHERE relname = 'leads';
```

### 5.3 Frontend Error Tracking

If using Sentry or similar, monitor:
- `leadService.upsertLead` failures
- Network errors to `/functions/v1/upsert-lead`
- Validation errors from contact forms

---

## Rollback Plan

If critical issues arise:

1. **Frontend rollback**: Revert to previous commit of `PublicFunnel.tsx` and `services/leadService.ts`
2. **Edge Function**: Disable by renaming or removing the function (but keep deployed old version if possible)
3. **Database**: Drop the unique index (not strictly needed, but can reduce errors):
   ```sql
   DROP INDEX IF EXISTS unique_lead_per_funnel;
   ```
4. **Data**: Restore from backup if any data corruption occurs

The old code path (using `form_data`) no longer exists after this change, so rollback requires redeploying previous version.

---

## Post-Deployment Checklist

- [ ] Migration applied, unique index exists
- [ ] Edge Function deployed and tested
- [ ] Frontend built and deployed
- [ ] End-to-end test passes for a funnel
- [ ] Lead appears in database with separate columns
- [ ] No duplicate leads for same email+funnel
- [ ] Email/phone verification status shows as 'pending' (or 'verified' if verification enabled)
- [ ] Edge Function logs show no unexpected errors
- [ ] Monitoring alerts configured

---

## Support

For issues, check:
- Edge Function logs (Supabase → Edge Functions)
- Frontend console (browser dev tools)
- Supabase table data

Report bugs with:
- Timestamp
- Funnel ID
- Email used
- Error logs from console or Edge Function

---

*Deployed by Clawdio (OpenClaw Assistant)*
*Wisefunnel Lead Overhaul v1.0*
