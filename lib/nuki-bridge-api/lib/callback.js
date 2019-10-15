var request = require('request-promise');
var urlParse = require('url-parse');
var express = require('express');
var bodyParser = require('body-parser');

var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * The constructor for callbacks via bridge or nuki.
 *
 * If called from nuki it will emit on it and check the battery level,
 * otherwise (called from bridge) it will only emit on itself (for every nuki connected to bridge).
 *
 * @class Callback
 * @param {Bridge}    connection        the bridge
 * @param {Number}    callbackId        the id of the callback
 * @param {Number}    callbackUrl       the url of the callback
 * @param {Nuki}      [nuki]            the nuki
 * @constructor
 */
var Callback = function Callback (connection, callbackId, callbackUrl, nuki) {
  EventEmitter.call(this);

  this.connection = connection;
  this.nuki = nuki;
  this.callbackId = callbackId;
  this.url = callbackUrl;
};

util.inherits(Callback, EventEmitter);

/**
 * This function requests an action.
 *
 * @param {String}    action					the name of the action
 * @param {Boolean}	  [forcePlainToken=false]	force to use plain instead of hashed token
 * @returns {Promise<Object>}
 * @private
 */
Callback.prototype._request = function _request (action, forcePlainToken) {
	
	var self = this;
	return new Promise(resolve =>
	{
		self.connection.delayer = self.connection.delayer
			.then(() =>
			{
				var url = 'http://' + self.connection.ip + ':' + self.connection.port + '/callback/' + action + '?id=' + self.callbackId;

				var tokenParams = self.connection._getTokenParams(forcePlainToken || false);
				Object.keys(tokenParams).forEach(key => url += '&' + key + '=' + tokenParams[key]);

				var req = request({
					uri: url,
					json: true,
				});

				resolve(req); // Resolve returned promise without delay

				return req;
			})
			.catch(function ignoreErrorsForNextRequest () {})
			.delay(self.connection.delayBetweenRequests);
	});
};

/**
 * This function removes the callback.
 * If there is a listener from us, we close that too.
 *
 * @returns {Promise}
 */
Callback.prototype.remove = function remove () {
  var self = this;

  return this
    ._request('remove')
    .then(function checkSuccess (response) {
      if (!response.success) {
        throw response;
      }

      if (self.app) {
        self.app.close();
      }
    });
};

/**
 * This function returns the ID of the callback;
 *
 * @returns {Number}
 */
Callback.prototype.getCallbackId = function getCallbackId () {
  return this.callbackId;
};

/**
 * This function returns the url of the callback;
 *
 * @returns {String}
 */
Callback.prototype.getUrl = function getUrl () {
  return this.url;
};

/**
 * This function starts a listener on the specific host and port.
 */
Callback.prototype.startListen = function startListen () {
  var self = this;
  var parsedUrl = urlParse(this.url, true);
  var port = parsedUrl.port || 80;
  var hostname = parsedUrl.hostname;
  var path = parsedUrl.pathname;

  var app = express();

  app.use(bodyParser.json());

  app.post(path, function processCallbackResponse (response) {
    var body = response.body;

    if (body) {
      self.emit(body.state, body);
      self.emit('action', body.state, body);

      if (self.nuki && self.nuki.nukiId === body.nukiId) {
        self.nuki._checkBatteryCritical(body);

        self.nuki.emit(body.state, body);
        self.nuki.emit('action', body.state, body);
      }
    }
  });

  this.app = app.listen(port, hostname);
};

module.exports = Callback;
