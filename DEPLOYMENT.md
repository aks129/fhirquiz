# FHIR Healthcare Bootcamp - Deployment Guide

**Last Updated:** 2025-10-07
**Target Platform:** Vercel (primary), AWS/GCP (alternative)

---

## 🚀 Quick Deploy to Vercel

### Prerequisites
1. Vercel account (free tier works)
2. GitHub repository connected to Vercel
3. Supabase project (for auth & database)
4. Stripe account (optional, for payments)

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/fhirquiz)

---

## 📋 Pre-Deployment Checklist

### Critical Fixes Required
Before deploying, ensure these issues are resolved:

- [ ] **NPM Installation** - Fix cache permissions:
  ```bash
  sudo chown -R $(id -u):$(id -g) "$HOME/.npm"
  npm cache clean --force
  rm -rf node_modules package-lock.json
  npm install
  ```

- [ ] **Verify Build Succeeds**:
  ```bash
  npm run build
  ```

- [ ] **Test Development Server**:
  ```bash
  npm run dev
  # Visit http://localhost:5000
  ```

- [ ] **Environment Variables Configured** (see below)

---

## 🔐 Environment Variables

### Required Variables

Create a `.env` file (local) or configure in Vercel dashboard:

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database (Required)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Application URLs (Required)
APP_BASE_URL=https://fhirbootcamp.vercel.app
API_BASE_URL=https://fhirbootcamp.vercel.app

# FHIR Server (Optional - defaults to public HAPI)
FHIR_BASE_URL=https://hapi.fhir.org/baseR4
LOCAL_FHIR_URL=http://localhost:8080/fhir
USE_LOCAL_FHIR=false  # Set to true for local development

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_IDS_JSON={"bootcamp_basic":"price_xxx","bootcamp_plus":"price_yyy"}

# Feature Flags (Optional)
INSTRUCTOR_MODE=false  # Set to true to enable instructor features
NODE_ENV=production
```

### Vercel Configuration

In your Vercel project settings:
1. Go to **Settings** → **Environment Variables**
2. Add all variables above
3. Select **Production**, **Preview**, and **Development** environments
4. Click **Save**

---

## 📦 Build Configuration

### Vercel Build Settings

**Framework Preset:** Vite
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`
**Node Version:** 18.x (or 20.x)

### vercel.json

Create `vercel.json` in project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/sim/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/ops/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/config/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

---

## 🗄️ Database Setup

### Supabase Setup (Recommended)

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note down connection string

2. **Run Migrations**:
   ```bash
   npm run db:push
   ```

3. **Enable Authentication**:
   - In Supabase dashboard: **Authentication** → **Providers**
   - Enable **Email/Password**
   - Enable **Google** (optional)
   - Configure callback URLs:
     - `https://your-domain.vercel.app/auth/callback`
     - `http://localhost:5000/auth/callback` (development)

4. **Row Level Security (RLS)**:
   - Review and enable RLS policies in Supabase
   - Ensure users can only access their own data

---

## 🚦 Deployment Process

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Connect Repository**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the `fhirquiz` project

2. **Configure Project**:
   - Framework: Vite
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables**:
   - Copy all variables from `.env`
   - Paste into Vercel environment variables

4. **Deploy**:
   - Click **Deploy**
   - Wait ~3-5 minutes for build to complete
   - Visit your deployment URL

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option 3: Auto-Deploy with GitHub

1. Connect Vercel to GitHub repository
2. Every push to `main` triggers production deploy
3. Every pull request creates preview deployment

---

## 🔍 Post-Deployment Verification

### Smoke Tests

After deployment, verify these critical paths:

1. **Homepage Loads**:
   ```
   https://your-domain.vercel.app
   ```

2. **API Health Check**:
   ```
   https://your-domain.vercel.app/ops/fhir-base
   ```
   Expected: JSON response with FHIR server config

3. **Authentication Works**:
   - Click "Sign Up" → should redirect to Supabase
   - Complete OAuth flow
   - Verify redirect back to app

4. **FHIR Connection**:
   - Navigate to Day 1 Lab
   - Try connecting to FHIR server
   - Should connect successfully

5. **BYOD Upload**:
   - Navigate to BYOD page
   - Upload sample file (tests/fixtures/apple-health/export-small.xml)
   - Verify processing completes

### Health Check Endpoints

```bash
# Check FHIR configuration
curl https://your-domain.vercel.app/ops/fhir-base

# Check feature flags
curl https://your-domain.vercel.app/config/features

# Check learners count (public endpoint)
curl https://your-domain.vercel.app/api/stats/learners-count
```

---

## 🚨 Troubleshooting

### Build Fails

**Error: `tsx: command not found`**
```bash
# Solution: Ensure devDependencies are installed
npm install --include=dev
```

**Error: TypeScript errors**
```bash
# Solution: Run type check
npm run check
# Fix reported errors
```

**Error: Missing environment variables**
```bash
# Solution: Verify .env.production exists
# Or check Vercel dashboard has all variables
```

### Runtime Errors

**Error: CORS issues**
- Verify `vercel.json` has CORS headers configured
- Check API routes are prefixed with `/api/`

**Error: Database connection failed**
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure IP is whitelisted in Supabase settings

**Error: Authentication not working**
- Verify Supabase callback URLs include your domain
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Ensure service role key is set (server-side only)

### Performance Issues

**Slow page loads**
```bash
# Check bundle size
npm run build
ls -lh dist/assets/

# If bundle too large (>500KB gzipped):
# - Enable code splitting
# - Lazy load heavy components
# - Optimize images
```

**API timeouts**
- Increase Vercel function timeout (Pro plan)
- Implement caching for FHIR metadata
- Use CDN for static assets

---

## 🔒 Security Hardening

### Pre-Production Security Checklist

- [ ] **Environment Variables**: No secrets in code
- [ ] **CORS**: Restricted to your domain only
- [ ] **Rate Limiting**: Enabled on sensitive endpoints
- [ ] **Input Validation**: All forms validated (server + client)
- [ ] **SQL Injection**: Using parameterized queries
- [ ] **XSS Protection**: React's built-in escaping used
- [ ] **HTTPS**: Enforced (Vercel does this by default)
- [ ] **Authentication**: JWT tokens verified server-side
- [ ] **Row Level Security**: Enabled in Supabase

### Update Dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix

# Review and update manually if needed
npm update
```

---

## 📊 Monitoring & Analytics

### Vercel Analytics (Free)

Enable in Vercel dashboard:
1. Go to **Analytics** tab
2. Enable Web Analytics
3. Add this to `client/src/main.tsx`:
   ```typescript
   import { Analytics } from '@vercel/analytics/react';

   // In render:
   <Analytics />
   ```

### Error Tracking (Optional)

**Sentry Integration**:
```bash
npm install @sentry/react @sentry/vite-plugin
```

Configure in `vite.config.ts`:
```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    sentryVitePlugin({
      org: 'your-org',
      project: 'fhirquiz'
    })
  ]
});
```

---

## 🔄 Rolling Back Deployments

### Instant Rollback

In Vercel dashboard:
1. Go to **Deployments**
2. Find previous working deployment
3. Click **⋯** → **Promote to Production**
4. Confirm

### Via CLI

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

---

## 🌍 Custom Domain Setup

### Add Custom Domain

1. In Vercel dashboard: **Settings** → **Domains**
2. Add your domain (e.g., `fhirbootcamp.com`)
3. Configure DNS records:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Wait for SSL certificate (automatic, ~30 seconds)

### Update Environment Variables

```bash
APP_BASE_URL=https://fhirbootcamp.com
API_BASE_URL=https://fhirbootcamp.com
```

### Update Supabase Callback URLs

Add your custom domain to allowed callback URLs:
- `https://fhirbootcamp.com/auth/callback`

---

## 🧪 Staging Environment

### Create Preview Deployment

**Automatic**:
- Every PR creates a preview deployment
- URL: `fhirquiz-git-<branch>-<team>.vercel.app`

**Manual**:
```bash
vercel --prod=false
```

### Environment Variables for Staging

Use separate Supabase project for staging:
```bash
# Staging-specific variables
VITE_SUPABASE_URL=https://staging-project.supabase.co
DATABASE_URL=postgresql://staging-db...
```

---

## 📖 Additional Resources

### Vercel Documentation
- [Deploying Vite Apps](https://vercel.com/docs/frameworks/vite)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)

### Supabase Documentation
- [Authentication](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development)

---

## 🎯 Production Readiness Checklist

Before going live with real users:

### Infrastructure
- [ ] Vercel deployment successful
- [ ] Custom domain configured
- [ ] SSL certificate active (automatic)
- [ ] Database migrations applied
- [ ] Environment variables set

### Testing
- [ ] All critical user paths tested
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing complete
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance benchmarks met (Lighthouse score >80)

### Security
- [ ] No exposed secrets in code
- [ ] Authentication working correctly
- [ ] CORS configured properly
- [ ] Rate limiting active
- [ ] Input validation on all forms
- [ ] npm audit shows no high/critical vulnerabilities

### Monitoring
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring (optional)
- [ ] Performance monitoring

### Documentation
- [ ] README updated with deployment info
- [ ] API documentation current
- [ ] User guide available
- [ ] Troubleshooting guide documented

### Support
- [ ] Support email configured
- [ ] Issue reporting process documented
- [ ] Incident response plan ready

---

## 🚀 Launch Day Checklist

### T-24 Hours
- [ ] Final testing in staging
- [ ] Database backup created
- [ ] Monitoring dashboards ready
- [ ] Support team briefed

### T-1 Hour
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Run smoke tests
- [ ] Check monitoring dashboards

### T+0 (Launch)
- [ ] Announce launch
- [ ] Monitor error rates
- [ ] Watch performance metrics
- [ ] Be ready to rollback if needed

### T+24 Hours
- [ ] Review error logs
- [ ] Check user feedback
- [ ] Performance analysis
- [ ] Plan hotfixes if needed

---

## 📞 Support

**Deployment Issues:**
- Vercel Support: https://vercel.com/support
- GitHub Issues: https://github.com/your-org/fhirquiz/issues

**Technical Questions:**
- Email: dev@fhirbootcamp.com
- Documentation: See README.md

---

**Document Version:** 1.0
**Last Updated:** 2025-10-07
**Maintained By:** Development Team

**Next Steps After Deployment:**
1. Monitor application for 24 hours
2. Collect user feedback
3. Plan iteration based on usage patterns
4. Implement refactoring roadmap (see REFACTORING-ROADMAP.md)
