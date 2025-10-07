# FHIR Healthcare Bootcamp - Refactoring Roadmap

**Purpose:** Detailed technical refactoring plan to improve code quality, testability, and maintainability
**Target:** Achieve 90% usability and production-ready status

---

## 🏗️ Architecture Improvements

### 1. Component Structure Refactoring

#### Current Issues:
- Large page components mixing concerns (UI, business logic, API calls)
- No separation between presentational and container components
- Difficult to test in isolation

#### Recommended Structure:
```
client/src/
├── pages/                    # Route-level components
│   └── day1-lab.tsx         # Orchestrates sub-components
├── components/
│   ├── lab/
│   │   ├── LabStep.tsx      # Presentational
│   │   ├── FhirConnection.tsx
│   │   ├── BundleUploader.tsx
│   │   └── DataVerification.tsx
│   ├── byod/
│   │   ├── FileUploader.tsx
│   │   ├── DataPreview.tsx
│   │   ├── FhirMapper.tsx
│   │   └── MiniAppGenerator.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── ProgressIndicator.tsx
├── hooks/                    # Custom hooks
│   ├── useFhirServer.ts
│   ├── useBundleUpload.ts
│   ├── useLabProgress.ts
│   └── useByodWorkflow.ts
├── services/                 # API clients
│   ├── fhirApi.ts
│   ├── byodApi.ts
│   └── quizApi.ts
└── utils/
    ├── fhirHelpers.ts
    ├── validation.ts
    └── testIds.ts           # Centralized test ID constants
```

---

### 2. State Management Improvements

#### Current Issues:
- Props drilling through multiple component levels
- Duplicate state in different components
- No global state management

#### Recommended Solution:
```typescript
// Using Zustand (already installed)

// stores/labStore.ts
export const useLabStore = create((set) => ({
  currentDay: 1,
  currentStep: 0,
  progress: {},
  fhirServer: null,

  setCurrentStep: (step) => set({ currentStep: step }),
  updateProgress: (day, step, completed) => set((state) => ({
    progress: {
      ...state.progress,
      [`day${day}-step${step}`]: completed
    }
  })),

  setFhirServer: (server) => set({ fhirServer: server })
}));

// stores/byodStore.ts
export const useByodStore = create((set) => ({
  uploadedFile: null,
  metrics: [],
  mappings: {},
  generatedApps: [],

  setUploadedFile: (file) => set({ uploadedFile: file }),
  setMetrics: (metrics) => set({ metrics }),
  addGeneratedApp: (app) => set((state) => ({
    generatedApps: [...state.generatedApps, app]
  }))
}));
```

---

### 3. API Client Refactoring

#### Create Typed API Clients:
```typescript
// services/fhirApi.ts
import { z } from 'zod';

const FhirServerSchema = z.object({
  baseUrl: z.string().url(),
  name: z.string(),
  version: z.string().optional()
});

const BundleUploadResponseSchema = z.object({
  success: z.boolean(),
  resourcesCreated: z.number(),
  resourcesFailed: z.number(),
  resourceIds: z.array(z.string())
});

export class FhirApiClient {
  constructor(private baseUrl: string = '/api') {}

  async testConnection(fhirServerUrl: string) {
    const response = await fetch(`${this.baseUrl}/fhir/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl: fhirServerUrl })
    });

    if (!response.ok) {
      throw new Error(`Connection test failed: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadBundle(bundle: object, fhirServerUrl: string) {
    const response = await fetch(`${this.baseUrl}/fhir/load-bundle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bundle,
        fhirServerUrl,
        fileName: 'bundle.json'
      })
    });

    const data = await response.json();

    // Validate response with Zod
    return BundleUploadResponseSchema.parse(data);
  }

  async getStats(fhirServerUrl: string, patientId?: string) {
    const response = await fetch(`${this.baseUrl}/fhir/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fhirServerUrl, patientId })
    });

    return response.json();
  }
}

export const fhirApi = new FhirApiClient();
```

---

### 4. Test ID Management

#### Create Centralized Test ID System:
```typescript
// utils/testIds.ts
export const TestIds = {
  // Navigation
  Nav: {
    Home: 'nav-home',
    Day1Lab: 'nav-day1-lab',
    Day2Lab: 'nav-day2-lab',
    Day3Lab: 'nav-day3-lab',
    Byod: 'nav-byod',
    QuizDay1: 'nav-quiz-day1',
    QuizDay2: 'nav-quiz-day2',
    QuizDay3: 'nav-quiz-day3'
  },

  // Day 1 Lab
  Day1Lab: {
    Overview: 'lab-overview',
    Step1: {
      Start: 'step-1-start',
      Panel: 'fhir-connection-panel',
      SelectLocal: 'select-local-fhir',
      TestConnection: 'button-test-connection',
      ConnectionStatus: 'connection-status',
      Complete: 'button-complete-step-1',
      Completed: 'step-1-completed'
    },
    Step2: {
      Start: 'step-2-start',
      Panel: 'bundle-upload-panel',
      UseSample: 'button-use-sample-bundle',
      Preview: 'bundle-preview',
      Upload: 'button-upload-bundle',
      Success: 'upload-success'
    }
  },

  // BYOD
  Byod: {
    Overview: 'byod-overview',
    SelectAppleHealth: 'select-apple-health',
    SelectGoogleFit: 'select-google-fit',
    SelectFitbit: 'select-fitbit',
    FileInput: (type: string) => `file-input-${type}`,
    ProcessButton: (type: string) => `button-process-${type}`,
    ProcessingStatus: 'processing-status',
    ProcessingComplete: 'processing-complete',
    DataPreview: 'data-preview',
    PreviewRow: (metricType: string, index: number) => `preview-row-${metricType}-${index}`
  },

  // Quiz
  Quiz: {
    Container: 'quiz-container',
    StartButton: 'button-start-quiz',
    Question: (index: number) => `question-${index}`,
    Option: (questionIndex: number, optionIndex: number) => `option-${questionIndex}-${optionIndex}`,
    SubmitButton: 'button-submit-quiz',
    Results: 'quiz-results',
    ScoreDisplay: 'score-display'
  }
} as const;

// Usage in components:
import { TestIds } from '@/utils/testIds';

<button data-testid={TestIds.Day1Lab.Step1.TestConnection}>
  Test Connection
</button>
```

---

### 5. Error Handling Improvements

#### Create Error Boundary System:
```typescript
// components/shared/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// components/shared/ApiErrorHandler.tsx
export function ApiErrorHandler({ error }: { error: Error }) {
  if (error.message.includes('timeout')) {
    return (
      <Alert variant="warning">
        <AlertTitle>Request Timeout</AlertTitle>
        <AlertDescription>
          The server took too long to respond. Please try again or check your connection.
        </AlertDescription>
      </Alert>
    );
  }

  if (error.message.includes('404')) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          The requested resource could not be found. Please check the URL and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}
```

---

### 6. Loading State Management

#### Create Reusable Loading Components:
```typescript
// components/shared/LoadingSpinner.tsx
export function LoadingSpinner({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg', message?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`} />
      {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

// components/shared/ProgressBar.tsx
export function ProgressBar({ value, max = 100, label }: { value: number, max?: number, label?: string }) {
  const percentage = (value / max) * 100;

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="h-2 w-full rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {value} / {max}
      </p>
    </div>
  );
}

// Hook for async operations
export function useAsyncOperation<T>() {
  const [state, setState] = useState<{
    isLoading: boolean;
    error: Error | null;
    data: T | null;
  }>({
    isLoading: false,
    error: null,
    data: null
  });

  const execute = async (operation: () => Promise<T>) => {
    setState({ isLoading: true, error: null, data: null });
    try {
      const data = await operation();
      setState({ isLoading: false, error: null, data });
      return data;
    } catch (error) {
      setState({ isLoading: false, error: error as Error, data: null });
      throw error;
    }
  };

  return { ...state, execute };
}
```

---

### 7. Form Validation Improvements

#### Use React Hook Form + Zod:
```typescript
// Already have @hookform/resolvers and zod installed

// components/byod/FileUploadForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const FileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 50 * 1024 * 1024, 'File must be less than 50MB')
    .refine(
      (file) => ['application/json', 'text/xml', 'text/csv'].includes(file.type),
      'File must be JSON, XML, or CSV'
    ),
  dataSource: z.enum(['apple-health', 'google-fit', 'fitbit'])
});

type FileUploadFormData = z.infer<typeof FileUploadSchema>;

export function FileUploadForm({ onSubmit }: { onSubmit: (data: FileUploadFormData) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FileUploadFormData>({
    resolver: zodResolver(FileUploadSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <select {...register('dataSource')} data-testid="select-data-source">
        <option value="apple-health">Apple Health</option>
        <option value="google-fit">Google Fit</option>
        <option value="fitbit">Fitbit</option>
      </select>
      {errors.dataSource && <p className="error">{errors.dataSource.message}</p>}

      <input type="file" {...register('file')} data-testid="file-input" />
      {errors.file && <p className="error">{errors.file.message}</p>}

      <button type="submit">Upload</button>
    </form>
  );
}
```

---

### 8. Performance Optimizations

#### Implement Code Splitting:
```typescript
// pages/day1-lab.tsx
import { lazy, Suspense } from 'react';

const BundleUploader = lazy(() => import('@/components/lab/BundleUploader'));
const DataVerification = lazy(() => import('@/components/lab/DataVerification'));

export function Day1Lab() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading lab components..." />}>
      <BundleUploader />
      <DataVerification />
    </Suspense>
  );
}
```

#### Memoize Expensive Components:
```typescript
import { memo } from 'react';

export const DataPreviewTable = memo(function DataPreviewTable({ data }: { data: any[] }) {
  // Expensive rendering logic
  return (
    <table>
      {data.map((row, i) => (
        <tr key={i}>
          <td>{row.value}</td>
        </tr>
      ))}
    </table>
  );
});
```

#### Use React Query for Caching:
```typescript
// Already installed @tanstack/react-query

// hooks/useFhirServer.ts
import { useQuery, useMutation } from '@tanstack/react-query';

export function useFhirConnection() {
  return useMutation({
    mutationFn: (serverUrl: string) => fhirApi.testConnection(serverUrl),
    onSuccess: (data) => {
      console.log('Connection successful:', data);
    }
  });
}

export function useFhirStats(serverUrl: string, patientId?: string) {
  return useQuery({
    queryKey: ['fhir-stats', serverUrl, patientId],
    queryFn: () => fhirApi.getStats(serverUrl, patientId),
    enabled: !!serverUrl, // Only run if serverUrl is provided
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });
}
```

---

### 9. Accessibility Improvements

#### Add Comprehensive ARIA Labels:
```typescript
// components/lab/FhirConnection.tsx
export function FhirConnection() {
  return (
    <section aria-labelledby="fhir-connection-heading">
      <h2 id="fhir-connection-heading">FHIR Server Connection</h2>

      <div role="group" aria-labelledby="server-selection-label">
        <label id="server-selection-label" htmlFor="fhir-server-select">
          Select FHIR Server
        </label>
        <select
          id="fhir-server-select"
          aria-describedby="server-selection-help"
          data-testid={TestIds.Day1Lab.Step1.SelectLocal}
        >
          <option value="local">Local HAPI Server (Recommended)</option>
          <option value="public">Public HAPI Server</option>
        </select>
        <p id="server-selection-help" className="text-sm text-muted-foreground">
          Use local server for privacy and performance
        </p>
      </div>

      <button
        type="button"
        aria-label="Test connection to FHIR server"
        aria-busy={isLoading}
        disabled={isLoading}
        data-testid={TestIds.Day1Lab.Step1.TestConnection}
      >
        {isLoading ? 'Testing...' : 'Test Connection'}
      </button>

      {connectionStatus && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid={TestIds.Day1Lab.Step1.ConnectionStatus}
        >
          {connectionStatus.success ? (
            <span className="text-success">✓ Connected successfully</span>
          ) : (
            <span className="text-error">✗ Connection failed: {connectionStatus.error}</span>
          )}
        </div>
      )}
    </section>
  );
}
```

#### Keyboard Navigation:
```typescript
// components/shared/Modal.tsx
import { useEffect, useRef } from 'react';

export function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus first focusable element in modal
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();

      // Trap focus within modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else {
      // Restore focus when modal closes
      previousActiveElement.current?.focus();
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
    >
      {children}
    </div>
  );
}
```

---

### 10. Backend API Improvements

#### Add Request Validation Middleware:
```typescript
// server/middleware/validation.ts
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validateRequest<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

// Usage in routes:
const BundleUploadSchema = z.object({
  bundle: z.object({
    resourceType: z.literal('Bundle'),
    entry: z.array(z.any()).min(1)
  }),
  fhirServerUrl: z.string().url(),
  fileName: z.string().optional()
});

app.post('/api/fhir/load-bundle', validateRequest(BundleUploadSchema), async (req, res) => {
  // Request body is now validated
  const { bundle, fhirServerUrl, fileName } = req.body;
  // ... upload logic
});
```

#### Add Response Formatting:
```typescript
// server/middleware/responseFormatter.ts
export function successResponse(data: any, message?: string) {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

export function errorResponse(error: string, details?: any) {
  return {
    success: false,
    error,
    details,
    timestamp: new Date().toISOString()
  };
}

// Usage:
res.json(successResponse({ resourcesCreated: 10 }, 'Bundle uploaded successfully'));
res.status(400).json(errorResponse('Invalid bundle format', validationErrors));
```

---

## 📋 Refactoring Checklist

### Immediate (Week 1)
- [ ] Add test IDs to all interactive components
- [ ] Create centralized test ID constants file
- [ ] Implement error boundaries in critical components
- [ ] Add loading spinners to all async operations
- [ ] Create API client classes with type safety

### Short Term (Weeks 2-3)
- [ ] Refactor large page components into smaller pieces
- [ ] Implement custom hooks for common logic
- [ ] Add form validation with React Hook Form + Zod
- [ ] Implement code splitting for better performance
- [ ] Add comprehensive ARIA labels

### Medium Term (Month 2)
- [ ] Migrate to Zustand for state management
- [ ] Implement React Query for all API calls
- [ ] Create reusable component library (Storybook optional)
- [ ] Add end-to-end accessibility testing
- [ ] Performance audit and optimization

### Long Term (Month 3+)
- [ ] Consider migrating to Next.js for SSR/SSG
- [ ] Implement proper authentication flow (refresh tokens)
- [ ] Add analytics and error tracking (Sentry)
- [ ] Internationalization (i18n) support
- [ ] Progressive Web App (PWA) features

---

## 🎯 Success Metrics

**Code Quality:**
- [ ] TypeScript strict mode enabled with 0 `any` types
- [ ] ESLint warnings reduced to 0
- [ ] Test coverage > 80%
- [ ] Lighthouse accessibility score > 95

**Performance:**
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Bundle size < 200KB (gzipped)
- [ ] No runtime errors in production

**User Experience:**
- [ ] All critical paths testable with E2E tests
- [ ] No UI jank (60fps scrolling)
- [ ] Error messages helpful and actionable
- [ ] Loading states for all async operations

---

**Document Version:** 1.0
**Last Updated:** 2025-10-07
