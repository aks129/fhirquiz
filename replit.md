# FHIR Healthcare Bootcamp

## Overview

This is a full-stack educational application designed to teach healthcare interoperability through hands-on FHIR (Fast Healthcare Interoperability Resources) training. The application provides a structured 3-day bootcamp experience where users learn to ingest, transform, and operationalize healthcare data using FHIR standards. Students work with synthetic patient data from Synthea, perform SQL-based transformations to calculate risk scores, and publish insights back to FHIR servers as structured observations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client application is built with React 18 and TypeScript, using Vite as the build tool and development server. The UI framework combines Tailwind CSS for styling with shadcn/ui components for consistent design patterns. Wouter provides lightweight client-side routing without the overhead of React Router. State management is handled through TanStack Query for server state and local React state for UI interactions. The application follows a component-based architecture with clear separation between layout components, FHIR-specific functionality, and lab exercise components.

### Backend Architecture
The server is built on Express.js with TypeScript, following a RESTful API design. The application uses an in-memory storage implementation that can be easily swapped for a database-backed solution. Session management is handled through unique session IDs for anonymous users, allowing progress tracking without requiring user authentication. The server provides FHIR proxy capabilities, bundle upload handling, and progress tracking endpoints.

### Data Storage Solutions
The application uses Drizzle ORM with PostgreSQL schema definitions for data modeling, though the current implementation uses in-memory storage for simplicity. The database schema includes tables for FHIR servers, lab progress tracking, uploaded bundles, and generated artifacts. The design supports both authenticated users and anonymous sessions through flexible foreign key relationships.

### Database Schema Design
The schema includes five main entities:
- **users**: Basic user authentication (currently unused in favor of anonymous sessions)
- **fhirServers**: Catalog of public FHIR test servers with connection details
- **labProgress**: Step-by-step progress tracking for each lab day
- **bundles**: Metadata for uploaded FHIR bundles and their processing results
- **artifacts**: Generated files like CSV exports and risk assessment results

### FHIR Integration Layer
The application provides a comprehensive FHIR client layer that handles server connectivity testing, bundle uploads, resource queries, and observation publishing. It supports multiple public FHIR servers and provides fallback options when servers are unavailable. The FHIR operations are abstracted through utility functions that handle authentication headers, session management, and error handling.

### Progress Tracking System
A sophisticated progress tracking system monitors completion of lab steps across three days of exercises. Progress is stored both locally in browser storage and server-side for persistence. The system supports step dependencies, completion timestamps, and metadata storage for complex lab artifacts.

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with modern hooks and concurrent features
- **Express.js**: Node.js web framework for the backend API
- **TypeScript**: Type safety across both frontend and backend
- **Vite**: Fast development server and build tool with hot module replacement

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for consistent styling
- **shadcn/ui**: Pre-built React components based on Radix UI primitives
- **Radix UI**: Unstyled, accessible UI components for complex interactions
- **Lucide React**: Icon library for consistent iconography

### Data Management
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL support
- **TanStack Query**: Server state management with caching and synchronization
- **Zod**: Runtime type validation for API endpoints and form handling

### FHIR and Healthcare
- **Synthea**: External synthetic patient data generator (sample data included)
- **Public FHIR Servers**: Integration with test servers like HAPI FHIR and Medplum
- **LOINC Codes**: Standard medical terminology for observations and assessments

### Development Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with autoprefixer for browser compatibility
- **Font Awesome**: Icon fonts for UI elements and indicators

### Database Integration
- **@neondatabase/serverless**: PostgreSQL driver optimized for serverless environments
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **drizzle-kit**: Database migration and introspection tools

## Recent Changes

### Instructor Mode Implementation
- **INSTRUCTOR_MODE Environment Variable**: When set to `true`, enables advanced classroom management features
- **Auto-Local FHIR Default**: In instructor mode, automatically defaults to local FHIR server unless explicitly overridden via API
- **Class Reset Endpoint**: POST `/ops/reset-class` allows instructors to clear artifacts and optionally wipe local HAPI data
- **Safety Controls**: Reset endpoint only available in instructor mode with prominent warnings for destructive operations

### Backend Testing Suite
- **Comprehensive FHIR Tests**: Validates active base URL resolution, health checks, seed operations, and observation POST structure
- **CI-Compatible**: All tests mock network calls to ensure reliable execution without external dependencies
- **Mock-Based Testing**: Uses Vitest with proper mocking for FHIR server interactions

The application architecture emphasizes educational value while maintaining professional development practices, making it suitable for both learning FHIR concepts and understanding modern full-stack development patterns.