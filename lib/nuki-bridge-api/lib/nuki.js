var request = require('request-promise');
var Callback = require('./callback');
var Promise = require('bluebird');

var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * The event `batteryCritical` will be emitted, if it is represent in any response.
 *
 * @event Nuki#batteryCritical
 */

/**
 * The constructor for nuki commands.
 *
 * @class Nuki
 * @param {Bridge}    connection      the bridge connection
 * @param {Number}    nukiId          the id of the nuki
 * @param {Number}    [deviceType=0]  the type of the nuki (0 = smartlock, 1 = box, 2 = opener) [@see https://developer.nuki.io/page/nuki-bridge-http-api-190/4#heading--device-types]
 * @constructor
 */
var Nuki = function Nuki (connection, nukiId, deviceType) {
  EventEmitter.call(this);

  this.connection = connection;
  this.nukiId = nukiId;
  this.deviceType = deviceType || 0;
};

util.inherits(Nuki, EventEmitter);

/**
 * This function requests an action.
 *
 * @param {String}    action                    the name of the action
 * @param {String}    [parameterAction]         the get parameter action
 * @param {String}    [additionalParameter]     additional get parameters
 * @param {Boolean}	  [forcePlainToken=false]	force to use plain instead of hashed token
 * @returns {Promise<Object>}
 * @private
 */
Nuki.prototype._request = function _request (action, parameterAction, additionalParameter, forcePlainToken) {
	
	return new Promise(resolve =>
	{
		this.connection.delayer = this.connection.delayer
			.then(() =>
			{
				var url = 'http://' + this.connection.ip + ':' + this.connection.port + '/' + action + '?nukiId=' + this.nukiId + '&deviceType=' + this.deviceType;

				var tokenParams = this.connection._getTokenParams(this.connection.forcePlainToken || forcePlainToken || false);
				Object.keys(tokenParams).forEach(key => url += '&' + key + '=' + tokenParams[key]);

				if (parameterAction)
					url += '&action=' + parameterAction;

				if (additionalParameter)
					url += additionalParameter;

				var req = request({
					uri: url,
					json: true,
				});

				resolve(req); // Resolve returned promise without delay

				return req;
			})
			.catch(function ignoreErrorsForNextRequest () {})
			.delay(this.connection.delayBetweenRequests);
	});
};

/**
 * This function checks if the `batteryCritical` flag is present and emits.
 *
 * @emits Nuki#batteryCritical
 * @param {Object}    response      the response to check
 * @private
 */
Nuki.prototype._checkBatteryCritical = function _checkBatteryCritical (response) {
  if (response.batteryCritical || (response.lastKnownState && response.lastKnownState.batteryCritical)) {
    this.emit('batteryCritical');
  }
};

/**
 * This function returns the lock-state of the Nuki.
 *
 * @returns {Promise<LockState>}
 */
Nuki.prototype.lockState = function lockState () {
  var self = this;

  return this
    ._request('lockState')
    .then(function processLockState (response) {
      self._checkBatteryCritical(response);

      if (response.success === true || response.success === "true") {
        return response.state;
      }

      throw response;
    });
};

/**
 * This function requests a lock-action.
 *
 * @param {LockAction}    action            the action to request
 * @param {Boolean}       [noWait=false]    if true, this function does not wait for the lock action to complete
 * @returns {Promise<Boolean>}
 */
Nuki.prototype.lockAction = function lockAction (action, noWait) {
  var self = this;

  return this
    ._request('lockAction', action, '&noWait=' + (noWait ? 1 : 0))
    .then(function processLockState (response) {
      self._checkBatteryCritical(response);

      return response.success;
    });
};

/**
 * This function returns all callbacks.
 *
 * @param {Boolean}   urlsOnly
 * @returns {Promise<Callback[]>}
 */
Nuki.prototype.getCallbacks = function getCallbacks (urlsOnly) {
  var self = this;

  return this
    ._request('callback/list')
    .then(function processCallbacks (response) {
      if (Array.isArray(response.callbacks)) {
        return urlsOnly === true ? response.callbacks : response.callbacks.map(function processCallback (callback) {
          return new Callback(self.connection, callback.id, callback.url, self);
        });
      }

      throw response;
    });
};

/**
 * This function adds an callback.
 *
 * @param {String}      hostname        the hostname of the current connection
 * @param {Number}      port            the port we want to send
 * @param {Boolean}     [listen=false]  if true, we open a web server to listen for the callbacks
 * @param {String}      [path]          if given, this path is used for the callback
 * @returns {Promise}
 */
Nuki.prototype.addCallback = function addCallback (hostname, port, listen, path) {
  var self = this;
  var url = 'http://' + hostname + ':' + port + '/' + (path || 'nuki-api-bridge');

  return this
    ._request('callback/add', null, '&url=' + url)
    .then(function checkResponse (response) {
      if (response.success) {
        return self
            .getCallbacks(true)
            .then(callbacks => {
              var callback = callbacks.find(callback => callback.url === url);
              if (callback)
                return new Callback(self.connection, callback.id, callback.url, self);

            throw new Error(JSON.stringify(response));
          }).tap(function checkIfWeShouldListen (callback) {
            if (listen) {
              return callback.startListen();
            }
          });
      }
    });
};

module.exports = Nuki;
