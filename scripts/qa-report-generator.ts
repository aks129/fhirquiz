#!/usr/bin/env node

/**
 * QA Report Generator
 * 
 * Generates comprehensive QA reports by aggregating results from various testing tools
 */

import fs from 'fs/promises';
import path from 'path';

interface TestResults {
  unitTests?: any;
  integrationTests?: any;
  e2eTests?: any;
  accessibilityTests?: any;
  performanceTests?: any;
  securityResults?: any;
  coverage?: any;
}

interface QAReport {
  timestamp: string;
  commit: string;
  branch: string;
  environment: string;
  summary: QASummary;
  details: TestResults;
  qualityGates: QualityGateStatus;
  recommendations: string[];
}

interface QASummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage: number;
  duration: number;
  status: 'PASS' | 'FAIL' | 'WARNING';
}

interface QualityGateStatus {
  coverage: { status: 'PASS' | 'FAIL'; value: number; threshold: number };
  testPassRate: { status: 'PASS' | 'FAIL'; value: number; threshold: number };
  accessibility: { status: 'PASS' | 'FAIL'; violations: number };
  performance: { status: 'PASS' | 'FAIL'; score: number; threshold: number };
  security: { status: 'PASS' | 'FAIL'; vulnerabilities: number };
}

class QAReportGenerator {
  private resultsDir: string;
  private outputDir: string;

  constructor() {
    this.resultsDir = path.join(process.cwd(), 'test-results');
    this.outputDir = path.join(process.cwd(), 'qa-reports');
  }

  async generateReport(): Promise<void> {
    console.log('🔍 Generating QA Report...');
    
    try {
      await this.ensureDirectories();
      const results = await this.collectTestResults();
      const report = await this.buildReport(results);
      await this.saveReports(report);
      
      console.log('✅ QA Report generated successfully');
      console.log(`📄 HTML Report: ${path.join(this.outputDir, 'qa-report.html')}`);
      console.log(`📊 JSON Data: ${path.join(this.outputDir, 'qa-report.json')}`);
      
    } catch (error) {
      console.error('❌ Failed to generate QA report:', error);
      process.exit(1);
    }
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.resultsDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  private async collectTestResults(): Promise<TestResults> {
    console.log('📊 Collecting test results...');
    
    const results: TestResults = {};

    // Unit test results
    try {
      const unitTestData = await this.readJSONFile('unit-test-results.json');
      results.unitTests = unitTestData;
    } catch (error) {
      console.warn('⚠️ Unit test results not found');
    }

    // Coverage data
    try {
      const coverageData = await this.readJSONFile('coverage/coverage-summary.json');
      results.coverage = coverageData;
    } catch (error) {
      console.warn('⚠️ Coverage data not found');
    }

    // E2E test results
    try {
      const e2eData = await this.readJSONFile('e2e-results.json');
      results.e2eTests = e2eData;
    } catch (error) {
      console.warn('⚠️ E2E test results not found');
    }

    // Accessibility results
    try {
      const a11yData = await this.readJSONFile('a11y-results.json');
      results.accessibilityTests = a11yData;
    } catch (error) {
      console.warn('⚠️ Accessibility test results not found');
    }

    // Performance results
    try {
      const perfData = await this.readJSONFile('lighthouse-results.json');
      results.performanceTests = perfData;
    } catch (error) {
      console.warn('⚠️ Performance test results not found');
    }

    // Security results
    try {
      const securityData = await this.readJSONFile('security-audit.json');
      results.securityResults = securityData;
    } catch (error) {
      console.warn('⚠️ Security scan results not found');
    }

    return results;
  }

  private async readJSONFile(filename: string): Promise<any> {
    const filePath = path.join(this.resultsDir, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  private async buildReport(results: TestResults): Promise<QAReport> {
    console.log('📋 Building comprehensive report...');

    const summary = this.calculateSummary(results);
    const qualityGates = this.evaluateQualityGates(results, summary);
    const recommendations = this.generateRecommendations(results, qualityGates);

    const report: QAReport = {
      timestamp: new Date().toISOString(),
      commit: process.env.GITHUB_SHA || 'unknown',
      branch: process.env.GITHUB_REF?.replace('refs/heads/', '') || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      summary,
      details: results,
      qualityGates,
      recommendations
    };

    return report;
  }

  private calculateSummary(results: TestResults): QASummary {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let totalDuration = 0;

    // Unit tests
    if (results.unitTests?.stats) {
      totalTests += results.unitTests.stats.tests || 0;
      passedTests += results.unitTests.stats.passes || 0;
      failedTests += results.unitTests.stats.failures || 0;
      totalDuration += results.unitTests.stats.duration || 0;
    }

    // E2E tests
    if (results.e2eTests?.stats) {
      totalTests += results.e2eTests.stats.tests || 0;
      passedTests += results.e2eTests.stats.passes || 0;
      failedTests += results.e2eTests.stats.failures || 0;
      totalDuration += results.e2eTests.stats.duration || 0;
    }

    // Coverage
    const coverage = results.coverage?.total?.lines?.pct || 0;

    // Overall status
    const status = failedTests > 0 ? 'FAIL' : coverage < 80 ? 'WARNING' : 'PASS';

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      coverage,
      duration: totalDuration,
      status
    };
  }

  private evaluateQualityGates(results: TestResults, summary: QASummary): QualityGateStatus {
    const coverage = {
      status: summary.coverage >= 80 ? 'PASS' as const : 'FAIL' as const,
      value: summary.coverage,
      threshold: 80
    };

    const testPassRate = {
      status: (summary.passedTests / Math.max(summary.totalTests, 1)) >= 0.95 ? 'PASS' as const : 'FAIL' as const,
      value: Math.round((summary.passedTests / Math.max(summary.totalTests, 1)) * 100),
      threshold: 95
    };

    const accessibilityViolations = results.accessibilityTests?.violations?.length || 0;
    const accessibility = {
      status: accessibilityViolations === 0 ? 'PASS' as const : 'FAIL' as const,
      violations: accessibilityViolations
    };

    const performanceScore = results.performanceTests?.lhr?.categories?.performance?.score * 100 || 0;
    const performance = {
      status: performanceScore >= 90 ? 'PASS' as const : 'FAIL' as const,
      score: Math.round(performanceScore),
      threshold: 90
    };

    const securityVulns = this.countSecurityVulnerabilities(results.securityResults);
    const security = {
      status: securityVulns === 0 ? 'PASS' as const : 'FAIL' as const,
      vulnerabilities: securityVulns
    };

    return {
      coverage,
      testPassRate,
      accessibility,
      performance,
      security
    };
  }

  private countSecurityVulnerabilities(securityResults: any): number {
    if (!securityResults) return 0;
    
    // npm audit format
    if (securityResults.metadata?.vulnerabilities) {
      const vulns = securityResults.metadata.vulnerabilities;
      return (vulns.high || 0) + (vulns.critical || 0);
    }

    // Snyk format
    if (securityResults.vulnerabilities) {
      return securityResults.vulnerabilities.filter((v: any) => 
        v.severity === 'high' || v.severity === 'critical'
      ).length;
    }

    return 0;
  }

  private generateRecommendations(results: TestResults, gates: QualityGateStatus): string[] {
    const recommendations: string[] = [];

    if (gates.coverage.status === 'FAIL') {
      recommendations.push(`Increase test coverage from ${gates.coverage.value}% to at least ${gates.coverage.threshold}%`);
    }

    if (gates.testPassRate.status === 'FAIL') {
      recommendations.push(`Improve test pass rate from ${gates.testPassRate.value}% to at least ${gates.testPassRate.threshold}%`);
    }

    if (gates.accessibility.status === 'FAIL') {
      recommendations.push(`Fix ${gates.accessibility.violations} accessibility violations`);
    }

    if (gates.performance.status === 'FAIL') {
      recommendations.push(`Improve performance score from ${gates.performance.score} to at least ${gates.performance.threshold}`);
    }

    if (gates.security.status === 'FAIL') {
      recommendations.push(`Address ${gates.security.vulnerabilities} high/critical security vulnerabilities`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All quality gates passed! Consider optimizing for even better performance.');
    }

    return recommendations;
  }

  private async saveReports(report: QAReport): Promise<void> {
    // Save JSON report
    await fs.writeFile(
      path.join(this.outputDir, 'qa-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Save HTML report
    const htmlReport = this.generateHTMLReport(report);
    await fs.writeFile(
      path.join(this.outputDir, 'qa-report.html'),
      htmlReport
    );

    // Save markdown summary
    const markdownReport = this.generateMarkdownReport(report);
    await fs.writeFile(
      path.join(this.outputDir, 'qa-summary.md'),
      markdownReport
    );

    // Save CSV for historical tracking
    const csvReport = this.generateCSVReport(report);
    await fs.writeFile(
      path.join(this.outputDir, 'qa-metrics.csv'),
      csvReport
    );
  }

  private generateHTMLReport(report: QAReport): string {
    const statusColor = report.summary.status === 'PASS' ? '#28a745' : 
                        report.summary.status === 'WARNING' ? '#ffc107' : '#dc3545';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QA Report - FHIR Healthcare Bootcamp</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; }
        .header { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; background-color: ${statusColor}; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .metric-value { font-size: 1.5em; font-weight: bold; }
        .pass { color: #28a745; } .fail { color: #dc3545; } .warning { color: #ffc107; }
        .progress-bar { width: 100%; height: 8px; background-color: #e9ecef; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background-color: #f8f9fa; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>QA Report - FHIR Healthcare Bootcamp</h1>
        <p><strong>Status:</strong> <span class="status">${report.summary.status}</span></p>
        <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
        <p><strong>Commit:</strong> ${report.commit.substring(0, 8)}</p>
        <p><strong>Branch:</strong> ${report.branch}</p>
    </div>

    <div class="grid">
        <div class="card">
            <h3>Test Summary</h3>
            <div class="metric">
                <span>Total Tests</span>
                <span class="metric-value">${report.summary.totalTests}</span>
            </div>
            <div class="metric">
                <span>Passed</span>
                <span class="metric-value pass">${report.summary.passedTests}</span>
            </div>
            <div class="metric">
                <span>Failed</span>
                <span class="metric-value ${report.summary.failedTests > 0 ? 'fail' : 'pass'}">${report.summary.failedTests}</span>
            </div>
            <div class="metric">
                <span>Duration</span>
                <span class="metric-value">${(report.summary.duration / 1000).toFixed(1)}s</span>
            </div>
        </div>

        <div class="card">
            <h3>Coverage</h3>
            <div class="metric">
                <span>Line Coverage</span>
                <span class="metric-value ${report.qualityGates.coverage.status === 'PASS' ? 'pass' : 'fail'}">
                    ${report.qualityGates.coverage.value}%
                </span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${report.qualityGates.coverage.value}%; background-color: ${report.qualityGates.coverage.status === 'PASS' ? '#28a745' : '#dc3545'};"></div>
            </div>
        </div>

        <div class="card">
            <h3>Quality Gates</h3>
            <table>
                <tr>
                    <td>Coverage</td>
                    <td class="${report.qualityGates.coverage.status === 'PASS' ? 'pass' : 'fail'}">
                        ${report.qualityGates.coverage.status}
                    </td>
                </tr>
                <tr>
                    <td>Test Pass Rate</td>
                    <td class="${report.qualityGates.testPassRate.status === 'PASS' ? 'pass' : 'fail'}">
                        ${report.qualityGates.testPassRate.status}
                    </td>
                </tr>
                <tr>
                    <td>Accessibility</td>
                    <td class="${report.qualityGates.accessibility.status === 'PASS' ? 'pass' : 'fail'}">
                        ${report.qualityGates.accessibility.status}
                    </td>
                </tr>
                <tr>
                    <td>Performance</td>
                    <td class="${report.qualityGates.performance.status === 'PASS' ? 'pass' : 'fail'}">
                        ${report.qualityGates.performance.status}
                    </td>
                </tr>
                <tr>
                    <td>Security</td>
                    <td class="${report.qualityGates.security.status === 'PASS' ? 'pass' : 'fail'}">
                        ${report.qualityGates.security.status}
                    </td>
                </tr>
            </table>
        </div>
    </div>

    ${report.recommendations.length > 0 ? `
    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    <div class="card">
        <h3>Detailed Results</h3>
        <pre style="background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(report.details, null, 2)}
        </pre>
    </div>
</body>
</html>`;
  }

  private generateMarkdownReport(report: QAReport): string {
    const statusEmoji = report.summary.status === 'PASS' ? '✅' : 
                        report.summary.status === 'WARNING' ? '⚠️' : '❌';

    return `# QA Report - FHIR Healthcare Bootcamp

## Summary

**Status**: ${statusEmoji} ${report.summary.status}  
**Generated**: ${new Date(report.timestamp).toLocaleString()}  
**Commit**: \`${report.commit.substring(0, 8)}\`  
**Branch**: \`${report.branch}\`  

## Test Results

| Metric | Value |
|--------|-------|
| Total Tests | ${report.summary.totalTests} |
| Passed | ${report.summary.passedTests} |
| Failed | ${report.summary.failedTests} |
| Coverage | ${report.summary.coverage}% |
| Duration | ${(report.summary.duration / 1000).toFixed(1)}s |

## Quality Gates

| Gate | Status | Details |
|------|--------|---------|
| Coverage | ${report.qualityGates.coverage.status === 'PASS' ? '✅' : '❌'} | ${report.qualityGates.coverage.value}% (threshold: ${report.qualityGates.coverage.threshold}%) |
| Test Pass Rate | ${report.qualityGates.testPassRate.status === 'PASS' ? '✅' : '❌'} | ${report.qualityGates.testPassRate.value}% (threshold: ${report.qualityGates.testPassRate.threshold}%) |
| Accessibility | ${report.qualityGates.accessibility.status === 'PASS' ? '✅' : '❌'} | ${report.qualityGates.accessibility.violations} violations |
| Performance | ${report.qualityGates.performance.status === 'PASS' ? '✅' : '❌'} | Score: ${report.qualityGates.performance.score} (threshold: ${report.qualityGates.performance.threshold}) |
| Security | ${report.qualityGates.security.status === 'PASS' ? '✅' : '❌'} | ${report.qualityGates.security.vulnerabilities} high/critical vulnerabilities |

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by FHIR Healthcare Bootcamp QA Pipeline*`;
  }

  private generateCSVReport(report: QAReport): string {
    const headers = [
      'timestamp', 'commit', 'branch', 'status', 'totalTests', 'passedTests', 
      'failedTests', 'coverage', 'duration', 'coverageGate', 'testPassRateGate', 
      'accessibilityGate', 'performanceGate', 'securityGate'
    ].join(',');

    const row = [
      report.timestamp,
      report.commit,
      report.branch,
      report.summary.status,
      report.summary.totalTests,
      report.summary.passedTests,
      report.summary.failedTests,
      report.summary.coverage,
      report.summary.duration,
      report.qualityGates.coverage.status,
      report.qualityGates.testPassRate.status,
      report.qualityGates.accessibility.status,
      report.qualityGates.performance.status,
      report.qualityGates.security.status
    ].join(',');

    return `${headers}\n${row}`;
  }
}

// CLI execution
if (require.main === module) {
  const generator = new QAReportGenerator();
  generator.generateReport().catch(error => {
    console.error('Failed to generate QA report:', error);
    process.exit(1);
  });
}

export default QAReportGenerator;