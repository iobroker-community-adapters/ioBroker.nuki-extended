var Bridge = require('./lib/bridge');
var DiscoveredBridge = require('./lib/bridge-discovery');
var lockAction = require('./lib/lock-action');
var lockState = require('./lib/lock-state');

module.exports = {
  Bridge: Bridge,
  DiscoveredBridge: DiscoveredBridge,
  lockAction: lockAction,
  lockState: lockState
};
