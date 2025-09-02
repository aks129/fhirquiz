# FHIR Healthcare Bootcamp - Manual QA Test Plan

## Overview

This document outlines comprehensive manual testing procedures for the FHIR Healthcare Bootcamp application. Manual testing complements automated testing by covering user experience, visual design, and complex user workflows that are difficult to automate.

## Testing Environment Setup

### Prerequisites
- Local HAPI FHIR server running on `localhost:8080`
- Application running on `localhost:5000`
- Test data files available in `tests/fixtures/`
- Access to multiple browsers (Chrome, Firefox, Safari)
- Screen reader testing tool (NVDA/JAWS/VoiceOver)

### Test Data
- Apple Health XML exports
- Google Fit CSV files
- Fitbit JSON exports
- Garmin CSV files
- Synthea FHIR bundles

## Core Functionality Testing

### 1. Navigation and User Interface

#### TC-001: Main Navigation
**Objective**: Verify all navigation elements function correctly

**Steps**:
1. Load the application home page
2. Click each navigation item in the header menu
3. Verify correct page loads for each section
4. Check breadcrumb navigation works
5. Test back/forward browser buttons

**Expected Results**:
- All navigation links work without errors
- Pages load within 2 seconds
- URLs update correctly
- Breadcrumbs show current location
- Browser history functions properly

**Notes**: Test on mobile and desktop viewports

---

#### TC-002: Responsive Design
**Objective**: Ensure application works across different screen sizes

**Steps**:
1. Test on desktop (1920x1080, 1366x768)
2. Test on tablet (768x1024, 1024x768)
3. Test on mobile (375x667, 414x896)
4. Check touch interactions on mobile
5. Verify scrolling and pinch-to-zoom

**Expected Results**:
- Content adapts to screen size
- No horizontal scrolling on mobile
- Touch targets are at least 44px
- Text remains readable at all sizes

---

### 2. Quiz System Testing

#### TC-003: Quiz Flow - Day 1
**Objective**: Complete full Day 1 quiz workflow

**Steps**:
1. Navigate to Day 1 quiz
2. Read quiz instructions
3. Answer all questions (mix correct/incorrect)
4. Submit quiz
5. Review results and feedback
6. Check progress tracking

**Expected Results**:
- Quiz loads with all questions visible
- Answer selection works smoothly
- Score calculation is accurate
- Feedback for incorrect answers is helpful
- Progress updates correctly

**Test Data**: Use different answer combinations to test scoring

---

#### TC-004: Challenge Mode
**Objective**: Test timed quiz functionality

**Steps**:
1. Enable challenge mode
2. Start quiz with visible timer
3. Answer questions while timer runs
4. Complete before/after time limit
5. Verify time-based scoring

**Expected Results**:
- Timer counts down accurately
- Time pressure affects scoring
- Timeout handling works
- Challenge results show time taken

---

### 3. Lab Workflow Testing

#### TC-005: FHIR Server Connection
**Objective**: Test FHIR server connectivity and error handling

**Steps**:
1. Navigate to Day 1 lab
2. Test local FHIR server connection
3. Test public FHIR server connection
4. Try invalid FHIR server URL
5. Test network timeout scenarios

**Expected Results**:
- Valid connections show green status
- Invalid connections show clear error messages
- Network issues handled gracefully
- User can retry connections

**Test Scenarios**:
- Valid local server: `http://localhost:8080/fhir`
- Valid public server: `https://hapi.fhir.org/baseR4`
- Invalid URL: `https://nonexistent-server.com/fhir`
- Malformed URL: `not-a-url`

---

#### TC-006: Bundle Upload and Processing
**Objective**: Test FHIR bundle upload functionality

**Steps**:
1. Upload sample Synthea bundle
2. Verify bundle validation
3. Check resource extraction
4. Test error handling for invalid bundles
5. Monitor upload progress

**Expected Results**:
- Valid bundles upload successfully
- Bundle contents are displayed correctly
- Invalid bundles show helpful errors
- Progress indicators work properly

**Test Files**:
- Valid: `tests/fixtures/synthea/test-patient-bundle.json`
- Invalid: Modified bundle with syntax errors

---

### 4. BYOD System Testing

#### TC-007: Apple Health Import
**Objective**: Test Apple Health XML processing

**Steps**:
1. Navigate to BYOD section
2. Select Apple Health import
3. Upload test XML file
4. Verify data parsing and preview
5. Check FHIR mapping suggestions
6. Generate FHIR observations

**Expected Results**:
- XML parsing completes successfully
- Data preview shows extracted records
- LOINC codes mapped correctly
- FHIR observations are valid

**Test File**: `tests/fixtures/apple-health/export-small.xml`

---

#### TC-008: Multi-format Data Import
**Objective**: Test support for various data formats

**Steps**:
1. Test Google Fit CSV import
2. Test Fitbit JSON import
3. Test Garmin CSV import
4. Compare data normalization across formats
5. Verify consistent FHIR mapping

**Expected Results**:
- All formats parse correctly
- Data normalized to common structure
- FHIR mappings appropriate for each format

---

#### TC-009: Safety Mode and Public Servers
**Objective**: Test data protection features

**Steps**:
1. Import personal health data
2. Attempt to publish to public FHIR server
3. Verify safety warnings appear
4. Test consent mechanisms
5. Check local server preference

**Expected Results**:
- Clear warnings about public servers
- Explicit consent required
- Local FHIR recommended when available
- PHI detection warnings shown

---

### 5. Data Security and Privacy Testing

#### TC-010: Data Sanitization
**Objective**: Ensure personal data is protected

**Steps**:
1. Upload files with personal information
2. Check data preview for exposed PII
3. Verify secure data handling
4. Test data cleanup after session
5. Check browser storage cleanup

**Expected Results**:
- Personal data handled securely
- No PII exposed in UI
- Session data cleaned appropriately
- Browser storage managed properly

---

#### TC-011: FHIR Publishing Safety
**Objective**: Test safe publishing mechanisms

**Steps**:
1. Process real-looking health data
2. Attempt publishing to various servers
3. Verify consent flows
4. Test publishing restrictions
5. Check error handling

**Expected Results**:
- Publishing requires explicit consent
- Clear warnings for production servers
- Error recovery works properly

---

### 6. Accessibility Testing

#### TC-012: Keyboard Navigation
**Objective**: Ensure application is keyboard accessible

**Steps**:
1. Tab through entire application
2. Use arrow keys in form controls
3. Test Enter/Space activation
4. Check focus indicators
5. Test keyboard shortcuts

**Expected Results**:
- All interactive elements reachable via keyboard
- Tab order is logical
- Focus indicators clearly visible
- Keyboard shortcuts work as expected

---

#### TC-013: Screen Reader Testing
**Objective**: Test screen reader compatibility

**Steps**:
1. Use NVDA/JAWS/VoiceOver
2. Navigate through all sections
3. Test form interactions
4. Verify table and list reading
5. Check alt text for images

**Expected Results**:
- All content announced correctly
- Forms properly labeled
- Tables have headers
- Images have descriptive alt text

---

### 7. Performance Testing

#### TC-014: Load Time Testing
**Objective**: Verify acceptable page load times

**Steps**:
1. Clear browser cache
2. Load each page and measure time
3. Test with slow network simulation
4. Check resource loading
5. Verify lazy loading

**Expected Results**:
- Initial page load < 3 seconds
- Navigation between pages < 1 second
- Large files load progressively
- No unnecessary resource loading

---

#### TC-015: Large File Handling
**Objective**: Test handling of large data files

**Steps**:
1. Upload maximum size health data files
2. Process large FHIR bundles
3. Test memory usage during processing
4. Verify progress indicators
5. Check error handling for oversized files

**Expected Results**:
- Large files process without crashes
- Memory usage remains reasonable
- Progress clearly communicated
- File size limits enforced

---

### 8. Error Handling and Edge Cases

#### TC-016: Network Error Handling
**Objective**: Test resilience to network issues

**Steps**:
1. Disconnect network during operations
2. Test with slow/unreliable connections
3. Simulate server timeouts
4. Check retry mechanisms
5. Verify error messages

**Expected Results**:
- Network errors handled gracefully
- Clear error messages displayed
- Retry options provided where appropriate
- Application doesn't crash

---

#### TC-017: Invalid Data Handling
**Objective**: Test robustness with malformed data

**Steps**:
1. Upload corrupted files
2. Provide malformed FHIR bundles
3. Test with incomplete data
4. Try unsupported file formats
5. Check validation errors

**Expected Results**:
- Invalid data rejected safely
- Helpful error messages shown
- Application remains stable
- User can recover and retry

---

## Browser Compatibility Testing

### Supported Browsers
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Cross-Browser Test Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|---------|---------|---------|------|
| Quiz System | ✓ | ✓ | ✓ | ✓ |
| Lab Workflows | ✓ | ✓ | ✓ | ✓ |
| BYOD Upload | ✓ | ✓ | ✓ | ✓ |
| FHIR Operations | ✓ | ✓ | ✓ | ✓ |
| Responsive Design | ✓ | ✓ | ✓ | ✓ |

## Regression Testing Checklist

After any significant changes, verify:

- [ ] All navigation links work
- [ ] Quiz submission and scoring
- [ ] FHIR server connections
- [ ] Bundle upload and processing
- [ ] BYOD data import flows
- [ ] Artifact generation and download
- [ ] Progress tracking
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Accessibility compliance

## Issue Reporting Template

**Issue ID**: [Unique identifier]
**Title**: [Brief description]
**Severity**: Critical/High/Medium/Low
**Browser**: [Browser and version]
**Device**: [Device type and OS]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**: [What should happen]
**Actual Result**: [What actually happened]
**Screenshots**: [Attach if applicable]

**Additional Notes**: [Any other relevant information]

## Test Sign-off

**Tester**: [Name]
**Date**: [Test completion date]
**Environment**: [Test environment details]
**Overall Result**: Pass/Fail/Pass with Minor Issues

**Summary**: [Brief summary of test results and any issues found]