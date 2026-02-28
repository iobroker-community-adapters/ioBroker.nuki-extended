# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.5.7
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

---

## 📑 Table of Contents

1. [Project Context](#project-context)
2. [Code Quality & Standards](#code-quality--standards)
   - [Code Style Guidelines](#code-style-guidelines)
   - [ESLint Configuration](#eslint-configuration)
3. [Testing](#testing)
   - [Unit Testing](#unit-testing)
   - [Integration Testing](#integration-testing)
   - [API Testing with Credentials](#api-testing-with-credentials)
4. [Development Best Practices](#development-best-practices)
   - [Dependency Management](#dependency-management)
   - [HTTP Client Libraries](#http-client-libraries)
   - [Error Handling](#error-handling)
5. [Admin UI Configuration](#admin-ui-configuration)
   - [JSON-Config Setup](#json-config-setup)
   - [Translation Management](#translation-management)
6. [Documentation](#documentation)
   - [README Updates](#readme-updates)
   - [Changelog Management](#changelog-management)
7. [CI/CD & GitHub Actions](#cicd--github-actions)
   - [Workflow Configuration](#workflow-configuration)
   - [Testing Integration](#testing-integration)
8. [Nuki-Specific Implementation Patterns](#nuki-specific-implementation-patterns)
9. [Advanced Features](#advanced-features)

---

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

**Nuki Extended Adapter Specific Context:**
This adapter provides comprehensive integration with Nuki Smart Lock systems, including:
- **Nuki Smart Lock 2.0 & 3.0**: Advanced smart lock control and monitoring
- **Nuki Opener**: Intercom door opener integration
- **Dual API Support**: Both Nuki Bridge API (local) and Nuki Web API (cloud)
- **Real-time Updates**: Callback-based state monitoring for instant lock status changes
- **Configuration Management**: Advanced lock and opener settings control
- **Multi-device Support**: Handle multiple Nuki devices from single adapter instance

Key integration features:
- Bridge discovery and automatic configuration
- Encrypted communication with hardware bridges
- User management and access control synchronization
- Battery monitoring and maintenance notifications
- Action logging and state history
- Callback URL management for real-time updates

---

## Code Quality & Standards

### Code Style Guidelines

- Follow JavaScript/TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper resource cleanup in `unload()` method
- Use semantic versioning for adapter releases
- Include proper JSDoc comments for public methods

**Timer and Resource Cleanup Example:**
```javascript
private connectionTimer?: NodeJS.Timeout;

async onReady() {
  this.connectionTimer = setInterval(() => this.checkConnection(), 30000);
}

onUnload(callback) {
  try {
    if (this.connectionTimer) {
      clearInterval(this.connectionTimer);
      this.connectionTimer = undefined;
    }
    callback();
  } catch (e) {
    callback();
  }
}
```

### ESLint Configuration

**CRITICAL:** ESLint validation must run FIRST in your CI/CD pipeline, before any other tests. This "lint-first" approach catches code quality issues early.

#### Setup
```bash
npm install --save-dev eslint @iobroker/eslint-config
```

#### Configuration (.eslintrc.json)
```json
{
  "extends": "@iobroker/eslint-config",
  "rules": {
    // Add project-specific rule overrides here if needed
  }
}
```

#### Package.json Scripts
```json
{
  "scripts": {
    "lint": "eslint --max-warnings 0 .",
    "lint:fix": "eslint . --fix"
  }
}
```

#### Best Practices
1. ✅ Run ESLint before committing — fix ALL warnings, not just errors
2. ✅ Use `lint:fix` for auto-fixable issues
3. ✅ Don't disable rules without documentation
4. ✅ Lint all relevant files (main code, tests, build scripts)
5. ✅ Keep `@iobroker/eslint-config` up to date
6. ✅ **ESLint warnings are treated as errors in CI** (`--max-warnings 0`). The `lint` script above already includes this flag — run `npm run lint` to match CI behavior locally

#### Common Issues
- **Unused variables**: Remove or prefix with underscore (`_variable`)
- **Missing semicolons**: Run `npm run lint:fix`
- **Indentation**: Use 4 spaces (ioBroker standard)
- **console.log**: Replace with `adapter.log.debug()` or remove

---

## Testing

### Unit Testing

- Use Jest as the primary testing framework
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files

**Example Structure:**
```javascript
describe('AdapterName', () => {
  let adapter;
  
  beforeEach(() => {
    // Setup test adapter instance
  });
  
  test('should initialize correctly', () => {
    // Test adapter initialization
  });
});
```

### Integration Testing

**CRITICAL:** Use the official `@iobroker/testing` framework. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation:** https://github.com/ioBroker/testing

#### Framework Structure

**✅ Correct Pattern:**
```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with specific configuration', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should configure and start adapter', function () {
                return new Promise(async (resolve, reject) => {
                    try {
                        // Get adapter object
                        const obj = await new Promise((res, rej) => {
                            harness.objects.getObject('system.adapter.your-adapter.0', (err, o) => {
                                if (err) return rej(err);
                                res(o);
                            });
                        });
                        
                        if (!obj) return reject(new Error('Adapter object not found'));

                        // Configure adapter
                        Object.assign(obj.native, {
                            position: '52.520008,13.404954',
                            createHourly: true,
                        });

                        harness.objects.setObject(obj._id, obj);
                        
                        // Start and wait
                        await harness.startAdapterAndWait();
                        await new Promise(resolve => setTimeout(resolve, 15000));

                        // Verify states
                        const stateIds = await harness.dbConnection.getStateIDs('your-adapter.0.*');
                        
                        if (stateIds.length > 0) {
                            console.log('✅ Adapter successfully created states');
                            await harness.stopAdapter();
                            resolve(true);
                        } else {
                            reject(new Error('Adapter did not create any states'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }).timeout(40000);
        });
    }
});
```

#### Testing Success AND Failure Scenarios

**IMPORTANT:** For every "it works" test, implement corresponding "it fails gracefully" tests.

**Failure Scenario Example:**
```javascript
it('should NOT create daily states when daily is disabled', function () {
    return new Promise(async (resolve, reject) => {
        try {
            harness = getHarness();
            const obj = await new Promise((res, rej) => {
                harness.objects.getObject('system.adapter.your-adapter.0', (err, o) => {
                    if (err) return rej(err);
                    res(o);
                });
            });
            
            if (!obj) return reject(new Error('Adapter object not found'));

            Object.assign(obj.native, {
                createDaily: false, // Daily disabled
            });

            await new Promise((res, rej) => {
                harness.objects.setObject(obj._id, obj, (err) => {
                    if (err) return rej(err);
                    res(undefined);
                });
            });

            await harness.startAdapterAndWait();
            await new Promise((res) => setTimeout(res, 20000));

            const stateIds = await harness.dbConnection.getStateIDs('your-adapter.0.*');
            const dailyStates = stateIds.filter((key) => key.includes('daily'));
            
            if (dailyStates.length === 0) {
                console.log('✅ No daily states found as expected');
                resolve(true);
            } else {
                reject(new Error('Expected no daily states but found some'));
            }

            await harness.stopAdapter();
        } catch (error) {
            reject(error);
        }
    });
}).timeout(40000);
```

#### Key Rules

1. ✅ Use `@iobroker/testing` framework
2. ✅ Configure via `harness.objects.setObject()`
3. ✅ Start via `harness.startAdapterAndWait()`
4. ✅ Verify states via `harness.states.getState()`
5. ✅ Allow proper timeouts for async operations
6. ❌ NEVER test API URLs directly
7. ❌ NEVER bypass the harness system

#### Nuki-Specific Testing Patterns

For the Nuki Extended adapter, implement these specific test scenarios:

```javascript
// Test Bridge API connectivity
suite('Nuki Bridge API Integration', (getHarness) => {
    it('should discover and connect to Nuki bridges', async function() {
        const harness = getHarness();
        
        await harness.changeAdapterConfig('nuki-extended', {
            native: {
                bridges: [{
                    bridge_name: 'Test Bridge',
                    bridge_ip: '192.168.1.100',
                    bridge_token: 'test_token',
                    bridge_port: 8080
                }],
                refreshBridgeApiType: 'polling',
                refreshBridgeApi: 30
            }
        });
        
        await harness.startAdapterAndWait();
        
        const connectionState = await harness.states.getStateAsync('nuki-extended.0.info.connection');
        expect(connectionState).to.exist;
    }).timeout(60000);
});

// Test Web API functionality
suite('Nuki Web API Integration', (getHarness) => {
    it('should authenticate and sync devices via Web API', async function() {
        const harness = getHarness();
        
        await harness.changeAdapterConfig('nuki-extended', {
            native: {
                api_token: 'test_web_api_token',
                syncConfig: true,
                syncUsers: true
            }
        });
        
        await harness.startAdapterAndWait();
        
        const webApiStates = await harness.objects.getObjectViewAsync(
            'system', 'state',
            { startkey: 'nuki-extended.0.', endkey: 'nuki-extended.0.\u9999' }
        );
        
        expect(webApiStates.rows.length).to.be.above(0);
    }).timeout(90000);
});
```

**Test Configuration Requirements:**
- **Bridge API Testing**: Requires local network access to Nuki Bridge hardware
- **Web API Testing**: Requires valid Nuki Web API token for cloud testing
- **Mock Data**: Provide sample JSON responses for offline testing scenarios
- **Error Handling**: Test connection failures, invalid tokens, and timeout scenarios

#### Workflow Dependencies

Integration tests should run ONLY after lint and adapter tests pass:

```yaml
integration-tests:
  needs: [check-and-lint, adapter-tests]
  runs-on: ubuntu-22.04
```

### API Testing with Credentials

For adapters connecting to external APIs requiring authentication:

#### Password Encryption for Integration Tests

```javascript
async function encryptPassword(harness, password) {
    const systemConfig = await harness.objects.getObjectAsync("system.config");
    if (!systemConfig?.native?.secret) {
        throw new Error("Could not retrieve system secret for password encryption");
    }
    
    const secret = systemConfig.native.secret;
    let result = '';
    for (let i = 0; i < password.length; ++i) {
        result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ password.charCodeAt(i));
    }
    return result;
}
```

#### Demo Credentials Testing Pattern

- Use provider demo credentials when available (e.g., `demo@api-provider.com` / `demo`)
- Create separate test file: `test/integration-demo.js`
- Add npm script: `"test:integration-demo": "mocha test/integration-demo --exit"`
- Implement clear success/failure criteria

**Example Implementation:**
```javascript
it("Should connect to API with demo credentials", async () => {
    const encryptedPassword = await encryptPassword(harness, "demo_password");
    
    await harness.changeAdapterConfig("your-adapter", {
        native: {
            username: "demo@provider.com",
            password: encryptedPassword,
        }
    });

    await harness.startAdapter();
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    const connectionState = await harness.states.getStateAsync("your-adapter.0.info.connection");
    
    if (connectionState?.val === true) {
        console.log("✅ SUCCESS: API connection established");
        return true;
    } else {
        throw new Error("API Test Failed: Expected API connection. Check logs for API errors.");
    }
}).timeout(120000);
```

---

## Development Best Practices

### Dependency Management

- Always use `npm` for dependency management
- Use `npm ci` for installing existing dependencies (respects package-lock.json)
- Use `npm install` only when adding or updating dependencies
- Keep dependencies minimal and focused
- Only update dependencies in separate Pull Requests

**When modifying package.json:**
1. Run `npm install` to sync package-lock.json
2. Commit both package.json and package-lock.json together

**Best Practices:**
- Prefer built-in Node.js modules when possible
- Use `@iobroker/adapter-core` for adapter base functionality
- Avoid deprecated packages
- Document specific version requirements

### HTTP Client Libraries

- **Preferred:** Use native `fetch` API (Node.js 20+ required)
- **Avoid:** `axios` unless specific features are required

**Example with fetch:**
```javascript
try {
  const response = await fetch('https://api.example.com/data');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
} catch (error) {
  this.log.error(`API request failed: ${error.message}`);
}
```

**Other Recommendations:**
- **Logging:** Use adapter built-in logging (`this.log.*`)
- **Scheduling:** Use adapter built-in timers and intervals
- **File operations:** Use Node.js `fs/promises`
- **Configuration:** Use adapter config system

### Error Handling

- Always catch and log errors appropriately
- Use adapter log levels (error, warn, info, debug)
- Provide meaningful, user-friendly error messages
- Handle network failures gracefully
- Implement retry mechanisms where appropriate
- Always clean up timers, intervals, and resources in `unload()` method

**Example:**
```javascript
try {
  await this.connectToDevice();
} catch (error) {
  this.log.error(`Failed to connect to device: ${error.message}`);
  this.setState('info.connection', false, true);
  // Implement retry logic if needed
}
```

---

## Admin UI Configuration

### JSON-Config Setup

Use JSON-Config format for modern ioBroker admin interfaces.

**Example Structure:**
```json
{
  "type": "panel",
  "items": {
    "host": {
      "type": "text",
      "label": "Host address",
      "help": "IP address or hostname of the device"
    }
  }
}
```

**Guidelines:**
- ✅ Use consistent naming conventions
- ✅ Provide sensible default values
- ✅ Include validation for required fields
- ✅ Add tooltips for complex options
- ✅ Ensure translations for all supported languages (minimum English and German)
- ✅ Write end-user friendly labels, avoid technical jargon

### Translation Management

**CRITICAL:** Translation files must stay synchronized with `admin/jsonConfig.json`. Orphaned keys or missing translations cause UI issues and PR review delays.

#### Overview
- **Location:** `admin/i18n/{lang}/translations.json` for 11 languages (de, en, es, fr, it, nl, pl, pt, ru, uk, zh-cn)
- **Source of truth:** `admin/jsonConfig.json` - all `label` and `help` properties must have translations
- **Command:** `npm run translate` - auto-generates translations but does NOT remove orphaned keys

#### Critical Rules
1. ✅ Keys must match exactly with jsonConfig.json
2. ✅ No orphaned keys in translation files
3. ✅ All translations must be in native language (no English fallbacks)
4. ✅ Keys must be sorted alphabetically

#### Workflow for Translation Updates

**When modifying admin/jsonConfig.json:**

1. Make your changes to labels/help texts
2. Run automatic translation: `npm run translate`
3. Run validation: `node scripts/validate-translations.js` (create this script if it doesn't exist)
4. Remove orphaned keys manually from all translation files
5. Run: `npm run lint && npm run test`

#### Translation Checklist

Before committing changes to admin UI or translations:
1. ✅ Validation script shows "All keys match!" for all 11 languages
2. ✅ No orphaned keys in any translation file
3. ✅ All translations in native language
4. ✅ Keys alphabetically sorted
5. ✅ `npm run lint` passes
6. ✅ `npm run test` passes

---

## Documentation

### README Updates

#### Required Sections
1. **Installation** - Clear npm/ioBroker admin installation steps
2. **Configuration** - Detailed configuration options with examples
3. **Usage** - Practical examples and use cases
4. **Changelog** - Version history (use "## **WORK IN PROGRESS**" for ongoing changes)
5. **License** - License information (typically MIT for ioBroker adapters)
6. **Support** - Links to issues, discussions, community support

#### Documentation Standards
- Use clear, concise language
- Include code examples for configuration
- Add screenshots for admin interface when applicable
- Maintain multilingual support (minimum English and German)
- Always reference issues in commits and PRs (e.g., "fixes #xx")

#### Mandatory README Updates for PRs

For **every PR or new feature**, always add a user-friendly entry to README.md:

- Add entries under `## **WORK IN PROGRESS**` section
- Use format: `* (author) **TYPE**: Description of user-visible change`
- Types: **NEW** (features), **FIXED** (bugs), **ENHANCED** (improvements), **TESTING** (test additions), **CI/CD** (automation)
- Focus on user impact, not technical details

**Example:**
```markdown
## **WORK IN PROGRESS**

* (DutchmanNL) **FIXED**: Adapter now properly validates login credentials (fixes #25)
* (DutchmanNL) **NEW**: Added device discovery to simplify initial setup
```

### Changelog Management

Follow the [AlCalzone release-script](https://github.com/AlCalzone/release-script) standard.

#### Format Requirements

```markdown
# Changelog

<!--
  Placeholder for the next version (at the beginning of the line):
  ## **WORK IN PROGRESS**
-->

## **WORK IN PROGRESS**

- (author) **NEW**: Added new feature X
- (author) **FIXED**: Fixed bug Y (fixes #25)

## v0.1.0 (2023-01-01)
Initial release
```

#### Workflow Process
- **During Development:** All changes go under `## **WORK IN PROGRESS**`
- **For Every PR:** Add user-facing changes to WORK IN PROGRESS section
- **Before Merge:** Version number and date added when merging to main
- **Release Process:** Release-script automatically converts placeholder to actual version

#### Change Entry Format
- Format: `- (author) **TYPE**: User-friendly description`
- Types: **NEW**, **FIXED**, **ENHANCED**
- Focus on user impact, not technical implementation
- Reference issues: "fixes #XX" or "solves #XX"

---

## CI/CD & GitHub Actions

### Workflow Configuration

#### GitHub Actions Best Practices

**Must use ioBroker official testing actions:**
- `ioBroker/testing-action-check@v1` for lint and package validation
- `ioBroker/testing-action-adapter@v1` for adapter tests
- `ioBroker/testing-action-deploy@v1` for automated releases with Trusted Publishing (OIDC)

**Configuration:**
- **Node.js versions:** Test on 20.x, 22.x, 24.x
- **Platform:** Use ubuntu-22.04
- **Automated releases:** Deploy to npm on version tags (requires NPM Trusted Publishing)
- **Monitoring:** Include Sentry release tracking for error monitoring

#### Critical: Lint-First Validation Workflow

**ALWAYS run ESLint checks BEFORE other tests.** Benefits:
- Catches code quality issues immediately
- Prevents wasting CI resources on tests that would fail due to linting errors
- Provides faster feedback to developers
- Enforces consistent code quality

**Workflow Dependency Configuration:**
```yaml
jobs:
  check-and-lint:
    # Runs ESLint and package validation
    # Uses: ioBroker/testing-action-check@v1
    
  adapter-tests:
    needs: [check-and-lint]  # Wait for linting to pass
    # Run adapter unit tests
    
  integration-tests:
    needs: [check-and-lint, adapter-tests]  # Wait for both
    # Run integration tests
```

**Key Points:**
- The `check-and-lint` job has NO dependencies - runs first
- ALL other test jobs MUST list `check-and-lint` in their `needs` array
- If linting fails, no other tests run, saving time
- Fix all ESLint errors before proceeding

### Testing Integration

#### API Testing in CI/CD

For adapters with external API dependencies:

```yaml
demo-api-tests:
  if: contains(github.event.head_commit.message, '[skip ci]') == false
  runs-on: ubuntu-22.04
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run demo API tests
      run: npm run test:integration-demo
```

#### Testing Best Practices
- Run credential tests separately from main test suite
- Don't make credential tests required for deployment
- Provide clear failure messages for API issues
- Use appropriate timeouts for external calls (120+ seconds)

#### Package.json Integration
```json
{
  "scripts": {
    "test:integration-demo": "mocha test/integration-demo --exit"
  }
}
```

---

## Nuki-Specific Implementation Patterns

#### Bridge API Integration
```javascript
// Initialize Nuki Bridge connection
const nukiBridge = require('nuki-bridge-api');

async function initializeBridge(bridgeConfig) {
    try {
        const bridge = new nukiBridge.Bridge(
            bridgeConfig.bridge_ip,
            bridgeConfig.bridge_port,
            bridgeConfig.bridge_token
        );
        
        // Test connection
        const info = await bridge.info();
        adapter.log.info(`Connected to bridge: ${info.bridge_name}`);
        
        return bridge;
    } catch (error) {
        adapter.log.error(`Bridge connection failed: ${error.message}`);
        throw error;
    }
}
```

#### Web API Integration  
```javascript
// Initialize Nuki Web API
const nukiWebApi = require('nuki-web-api');

async function initializeWebApi(token) {
    try {
        const webApi = new nukiWebApi.WebApi(token);
        
        // Validate token
        const smartlocks = await webApi.getSmartlocks();
        adapter.log.info(`Web API connected, found ${smartlocks.length} devices`);
        
        return webApi;
    } catch (error) {
        adapter.log.error(`Web API authentication failed: ${error.message}`);
        throw error;
    }
}
```

#### State Management for Nuki Devices
```javascript
// Create device states following ioBroker conventions
async function createDeviceStates(device) {
    const deviceId = device.smartlockId || device.nukiId;
    const devicePath = `${adapter.namespace}.${deviceId}`;
    
    // Create device object
    await adapter.setObjectNotExistsAsync(devicePath, {
        type: 'device',
        common: {
            name: device.name || 'Nuki Device',
            type: device.type === 2 ? 'opener' : 'smartlock'
        },
        native: {
            smartlockId: deviceId,
            type: device.type
        }
    });
    
    // Create state objects with proper types and roles
    await adapter.setObjectNotExistsAsync(`${devicePath}.state`, {
        type: 'state',
        common: {
            name: 'Lock State',
            type: 'number',
            role: 'value.lock',
            read: true,
            write: false,
            states: {
                0: 'uncalibrated',
                1: 'locked',
                2: 'unlocking',
                3: 'unlocked',
                4: 'locking',
                5: 'unlatched',
                6: 'unlocked (lock n go)',
                7: 'unlatching',
                254: 'motor blocked',
                255: 'undefined'
            }
        },
        native: {}
    });
}
```

### Callback Management
```javascript
// Handle Bridge API callbacks for real-time updates
function setupCallbackServer(callbackPort) {
    const express = require('express');
    const bodyParser = require('body-parser');
    
    const app = express();
    app.use(bodyParser.json());
    
    app.post('/nuki-api-bridge', (req, res) => {
        try {
            const data = req.body;
            adapter.log.debug(`Callback received: ${JSON.stringify(data)}`);
            
            // Process callback data
            processCallbackData(data);
            
            res.status(200).send('OK');
        } catch (error) {
            adapter.log.error(`Callback processing failed: ${error.message}`);
            res.status(500).send('Error');
        }
    });
    
    app.listen(callbackPort, () => {
        adapter.log.info(`Callback server listening on port ${callbackPort}`);
    });
}
```

### Configuration Validation
```javascript
// Validate adapter configuration before starting
function validateConfiguration(config) {
    const errors = [];
    
    // Check Bridge API configuration
    if (config.bridges && config.bridges.length > 0) {
        config.bridges.forEach((bridge, index) => {
            if (!bridge.bridge_ip) {
                errors.push(`Bridge ${index + 1}: IP address is required`);
            }
            if (!bridge.bridge_token) {
                errors.push(`Bridge ${index + 1}: Token is required`);
            }
            if (!bridge.bridge_port || bridge.bridge_port < 1 || bridge.bridge_port > 65535) {
                errors.push(`Bridge ${index + 1}: Valid port number is required`);
            }
        });
    }
    
    // Check Web API configuration
    if (config.api_token && config.api_token.length < 10) {
        errors.push('Web API token appears to be invalid (too short)');
    }
    
    // Check callback configuration
    if (config.refreshBridgeApiType === 'callback') {
        if (!config.callbackPort || config.callbackPort < 1024 || config.callbackPort > 65535) {
            errors.push('Valid callback port is required for callback mode');
        }
    }
    
    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
}
```

### Logging Best Practices
- Use appropriate log levels: `debug` for detailed info, `info` for important events, `warn` for non-critical issues, `error` for failures
- Log all API calls with request/response details in debug mode
- Include context information in error messages (device ID, action, etc.)
- Use structured logging for complex data objects

---

## Advanced Features

### Device Discovery and Auto-Configuration
```javascript
// Automatic bridge discovery
async function discoverBridges() {
    try {
        const nukiBridge = require('nuki-bridge-api');
        const bridges = await nukiBridge.discover();
        
        adapter.log.info(`Discovered ${bridges.length} Nuki bridges on network`);
        
        return bridges.map(bridge => ({
            bridge_name: bridge.name,
            bridge_ip: bridge.ip,
            bridge_port: bridge.port || 8080,
            bridge_id: bridge.serverId
        }));
    } catch (error) {
        adapter.log.error(`Bridge discovery failed: ${error.message}`);
        return [];
    }
}
```

### Battery Monitoring and Alerts
```javascript
// Monitor device battery levels
async function checkBatteryLevels(devices) {
    devices.forEach(async (device) => {
        if (device.state && device.state.batteryCharging !== undefined) {
            const batteryLevel = device.state.batteryCharging ? 100 : device.state.batteryLevel;
            
            await adapter.setStateAsync(`${device.smartlockId}.battery`, {
                val: batteryLevel,
                ack: true
            });
            
            // Alert on low battery
            if (batteryLevel < 20 && !device.state.batteryCharging) {
                adapter.log.warn(`Low battery warning for device ${device.name}: ${batteryLevel}%`);
                
                await adapter.setStateAsync(`${device.smartlockId}.batteryWarning`, {
                    val: true,
                    ack: true
                });
            }
        }
    });
}
```

### Advanced Logging and Diagnostics
```javascript
// Comprehensive device diagnostics
async function runDeviceDiagnostics(deviceId) {
    try {
        const device = await webApi.getSmartlock(deviceId);
        const bridgeDevice = await bridge.list().find(d => d.nukiId === deviceId);
        
        const diagnostics = {
            webApi: {
                online: !!device,
                lastSeen: device?.lastKnownState?.timestamp,
                batteryLevel: device?.state?.batteryCharging ? 100 : device?.state?.batteryLevel,
                firmwareVersion: device?.config?.firmwareVersion
            },
            bridge: {
                online: !!bridgeDevice,
                lastAction: bridgeDevice?.lastKnownState?.timestamp,
                rssi: bridgeDevice?.state?.rssi,
                connectionState: bridgeDevice?.state?.connectionState
            }
        };
        
        adapter.log.info(`Device ${deviceId} diagnostics: ${JSON.stringify(diagnostics, null, 2)}`);
        
        return diagnostics;
    } catch (error) {
        adapter.log.error(`Diagnostics failed for device ${deviceId}: ${error.message}`);
        return null;
    }
}
```
