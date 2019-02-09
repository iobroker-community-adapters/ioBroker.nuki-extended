'use strict';
const adapterName = require('./io-package.json').common.name;
const utils = require(__dirname + '/lib/utils'); // Get common adapter utils

const _request = require('request-promise');
const _http = require('express')();
const _parser = require('body-parser');
const _ip = require('ip');


/*
 * internal libraries
 */
const Library = require(__dirname + '/lib/library.js');
const Bridge = require('nuki-bridge-api');
const Nuki = require('nuki-api');


/*
 * variables initiation
 */
var adapter;
var library;

const LOCK = require(__dirname + '/LOCK.js');
const NODES = require(__dirname + '/NODES.js');

var setup = [];
var nuki = null, bridges = {}, doors = {}, listeners = {};
var callback = false, refresh = null;


/*
 * ADAPTER
 *
 */
function startAdapter(options)
{
	options = options || {};
	Object.assign(options,
	{
		name: adapterName
	});
	
	adapter = new utils.Adapter(options);
	library = new Library(adapter);
	
	/*
	 * ADAPTER READY
	 *
	 */
	adapter.on('ready', main);
	
	/*
	 * ADAPTER UNLOAD
	 *
	 */
	adapter.on('unload', function(callback)
	{
		try
		{
			adapter.log.info('Adapter stopped und unloaded.');
			if (refresh) clearInterval(refresh);
			callback();
		}
		catch(e)
		{
			callback();
		}
	});

	/*
	 * STATE CHANGE
	 *
	 */
	adapter.on('stateChange', function(node, object)
	{
		adapter.log.debug('State of ' + node + ' has changed ' + JSON.stringify(object) + '.');
		var state = node.substr(node.lastIndexOf('.')+1);
		var action = object !== undefined && object !== null ? object.val : 0;
		
		if (state === 'action' && Number.isInteger(action) && action > 0 && object.ack !== true)
		{
			adapter.getObject(node, function(err, node)
			{
				adapter.setState(node, 0, true);
				var nukiId = node.common.nukiId || false;
				if (err !== null || !nukiId)
				{
					adapter.log.warn('Error triggering action -' + LOCK.ACTIONS[action] + '- on the Nuki: ' + err.message);
					return;
				}
				
				// retrieve Nuki and apply action
				adapter.log.info('Triggered action -' + LOCK.ACTIONS[action] + '- on Nuki ' + doors[nukiId].name + '.');
				
				// try bridge API
				var bridge = bridges[doors[nukiId].bridge] !== undefined ? bridges[doors[nukiId].bridge].instance : null;
				if (bridge !== null)
				{
					adapter.log.debug('Action applied on Bridge API.');
					bridge.get(nukiId).then(function(device)
					{
						device.lockAction(action)
							.then(function()
							{
								adapter.log.info('Successfully triggered action -' + LOCK.ACTIONS[action] + '- on Nuki ' + doors[nukiId].name + '.');
								library._setValue(node, 0);
							})
							.catch(function(e)
							{
								adapter.log.warn('Error triggering action -' + LOCK.ACTIONS[action] + '- on Nuki ' + doors[nukiId].name + '. See debug log for details.');
								adapter.log.debug(e.message);
							});
					});
				}
				
				// try Web API
				else if (nuki !== null)
				{
					adapter.log.debug('Action applied on Web API.');
					nuki.setLock(nukiId, action).catch(function(e) {adapter.log.debug(e.message)});
				}
			});
		}
	});

	/*
	 * HANDLE MESSAGES
	 *
	 */
	adapter.on('message', function(msg)
	{
		adapter.log.debug('Message: ' + JSON.stringify(msg));
		
		switch(msg.command)
		{
			case 'discover':
				adapter.log.info('Discovering bridges..');
				
				_request({ url: 'https://api.nuki.io/discover/bridges', json: true })
					.then(function(res)
					{
						var discovered = res.bridges;
						adapter.log.info('Bridges discovered: ' + discovered.length);
						adapter.log.debug(JSON.stringify(discovered));
						
						library.msg(msg.from, msg.command, {result: true, bridges: discovered}, msg.callback);
					})
					.catch(function(err)
					{
						adapter.log.warn('Error while discovering bridges: ' + err.message);
						library.msg(msg.from, msg.command, {result: false, error: err.message}, msg.callback);
					});
				break;
			
			case 'auth':
				adapter.log.info('Authenticate bridge..');
				
				_request({ url: 'http://' + msg.message.bridgeIp + ':' + msg.message.bridgePort + '/auth', json: true })
					.then(function(res)
					{
						library.msg(msg.from, msg.command, {result: true, token: res.token}, msg.callback);
					})
					.catch(function(err)
					{
						adapter.log.warn('Error while authenticating bridge: ' + err.message);
						library.msg(msg.from, msg.command, {result: false, error: err.message}, msg.callback);
					});
				break;
		}
	});
	
	return adapter;	
};


/**
 * Main function
 *
 */
function main()
{
	/*
	 * WEB API
	 *
	 */
	if (!adapter.config.api_token)
		adapter.log.info('No API token provided.');
	
	else
	{
		nuki = new Nuki();
		nuki.apiKey = adapter.config.api_token;
		setup.push('web_api');
		
		// get locks
		updateLocks();
	}
	
	
	/*
	 * BRIDGE API
	 *
	 */
	// check if bridges have been defined
	if (adapter.config.bridges === undefined || adapter.config.bridges.length == 0)
		adapter.log.info('No bridges have been defined in settings so far.');
	
	else
	{
		setup.push('bridge_api');
		
		// go through bridges
		adapter.config.bridges.forEach(function(device, i)
		{
			// check if Bridge is enabled in settings
			if (!device.active)
			{
				adapter.log.info('Bridge ' + (device.bridge_name ? 'with name ' + device.bridge_name : (device.bridge_id ? 'with ID ' + device.bridge_id : 'with index ' + i)) + ' is disabled in adapter settings. Thus, ignored.');
				return;
			}
			
			// check if API settings are set
			if (!device.bridge_ip || !device.bridge_token)
			{
				adapter.log.warn('IP or API token missing for bridge ' + (device.bridge_name ? 'with name ' + device.bridge_name : (device.bridge_id ? 'with ID ' + device.bridge_id : 'with index ' + i)) + '! Please go to settings and fill in IP and the API token first!');
				return;
			}
			
			// check for enabled callback
			if (device.bridge_callback)
				callback = true;
			
			// initialize Nuki Bridge class
			var bridge = {
				'data': device,
				'instance': new Bridge.Bridge(device.bridge_ip, device.bridge_port || 8080, device.bridge_token)
			};
			
			// get bridge info
			getBridgeInfo(bridge);
		});
	}
	
	// exit if no API is given
	if (setup.length == 0) return;
	
	
	// periodically refresh settings
	if (adapter.config.refresh !== undefined && adapter.config.refresh >= 10)
	{
		refresh = setInterval(function()
		{
			// update nuki
			updateLocks();
			
			// update bridge
			for (var key in bridges) {getBridgeInfo(bridges[key])}
			
		}, Math.round(parseInt(adapter.config.refresh)*1000));
	}
	
	// attach server to listen (@see https://stackoverflow.com/questions/9304888/how-to-get-data-passed-from-a-form-in-express-node-js/38763341#38763341)
	if (callback)
	{
		adapter.config.port = adapter.config.port !== undefined && adapter.config.port > 1024 && adapter.config.port <= 65535 ? adapter.config.port : 51988;
		adapter.log.info('Listening for Nuki events on port ' + adapter.config.port + '.');
		
		_http.use(_parser.json());
		_http.use(_parser.urlencoded({extended: false}));
		
		_http.post('/nuki-api-bridge', function(req, res)
		{
			adapter.log.debug('Received payload via callback: ' + JSON.stringify(req.body));
			var payload;
			try
			{
				payload = req.body;
				updateLock({'nukiId': payload.nukiId, 'state': {'state': payload.state, 'batteryCritical': payload.batteryCritical, 'timestamp': new Date()}});
			}
			catch(e)
			{
				adapter.log.warn(e.message);
			}
		});
		
		_http.listen(adapter.config.port);
	}
}


/**
 * Retrieve Nuki's.
 *
 */
function getBridgeInfo(bridge)
{
	// get nuki's
	//adapter.log.info('Retrieving Nuki\'s from Bridge ' + bridge.data.bridge_ip + '..');
	bridge.instance.list().then(function gotNukis(nukis)
	{
		nukis.forEach(function(nuki)
		{
			// create Nuki
			nuki.bridge = bridge.data.bridge_id !== '' ? bridge.data.bridge_id : undefined;
			nuki.state = nuki.lastKnownState;
			adapter.log.debug('getBridgeInfo(): ' + JSON.stringify(nuki));
			updateLock(nuki);
			
			// attach callback (NOTE: https is not supported according to API documentation)
			if (bridge.data.bridge_callback)
			{
				nuki.nuki.addCallback(_ip.address(), adapter.config.port)
					.then(function(res)
					{
						adapter.log.info('Callback attached to Nuki ' + nuki.name + '.');
					})
					.catch(function(e)
					{
						if (e.error.message === 'callback already added')
							adapter.log.debug('Callback already attached to Nuki ' + nuki.name + '.');
						
						else
						{
							adapter.log.warn('Callback not attached due to error. See debug log for details.');
							adapter.log.debug(e.message);
						}
					});
			}
		});
	})
	.catch(function(e)
	{
		adapter.log.warn('Connection settings for bridge incorret' + (bridge.data.bridge_name ? ' with name ' + bridge.data.bridge_name : (bridge.data.bridge_id ? ' with ID ' + bridge.data.bridge_id : (bridge.data.bridge_ip ? ' with ip ' + bridge.data.bridge_ip : ''))) + '! No connection established.');
		adapter.log.debug(e.message);
	});
	
	// get bride info
	bridge.instance.info().then(function gotInfo(info)
	{
		//
		info.ip = bridge.data.bridge_ip;
		info.port = bridge.data.bridge_port || 8080;
		
		// get bridge ID if not given
		if (bridge.data.bridge_id === undefined || bridge.data.bridge_id === '')
		{
			adapter.log.debug('Adding missing Bridge ID for bridge with IP ' + bridge.data.bridge_ip + '.');
			bridge.data.bridge_id = info.ids.serverId;
			
			// update bridge ID in configuration
			adapter.getForeignObject('system.adapter.' + adapter.namespace, function(err, obj)
			{
				obj.native.bridges.forEach(function(entry, i)
				{
					if (entry.bridge_ip === bridge.data.bridge_ip)
					{
						obj.native.bridges[i].bridge_id = bridge.data.bridge_id;
						adapter.setForeignObject(obj._id, obj);
					}
				});
			});
		}
		
		// index bridge
		if (bridges[bridge.data.bridge_id] === undefined)
			bridges[bridge.data.bridge_id] = bridge;
		
		// create bridge
		var device = 'bridge__' + (bridge.data.bridge_name ? bridge.data.bridge_name.replace(/ /gi, '_').toLowerCase() : bridge.data.bridge_id);
		adapter.createDevice(device, {name: 'Bridge (' + bridge.data.bridge_ip + ')'}, {}, function(err)
		{
			NODES.BRIDGE.forEach(function(node)
			{
				node.node = device + '.' + node.state;
				setInformation(node, info);
			});
		});
	})
	.catch(function(e) {adapter.log.debug(e.message)});
}


/**
 * Update Nuki Locks.
 *
 */
function updateLocks()
{
	//adapter.log.info('Retrieving Nuki\'s from Web API..');
	nuki.getSmartLocks(true).then(function(smartlocks)
	{
		smartlocks.forEach(function(smartlock)
		{
			smartlock.nukiId = smartlock.smartlockId;
			if (setup.indexOf('bridge_api') > -1) delete smartlock.state.state; // use state retrieved from bridge instead of this
			adapter.log.debug('updateLocks(): ' + JSON.stringify(smartlock));
			updateLock(smartlock);
			updateLogs(smartlock.nukiId);
			
			// get users
			nuki.getSmartLockUsers(smartlock.nukiId, true).then(function(users)
			{
				users.forEach(function(user)
				{
					var nodePath = doors[smartlock.nukiId].device + '.users.' + user.name.toLowerCase().replace(/ /gi, '_');
					library.set({node: nodePath, description: 'User ' + user.name});
					
					NODES.LOCK.USERS.forEach(function(node)
					{
						setInformation(Object.assign(node, {node: nodePath + '.' + node.state}), user);
					});
				});
				
			}).catch(function(err) {adapter.log.warn('Error retrieving users: ' + err.message)});
		});
		
	}).catch(function(err) {adapter.log.warn('Error retrieving smartlocks: ' + err.message)});
}


/**
 * Update states of Nuki Door based on payload.
 *
 */
function updateLock(payload)
{
	// index Nuki
	var device;
	if (doors[payload.nukiId] === undefined)
	{
		device = 'door__' + payload.name.toLowerCase().replace(/ /gi, '_');
		doors[payload.nukiId] = {device: device, name: payload.name, state: payload.state.state, bridge: null};
	}
	
	// retrieve Nuki name
	else
		device = doors[payload.nukiId].device;
	
	// update bridge
	if (payload.bridge !== undefined) doors[payload.nukiId].bridge = payload.bridge;
	
	// create / update device
	adapter.createDevice(device, {name: payload.name}, {}, function(err)
	{
		NODES.LOCK.STATES.forEach(function(node)
		{
			node.node = device + '.' + node.state;
			node.description = node.description.replace(/%id%/gi, payload.nukiId).replace(/%name%/gi, payload.name);
			setInformation(node, payload);
		});
	});
}


/**
 * Set information based on payload.
 *
 */
function setInformation(node, payload)
{
	var tmp = {}, status = '', index = '';
	try
	{
		// action
		if (node.action !== undefined && listeners[node.node] === undefined)
		{
			node.common.nukiId = payload.nukiId;
			library.set(node, node.def);
			adapter.subscribeStates(node.node); // attach state listener
			listeners[node.node] = node;
		}
		
		// status
		else if (node.status !== undefined)
		{
			tmp = Object.assign({}, payload); // copy object
			status = node.status;
			
			// go through response
			while (status.indexOf('.') > -1)
			{
				try
				{
					index = status.substr(0, status.indexOf('.'));
					status = status.substr(status.indexOf('.')+1);
					tmp = tmp[index];
				}
				catch(e) {adapter.log.debug(e.message);}
			}
			
			// write value
			if (tmp !== undefined && tmp[status] !== undefined)
				library.set(node, (node.states !== undefined ? node.states[tmp[status]] : (node.type === 'boolean' && Number.isInteger(tmp[status]) ? (tmp[status] === 1) : tmp[status])));
		}
		
		// only state creation
		else
		{
			adapter.getState(node.node, function(err, res)
			{
				if ((err !== null || !res) && (node.node !== undefined && node.description !== undefined))
					library.set(node, '');
			});
		}
		
	}
	catch(e) {adapter.log.warn(JSON.stringify(e.message))}
}


/**
 * Update Nuki Logs.
 *
 */
function updateLogs(nukiId)
{
	//adapter.log.info('Retrieving Nuki Log\'s from Web API..');
	nuki.getLog(nukiId).then(function(log)
	{
		library.set({node: doors[nukiId].device + '.logs', description: 'Logs / History of Nuki'}, JSON.stringify(log));
		
	}).catch(function(e) {adapter.log.debug(e.message)});
}


/*
 * COMPACT MODE
 * If started as allInOne/compact mode => return function to create instance
 *
 */
if (module && module.parent)
	module.exports = startAdapter;
else
	startAdapter(); // or start the instance directly
