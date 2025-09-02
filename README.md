# FHIR Healthcare Bootcamp

This is a full-stack educational application designed to teach healthcare interoperability through hands-on FHIR (Fast Healthcare Interoperability Resources) training.

## Quick Start

### Using Local HAPI FHIR Server

1. Start the local HAPI FHIR server:
   ```bash
   make up
   ```

2. Wait for the healthcheck to pass (about 30-60 seconds)

3. Seed the server with sample data:
   ```bash
   make seed
   ```

4. The local HAPI FHIR endpoint will be available at: `http://localhost:8080/fhir`

### Helper Commands

- `make up` - Start services with Docker Compose
- `make down` - Stop all services
- `make logs` - View HAPI FHIR server logs
- `make seed` - Seed local FHIR server with sample data

## Important Security Notice

⚠️ **WARNING**: Never upload real PHI (Protected Health Information) to public FHIR servers unless you run them locally and understand the security risks.

This application is designed for educational purposes using synthetic patient data from Synthea. Always use synthetic/test data when working with public or shared FHIR servers.

## Instructor Mode

Enable instructor mode for advanced classroom management features:

```bash
INSTRUCTOR_MODE=true npm run dev
```

### Instructor Features

- **Auto-Local FHIR**: Automatically defaults to local FHIR server unless explicitly overridden
- **Class Reset**: Reset all class artifacts and optionally wipe local HAPI data

#### Reset Class Operation

**⚠️ Instructor Mode Only**: Clear class artifacts to prepare for new sessions.

```bash
# Clear artifacts only (safe)
curl -X POST http://localhost:5000/ops/reset-class \
  -H "Content-Type: application/json" \
  -d '{}'

# DANGEROUS: Clear artifacts AND wipe all FHIR data
curl -X POST http://localhost:5000/ops/reset-class \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}'
```

**⚠️ WARNING**: Setting `confirm: true` completely wipes the local HAPI FHIR database. All patient data, observations, and resources will be permanently deleted. Use only when starting fresh classes.

#### Commerce Data Seeding

Seed the database with demo products, courses, and badges for the bootcamp platform:

```bash
# Seed commerce data (products, courses, badges)
curl -X POST http://localhost:5000/ops/seed-commerce \
  -H "Content-Type: application/json"
```

This operation creates:

**Products:**
- `bootcamp_basic` - FHIR Bootcamp Basic Access ($299)
- `bootcamp_plus` - FHIR Bootcamp Plus Access ($599) 
- `course_fhir101` - FHIR 101 Fundamentals Course ($99)

**Courses:**
- `fhir-101` - Free introductory course
- `health-data-bootcamp` - Requires `bootcamp_basic` purchase
- `fhir-deep-dive` - Requires `bootcamp_plus` purchase

**Achievement Badges:**
- `BYOD_CHAMP` - Bring Your Own Data completion (50 points)
- `FHIR_LOOP_CLOSER` - Complete FHIR lifecycle (75 points)
- `QUIZ_MASTER` - High quiz performance (25 points)

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (required)
- `STRIPE_PRICE_IDS_JSON` - JSON mapping of product SKUs to Stripe price IDs (optional)

Example `STRIPE_PRICE_IDS_JSON`:
```json
{
  "bootcamp_basic": "price_1234567890abcdef",
  "bootcamp_plus": "price_abcdef1234567890", 
  "course_fhir101": "price_fedcba0987654321"
}
```

## Setup Instructions

### Prerequisites

1. **Node.js 18+** and **npm**
2. **Docker and Docker Compose** (for local FHIR server)
3. **Supabase account** (for authentication and database)
4. **Stripe account** (for payments, optional)

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Configure the required environment variables in `.env`:

#### Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to **Settings** → **API** in your Supabase dashboard
3. Copy your project URL and anon key:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Copy your service role key (for backend operations):
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

#### Enable Google Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your OAuth credentials:
   - **Client ID**: Get from [Google Cloud Console](https://console.cloud.google.com)
   - **Client Secret**: Get from Google Cloud Console
4. Add authorized redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:5173/auth/callback` (for development)

#### Stripe Setup (Optional)

1. Go to [stripe.com](https://stripe.com) and create an account
2. Navigate to **Developers** → **API Keys**
3. Copy your keys:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   ```
4. Set up webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `invoice.payment_succeeded`
   - Copy webhook secret:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```

#### Create Stripe Products and Prices

1. In Stripe dashboard, go to **Products** → **Add product**
2. Create products for:
   - **FHIR Bootcamp Basic**: $99
   - **FHIR Bootcamp Plus**: $199  
   - **FHIR 101 Course**: $49
3. Copy the price IDs and update:
   ```bash
   STRIPE_PRICE_IDS_JSON={"bootcamp_basic":"price_xxx","bootcamp_plus":"price_yyy","course_fhir101":"price_zzz"}
   ```

#### Application URLs

Configure your application URLs:
```bash
APP_BASE_URL=http://localhost:5173
API_BASE_URL=http://localhost:8000
```

For production, update these to your actual domain names.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the local HAPI FHIR server:
   ```bash
   make up
   ```

3. Wait for health check (30-60 seconds), then seed with sample data:
   ```bash
   make seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`.

## Development

The application uses synthetic patient data for all exercises and demonstrations, ensuring HIPAA compliance and data privacy.

### Testing

Run the test suite to verify FHIR functionality:

```bash
npx vitest run
```

**CI Note**: Tests mock FHIR network calls to ensure reliable execution in CI environments without requiring external FHIR servers.

### Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript  
- **Database**: PostgreSQL with Drizzle ORM
- **FHIR Integration**: Support for multiple FHIR R4 servers