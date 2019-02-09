'use strict';

/**
 * Library
 *
 * @description Library of general functions as well as helping functions handling ioBroker
 * @author Zefau <https://github.com/Zefau/>
 * @license MIT License
 * @version 0.9.0
 * @date 2019-01-12
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
	 * Convert an integer to IP.
	 *
	 * @param	{integer}	number		Number to be converted to IP address
	 * @return	{string}				Converted IP address
	 *
	 */
	getIP(number)
	{
		var ip = [];
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
	 * Convert a date to timestamp.
	 *
	 * @param	{date}		date			Datetime to parse
	 * @return	{integer}					parsed Timestamp
	 *
	 */
	getTimestamp(date)
	{
		if (date === undefined || timestamp <= 0)
			return 0;
		
		var date = new Date(date);
		var ts = date.getTime();
		return isNaN(ts) ? 0 : ts;
	}

	/**
	 * Convert a timestamp to datetime.
	 *
	 * @param	{integer}	timestamp		Timestamp to be converted to date-time format
	 * @return	{string}					Timestamp in date-time format
	 *
	 */
	getDateTime(timestamp)
	{
		if (timestamp === undefined || timestamp <= 0)
			return '';
		
		var date    = new Date(timestamp);
		var day     = '0' + date.getDate();
		var month   = '0' + (date.getMonth() + 1);
		var year    = date.getFullYear();
		var hours   = '0' + date.getHours();
		var minutes = '0' + date.getMinutes();
		var seconds = '0' + date.getSeconds();
		return day.substr(-2) + '.' + month.substr(-2) + '.' + year + ' ' + hours.substr(-2) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
	}

	/**
	 * Set a value and create the necessary state for it in case it is missing.
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
		var that = this;
		
		// catch error
		if (node.node === undefined && (node.name === undefined || node.description === undefined))
			this._adapter.log.error('Error: State not properly defined (' + JSON.stringify(node) + ')!');
		
		// create node
		else
			this._createNode(node, that._setValue(node.node, value));
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
		var that = this;
		
		var common = {};
		if (node.description !== undefined) common.name = node.description;
		common.role = node.role !== undefined ? node.role : '';
		common.type = node.type !== undefined ? node.type : '';
		if (common.role.indexOf('button') > -1) {common.read = false; common.write = true;}
		
		this._adapter.setObjectNotExists(
			node.node,
			{common: Object.assign({role: 'state', type: 'string', 'write': false}, node.common || {}, common), type: 'state', native: node.native || {}},
			function(err, obj)
			{
				if (obj !== undefined)
					that._adapter.log.debug('Created node ' + JSON.stringify(obj));
				
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
		var that = this;
		if (value !== undefined)
			this._adapter.setState(state, {val: value, ts: Date.now(), ack: true}, function(err) {if (err) that._adapter.log.error(err);})
	}
}

module.exports = Library;
