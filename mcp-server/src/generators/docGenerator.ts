import { writeFileSync, readFileSync } from 'fs';
import { ApiValidationResult } from '../types';

export class DocumentationGenerator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  updateAgentsDocumentation(validationResult: ApiValidationResult): void {
    const agentsPath = `${this.projectRoot}/AGENTS.md`;
    
    try {
      const currentContent = readFileSync(agentsPath, 'utf-8');
      const updatedContent = this.insertValidationReport(currentContent, validationResult);
      writeFileSync(agentsPath, updatedContent);
      console.log('AGENTS.md updated with validation results');
    } catch (error) {
      console.error('Error updating AGENTS.md:', error);
    }
  }

  generateApiReport(validationResult: ApiValidationResult): string {
    const timestamp = new Date().toISOString();
    
    let report = `# API Validation Report\n\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Status:** ${validationResult.isValid ? '✅ Valid' : '❌ Issues Found'}\n\n`;

    if (validationResult.missingBackend.length > 0) {
      report += `## Missing Backend Implementations\n\n`;
      validationResult.missingBackend.forEach(cmd => {
        report += `- \`${cmd}\` - Frontend method exists but no Tauri command found\n`;
      });
      report += `\n`;
    }

    if (validationResult.missingFrontend.length > 0) {
      report += `## Missing Frontend Implementations\n\n`;
      validationResult.missingFrontend.forEach(cmd => {
        report += `- \`${cmd}\` - Tauri command exists but no frontend method found\n`;
      });
      report += `\n`;
    }

    if (validationResult.typeMismatches.length > 0) {
      report += `## Type Mismatches\n\n`;
      validationResult.typeMismatches.forEach(mismatch => {
        report += `- **${mismatch.endpoint}**: Frontend expects \`${mismatch.frontend}\`, Backend provides \`${mismatch.backend}\`\n`;
      });
      report += `\n`;
    }

    if (validationResult.inconsistencies.length > 0) {
      report += `## Other Inconsistencies\n\n`;
      validationResult.inconsistencies.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += `\n`;
    }

    if (validationResult.isValid) {
      report += `## Summary\n\n`;
      report += `All API endpoints are properly synchronized between frontend and backend. ✅\n`;
    }

    return report;
  }

  private insertValidationReport(content: string, validationResult: ApiValidationResult): string {
    const reportSection = this.generateApiReport(validationResult);
    
    // Find the "Next Steps" section and insert before it
    const nextStepsIndex = content.indexOf('## Next Steps');
    if (nextStepsIndex !== -1) {
      const beforeNextSteps = content.substring(0, nextStepsIndex);
      const afterNextSteps = content.substring(nextStepsIndex);
      
      // Remove any existing validation report
      const cleanedBefore = beforeNextSteps.replace(/# API Validation Report[\s\S]*?(?=##|$)/g, '');
      
      return cleanedBefore + reportSection + '\n' + afterNextSteps;
    }
    
    // If no "Next Steps" section, append at the end
    return content + '\n\n' + reportSection;
  }

  saveReport(validationResult: ApiValidationResult, filename: string = 'api-validation-report.md'): void {
    const reportPath = `${this.projectRoot}/${filename}`;
    const report = this.generateApiReport(validationResult);
    
    try {
      writeFileSync(reportPath, report);
      console.log(`API validation report saved to ${filename}`);
    } catch (error) {
      console.error('Error saving validation report:', error);
    }
  }
}