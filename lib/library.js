'use strict';

/**
 * Library
 *
 * @description Library of general functions as well as helping functions handling ioBroker
 * @author Zefau <https://github.com/Zefau/>
 * @license MIT License
 * @version 0.14.0
 * @date 2019-05-18
 *
 */
class Library
{
	/**
	 * Constructor.
	 *
	 * @param	{object}	adapter		ioBroker adpater object
	 *
	 */
    constructor(adapter)
	{
		this._adapter = adapter;
    }
	
	/**
	 * Remove specials characters from string.
	 *
	 * @param	{string}	string												String to proceed
	 * @param	{boolean}	[lowerCase=false]									if String shall be return in lower case
	 * @param	{array}		[characters=['<', '>', ' ', ',', ';', '!', '?']]	Characters to be removed from string
	 * @param	{string}	[replacement='']									Characters shall be replaced with this character
	 * @return	{string}														Cleaned String
	 *
	 */
	clean(string, lowerCase, characters, replacement)
	{
		characters = characters ? characters : ['<', '>', ' ', ',', ';', '!', '?'];
		characters.forEach(function(character)
		{
			string = string.replace(RegExp('\\'+character, 'gi'), replacement ? replacement : '')
		});
		
		return lowerCase ? string.toLowerCase() : string;
	}
	
	/**
	 * Waits for a specific time before invoking a callback.
	 *
	 * @param	{number}	time		Time to wait before invoking the callback
	 * @param	{function}	callback	Callback to be invoked
	 * @return	void
	 *
	 */
	wait(time, callback)
	{
		setTimeout(() => callback, time);
	}
	
	/**
	 * Encode a string.
	 *
	 * @param	{string}	key			Key used for encoding
	 * @param	{string}	string		String to encode
	 * @return	{string}				Encoded String
	 *
	 */
	encode(key, string)
	{
		let result = '';
		for (let i = 0; i < string.length; i++)
			result += String.fromCharCode(key[i % key.length].charCodeAt(0) ^ string.charCodeAt(i));
		
		return result;
	}
	
	/**
	 * Decode a string.
	 *
	 * @param	{string}	key			Key used for decoding
	 * @param	{string}	string		String to decode
	 * @return	{string}				Decoded String
	 *
	 */
	decode(key, string)
	{
		return this.encode(key, string);
	}
	
	/**
	 * Get a random key.
	 *
	 * @param	{integer}	length		Length of key
	 * @return	{string}				Key
	 *
	 */
	getKey(length)
	{
		length = length || 8;
		let key = '';
		
		while (key.length < length)
			key += Math.random().toString().substring(2,3) >= 5 ? Math.random().toString(36).substring(2, 4) : Math.random().toString(36).substring(2, 4).toUpperCase();
		
		return key.substr(0, length);
	}
	
	/**
	 * Convert an integer to IP.
	 *
	 * @param	{integer}	number		Number to be converted to IP address
	 * @return	{string}				Converted IP address
	 *
	 */
	getIP(number)
	{
		let ip = [];
		ip.push(number & 255);
		ip.push((number >> 8) & 255);
		ip.push((number >> 16) & 255);
		ip.push((number >> 24) & 255);
		
		ip.reverse();
		return ip.join('.');
	}
	
	/**
	 * Sends a message to another adapter.
	 *
	 * @param	{string}	receiver	
	 * @param	{string}	command		
	 * @param	{*}			message		Message to send to receiver, shall be an object and will be converted to such if another is given
	 * @param	{function}	(optional)	Callback
	 * @return	void
	 *
	 */
	msg(receiver, command, message, callback)
	{
		this._adapter.sendTo(
			receiver,
			command,
			typeof message !== 'object' ? {message: message} : message,
			callback === undefined ? function() {} : callback
		);
	}
	
	/**
	 * Capitalize first letter of a string
	 *
	 * @param	{string}	str			String to capitalize
	 * @return	{string}
	 *
	 */
	ucFirst(str)
	{
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
	
	/**
	 * Convert a date to timestamp.
	 *
	 * @param	{date}		date		Datetime to parse
	 * @return	{integer}					parsed Timestamp
	 *
	 */
	getTimestamp(date)
	{
		if (date === undefined || !date)
			return 0;
		
		let ts = new Date(date).getTime();
		return isNaN(ts) ? 0 : ts;
	}

	/**
	 * Convert a timestamp to datetime.
	 *
	 * @param	{integer}	ts			Timestamp to be converted to date-time format (in ms)
	 * @return	{string}				Timestamp in date-time format
	 *
	 */
	getDateTime(ts)
	{
		if (ts === undefined || ts <= 0 || ts == '')
			return '';
		
		let date    = new Date(ts);
		let day     = '0' + date.getDate();
		let month   = '0' + (date.getMonth() + 1);
		let year    = date.getFullYear();
		let hours   = '0' + date.getHours();
		let minutes = '0' + date.getMinutes();
		let seconds = '0' + date.getSeconds();
		return day.substr(-2) + '.' + month.substr(-2) + '.' + year + ' ' + hours.substr(-2) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
	}

	/**
	 * Set multiple values and create the necessary nodes for it in case they are missing.
	 *
	 * @param	{object}	values
	 * @param	{object}	nodes
	 * @param	{object}	options
	 * @return	void
	 *
	 */
	setMultiple(values, nodes, options)
	{
		let that = this;
		options = options !== undefined ? options : {};
		
		for (let key in values)
		{
			if (nodes[key] && nodes[key].node && nodes[key].description)
			{
				let node = nodes[key];
				let value = values[key];
				
				// replace options if given
				for (let option in options)
				{
					node.node = node.node.replace(option, options[option]);
					node.description = node.description.replace(option, options[option]);
				}
				
				// convert data if necessary
				switch(node.convert)
				{
					case "datetime":
						this.set({node: node.node + 'Datetime', description: node.description.replace('Timestamp', 'Date-Time'), common: {"type": "string", "role": "text"}}, value ? this.getDateTime(value * 1000) : '');
						break;
				} 
				
				// set node
				this.set(node, value);
			}
		}
	}

	/**
	 * Set a value and create the necessary nodes for it in case it is missing.
	 *
	 * @param	{object}	node					
	 * @param	{string}	node.node				Node (= state) to set the value (and create in case it does not exist)
	 * @param	{string}	node.description		Description of the node (in case it will be created)
	 * @param	{object}	node.common				Common Details of the node (in case it will be created)
	 * @param	{string}	node.common.role		Role of the node (in case it will be created)
	 * @param	{string}	node.common.type		Type of the node (in case it will be created)
	 * @param	{object}	node.native				Native Details of the node (in case it will be created)
	 * @param	{string}	value					Value to set (in any case)
	 * @return	void
	 *
	 */
	set(node, value)
	{
		let that = this;
		
		// catch error
		if (node.node === undefined && (node.name === undefined || node.description === undefined))
			this._adapter.log.error('Error: State not properly defined (' + JSON.stringify(node) + ')!');
		
		// create node
		else
			this._createNode(node, that._setValue(node.node, value));
	}

	/**
	 * Run Duty Cycle and delete outdated states / objects.
	 *
	 * @param	{string}	states					State tree to be deleted
	 * @param	{number}	kill					in seconds
	 * @param	{number}	[variance=5]			in seconds
	 * @return	void
	 *
	 */
	runDutyCycle(states, kill, variance)
	{
		let that = this;
		
		var tree = states.split('.');
		if (tree.length > 0)
		{
			that._adapter.getStatesOf(tree[tree.length-2] || '', tree[tree.length-1], function(err, states)
			{
				states.forEach(function(state)
				{
					that._adapter.getState(state._id, function(err, info)
					{
						let ts = 0, lc = 0;
						if (info === undefined || info === null || info.lc === undefined)
							that._adapter.log.silly('Duty Cycle: ID ' + state._id + ' never updated!');
						
						else
						{
							ts = (Math.floor(info.ts/1000) + (variance ? variance : 100));
							lc = (Math.floor(info.lc/1000) + (variance ? variance : 100));
						}
						
						if (ts < kill && lc < kill)
						{
							that._adapter.log.silly('Duty Cycle: Deleted ' + state._id + ' (created ' + ts + ' & last change ' + lc + ' < ' + kill + ')!');
							that._adapter.delObject(state._id);
						}
					});
				});
			});
		}
	}

	/**
	 * Deletes a state / object.
	 *
	 * @param	{string|array}		states			State(s) or state tree to be deleted
	 * @param	{boolean}			[nested=true]	Whether to delete nested states as well
	 * @param	{function}			[callback]		Callback to be invoked once finished deleting all states
	 * @return	void
	 *
	 */
	del(states, nested, callback)
	{
		let that = this;
		
		let finished = 0;
		states = typeof states == 'string' ? [states] : states;
		
		states.forEach(function(state)
		{
			// create state to have at least one deletion (in case no states exist at all)
			that._createNode({node: state}, function()
			{
				// get state tree
				that._adapter.getStates(nested ? state + '.*' : state, function(err, objects)
				{
					let deleted = 0;
					objects = Object.keys(objects);
					
					// no states to delete, invoke callback
					if (objects.length == 0)
						callback && callback();
					
					// delete child states
					else
					{
						objects.forEach(function(object)
						{
							that._adapter.delObject(object, function(err)
							{
								deleted++;
								
								if (deleted == objects.length)
								{
									finished++;
									
									if (finished == states.length && callback !== undefined)
										callback();
								}
							});
						});
					}
				});
			});
		});
	}
	
	/**
	 * Creates an object (channel or state).
	 *
	 * @param	{object}	node					
	 * @param	{string}	node.node				Node (= state) to set the value (and create in case it does not exist)
	 * @param	{string}	node.description		Description of the node (in case it will be created)
	 * @param	{object}	node.common				Common Details of the node (in case it will be created)
	 * @param	{string}	node.common.role		Role of the node (in case it will be created)
	 * @param	{string}	node.common.type		Type of the node (in case it will be created)
	 * @param	{object}	node.native				Native Details of the node (in case it will be created)
	 * @param	{function}	callback				Callback function to be invoked
	 * @return	void
	 *
	 */
	_createNode(node, callback)
	{
		let that = this;
		
		let common = {};
		if (node.description !== undefined) common.name = node.description;
		if (node.role !== undefined) common.role = node.role;
		if (node.type !== undefined) common.type = node.type;
		if (common.role && common.role.indexOf('button') > -1) {common.read = false; common.write = true;}
		
		this._adapter.setObjectNotExists(
			node.node,
			{common: Object.assign({name: node, role: 'state', type: 'string', 'write': false}, node.common || {}, common), type: 'state', native: node.native || {}},
			function(err, obj)
			{
				if (obj !== undefined)
					that._adapter.log.silly('Created node ' + JSON.stringify(obj));
				
				callback && callback();
			}
		);
	}

	/**
	 * Sets a value of a state.
	 *
	 * @param	{string}	state		State the value shall be set
	 * @param	{string}	value		Value to be set
	 * @return	void
	 *
	 */
	_setValue(state, value)
	{
		let that = this;
		
		if (value !== undefined)
			this._adapter.setState(state, {val: value, ts: Date.now(), ack: true}, function(err) {if (err) that._adapter.log.error(err);})
	}
}

module.exports = Library;
