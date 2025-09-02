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

## Development

The application uses synthetic patient data for all exercises and demonstrations, ensuring HIPAA compliance and data privacy.

### Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript  
- **Database**: PostgreSQL with Drizzle ORM
- **FHIR Integration**: Support for multiple FHIR R4 servers