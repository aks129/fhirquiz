# FHIR Healthcare Bootcamp Sample Data

This directory contains sample datasets and artifacts for the FHIR Healthcare Bootcamp learning experience.

## Sample Data Files

### `synthea_patient_small.json`
**Purpose**: Demonstration FHIR Bundle containing one synthetic patient with complete medical history

**Contents**:
- 1 Patient resource (John Robert Smith)
- 1 Encounter resource (ambulatory visit)
- 2 Observation resources (blood pressure, weight)
- 1 Condition resource (Type 2 diabetes)
- 1 Organization resource (hospital)
- 1 Practitioner resource (attending physician)

**FHIR Version**: R4
**Bundle Type**: Transaction (atomic operation)
**Use Case**: Perfect for Day 1 lab exercises - small enough to understand structure, complete enough to demonstrate FHIR concepts

### `example_observation.json`
**Purpose**: Example of a properly structured FHIR Observation for risk assessment

**Key Features**:
- LOINC code 72133-2 (Risk assessment score)
- Proper CodeableConcept structure
- Patient and encounter references
- Risk categorization components
- Derived-from references showing data lineage

**Use Case**: Reference for Day 3 lab when creating your own risk assessment observations

### `lab_checklist.md`
**Purpose**: Comprehensive checklist for tracking progress through all bootcamp labs

**Sections**:
- Day-by-day task breakdowns
- Screenshot requirements for portfolio
- LinkedIn post preparation guide
- Troubleshooting quick reference
- Expected learning outcomes

## Where to Get More Data

### Synthea Patient Generator
For additional synthetic patient data beyond the single patient provided:

**Official Synthea Downloads**:
- FHIR R4 Sample Data (1000+ patients): https://synthetichealth.github.io/synthea-sample-data/downloads/synthea_sample_data_fhir_r4_sep2019.zip
- Current Synthea Generator: https://github.com/synthetichealth/synthea

**Important Notes**:
- Older Synthea archives (like the Sept 2019 R4 dataset) often load more reliably than newer ones
- Each bundle typically contains 200-500 FHIR resources for realistic complexity
- Bundles include full patient journeys from birth to current date
- All data is synthetic - safe for development and learning

### FHIR Test Data Best Practices

According to [FHIR IQ's guidance](https://fhiriq.com/fhir-test-data-from-synthea/):

1. **Start Small**: Use the provided single-patient bundle first
2. **Validate Structure**: Ensure bundles are properly formatted FHIR R4
3. **Check References**: Verify all resource references are resolvable
4. **Test Loading**: Try individual resources if transaction bundles fail
5. **Monitor Server Limits**: Some public servers have upload size restrictions

## Data Safety Guidelines

### 🚨 Critical Safety Rules
- **NEVER use real patient data (PII/PHI) on public test servers**
- Only use synthetic data like Synthea patients
- Public FHIR servers are for learning and development only
- Assume all data on public servers is visible to others

### Synthetic Data Benefits
- No privacy concerns or regulatory compliance issues
- Realistic medical complexity for learning
- Reproducible scenarios for testing
- Safe for sharing and collaboration

## File Formats and Structure

### FHIR Bundle Structure
```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": { /* FHIR Resource */ },
      "request": {
        "method": "PUT",
        "url": "ResourceType/id"
      }
    }
  ]
}
