# 🤖 Automated Deployment via GitHub Actions

**Status:** ✅ GitHub Actions workflow configured
**Benefit:** Automatic deployment on every push to main
**Alternative:** Since npm CLI has permission issues locally

---

## 🎯 Quick Setup (5 minutes)

This method bypasses local npm issues by using GitHub's servers to deploy.

---

## 📋 Setup Steps

### Step 1: Create Vercel Project (3 minutes)

You **must** create the Vercel project first via the dashboard:

1. **Go to Vercel:**
   - Visit [https://vercel.com/new](https://vercel.com/new)
   - Login with GitHub

2. **Import Repository:**
   - Click "Import Git Repository"
   - Select `aks129/fhirquiz`
   - Click "Import"

3. **Configure (Important - Don't deploy yet):**
   - Project Name: `fhir-bootcamp` (or your choice)
   - Framework: Vite
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variables:**
   ```bash
   # Required - From Supabase
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   DATABASE_URL=postgresql://postgres:...

   # Required - Use placeholder, update after first deploy
   APP_BASE_URL=https://placeholder.vercel.app
   API_BASE_URL=https://placeholder.vercel.app

   # Optional - Defaults
   FHIR_BASE_URL=https://hapi.fhir.org/baseR4
   USE_LOCAL_FHIR=false
   INSTRUCTOR_MODE=false
   NODE_ENV=production
   ```

5. **Click "Deploy"** and wait for initial deployment to complete

### Step 2: Get Vercel Tokens (2 minutes)

After the project is created:

1. **Get Project ID:**
   - In your Vercel project dashboard
   - Go to **Settings** → **General**
   - Copy **Project ID** (starts with `prj_`)

2. **Get Organization/Team ID:**
   - In Vercel dashboard, click your profile (top right)
   - Go to **Account Settings** → **General**
   - Copy **Organization ID** or **Team ID** (starts with `team_`)

3. **Create Vercel Token:**
   - Go to [https://vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Click "Create Token"
   - Name: `GitHub Actions Deploy`
   - Scope: Full Account (or specific project)
   - Expiration: No expiration (or your choice)
   - Click "Create"
   - **COPY THE TOKEN** (shown only once!)

### Step 3: Add GitHub Secrets (2 minutes)

1. **Go to GitHub Repository:**
   - Visit [https://github.com/aks129/fhirquiz](https://github.com/aks129/fhirquiz)
   - Click **Settings** tab
   - Click **Secrets and variables** → **Actions**

2. **Add these 3 secrets:**

   Click "New repository secret" for each:

   ```
   Name: VERCEL_TOKEN
   Value: [paste your Vercel token]
   ```

   ```
   Name: VERCEL_ORG_ID
   Value: [paste your Organization/Team ID - starts with team_]
   ```

   ```
   Name: VERCEL_PROJECT_ID
   Value: [paste your Project ID - starts with prj_]
   ```

3. **Click "Add secret"** for each one

---

## 🚀 Trigger Deployment

### Option 1: Commit and Push (Automatic)

The workflow is already in your repo (`.github/workflows/vercel-deploy.yml`)

**Simply push any commit to main:**

```bash
cd /Users/eugenevestel/Documents/GitHub/fhirquiz

# Make any small change (or use this)
echo "# Deployed $(date)" >> deployment-log.txt

# Commit and push
git add .
git commit -m "Trigger GitHub Actions deployment"
git push origin main
```

**GitHub Actions will:**
1. Detect the push
2. Install Vercel CLI
3. Build your project
4. Deploy to Vercel
5. Show deployment URL

### Option 2: Manual Trigger (From GitHub)

1. Go to [https://github.com/aks129/fhirquiz/actions](https://github.com/aks129/fhirquiz/actions)
2. Click **"Deploy to Vercel"** workflow (left sidebar)
3. Click **"Run workflow"** button (right side)
4. Select branch: `main`
5. Click **"Run workflow"**

---

## 📊 Monitor Deployment

### Watch the Deployment:

1. Go to [https://github.com/aks129/fhirquiz/actions](https://github.com/aks129/fhirquiz/actions)
2. Click the latest workflow run
3. Watch real-time logs
4. See deployment URL when complete

### Check Deployment Status:

The workflow will show:
- ✅ Checkout code
- ✅ Setup Node.js
- ✅ Install Vercel CLI
- ✅ Pull Vercel config
- ✅ Build project
- ✅ Deploy to production
- ✅ Deployment URL

**Time:** ~3-5 minutes per deployment

---

## 🎉 After First Deployment

### Update Environment Variables:

1. Copy your Vercel URL from the workflow output
2. Go to Vercel project → **Settings** → **Environment Variables**
3. Update these:
   - `APP_BASE_URL` → your Vercel URL
   - `API_BASE_URL` → your Vercel URL
4. **Redeploy** (push another commit or manual trigger)

### Configure Supabase:

1. Go to your Supabase project
2. **Authentication** → **URL Configuration**
3. Add callback URL:
   - `https://your-vercel-url.vercel.app/auth/callback`
4. Save

---

## 🔄 Future Deployments

**Automatic deployment on every push:**

```bash
git add .
git commit -m "Your changes"
git push origin main
```

GitHub Actions automatically:
- Builds your app
- Runs tests (if configured)
- Deploys to Vercel
- Updates production URL

**No manual steps needed!**

---

## 🐛 Troubleshooting

### Workflow Fails with "VERCEL_TOKEN is not set"

**Solution:**
- Verify you added the secret in GitHub (Settings → Secrets)
- Name must be **exactly** `VERCEL_TOKEN`
- No extra spaces

### Workflow Fails with "Project not found"

**Solution:**
- Verify `VERCEL_PROJECT_ID` is correct
- Should start with `prj_`
- Get from Vercel project Settings → General

### Workflow Fails with "Insufficient permissions"

**Solution:**
- Recreate Vercel token with Full Account access
- Or give token access to specific project
- Update `VERCEL_TOKEN` secret in GitHub

### Build Fails

**Solution:**
- Check workflow logs for specific error
- Verify package.json has all dependencies
- Test build locally if possible: `npm run build`

---

## 📈 Benefits of This Approach

### Advantages:
- ✅ **Bypasses local npm issues** (no permission problems)
- ✅ **Automatic deployments** (push to deploy)
- ✅ **Consistent environment** (GitHub's servers)
- ✅ **Deployment history** (see all deployments)
- ✅ **Rollback capability** (redeploy previous commits)
- ✅ **No CLI installation needed** locally

### Features:
- Automatic on push to main
- Manual trigger available
- Shows deployment URL
- Build logs visible
- Free on GitHub Actions
- Integrates with Vercel perfectly

---

## 🎯 Quick Reference

### GitHub Actions URLs:
- **Workflows:** [https://github.com/aks129/fhirquiz/actions](https://github.com/aks129/fhirquiz/actions)
- **Secrets:** [https://github.com/aks129/fhirquiz/settings/secrets/actions](https://github.com/aks129/fhirquiz/settings/secrets/actions)

### Vercel URLs:
- **Dashboard:** [https://vercel.com/dashboard](https://vercel.com/dashboard)
- **Tokens:** [https://vercel.com/account/tokens](https://vercel.com/account/tokens)
- **Import:** [https://vercel.com/new](https://vercel.com/new)

### Need Help:
- **GitHub Actions Docs:** [https://docs.github.com/en/actions](https://docs.github.com/en/actions)
- **Vercel CLI Docs:** [https://vercel.com/docs/cli](https://vercel.com/docs/cli)
- **Our Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🚀 Ready to Deploy

**Your workflow is configured and ready!**

**Next steps:**
1. ✅ Create Vercel project (dashboard)
2. ✅ Get Vercel tokens
3. ✅ Add GitHub secrets
4. ✅ Push to main → Auto-deploy!

**The workflow file is already in your repo:**
`.github/workflows/vercel-deploy.yml`

**Just push a commit to trigger deployment!**

---

## 📝 Workflow Details

### What the Workflow Does:

```yaml
Trigger: On push to main (or manual)
Steps:
  1. Checkout your code
  2. Setup Node.js 18
  3. Install Vercel CLI
  4. Pull Vercel project config
  5. Build your React app
  6. Deploy to Vercel production
  7. Show deployment URL
```

### Configuration:
- **File:** `.github/workflows/vercel-deploy.yml`
- **Runs on:** Ubuntu Latest
- **Node:** 18.x
- **Cache:** npm dependencies
- **Deployment:** Production only

---

## 🎓 Alternative: Manual Dashboard Deploy

If you prefer not to use GitHub Actions:

1. **Go to Vercel:** [https://vercel.com/new](https://vercel.com/new)
2. **Import:** `aks129/fhirquiz`
3. **Configure:** Add environment variables
4. **Deploy:** Click deploy button
5. **Auto-deploy:** Vercel will auto-deploy on future pushes

This works without GitHub Actions but gives you less control.

---

## ✨ Summary

**Problem:** Local npm cache permissions blocked CLI deployment
**Solution:** GitHub Actions deploys from GitHub's servers
**Result:** Automatic, reliable deployments on every push

**Status:** ✅ Configured and ready to use

**Start deployment:** Push a commit to main!

---

**Created:** 2025-10-07
**Repository:** github.com/aks129/fhirquiz
**Workflow:** .github/workflows/vercel-deploy.yml
**Status:** READY FOR AUTOMATED DEPLOYMENT 🤖
