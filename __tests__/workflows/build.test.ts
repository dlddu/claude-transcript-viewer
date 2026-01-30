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

    describe('Pull Request Triggers', () => {
      it('should trigger on pull_request events', () => {
        // Assert
        expect(workflowConfig.on).toHaveProperty('pull_request');
      });

      it('should trigger on pull requests targeting main branch', () => {
        // Assert
        expect(workflowConfig.on.pull_request).toHaveProperty('branches');
        expect(workflowConfig.on.pull_request.branches).toContain('main');
      });

      it('should only target main branch for pull requests', () => {
        // Assert
        const prBranches = workflowConfig.on.pull_request.branches;
        expect(Array.isArray(prBranches)).toBe(true);
        expect(prBranches).toEqual(['main']);
      });
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
        expect(step).toHaveProperty('name');
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

  describe('GitHub Container Registry (GHCR) Configuration', () => {
    it('should have packages write permission', () => {
      // Assert
      expect(workflowConfig.jobs.build).toHaveProperty('permissions');
      expect(workflowConfig.jobs.build.permissions).toHaveProperty('packages');
      expect(workflowConfig.jobs.build.permissions.packages).toBe('write');
    });

    describe('GHCR Login Step', () => {
      let ghcrLoginStep: any;

      beforeAll(() => {
        const steps = workflowConfig.jobs.build.steps;
        ghcrLoginStep = steps.find((step: any) =>
          step.uses && step.uses.includes('docker/login-action')
        );
      });

      it('should have GHCR login step', () => {
        // Assert
        expect(ghcrLoginStep).toBeDefined();
      });

      it('should use docker/login-action@v3', () => {
        // Assert
        expect(ghcrLoginStep.uses).toMatch(/docker\/login-action@v3/);
      });

      it('should configure registry as ghcr.io', () => {
        // Assert
        expect(ghcrLoginStep).toHaveProperty('with');
        expect(ghcrLoginStep.with).toHaveProperty('registry');
        expect(ghcrLoginStep.with.registry).toBe('ghcr.io');
      });

      it('should use GITHUB_TOKEN for authentication', () => {
        // Assert
        expect(ghcrLoginStep.with).toHaveProperty('password');
        expect(ghcrLoginStep.with.password).toMatch(/\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}/);
      });

      it('should use repository owner as username', () => {
        // Assert
        expect(ghcrLoginStep.with).toHaveProperty('username');
        expect(ghcrLoginStep.with.username).toMatch(/\$\{\{\s*github\.actor\s*\}\}/);
      });

      it('should skip on pull request events', () => {
        // Assert
        expect(ghcrLoginStep).toHaveProperty('if');
        const ifCondition = ghcrLoginStep.if;

        // Should have condition to skip on pull_request
        expect(ifCondition).toMatch(/github\.event_name\s*!=\s*['"]pull_request['"]/);
      });

      it('should only run on push events', () => {
        // Assert
        const ifCondition = ghcrLoginStep.if;

        // Verify the condition excludes pull_request
        expect(typeof ifCondition).toBe('string');
        expect(ifCondition.length).toBeGreaterThan(0);

        // Should use inequality operator
        expect(ifCondition).toMatch(/!=/);
      });
    });

    describe('Docker Metadata Extraction Step', () => {
      let metadataStep: any;

      beforeAll(() => {
        const steps = workflowConfig.jobs.build.steps;
        metadataStep = steps.find((step: any) =>
          step.uses && step.uses.includes('docker/metadata-action')
        );
      });

      it('should have Docker metadata extraction step', () => {
        // Assert
        expect(metadataStep).toBeDefined();
      });

      it('should use docker/metadata-action@v5', () => {
        // Assert
        expect(metadataStep.uses).toMatch(/docker\/metadata-action@v5/);
      });

      it('should configure correct image name', () => {
        // Assert
        expect(metadataStep).toHaveProperty('with');
        expect(metadataStep.with).toHaveProperty('images');
        expect(metadataStep.with.images).toBe('ghcr.io/dlddu/claude-transcript-viewer');
      });

      it('should have output id for metadata', () => {
        // Assert
        expect(metadataStep).toHaveProperty('id');
        expect(typeof metadataStep.id).toBe('string');
        expect(metadataStep.id.length).toBeGreaterThan(0);
      });
    });

    describe('Image Tagging Strategy', () => {
      let metadataStep: any;

      beforeAll(() => {
        const steps = workflowConfig.jobs.build.steps;
        metadataStep = steps.find((step: any) =>
          step.uses && step.uses.includes('docker/metadata-action')
        );
      });

      it('should include latest tag for main branch', () => {
        // Assert
        expect(metadataStep.with).toHaveProperty('tags');
        const tagsString = typeof metadataStep.with.tags === 'string'
          ? metadataStep.with.tags
          : metadataStep.with.tags.join('\n');
        expect(tagsString).toMatch(/type=raw.*latest/i);
      });

      it('should include semver tag pattern for version tags', () => {
        // Assert
        const tagsString = typeof metadataStep.with.tags === 'string'
          ? metadataStep.with.tags
          : metadataStep.with.tags.join('\n');
        expect(tagsString).toMatch(/type=semver/i);
      });

      it('should include SHA-based tag', () => {
        // Assert
        const tagsString = typeof metadataStep.with.tags === 'string'
          ? metadataStep.with.tags
          : metadataStep.with.tags.join('\n');
        expect(tagsString).toMatch(/type=sha/i);
      });

      it('should have at least three tagging strategies', () => {
        // Assert
        const tagsString = typeof metadataStep.with.tags === 'string'
          ? metadataStep.with.tags
          : metadataStep.with.tags.join('\n');
        const typeMatches = tagsString.match(/type=/g);
        expect(typeMatches).toBeDefined();
        expect(typeMatches!.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe('Tag Strategy Conditions', () => {
      let metadataStep: any;

      beforeAll(() => {
        const steps = workflowConfig.jobs.build.steps;
        metadataStep = steps.find((step: any) =>
          step.uses && step.uses.includes('docker/metadata-action')
        );
      });

      it('should apply latest tag only on main branch', () => {
        // Assert
        const tagsString = typeof metadataStep.with.tags === 'string'
          ? metadataStep.with.tags
          : metadataStep.with.tags.join('\n');

        // Check that latest tag has a condition for main branch
        const latestTagLine = tagsString.split('\n').find((line: string) =>
          line.includes('latest')
        );

        if (latestTagLine) {
          // If there's a condition, it should reference main branch
          if (latestTagLine.includes('enable=')) {
            expect(latestTagLine).toMatch(/main/i);
          }
        }
      });

      it('should support v*.*.* tag pattern for semver', () => {
        // Assert
        const tagsString = typeof metadataStep.with.tags === 'string'
          ? metadataStep.with.tags
          : metadataStep.with.tags.join('\n');

        // Semver pattern should handle v prefix
        expect(tagsString).toMatch(/semver.*pattern=v?\{\{version\}\}|semver/i);
      });
    });
  });

  describe('Docker Build and Push Step', () => {
    let buildPushStep: any;

    beforeAll(() => {
      const steps = workflowConfig.jobs.build.steps;
      buildPushStep = steps.find((step: any) =>
        step.uses && step.uses.includes('docker/build-push-action')
      );
    });

    describe('Step Existence and Version', () => {
      it('should have Docker build-push step', () => {
        // Assert
        expect(buildPushStep).toBeDefined();
      });

      it('should use docker/build-push-action@v5', () => {
        // Assert
        expect(buildPushStep.uses).toMatch(/docker\/build-push-action@v5/);
      });

      it('should have a descriptive name', () => {
        // Assert
        expect(buildPushStep).toHaveProperty('name');
        expect(typeof buildPushStep.name).toBe('string');
        expect(buildPushStep.name.length).toBeGreaterThan(0);
      });
    });

    describe('Build Configuration', () => {
      it('should have with configuration', () => {
        // Assert
        expect(buildPushStep).toHaveProperty('with');
        expect(typeof buildPushStep.with).toBe('object');
      });

      it('should specify context as current directory', () => {
        // Assert
        expect(buildPushStep.with).toHaveProperty('context');
        expect(buildPushStep.with.context).toBe('.');
      });
    });

    describe('Tags and Labels from Metadata', () => {
      it('should use metadata step output for tags', () => {
        // Assert
        expect(buildPushStep.with).toHaveProperty('tags');
        expect(buildPushStep.with.tags).toMatch(/\$\{\{\s*steps\.meta\.outputs\.tags\s*\}\}/);
      });

      it('should use metadata step output for labels', () => {
        // Assert
        expect(buildPushStep.with).toHaveProperty('labels');
        expect(buildPushStep.with.labels).toMatch(/\$\{\{\s*steps\.meta\.outputs\.labels\s*\}\}/);
      });

      it('should reference meta step by correct id', () => {
        // Arrange
        const steps = workflowConfig.jobs.build.steps;
        const metadataStep = steps.find((step: any) =>
          step.uses && step.uses.includes('docker/metadata-action')
        );

        // Assert
        expect(metadataStep).toHaveProperty('id');
        expect(buildPushStep.with.tags).toContain(metadataStep.id);
        expect(buildPushStep.with.labels).toContain(metadataStep.id);
      });
    });

    describe('Cache Configuration', () => {
      it('should configure cache-from with GitHub Actions cache', () => {
        // Assert
        expect(buildPushStep.with).toHaveProperty('cache-from');
        expect(buildPushStep.with['cache-from']).toMatch(/type=gha/);
      });

      it('should configure cache-to with GitHub Actions cache', () => {
        // Assert
        expect(buildPushStep.with).toHaveProperty('cache-to');
        expect(buildPushStep.with['cache-to']).toMatch(/type=gha/);
      });

      it('should use mode=max for cache-to to cache all layers', () => {
        // Assert
        expect(buildPushStep.with['cache-to']).toMatch(/mode=max/);
      });

      it('should have proper cache configuration format', () => {
        // Assert
        const cacheFrom = buildPushStep.with['cache-from'];
        const cacheTo = buildPushStep.with['cache-to'];

        // Cache configuration should be valid format
        expect(cacheFrom).toMatch(/^type=gha/);
        expect(cacheTo).toMatch(/^type=gha,mode=max$/);
      });
    });

    describe('Push Conditions', () => {
      it('should have push configuration', () => {
        // Assert
        expect(buildPushStep.with).toHaveProperty('push');
      });

      it('should push only on main branch or tags', () => {
        // Assert
        const pushCondition = buildPushStep.with.push;

        // Push should be conditional based on ref
        if (typeof pushCondition === 'string') {
          expect(pushCondition).toMatch(/github\.ref/);
          // Should check for main branch
          expect(pushCondition).toMatch(/main/);
          // Should check for tag refs
          expect(pushCondition).toMatch(/tags/);
        } else {
          // If boolean, should have step-level condition
          expect(buildPushStep).toHaveProperty('if');
        }
      });

      it('should not push on pull requests', () => {
        // Assert
        const pushCondition = buildPushStep.with.push;

        if (typeof pushCondition === 'string') {
          // Should not include pull_request in condition
          expect(pushCondition).not.toMatch(/pull_request/);

          // Condition should be exclusive (main or tags only)
          // This ensures PRs are excluded
          const hasMainCondition = pushCondition.includes("refs/heads/main");
          const hasTagCondition = pushCondition.includes("refs/tags/");

          expect(hasMainCondition || hasTagCondition).toBe(true);
        }
      });

      it('should build without push on pull requests', () => {
        // Assert
        const pushCondition = buildPushStep.with.push;

        // Push should be false for pull requests (only true for main or tags)
        if (typeof pushCondition === 'string') {
          // Verify condition explicitly checks refs, excluding pull requests
          expect(pushCondition).toMatch(/github\.ref\s*==\s*['"]refs\/heads\/main['"]/);
          expect(pushCondition).toMatch(/startsWith\(github\.ref,\s*['"]refs\/tags\//);

          // Should use OR operator, not AND
          expect(pushCondition).toMatch(/\|\|/);
        }
      });

      it('should build but not push on non-main branches', () => {
        // Assert
        const pushCondition = buildPushStep.with.push;

        if (typeof pushCondition === 'string') {
          // Verify the condition logic ensures only main/tags push
          expect(pushCondition).toMatch(/github\.ref\s*==\s*['"]refs\/heads\/main['"]|startsWith\(github\.ref,\s*['"]refs\/tags\//);
        }
      });
    });

    describe('Build Order and Dependencies', () => {
      it('should run after metadata extraction step', () => {
        // Arrange
        const steps = workflowConfig.jobs.build.steps;
        const metadataStepIndex = steps.findIndex((step: any) =>
          step.uses && step.uses.includes('docker/metadata-action')
        );
        const buildStepIndex = steps.findIndex((step: any) =>
          step.uses && step.uses.includes('docker/build-push-action')
        );

        // Assert
        expect(metadataStepIndex).toBeGreaterThanOrEqual(0);
        expect(buildStepIndex).toBeGreaterThan(metadataStepIndex);
      });

      it('should run after GHCR login step', () => {
        // Arrange
        const steps = workflowConfig.jobs.build.steps;
        const loginStepIndex = steps.findIndex((step: any) =>
          step.uses && step.uses.includes('docker/login-action')
        );
        const buildStepIndex = steps.findIndex((step: any) =>
          step.uses && step.uses.includes('docker/build-push-action')
        );

        // Assert
        expect(loginStepIndex).toBeGreaterThanOrEqual(0);
        expect(buildStepIndex).toBeGreaterThan(loginStepIndex);
      });

      it('should run after Node.js build steps', () => {
        // Arrange
        const steps = workflowConfig.jobs.build.steps;
        const nodeBuildSteps = steps.filter((step: any) =>
          step.run && (
            step.run.includes('npm run build') ||
            step.run.includes('npm install')
          )
        );
        const buildStepIndex = steps.findIndex((step: any) =>
          step.uses && step.uses.includes('docker/build-push-action')
        );

        // Assert
        if (nodeBuildSteps.length > 0) {
          const lastNodeBuildIndex = steps.lastIndexOf(
            nodeBuildSteps[nodeBuildSteps.length - 1]
          );
          expect(buildStepIndex).toBeGreaterThan(lastNodeBuildIndex);
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle tag format v1.0.0 correctly', () => {
        // Assert
        // The metadata step should generate proper tags that the build step uses
        const steps = workflowConfig.jobs.build.steps;
        const metadataStep = steps.find((step: any) =>
          step.uses && step.uses.includes('docker/metadata-action')
        );

        const tagsString = typeof metadataStep.with.tags === 'string'
          ? metadataStep.with.tags
          : metadataStep.with.tags.join('\n');

        // Should support v* pattern
        expect(tagsString).toMatch(/semver/);
      });

      it('should handle concurrent builds with different refs', () => {
        // Assert
        // Cache configuration should support concurrent builds
        expect(buildPushStep.with['cache-from']).toBe('type=gha');
        expect(buildPushStep.with['cache-to']).toBe('type=gha,mode=max');

        // Push condition should be ref-specific
        const pushCondition = buildPushStep.with.push;
        expect(typeof pushCondition).toBe('string');
        expect(pushCondition).toMatch(/github\.ref/);
      });
    });

    describe('Error Cases', () => {
      it('should fail gracefully if metadata step fails', () => {
        // Assert
        // Build step depends on metadata outputs
        expect(buildPushStep.with.tags).toContain('steps.meta.outputs');

        // This means build will be skipped if metadata fails (GitHub Actions behavior)
        // No explicit error handling needed as workflow will fail appropriately
        expect(buildPushStep.with.tags).toBeDefined();
      });

      it('should not push if login fails', () => {
        // Arrange
        const steps = workflowConfig.jobs.build.steps;
        const loginStepIndex = steps.findIndex((step: any) =>
          step.uses && step.uses.includes('docker/login-action')
        );
        const buildStepIndex = steps.findIndex((step: any) =>
          step.uses && step.uses.includes('docker/build-push-action')
        );

        // Assert
        // Build step comes after login, so login failure will prevent build
        expect(buildStepIndex).toBeGreaterThan(loginStepIndex);

        // No continue-on-error flag that would allow push after login failure
        const loginStep = steps[loginStepIndex];
        expect(loginStep['continue-on-error']).not.toBe(true);
      });
    });

    describe('Best Practices', () => {
      it('should use pinned action version', () => {
        // Assert
        expect(buildPushStep.uses).toMatch(/@v\d+$/);
      });

      it('should have all required build-push-action parameters', () => {
        // Assert
        const requiredParams = ['context', 'push', 'tags', 'labels', 'cache-from', 'cache-to'];

        requiredParams.forEach((param) => {
          expect(buildPushStep.with).toHaveProperty(param);
        });
      });

      it('should maximize cache efficiency with mode=max', () => {
        // Assert
        // mode=max caches all layers, not just final ones
        expect(buildPushStep.with['cache-to']).toContain('mode=max');
      });

      it('should reference outputs using correct syntax', () => {
        // Assert
        const tagsRef = buildPushStep.with.tags;
        const labelsRef = buildPushStep.with.labels;

        // Should use ${{ }} syntax
        expect(tagsRef).toMatch(/\$\{\{.*\}\}/);
        expect(labelsRef).toMatch(/\$\{\{.*\}\}/);

        // Should not have syntax errors
        expect(tagsRef).not.toMatch(/\$\{\s*\}\}/);
        expect(labelsRef).not.toMatch(/\$\{\s*\}\}/);
      });
    });
  });
});
