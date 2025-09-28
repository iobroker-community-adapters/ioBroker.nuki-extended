# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

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

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
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

**IMPORTANT**: Use the official `@iobroker/testing` framework for all integration tests. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation**: https://github.com/ioBroker/testing

#### Framework Structure
Integration tests MUST follow this exact pattern:

```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

// Define test coordinates or configuration
const TEST_COORDINATES = '52.520008,13.404954'; // Berlin
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Use tests.integration() with defineAdditionalTests
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
                        harness = getHarness();
                        
                        // Get adapter object using promisified pattern
                        const obj = await new Promise((res, rej) => {
                            harness.objects.getObject('system.adapter.your-adapter.0', (err, o) => {
                                if (err) return rej(err);
                                res(o);
                            });
                        });
                        
                        if (!obj) {
                            return reject(new Error('Adapter object not found'));
                        }

                        // Configure adapter properties
                        Object.assign(obj.native, {
                            position: TEST_COORDINATES,
                            createCurrently: true,
                            createHourly: true,
                            createDaily: true,
                            // Add other configuration as needed
                        });

                        // Set the updated configuration
                        harness.objects.setObject(obj._id, obj);

                        console.log('✅ Step 1: Configuration written, starting adapter...');
                        
                        // Start adapter and wait
                        await harness.startAdapterAndWait();
                        
                        console.log('✅ Step 2: Adapter started');

                        // Wait for adapter to process data
                        const waitMs = 15000;
                        await wait(waitMs);

                        console.log('🔍 Step 3: Checking states after adapter run...');
                        
                        // Check if essential states were created
                        const states = await harness.objects.getObjectViewAsync(
                            'system', 'state', 
                            { startkey: 'your-adapter.0.', endkey: 'your-adapter.0.\u9999' }
                        );

                        const stateCount = states.rows.length;
                        console.log(`📊 Found ${stateCount} states created by adapter`);

                        if (stateCount < 5) {
                            return reject(new Error(`Expected at least 5 states, but found ${stateCount}. Check API connectivity and configuration.`));
                        }

                        console.log('✅ Integration test completed successfully');
                        resolve();
                        
                    } catch (error) {
                        console.error(`❌ Integration test failed: ${error.message}`);
                        reject(error);
                    }
                });
            }).timeout(120000); // 2 minutes timeout for integration tests
        });
    }
});
```

#### Nuki-Specific Testing Patterns

For the Nuki Extended adapter, implement these specific test scenarios:

```javascript
// Test Bridge API connectivity
suite('Nuki Bridge API Integration', (getHarness) => {
    it('should discover and connect to Nuki bridges', async function() {
        const harness = getHarness();
        
        // Configure with bridge settings
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
        
        // Verify bridge connection state
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
        
        // Check if Web API states were created
        const webApiStates = await harness.objects.getObjectViewAsync(
            'system', 'state',
            { startkey: 'nuki-extended.0.', endkey: 'nuki-extended.0.\u9999' }
        );
        
        expect(webApiStates.rows.length).to.be.above(0);
    }).timeout(90000);
});
```

### Test Configuration Requirements
- **Bridge API Testing**: Requires local network access to Nuki Bridge hardware
- **Web API Testing**: Requires valid Nuki Web API token for cloud testing
- **Mock Data**: Provide sample JSON responses for offline testing scenarios
- **Error Handling**: Test connection failures, invalid tokens, and timeout scenarios

## ioBroker Development Guidelines

### Core Adapter Structure
- Follow the standard ioBroker adapter template structure
- Use `@iobroker/adapter-core` as the base class
- Implement proper state management with `adapter.setState()` 
- Use semantic object IDs following ioBroker conventions

### Nuki-Specific Implementation Patterns

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

### Error Handling and Logging
```javascript
// Implement comprehensive error handling
async function handleApiRequest(requestFunc, context) {
    try {
        return await requestFunc();
    } catch (error) {
        // Log detailed error information
        adapter.log.error(`${context} failed: ${error.message}`);
        
        // Handle specific error types
        if (error.code === 'ENOTFOUND') {
            adapter.log.error('Network error - check bridge IP address');
        } else if (error.status === 401) {
            adapter.log.error('Authentication failed - check API token');
        } else if (error.status === 403) {
            adapter.log.error('Access denied - check token permissions');
        }
        
        // Set connection state to false on error
        adapter.setState('info.connection', false, true);
        throw error;
    }
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

### Resource Management
```javascript
// Proper cleanup in unload method
adapter.on('unload', (callback) => {
    try {
        // Clear all timers
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
        
        // Close HTTP server
        if (this.callbackServer) {
            this.callbackServer.close();
            this.callbackServer = null;
        }
        
        // Clear Bridge connections
        if (this.bridges) {
            Object.values(this.bridges).forEach(bridge => {
                if (bridge.cleanup) bridge.cleanup();
            });
        }
        
        adapter.log.info('Adapter stopped cleanly');
        callback();
    } catch (error) {
        adapter.log.error(`Error during cleanup: ${error.message}`);
        callback();
    }
});
```

## Code Style and Standards

- Follow JavaScript/TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper resource cleanup in `unload()` method
- Use semantic versioning for adapter releases
- Include proper JSDoc comments for public methods

## CI/CD and Testing Integration

### GitHub Actions for API Testing
For adapters with external API dependencies, implement separate CI/CD jobs:

```yaml
# Tests API connectivity with demo credentials (runs separately)
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

### CI/CD Best Practices
- Run credential tests separately from main test suite
- Use ubuntu-22.04 for consistency
- Don't make credential tests required for deployment
- Provide clear failure messages for API connectivity issues
- Use appropriate timeouts for external API calls (120+ seconds)

### Package.json Script Integration
Add dedicated script for credential testing:
```json
{
  "scripts": {
    "test:integration-demo": "mocha test/integration-demo --exit"
  }
}
```

### Practical Example: Complete API Testing Implementation
Here's a complete example based on lessons learned from the Discovergy adapter:

#### test/integration-demo.js
```javascript
const path = require("path");
const { tests } = require("@iobroker/testing");

// Helper function to encrypt password using ioBroker's encryption method
async function encryptPassword(harness, password) {
    const systemConfig = await harness.objects.getObjectAsync("system.config");
    
    if (!systemConfig || !systemConfig.native || !systemConfig.native.secret) {
        throw new Error("Could not retrieve system secret for password encryption");
    }
    
    const secret = systemConfig.native.secret;
    let result = '';
    for (let i = 0; i < password.length; ++i) {
        result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ password.charCodeAt(i));
    }
    
    return result;
}

// Run integration tests with demo credentials
tests.integration(path.join(__dirname, ".."), {
    defineAdditionalTests({ suite }) {
        suite("API Testing with Demo Credentials", (getHarness) => {
            let harness;
            
            before(() => {
                harness = getHarness();
            });

            it("Should connect to API and initialize with demo credentials", async () => {
                console.log("Setting up demo credentials...");
                
                if (harness.isAdapterRunning()) {
                    await harness.stopAdapter();
                }
                
                const encryptedPassword = await encryptPassword(harness, "demo_password");
                
                await harness.changeAdapterConfig("your-adapter", {
                    native: {
                        username: "demo@provider.com",
                        password: encryptedPassword,
                        // other config options
                    }
                });

                console.log("Starting adapter with demo credentials...");
                await harness.startAdapter();
                
                // Wait for API calls and initialization
                await new Promise(resolve => setTimeout(resolve, 60000));
                
                const connectionState = await harness.states.getStateAsync("your-adapter.0.info.connection");
                
                if (connectionState && connectionState.val === true) {
                    console.log("✅ SUCCESS: API connection established");
                    return true;
                } else {
                    throw new Error("API Test Failed: Expected API connection to be established with demo credentials. " +
                        "Check logs above for specific API errors (DNS resolution, 401 Unauthorized, network issues, etc.)");
                }
            }).timeout(120000);
        });
    }
});
```

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