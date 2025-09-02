import { ByodMapping, AppConfig } from "@shared/schema";

// Health data processors for different sources
export function extractHealthMetrics(rawData: any, sourceType: string): any[] {
  switch (sourceType) {
    case 'apple-health':
      return processAppleHealthData(rawData);
    case 'google-fit':
      return processGoogleFitData(rawData);
    case 'fitbit':
      return processFitbitData(rawData);
    case 'csv':
      return processCsvData(rawData);
    default:
      return processGenericData(rawData);
  }
}

function processAppleHealthData(data: any): any[] {
  const metrics: any[] = [];
  
  // Process Apple Health XML export
  if (data.HealthData?.Record) {
    const records = Array.isArray(data.HealthData.Record) ? data.HealthData.Record : [data.HealthData.Record];
    
    for (const record of records) {
      if (record.type && record.value) {
        metrics.push({
          type: record.type.replace('HKQuantityTypeIdentifier', ''),
          value: parseFloat(record.value) || record.value,
          unit: record.unit || '',
          date: new Date(record.startDate || record.creationDate),
          source: record.sourceName || 'Apple Health'
        });
      }
    }
  }
  
  return metrics;
}

function processGoogleFitData(data: any): any[] {
  const metrics: any[] = [];
  
  // Process Google Fit JSON export
  if (data.bucket) {
    for (const bucket of data.bucket) {
      if (bucket.dataset) {
        for (const dataset of bucket.dataset) {
          if (dataset.point) {
            for (const point of dataset.point) {
              metrics.push({
                type: dataset.dataTypeName || 'unknown',
                value: point.value?.[0]?.fpVal || point.value?.[0]?.intVal || 0,
                unit: '',
                date: new Date(parseInt(point.startTimeNanos) / 1000000),
                source: 'Google Fit'
              });
            }
          }
        }
      }
    }
  }
  
  return metrics;
}

function processFitbitData(data: any): any[] {
  const metrics: any[] = [];
  
  // Process various Fitbit data formats
  if (Array.isArray(data)) {
    for (const entry of data) {
      if (entry.dateTime && entry.value !== undefined) {
        metrics.push({
          type: 'activity',
          value: parseFloat(entry.value) || 0,
          unit: '',
          date: new Date(entry.dateTime),
          source: 'Fitbit'
        });
      }
    }
  }
  
  return metrics;
}

function processCsvData(data: any): any[] {
  const metrics: any[] = [];
  
  // Process CSV data (assuming it's already parsed to JSON)
  if (Array.isArray(data)) {
    for (const row of data) {
      // Try common column names
      const dateCol = row.date || row.Date || row.timestamp || row.Timestamp;
      const valueCol = row.value || row.Value || row.measurement || row.Measurement;
      const typeCol = row.type || row.Type || row.metric || row.Metric || 'measurement';
      
      if (dateCol && valueCol !== undefined) {
        metrics.push({
          type: typeCol,
          value: parseFloat(valueCol) || valueCol,
          unit: row.unit || row.Unit || '',
          date: new Date(dateCol),
          source: 'CSV Import'
        });
      }
    }
  }
  
  return metrics;
}

function processGenericData(data: any): any[] {
  const metrics: any[] = [];
  
  // Try to extract any meaningful health data from generic format
  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'object' && item !== null) {
        // Look for common patterns
        const possibleValue = item.value || item.measurement || item.result;
        const possibleDate = item.date || item.timestamp || item.time;
        const possibleType = item.type || item.metric || item.name || 'measurement';
        
        if (possibleValue !== undefined && possibleDate) {
          metrics.push({
            type: possibleType,
            value: parseFloat(possibleValue) || possibleValue,
            unit: item.unit || '',
            date: new Date(possibleDate),
            source: 'Generic Import'
          });
        }
      }
    }
  }
  
  return metrics;
}

export function generateMetricsPreview(metrics: any[]): Record<string, any> {
  const preview: Record<string, any> = {};
  
  // Group metrics by type
  const grouped = metrics.reduce((acc, metric) => {
    const type = metric.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(metric);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Generate preview for each metric type
  for (const [type, values] of Object.entries(grouped)) {
    const sampleValues = values.slice(0, 5).map(v => ({
      value: v.value,
      date: v.date,
      unit: v.unit
    }));
    
    preview[type] = {
      count: values.length,
      sampleValues,
      unit: values[0]?.unit || '',
      dateRange: {
        start: Math.min(...values.map(v => new Date(v.date).getTime())),
        end: Math.max(...values.map(v => new Date(v.date).getTime()))
      }
    };
  }
  
  return preview;
}

export async function createFhirObservations(rawData: any, mappings: ByodMapping[], patientId: string): Promise<any[]> {
  const observations: any[] = [];
  const metrics = extractHealthMetrics(rawData, 'generic');
  
  for (const mapping of mappings) {
    const relevantMetrics = metrics.filter(m => m.type === mapping.metric);
    
    for (const metric of relevantMetrics) {
      const observation = {
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: mapping.category || 'vital-signs',
            display: mapping.category || 'Vital Signs'
          }]
        }],
        code: {
          coding: [{
            system: mapping.codeSystem,
            code: mapping.code,
            display: mapping.display
          }]
        },
        subject: {
          reference: `Patient/${patientId}`
        },
        effectiveDateTime: metric.date.toISOString(),
        valueQuantity: {
          value: parseFloat(metric.value),
          unit: mapping.unit,
          system: 'http://unitsofmeasure.org',
          code: mapping.unit
        }
      };
      
      observations.push(observation);
    }
  }
  
  return observations;
}

export async function publishObservationsToFhir(fhirBaseUrl: string, observations: any[]): Promise<any[]> {
  const results: any[] = [];
  
  for (const observation of observations) {
    try {
      const response = await fetch(`${fhirBaseUrl}/Observation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json'
        },
        body: JSON.stringify(observation)
      });
      
      if (response.ok) {
        const created = await response.json();
        results.push({
          fhirId: created.id,
          type: observation.code.coding[0].display,
          value: observation.valueQuantity.value.toString(),
          unit: observation.valueQuantity.unit,
          effectiveDate: new Date(observation.effectiveDateTime)
        });
      } else {
        console.error(`Failed to create observation: ${response.status}`);
      }
    } catch (error) {
      console.error('Error publishing observation:', error);
    }
  }
  
  return results;
}

export async function generateAppConfig(appType: string, metrics: string[], customConfig?: any): Promise<AppConfig> {
  const baseConfig: AppConfig = {
    theme: 'light',
    charts: [],
    layout: 'grid',
    features: []
  };
  
  switch (appType) {
    case 'dashboard':
      baseConfig.charts = metrics.map(metric => ({
        type: 'line' as const,
        metric,
        title: formatMetricTitle(metric),
        timeRange: '30d'
      }));
      baseConfig.layout = 'grid';
      baseConfig.features = ['export', 'share', 'filters'];
      break;
      
    case 'trends':
      baseConfig.charts = metrics.map(metric => ({
        type: 'area' as const,
        metric,
        title: `${formatMetricTitle(metric)} Trend`,
        timeRange: '90d'
      }));
      baseConfig.layout = 'single';
      baseConfig.features = ['trendlines', 'predictions'];
      break;
      
    case 'insights':
      baseConfig.charts = metrics.map(metric => ({
        type: 'bar' as const,
        metric,
        title: `${formatMetricTitle(metric)} Analysis`,
        timeRange: '1y'
      }));
      baseConfig.layout = 'tabs';
      baseConfig.features = ['insights', 'recommendations', 'goals'];
      break;
      
    case 'custom':
      // Use custom configuration if provided
      if (customConfig) {
        return { ...baseConfig, ...customConfig };
      }
      baseConfig.charts = metrics.map(metric => ({
        type: 'line' as const,
        metric,
        title: formatMetricTitle(metric)
      }));
      break;
  }
  
  return baseConfig;
}

function formatMetricTitle(metric: string): string {
  return metric
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// Common LOINC codes for health metrics
export const commonMappings: Record<string, ByodMapping> = {
  'HeartRate': {
    metric: 'HeartRate',
    codeSystem: 'http://loinc.org',
    code: '8867-4',
    display: 'Heart rate',
    unit: 'bpm',
    category: 'vital-signs'
  },
  'BloodPressureSystolic': {
    metric: 'BloodPressureSystolic',
    codeSystem: 'http://loinc.org',
    code: '8480-6',
    display: 'Systolic blood pressure',
    unit: 'mmHg',
    category: 'vital-signs'
  },
  'BloodPressureDiastolic': {
    metric: 'BloodPressureDiastolic',
    codeSystem: 'http://loinc.org',
    code: '8462-4',
    display: 'Diastolic blood pressure',
    unit: 'mmHg',
    category: 'vital-signs'
  },
  'BodyWeight': {
    metric: 'BodyWeight',
    codeSystem: 'http://loinc.org',
    code: '29463-7',
    display: 'Body weight',
    unit: 'kg',
    category: 'vital-signs'
  },
  'Steps': {
    metric: 'Steps',
    codeSystem: 'http://loinc.org',
    code: '41950-7',
    display: 'Number of steps',
    unit: 'steps',
    category: 'activity'
  }
};