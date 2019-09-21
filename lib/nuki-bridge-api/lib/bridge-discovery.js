var request = require('request-promise');
var Bridge = require('./bridge');
var Promise = require('bluebird');

/**
 * The constructor for a discovered bridge. Authentication is not done yet ({@see DiscoveredBridge.connect}).
 *
 * @class DiscoveredBridge
 * @param {String}    ip        the ip of the bridge
 * @param {String}    port      the port of the bridge
 * @returns {DiscoveredBridge}
 * @constructor
 */
var DiscoveredBridge = function DiscoveredBridge (ip, port) {
  if (!(this instanceof DiscoveredBridge)) {
    return new DiscoveredBridge(ip, port);
  }

  this.ip = ip;
  this.port = port;
};

/**
 * Connects to a discovered bridge.
 * If you call without token, you will have to push the button on the bridge to gain access.
 *
 * @param {String}    [token]     if given, will use this one instead of requesting auth
 * @returns {Promise<Bridge>}
 */
DiscoveredBridge.prototype.connect = function connect (token) {
  const self = this;

  if (token) {
    return Promise.resolve(new Bridge(this.ip, this.port, token));
  }

  return this
      ._request('auth')
      .then(function getToken (response) {
        if (response.success) {
          return new Bridge(self.ip, self.port, response.token);
        }

        throw new Error('connect to discovered bridge not successful: ' + JSON.stringify(response));
      });
};

/**
 * This function requests an action.
 *
 * @param {String}    action                    the name of the action
 * @param {String}    [additionalParameter]     additional get parameters
 * @returns {Promise<Object>}
 * @private
 */
DiscoveredBridge.prototype._request = function _request (action, additionalParameter) {
  var url = 'http://' + this.ip + ':' + this.port + '/' + action;

  if (additionalParameter) {
    url += additionalParameter;
  }

  return request({
    uri: url,
    json: true
  });
};

/**
 * Discovers the bridges.
 *
 * @returns {Promise<DiscoveredBridge[]>}
 */
DiscoveredBridge.discover = function discover () {
  if (DiscoveredBridge.testMode) {
    return Promise.resolve([new DiscoveredBridge('127.0.0.1', 8881)]);
  }

  return request({
    uri: 'https://api.nuki.io/discover/bridges',
    json: true
  }).then(function processBridges (response) {
    return response.bridges.map(function processBridge (bridge) {
      return new DiscoveredBridge(bridge.ip, bridge.port);
    });
  });
};

/**
 * Enables the test mode, which means, discovery only finds one bridge (can be used with nukiio-dummy-bridge)
 * and connect does not call the auth endpoint but uses a hardcoded token.
 */
DiscoveredBridge.enableTestMode = function enableTestMode () {
  DiscoveredBridge.testMode = true;
};

module.exports = DiscoveredBridge;
