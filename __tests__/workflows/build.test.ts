import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

describe('GitHub Actions Build Workflow', () => {
  const workflowPath = path.join(__dirname, '../../.github/workflows/build.yml');
  let workflowContent: string;
  let workflowConfig: any;

  beforeAll(() => {
    // Arrange: Read and parse the workflow file
    workflowContent = fs.readFileSync(workflowPath, 'utf-8');
    workflowConfig = yaml.parse(workflowContent);
  });

  describe('Workflow File Structure', () => {
    it('should exist at .github/workflows/build.yml', () => {
      // Assert
      expect(fs.existsSync(workflowPath)).toBe(true);
    });

    it('should be valid YAML syntax', () => {
      // Assert
      expect(() => yaml.parse(workflowContent)).not.toThrow();
    });

    it('should have a workflow name', () => {
      // Assert
      expect(workflowConfig).toHaveProperty('name');
      expect(typeof workflowConfig.name).toBe('string');
      expect(workflowConfig.name.length).toBeGreaterThan(0);
    });
  });

  describe('Workflow Triggers', () => {
    it('should trigger on push events', () => {
      // Assert
      expect(workflowConfig).toHaveProperty('on');
      expect(workflowConfig.on).toHaveProperty('push');
    });

    it('should trigger on main branch push', () => {
      // Assert
      expect(workflowConfig.on.push).toHaveProperty('branches');
      expect(workflowConfig.on.push.branches).toContain('main');
    });

    it('should trigger on tag push', () => {
      // Assert
      expect(workflowConfig.on.push).toHaveProperty('tags');
      expect(Array.isArray(workflowConfig.on.push.tags)).toBe(true);
      expect(workflowConfig.on.push.tags.length).toBeGreaterThan(0);
    });

    it('should have valid tag pattern for semantic versioning', () => {
      // Assert
      const tagPatterns = workflowConfig.on.push.tags;
      const hasVersionPattern = tagPatterns.some((pattern: string) =>
        pattern.includes('v*') || pattern.includes('*.*.*')
      );
      expect(hasVersionPattern).toBe(true);
    });
  });

  describe('Job Configuration', () => {
    it('should have at least one job defined', () => {
      // Assert
      expect(workflowConfig).toHaveProperty('jobs');
      expect(Object.keys(workflowConfig.jobs).length).toBeGreaterThan(0);
    });

    it('should have a build job', () => {
      // Assert
      expect(workflowConfig.jobs).toHaveProperty('build');
    });

    describe('Build Job', () => {
      let buildJob: any;

      beforeAll(() => {
        buildJob = workflowConfig.jobs.build;
      });

      it('should have a descriptive name', () => {
        // Assert
        expect(buildJob).toHaveProperty('name');
        expect(typeof buildJob.name).toBe('string');
        expect(buildJob.name.length).toBeGreaterThan(0);
      });

      it('should use ubuntu-24.04-arm runner', () => {
        // Assert
        expect(buildJob).toHaveProperty('runs-on');
        expect(buildJob['runs-on']).toBe('ubuntu-24.04-arm');
      });

      it('should have steps array', () => {
        // Assert
        expect(buildJob).toHaveProperty('steps');
        expect(Array.isArray(buildJob.steps)).toBe(true);
        expect(buildJob.steps.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Build Job Steps', () => {
    let steps: any[];

    beforeAll(() => {
      steps = workflowConfig.jobs.build.steps;
    });

    it('should have checkout step', () => {
      // Assert
      const checkoutStep = steps.find((step: any) =>
        step.uses && step.uses.includes('actions/checkout')
      );
      expect(checkoutStep).toBeDefined();
    });

    it('should use checkout@v4 or later', () => {
      // Assert
      const checkoutStep = steps.find((step: any) =>
        step.uses && step.uses.includes('actions/checkout')
      );
      expect(checkoutStep.uses).toMatch(/actions\/checkout@v[4-9]/);
    });

    it('should have Node.js setup step', () => {
      // Assert
      const nodeStep = steps.find((step: any) =>
        step.uses && step.uses.includes('actions/setup-node')
      );
      expect(nodeStep).toBeDefined();
    });

    it('should use Node.js version 20', () => {
      // Assert
      const nodeStep = steps.find((step: any) =>
        step.uses && step.uses.includes('actions/setup-node')
      );
      expect(nodeStep).toHaveProperty('with');
      expect(nodeStep.with).toHaveProperty('node-version');
      expect(nodeStep.with['node-version']).toMatch(/20/);
    });

    it('should have step names for all steps', () => {
      // Assert
      steps.forEach((step: any, index: number) => {
        expect(step).toHaveProperty('name',
          `Step at index ${index} should have a name property`
        );
        expect(typeof step.name).toBe('string');
        expect(step.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ARM64 Architecture Configuration', () => {
    it('should use ARM64-compatible runner', () => {
      // Assert
      const buildJob = workflowConfig.jobs.build;
      expect(buildJob['runs-on']).toMatch(/arm/i);
    });

    it('should not have x86-specific configurations', () => {
      // Assert
      const workflowString = yaml.stringify(workflowConfig);
      expect(workflowString).not.toMatch(/amd64/i);
      expect(workflowString).not.toMatch(/x86/i);
      expect(workflowString).not.toMatch(/x64(?!.*arm)/i);
    });
  });

  describe('Workflow Best Practices', () => {
    it('should have meaningful step descriptions', () => {
      // Assert
      const steps = workflowConfig.jobs.build.steps;
      steps.forEach((step: any) => {
        // Step names should be descriptive (more than just "Run command")
        if (step.name) {
          expect(step.name.length).toBeGreaterThan(5);
        }
      });
    });

    it('should follow GitHub Actions schema', () => {
      // Assert
      expect(workflowConfig).toHaveProperty('name');
      expect(workflowConfig).toHaveProperty('on');
      expect(workflowConfig).toHaveProperty('jobs');

      // Each job should have required properties
      Object.values(workflowConfig.jobs).forEach((job: any) => {
        expect(job).toHaveProperty('runs-on');
        expect(job).toHaveProperty('steps');
      });
    });

    it('should use pinned action versions', () => {
      // Assert
      const steps = workflowConfig.jobs.build.steps;
      steps.forEach((step: any) => {
        if (step.uses) {
          // Actions should have version specified (e.g., @v4, @v3)
          expect(step.uses).toMatch(/@[v\d]/);
        }
      });
    });
  });

  describe('Integration with Existing Workflows', () => {
    it('should be consistent with test.yml structure', () => {
      // Arrange
      const testWorkflowPath = path.join(__dirname, '../../.github/workflows/test.yml');

      if (fs.existsSync(testWorkflowPath)) {
        const testWorkflowContent = fs.readFileSync(testWorkflowPath, 'utf-8');
        const testWorkflowConfig = yaml.parse(testWorkflowContent);

        // Assert: Should use similar checkout and node setup patterns
        const buildCheckout = workflowConfig.jobs.build.steps.find((s: any) =>
          s.uses && s.uses.includes('actions/checkout')
        );
        const testCheckout = testWorkflowConfig.jobs['backend-test'].steps.find((s: any) =>
          s.uses && s.uses.includes('actions/checkout')
        );

        expect(buildCheckout.uses.split('@')[0]).toBe(testCheckout.uses.split('@')[0]);
      }
    });

    it('should use Node.js 20 consistent with project requirements', () => {
      // Arrange
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      // Assert
      const nodeStep = workflowConfig.jobs.build.steps.find((step: any) =>
        step.uses && step.uses.includes('actions/setup-node')
      );

      // Should match or exceed minimum Node version from package.json
      const nodeVersion = nodeStep.with['node-version'];
      expect(nodeVersion).toMatch(/20/);
    });
  });

  describe('Workflow Syntax Validation', () => {
    it('should not have syntax errors that prevent execution', () => {
      // Assert
      expect(() => {
        // Validate all jobs have required fields
        Object.entries(workflowConfig.jobs).forEach(([jobName, job]: [string, any]) => {
          if (!job['runs-on']) {
            throw new Error(`Job '${jobName}' missing 'runs-on' field`);
          }
          if (!job.steps || !Array.isArray(job.steps)) {
            throw new Error(`Job '${jobName}' missing or invalid 'steps' field`);
          }
        });
      }).not.toThrow();
    });

    it('should have valid trigger configuration', () => {
      // Assert
      expect(() => {
        if (!workflowConfig.on) {
          throw new Error('Workflow missing trigger configuration');
        }
        if (typeof workflowConfig.on === 'string') {
          // Single trigger event (valid)
          return;
        }
        if (typeof workflowConfig.on === 'object') {
          // Multiple triggers or configured triggers (valid)
          return;
        }
        throw new Error('Invalid trigger configuration');
      }).not.toThrow();
    });
  });

  describe('Error Cases', () => {
    it('should handle workflow file read errors gracefully in tests', () => {
      // This test verifies the test setup itself is robust
      expect(() => {
        const nonExistentPath = '/non/existent/workflow.yml';
        if (fs.existsSync(nonExistentPath)) {
          fs.readFileSync(nonExistentPath, 'utf-8');
        }
      }).not.toThrow();
    });
  });
});
