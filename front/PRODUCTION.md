# MyFiscal Production Guide 🚀

This document outlines the requirements and steps to deploy MyFiscal to production (Vercel + Supabase).

## 1. Environment Variables (Critical)

Ensure the following variables are set in your production environment (Vercel Dashboard):

| Variable | Description | Required |
| --- | --- | --- |
| `DATABASE_URL` | Supabase Connection String (Postgres) | Yes |
| `OPENAI_API_KEY` | OpenAI API Key | Yes |
| `SESSION_SECRET` | 32+ char random string for JWT signing | Yes |
| `OPENAI_MODEL` | Default: `gpt-4o-mini` | No |
| `NEXT_PUBLIC_APP_URL` | Your production domain | No |

## 2. Pre-Deployment Checks

Before deploying, run the following commands to ensure stability:

```bash
# 1. Validation of environment logic
# (Run this in a local env mimicking production)
npx tsx -e "import { validateConfig } from './lib/env-config'; validateConfig();"

# 2. Build Check
npm run build
```

## 3. Post-Deployment Verification (Smoke Tests)

Once deployed, verify the health of the application:

```bash
# Check the health endpoint
curl https://your-domain.com/api/health

# Run the automated smoke tests
npx tsx scripts/smoke-test.ts https://your-domain.com
```

## 4. Maintenance Endpoints

- **Health Check**: `/api/health` - Monitor DB and API status.
* **Billing Webhook**: `/api/billing/webhook` - Point your Stripe/Payment provider here.

## 5. Security Notes

- JWT sessions expire in 7 days.
* Cookies are set to `HttpOnly`, `Secure`, and `SameSite: Lax`.
- Database SSL is enforced.
- All critical endpoints are hardened against unauthorized methods and invalid payloads.

---
*Created by MyFiscal Lead Production Engineer*
