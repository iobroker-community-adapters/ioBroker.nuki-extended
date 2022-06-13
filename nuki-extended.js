'use strict';
const adapterName = require('./io-package.json').common.name;
const utils = require('@iobroker/adapter-core'); // Get common adapter utils

const _request = require('request-promise');
const _http = require('express')();
const _parser = require('body-parser');
const _ip = require('ip');

const Bridge = require('nuki-bridge-api');


/*
 * internal libraries
 */
const Library = require(__dirname + '/lib/library.js');
const _LOCK = require(__dirname + '/_LOCK.js');
const _OPENER = require(__dirname + '/_OPENER.js');
const _NODES = require(__dirname + '/_NODES.js');
const WebApiHandler = require("./lib/web-api");
const NukiTools = require("./lib/nuki-tools");


/*
 * constants & variables initiation
 */
const MAX_RETRY_ACTIONS = 3;

let adapter;
let library;
let unloaded;
let refreshCycleWebApi, refreshCycleBridgeApi;

let setup = [];
let BRIDGES = {};
let nukiWebApi = new WebApiHandler(), listener = false;


/*
 * ADAPTER
 *
 */
function startAdapter(options) {
	options = options || {};
	adapter = new utils.Adapter({ ...options, name: adapterName });

	/*
	 * ADAPTER READY
	 *
	 */
	adapter.on('ready', function() {
		library = new Library(adapter, { nodes: _NODES, updatesInLog: adapter.config.debugLog || false });
		unloaded = false;

		// Check Node.js Version
		let version = parseInt(process.version.substring(1, process.version.indexOf('.')));
		if (version <= 6) {
			return library.terminate('This Adapter is not compatible with your Node.js Version ' + process.version + ' (must be >= Node.js v7).', true);
		}

		// Check port
		if (!adapter.config.callbackPort) {
			adapter.config.callbackPort = 51989;
		}

		if (adapter.config.callbackPort < 10000 || adapter.config.callbackPort > 65535) {
			adapter.log.warn('The callback port (' + adapter.config.callbackPort + ') is incorrect. Provide a port between 10.000 and 65.535! Using port 51989 now.');
			adapter.config.callbackPort = 51989;
		}
		adapter.config.additionalWebApiTimeout = parseInt(adapter.config.additionalWebApiTimeout, 10) || 3;
		adapter.config.additionalWebApiCall = adapter.config.additionalWebApiCall !== undefined ? adapter.config.additionalWebApiCall : true;

		// retrieve all values from states to avoid message "Unsubscribe from all states, except system's, because over 3 seconds the number of events is over 200 (in last second 0)"
		adapter.getStates(adapterName + '.' + adapter.instance + '.*', (err, states) => {
			if (err || !states) {
				return;
			}

			for (let state in states) {
				library.setDeviceState(state.replace(adapterName + '.' + adapter.instance + '.', ''), states[state] && states[state].val);
			}

			// start
			library.set(Library.CONNECTION, true);
			initNukiAPIs();
		});
	});

	/*
	 * ADAPTER UNLOAD
	 *
	 */
	adapter.on('unload', function(callback) {
		try {
			adapter.log.info('Adapter stopped und unloaded.');
			nukiWebApi.unload();
			unloaded = true;
			if (refreshCycleBridgeApi) {
				clearTimeout(refreshCycleBridgeApi);
			}

			callback();
		}
		catch(err) {
			callback();
		}
	});

	/*
	 * STATE CHANGE
	 *
	 */
	adapter.on('stateChange', function(node, object) {
		adapter.log.debug('State of ' + node + ' has changed ' + JSON.stringify(object) + '.');

		let state = node.substring(node.lastIndexOf('.')+1);
		let action = object !== undefined && object !== null ? object.val : 0;
		let path = node.substring(0, node.lastIndexOf('.')).replace(adapterName + '.' + adapter.instance + '.', '');
		let root = path.split('.').slice(0, 2).join('.');

		// apply an action on the callback
		if (state === '_delete' && object && object.ack !== true) {
			let bridgeId = library.getDeviceState(root + '.bridgeId');
			let url = library.getDeviceState(path + '.url');

			// ID or url could not be retrived
			if (!bridgeId || !url || url === '{}') {
				adapter.log.warn('Error deleting callback: No Bridge ID or URL given!');
				return;
			}

			// delete callback
			let callbackIndex = BRIDGES[bridgeId].callbacks.findIndex(cb => cb.url === url);
			if (callbackIndex > -1) {

				BRIDGES[bridgeId].callbacks[callbackIndex].remove().then(() => {
					adapter.log.info('Deleted callback with URL ' + url + '.');

					// delete objects
					let path = BRIDGES[bridgeId].data.path + '.callbacks.' + BRIDGES[bridgeId].callbacks[callbackIndex].getCallbackId();
					library.del(path, true);

					// update callback list
					BRIDGES[bridgeId].callbacks.splice(callbackIndex, 1);
					library._setValue(BRIDGES[bridgeId].data.path + '.callbacks.list', JSON.stringify(BRIDGES[bridgeId].callbacks.map(cb => {
						return { 'id': cb.id, 'url': cb.url };
					})));
				})
					.catch(err => adapter.log.debug('Error removing callback (' + err.message + ')!'));
			}
			else {
				adapter.log.warn('Error deleting callback with URL ' + url + ': ' + (err ? err.message : 'No Callback ID given!'));
			}
		}

		// apply an action on the door
		let lockAction = Object.values(_LOCK.ACTIONS).indexOf(state.replace(/_/g, ' '));
		let openerAction = Object.values(_OPENER.ACTIONS).indexOf(state.replace(/_/g, ' '));

		if (state !== '_ACTION' && (lockAction > -1 || openerAction > -1)) {

			state = '_ACTION';
			action = lockAction > -1 ? lockAction : openerAction;
			path = path.substr(0, path.lastIndexOf('.'));
		}

		if (state === '_ACTION' && Number.isInteger(action) && action > 0 && object && object.ack !== true) {
			library._setValue(node, false, true);
			let nukiHexId = library.getDeviceState(path + '.hex');

			// ID or type could not be retrived
			if (!nukiHexId) {
				adapter.log.warn('Error triggering action via Nuki Bridge API: No Nuki Hex ID given!');
				return false;
			}

			// get smartlock
			let device = NukiTools.DEVICES[nukiHexId];
			action = { 'id': action };

			switch ((device.type && device.type.toLowerCase()) || false) {
			case 'smartlock':
				action.name = _LOCK.ACTIONS[action.id];
				break;

			case 'opener':
				action.name = _OPENER.ACTIONS[action.id];
				break;

			case 'smart door':
				action.name = _LOCK.ACTIONS[action.id];
				break;

			case 'box':
			default:
				adapter.log.warn('Error triggering action via Nuki Bridge API: Wrong Nuki type given!');
				return false;
			}

			// apply action
			setAction(device, action, (nukiWebApi.active && adapter.config.bridges.length === 0 ? 'web' : 'bridge'));
		}

		// configuration
		if ((node.indexOf('.config.') > -1 || node.indexOf('.advancedConfig.') > -1 || node.indexOf('.openerAdvancedConfig.') > -1) && nukiWebApi.active && object && object.ack !== true) {

			library.set({ node: node.replace(adapter.name + '.' + adapter.instance + '.', '') }, object.val);

			path = path.substr(0, path.lastIndexOf('.'));
			let nukiHexId = library.getDeviceState(path + '.hex');

			// ID or type could not be retrived
			if (!nukiHexId) {
				adapter.log.warn('Error triggering action via Nuki Web API: No Nuki Hex ID given!');
				return false;
			}

			// get smartlock
			let device = NukiTools.DEVICES[nukiHexId];

			// change config
			if (node.indexOf('.config.') > -1) {
				nukiWebApi.setConfig(
					device.smartlockId,
					{ ...device.config, [state]: action },
					state
				);
			}

			// change advancedConfig
			else if (node.indexOf('.advancedConfig.') > -1) {

				nukiWebApi.setAdvancedConfig(
					device.smartlockId,
					{ ...device.advancedConfig, [state]: action },
					state
				);
			}

			// change openerAdvancedConfig
			else if (node.indexOf('.openerAdvancedConfig.') > -1) {

				nukiWebApi.setAdvancedConfig(
					device.smartlockId,
					{ ...device.openerAdvancedConfig, [state]: action },
					state
				);
			}
		}
		else if (state !== '_ACTION' && state !== '_delete' && !nukiWebApi.active && object && object.ack !== true) {
			adapter.log.info('Nuki Web API needs to be configured to change configuration!');
		}
	});

	/*
	 * HANDLE MESSAGES
	 *
	 */
	adapter.on('message', function(msg) {
		adapter.log.debug('Message: ' + JSON.stringify(msg));

		switch(msg.command) {
		case 'discover':
			adapter.log.info('Discovering bridges..');

			_request({ url: 'https://api.nuki.io/discover/bridges', json: true })
				.then(res => {
					let discovered = res.bridges;
					adapter.log.info('Bridges discovered: ' + discovered.length);
					adapter.log.debug(JSON.stringify(discovered));

					library.msg(msg.from, msg.command, {result: true, bridges: discovered}, msg.callback);
				})
				.catch(err => {
					adapter.log.warn('Error while discovering bridges: ' + err.message);
					library.msg(msg.from, msg.command, {result: false, error: err.message}, msg.callback);
				});
			break;

		case 'auth':
			adapter.log.info('Authenticate bridge..');

			_request({ url: 'http://' + msg.message.bridgeIp + ':' + msg.message.bridgePort + '/auth', json: true })
				.then(res => {
					library.msg(msg.from, msg.command, {result: true, token: res.token}, msg.callback);
				})
				.catch(err => {
					adapter.log.warn('Error while authenticating bridge: ' + err.message);
					library.msg(msg.from, msg.command, {result: false, error: err.message}, msg.callback);
				});
			break;
		}
	});

	return adapter;
}


/**
 * Main function
 *
 */
function initNukiAPIs() {
	library.set(library.getNode('bridgeApiCallback'), false);
	library.set(library.getNode('bridgeApiSync'), false);
	library.set(library.getNode('webApiSync'), false);


	const hasBridge = adapter.config.bridges !== undefined && adapter.config.bridges.length > 0;
	const hasWebApi = adapter.config.refreshWebApi !== 0;

	/*
	 * BRIDGE API
	 *
	 */
	// check if bridges have been defined
	if (!hasBridge && !hasWebApi) {
		return library.terminate('You either need a bridge or WebApi.');
	}

	if (nukiWebApi.initialize(adapter, library)) {
		setup.push('web_api');
	}

	if (!hasBridge) {
		return;
	}
	setup.push('bridge_api');

	// go through bridges
	listener = adapter.config.bridges.map((device, i) => {
		// check if API settings are set
		if (!device.bridge_name || !device.bridge_ip || !device.bridge_token) {
			adapter.log.warn('Name, IP or API token missing for bridge ' + device.bridge_name + '! Please go to settings and fill in IP and the API token first!');
			return Promise.resolve(false);
		}

		// check if Bridge is enabled in settings
		if (!device.active) {
			adapter.log.info('Bridge with name ' + device.bridge_name + ' is disabled in adapter settings. Thus, ignored.');
			return Promise.resolve(false);
		}

		// initialize Nuki Bridge class
		library.set(library.getNode('bridges'));
		device.path = 'bridges.' + library.clean(device.bridge_name, true, '_');

		let bridge = {
			'data': device,
			'callbacks': [],
			'instance': new Bridge.Bridge(device.bridge_ip, device.bridge_port || 8080, device.bridge_token, {'forcePlainToken': adapter.config.hashedToken !== true})
		};

		// index bridge
		BRIDGES[bridge.data.bridge_id] = bridge;

		// get bridge info
		getBridgeApi(bridge);

		// get current callback URLs
		return getCallbacks(bridge);
	});

	// everything ok
	library.set(Library.CONNECTION, true);

	// attach server to listen (only one listener for all Nuki Bridges)
	// @see https://stackoverflow.com/questions/9304888/how-to-get-data-passed-from-a-form-in-express-node-js/38763341#38763341
	return Promise.all(listener).then(values => {
		// attach callback
		if (values.findIndex(el => el === 'attachListener') > -1) {
			_http.use(_parser.json());
			_http.use(_parser.urlencoded({extended: false}));

			_http.post('/nuki-api-bridge', (req, res) => {
				if (req && req.body) {
					let payload = {
						'nukiId': req.body.nukiId,
						'state': {...req.body, 'timestamp': new Date().toISOString().substr(0, 19) + '+00:00'}
					};
					if (payload.state.nukiId) {
						delete payload.state.nukiId;
					}
					if (payload.state.deviceType) {
						delete payload.state.deviceType;
					}

					adapter.log.debug('Received payload via callback: ' + JSON.stringify(payload));
					library.set(library.getNode('bridgeApiLast'), new Date().toISOString().substr(0, 19) + '+00:00');
					library.set(library.getNode('bridgeApiCallback'), true);

					NukiTools.updateLock(payload, library, adapter);
					res.sendStatus(200);
					res.end();

					// update Web API as well
					// update Web API as well if enabled
					if (adapter.config.additionalWebApiCall) {
						setTimeout(() => {
							nukiWebApi.getWebApi()
						}, adapter.config.additionalWebApiTimeout * 1000);
					}
				} else {
					adapter.log.warn('main(): ' + e.message);
					res.sendStatus(500);
					res.end();
				}
			});

			_http.listen(adapter.config.callbackPort, () => adapter.log.info('Listening for Nuki events on port ' + adapter.config.callbackPort + '.'));
		}

		// no callback
		else if (values.findIndex(el => el === 'attachListener') === -1 && values.findIndex(el => el === 'doNotAttachListener') > -1) {
			adapter.log.info('Not listening for Nuki events.');
		}

		// no bridges
		else {
			adapter.log.info('No bridges are sufficiently defined! Name, IP or token missing or all bridges deactivated!');
		}

		// everything ok
		library.set(Library.CONNECTION, true);
	})
		.catch(err => adapter.log.debug('Error resolving listeners (' + JSON.stringify(err) + ')!'));
}

/**
 *
 *
 */
function getCallbacks(bridge) {

	return bridge.instance.getCallbacks().then(cbs => {
		adapter.log.debug('Retrieved current callbacks from Nuki Bridge with name ' + bridge.data.bridge_name + '.');
		BRIDGES[bridge.data.bridge_id].callbacks = cbs;

		// check for enabled callback
		if (adapter.config.refreshBridgeApiType === 'callback') {
			library.set(library.getNode('bridgeApiCallback'), true);
			let url = 'http://' + (adapter.config.callbackIp || _ip.address()) + ':' + adapter.config.callbackPort + '/nuki-api-bridge'; // NOTE: https is not supported according to API documentation

			// attach callback
			if (BRIDGES[bridge.data.bridge_id].callbacks.findIndex(cb => cb.url === url) === -1) {
				adapter.log.debug('Adding callback with URL ' + url + ' to Nuki Bridge with name ' + bridge.data.bridge_name + '.');

				// set callback on bridge
				bridge.instance.addCallback(adapter.config.callbackIp || _ip.address(), adapter.config.callbackPort, false)
					.then(res => {
						if (!res || !res.url) {
							throw new Error(JSON.stringify(res));
						}

						adapter.log.info('Callback (with URL ' + res.url + ') attached to Nuki Bridge with name ' + bridge.data.bridge_name + '.');
						BRIDGES[bridge.data.bridge_id].callbacks.push(res);
						setCallbackNodes(bridge.data.bridge_id);
					})
					.catch(err => {
						if (err && err.error && err.error.message === 'callback already added') {
							adapter.log.debug('Callback (with URL ' + url + ') already attached to Nuki Bridge with name ' + bridge.data.bridge_name + '.');
						}
						else if (BRIDGES[bridge.data.bridge_id].callbacks.length >= 3) {
							adapter.log.warn('Callback not attached because too many Callbacks attached to the Nuki Bridge already! Please delete a callback!');
						}
						else {
							adapter.log.warn('Callback not attached due to error. See debug log for details.');
							adapter.log.debug(err.error.message);
						}
					});
			}
			else {
				adapter.log.debug('Callback (with URL ' + url + ') already attached to Nuki Bridge with name ' + bridge.data.bridge_name + '.');
				setCallbackNodes(bridge.data.bridge_id);
			}

			return Promise.resolve('attachListener');
		}

		return Promise.resolve('doNotAttachListener');
	})
		.catch(err => adapter.log.debug('Error retrieving callbacks (' + JSON.stringify(err) + ')!'));
}

/**
 * Retrieve from Bridge API.
 *
 */
function getBridgeApi(bridge) {
	library.set(library.getNode('bridgeApiSync'), true, { 'force': true });
	library.set(library.getNode('bridgeApiLast'), new Date().toISOString().substr(0,19) + '+00:00');

	// get nuki devices from bridge
	adapter.log.silly('Retrieving from Nuki Bridge API (Bridge ' + bridge.data.bridge_ip + (adapter.config.hashedToken ? ' using hashed token' : '') + ')..');
	bridge.instance.list()
		.then(nukis => {
			adapter.log.debug('getBridgeApi() [forcePlainToken: ' + (bridge.instance.forcePlainToken === true) + ']: ' + JSON.stringify(nukis));
			nukis.forEach(nuki => {

				// remap states
				nuki.bridge = bridge.data.bridge_id !== '' ? bridge.data.bridge_id : undefined;
				nuki.state = nuki.lastKnownState;
				nuki.deviceType = nuki.deviceType || 0;
				delete nuki.lastKnownState;

				NukiTools.updateLock(nuki, library, adapter);
			});
		})
		.catch(err => {
			adapter.log.warn('Failed retrieving /list from Nuki Bridge with name ' + bridge.data.bridge_name + ' (forcePlainToken: ' + (bridge.instance.forcePlainToken === true) + ')!');
			adapter.log.debug('getBridgeApi(): ' + err.message);
			adapter.log.debug('_getTokenParams(): ' + JSON.stringify(bridge.instance._getTokenParams()));

			if ((err.message.indexOf('503') > -1 || err.message.indexOf('socket hang up') > -1) && !unloaded) {
				adapter.log.info('Trying again in 10s..');
				setTimeout(getBridgeApi, 10*1000, bridge);
			}
		});

	// get bridge info
	bridge.instance.info()
		.then(payload => {

			// enrich payload
			payload.name = bridge.data.bridge_name;
			payload.ip = bridge.data.bridge_ip;
			payload.port = bridge.data.bridge_port || 8080;

			// get log
			/*
			bridge.instance.log()
				.then(log => {
					adapter.log.warn(JSON.stringify(log));
				})
				.catch(err => {
					adapter.log.warn('Failed retrieving /log from Nuki Bridge with name ' + bridge.data.bridge_name + ' (forcePlainToken: ' + (bridge.instance.forcePlainToken === true) + ')!');
					adapter.log.debug('getBridgeApi(): ' + err.message);
				});
			*/

			// add bridge actions
			payload.actions = payload.actions || {};
			payload.actions.clearLog = false;
			payload.actions.firmwareUpdate = false;
			payload.actions.reboot = false;

			// get bridge ID if not given
			if (bridge.data.bridge_id === undefined || bridge.data.bridge_id === '') {
				adapter.log.debug('Adding missing Bridge ID for bridge with IP ' + bridge.data.bridge_ip + '.');
				bridge.data.bridge_id = payload.ids.serverId;

				// update bridge ID in configuration
				adapter.getForeignObject('system.adapter.' + adapter.namespace, (err, obj) => {
					obj.native.bridges.forEach((entry, i) => {
						if (entry.bridge_ip === bridge.data.bridge_ip) {
							obj.native.bridges[i].bridge_id = bridge.data.bridge_id;
							adapter.setForeignObject(obj._id, obj);
						}
					});
				});
			}

			// set payload for bridge
			library.set({node: bridge.data.path, description: 'Bridge ' + (bridge.data.bridge_name ? bridge.data.bridge_name + ' ' : '') + '(' + bridge.data.bridge_ip + ')', role: 'channel'});
			library.readData('', payload, bridge.data.path);
		})
		.catch(err => {
			adapter.log.warn('Failed retrieving /info from Nuki Bridge with name ' + bridge.data.bridge_name + ' (forcePlainToken: ' + (bridge.instance.forcePlainToken === true) + ')!');
			adapter.log.debug('getBridgeApi(): ' + err.message);
		});
}


/**
 * Apply an action on either via Nuki Bridge API or via Nuki Web API.
 *
 */
function setAction(device, action, api = 'bridge', retry = 0) {
	adapter.log.info('Trigger action -' + action.name + '- on Nuki ' + device.type + ' ' + device.name + ' (via ' + library.ucFirst(api) + ' API).');

	// try Bridge API
	if (device.instance !== undefined && device.instance !== null && api === 'bridge') {
		adapter.log.debug('Action applied on Bridge API.');

		device.instance.lockAction(action.id)
			.then(() => {
				adapter.log.info('Successfully triggered action -' + action.name + '- on Nuki ' + device.type + ' ' + device.name + ' (via Bridge API).');
				return Promise.resolve(true);
			})
			.catch(err => {
				adapter.log.warn('Error triggering action -' + action.name + '- on Nuki ' + device.type + ' ' + device.name + ' (via Bridge API). See debug log for details.');
				adapter.log.debug(err.message);

				// retry
				retry++;
				if (retry >= MAX_RETRY_ACTIONS) {
					return Promise.resolve(false);
				}

				if (nukiWebApi) {
					adapter.log.info('Try again (' + retry + 'x) with Nuki Web API..');
					return setAction(device, action, 'web', retry);
				}
				else {
					adapter.log.info('Try again (' + retry + 'x) in 10s with Nuki Bridge API..');
					setTimeout(() => {
						return setAction(device, action, 'bridge', retry);

					}, 10*1000);
				}
			});
	}

	// try Web API
	else if (nukiWebApi !== null && api === 'web') {
		adapter.log.debug('Action applied on Web API.');

		nukiWebApi.api.setAction(device.smartlockId, action.id)
			.then(() => {
				adapter.log.info('Successfully triggered action -' + action.name + '- on Nuki ' + device.type + ' ' + device.name + ' (via Web API).');
				return Promise.resolve(true);
			})
			.catch(err => {
				adapter.log.warn('Error triggering action -' + action.name + '- on Nuki ' + device.type + ' ' + device.name + ' (via Web API). See debug log for details.');
				adapter.log.debug(err.message);

				// retry
				retry++;
				if (retry >= MAX_RETRY_ACTIONS) {
					return Promise.resolve(false);
				}

				adapter.log.info('Try again (' + retry + 'x) in 10s with Nuki Bridge API..');
				setTimeout(() => {
					return setAction(device, action, 'bridge', retry);

				}, 10*1000);
			});
	}

	// No API given
	else {
		adapter.log.warn('Neither Bridge API or Web API initialized!');
		adapter.log.debug('DEVICE:' + JSON.stringify(device));
		adapter.log.debug('Bridge API:' + JSON.stringify(device.instance));
		adapter.log.debug('Web API: ' + JSON.stringify(nukiWebApi));

		return Promise.resolve(false);
	}
}


/**
 * Refresh Callbacks of the Nuki Bridge.
 *
 */
function setCallbackNodes(bridgeId) {
	let path = BRIDGES[bridgeId].data.path + '.callbacks';
	let urls = {};

	// compare callback list with states
	adapter.getStates(path + '.*', (err, states) => {

		// index states
		for (let state in states) {
			if (state.substr(-4) === '.url' && states[state] && states[state].val) {
				urls[state.substr(-5, 1)] = states[state].val;
			}
		}

		// add new callbacks
		let index = null, cbs = [];
		BRIDGES[bridgeId].callbacks.forEach(cb => {
			// search for callback URL
			index = Object.values(urls).indexOf(cb.url);
			cbs.push({'id': cb.callbackId, 'url': cb.url});

			// add new URL
			if (index === -1) {
				let node = path + '.' + cb.callbackId.toString();
				library.set({ ...library.getNode('callbacks.callback'), 'node': node });
				library.set({ ...library.getNode('callbacks.callback.id'), 'node': node + '.id' }, parseInt(cb.callbackId));
				library.set({ ...library.getNode('callbacks.callback.url'), 'node': node + '.url' }, cb.url);
				library.set({ ...library.getNode('callbacks.callback.delete'), 'node': node + '._delete'});
			}

			// keep existing URLs
			else {
				let key = Object.keys(urls)[index];
				delete urls[key];
			}
		});

		// create channel and callback list
		library.set({ ...library.getNode('callbacks'), 'node': path });
		library.set({ ...library.getNode('callbacks.list'), 'node': path + '.list'}, JSON.stringify(cbs));

		// attach state listener
		adapter.subscribeStates('*.callbacks.*._delete');

		// remove old callbacks
		for (let key in urls) {
			library.del(path + '.' + key, true, () => adapter.log.debug('Deleted states for callback with URL ' + urls[key] + '.'));
		}
	});
}


/*
 * COMPACT MODE
 * If started as allInOne/compact mode => return function to create instance
 *
 */
if (module && module.parent) {
	module.exports = startAdapter;
}
else {
	startAdapter();
} // or start the instance directly
