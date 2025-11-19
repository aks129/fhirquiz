# Client Demo Setup Guide

This guide will help you quickly set up and run the FHIR Healthcare Bootcamp application for a client demonstration.

## Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ installed
- Internet connection (for FHIR server access)

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   The `.env` file is already configured for demo mode with:
   - Public FHIR server (hapi.fhir.org) - no local setup needed
   - Authentication disabled for easy access
   - All features enabled

3. **Start the Application**
   ```bash
   npm run dev
   ```

4. **Access the Demo**
   Open your browser to: `http://localhost:5000`

## Demo Features

### 1. Landing Page
- Professional marketing page showcasing the bootcamp
- View at: `http://localhost:5000`
- Features: Course overview, curriculum, pricing

### 2. Demo Mode
- Click "Continue in Demo Mode" to explore without creating an account
- Access all features without authentication
- Perfect for quick demonstrations

### 3. Key Features to Demonstrate

#### FHIR Labs (Hands-on Learning)
- Navigate to Labs section
- Day 1: FHIR Data Ingestion
- Day 2: FHIR Data Transformation & Analytics
- Day 3: FHIR Data Operationalization

#### Interactive Quizzes
- Multiple quiz categories available
- Real-time scoring and feedback
- Progress tracking

#### FHIR Simulator
- Interactive FHIR API testing
- Real requests to public FHIR server
- View at: `/simulator`

#### BYOD (Bring Your Own Data)
- Upload custom FHIR bundles
- Generate analytics and visualizations
- Export results

### 4. Portal Experience
- If authentication is enabled:
  - Create account or sign in with Google
  - Access personalized dashboard
  - Track learning progress
  - View achievements and badges

## Demo Flow Suggestions

### Basic Demo (10 minutes)
1. Start on landing page - show curriculum
2. Click "Continue in Demo Mode"
3. Navigate through Day 1 Lab
4. Take a quiz to show interactivity
5. Show FHIR Simulator with live requests

### Comprehensive Demo (20 minutes)
1. Landing page walkthrough
2. Demo mode activation
3. Complete a lab exercise
4. Take and review a quiz
5. BYOD: Upload a sample bundle
6. Show generated visualizations
7. Demonstrate FHIR Simulator
8. Review progress tracking

## Technical Details

### Architecture
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **FHIR Server**: Public HAPI FHIR R4 (hapi.fhir.org)
- **Authentication**: Disabled for demo (can be enabled with Supabase)

### FHIR Server
- Currently using: `https://hapi.fhir.org/baseR4`
- This is a public test server with synthetic data
- No local setup required

### Optional: Enable Local FHIR Server

If you want to use a local FHIR server:

1. Start the HAPI FHIR server:
   ```bash
   make up
   ```

2. Wait for healthcheck (~60 seconds)

3. Seed with sample data:
   ```bash
   make seed
   ```

4. Update `.env`:
   ```
   USE_LOCAL_FHIR=true
   ```

5. Restart the application

## Troubleshooting

### Port Already in Use
If port 5000 is busy:
```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9

# Or change the port in package.json
```

### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### FHIR Server Not Responding
- The public HAPI FHIR server may occasionally be slow
- Try refreshing the page
- Or switch to local FHIR server (see Optional section above)

## Production Deployment

For production deployment:

1. Set up Supabase for authentication
2. Configure Stripe for billing
3. Set up proper environment variables
4. Use the build command:
   ```bash
   npm run build
   npm start
   ```

See `README.md` for full production setup instructions.

## Support

For issues or questions:
- Check the main README.md
- Review the application documentation at `/docs`
- Check the troubleshooting guide at `/troubleshooting`

## Demo Tips

1. **Keep it Interactive**: Let clients click through features themselves
2. **Show Real FHIR Data**: Demonstrate live API calls in the simulator
3. **Highlight Educational Value**: Emphasize hands-on learning approach
4. **Showcase Progress Tracking**: Show how learners can track their journey
5. **Demonstrate Flexibility**: Show both demo mode and authenticated experience

## Next Steps After Demo

1. Discuss customization options
2. Review pricing and licensing
3. Set up pilot program
4. Configure production environment
5. Plan instructor training
