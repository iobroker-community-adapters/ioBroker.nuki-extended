var LOCK = require(__dirname + '/LOCK.js');

module.exports.BRIDGE =
[
	{'state': 'bridgeType', 'description': 'Type of bridge', 'status': 'bridgeType', 'type': 'number', 'role': 'value', 'common': {'states': {'1': 'Hardware Bridge', '2': 'Software Bridge'}}},
	{'state': 'bridgeId', 'description': 'ID of the bridge / server', 'status': 'ids.serverId', 'role': 'value'},
	{'state': 'bridgeIp', 'description': 'IP address of the bridge', 'status': 'ip', 'role': 'info.ip'},
	{'state': 'bridgePort', 'description': 'Port of the bridge', 'status': 'port', 'role': 'info.port'},
	{'state': 'hardwareId', 'description': 'ID of the hardware bridge', 'status': 'ids.hardwareId', 'role': 'value'},
	
	{'state': 'uptime', 'description': 'Uptime of the bridge in seconds', 'status': 'uptime', 'role': 'value'},
	{'state': 'refreshed', 'description': 'Timestamp of last update', 'status': 'currentTime', 'role': 'date'},
	{'state': '_connected', 'description': 'Flag indicating whether or not the bridge is connected to the Nuki server', 'status': 'serverConnected', 'type': 'boolean', 'role': 'indicator.reachable'},
	
	{'state': 'versFirmware', 'description': 'Version of the bridges firmware (hardware bridge only)', 'status': 'versions.firmwareVersion', 'role': 'text'},
	{'state': 'versWifi', 'description': 'Version of the WiFi modules firmwarehardware bridge only', 'status': 'versions.wifiFirmwareVersion', 'role': 'text'},
	{'state': 'versApp', 'description': 'Version of the bridge appsoftware bridge only', 'status': 'versions.appVersion', 'role': 'text'},
];

module.exports.LOCK = {
	STATES: [
		{'state': 'id', 'description': 'ID of the Nuki', 'status': 'nukiId', 'role': 'value'},
		{'state': 'name', 'description': 'Name of the Nuki', 'status': 'name', 'role': 'text'},
		{'state': 'bridge', 'description': 'Bridge of the Nuki', 'status': 'bridge', 'role': 'text'},
		{'state': 'action', 'description': 'Trigger an action on %name%', 'action': true, 'def': 0, 'type': 'number', 'role': 'value', 'common': {'write': true, 'states': LOCK.ACTIONS}},
		
		// STATUS
		{'state': 'status', 'description': 'Current status of %name%', 'role': 'channel'},
		{'state': 'status.mode', 'description': 'The smartlock mode', 'status': 'state.mode', 'type': 'number', 'role': 'value', 'common': {'states': {"0": 'UNINITIALIZED', "1": 'PAIRING', "2": 'NORMAL', "3": 'UNKNOWN', "4": 'MAINTENANCE'}}},
		{'state': 'status.batteryCritical', 'description': 'States critical battery level', 'status': 'state.batteryCritical', 'role': 'indicator.lowbat', 'type': 'boolean'},
		{'state': 'status.refreshed', 'description': 'Timestamp of last update', 'status': 'state.timestamp', 'role': 'date'},
		{'state': 'status.lockState', 'description': 'Current lock-state of the Nuki', 'status': 'state.state', 'type': 'number', 'role': 'value', 'common': {'states': LOCK.STATES}},
		{'state': 'status.locked', 'description': 'Indication if door is locked (boolean of lockState)', 'status': 'state.state', 'type': 'boolean', 'role': 'sensor.lock', 'states': {"0": 'false', "1": 'true', "2": 'false', "3": 'false', "4": 'true', "5": 'false', "6": 'false', "7": 'false', "254": 'false', "255": 'false'}},
		{'state': 'status.doorState', 'description': 'Current door-state of the Nuki', 'status': 'state.doorState', 'type': 'number', 'role': 'value', 'common': {'states': LOCK.DOOR}},
		{'state': 'status.closed', 'description': 'Indication if door is closed (boolean of doorState)', 'status': 'state.doorState', 'type': 'boolean', 'role': 'sensor.lock', 'states': {"0": 'false', "1": 'false', "2": 'true', "3": 'false', "4": 'true', "5": 'false'}},
		{'state': 'status.lastAction', 'description': 'Last triggered action', 'status': 'state.lastAction', 'type': 'number', 'role': 'value', 'common': {'states': LOCK.ACTIONS}},
		{'state': 'status.trigger', 'description': 'The state trigger', 'status': 'state.trigger', 'type': 'number', 'role': 'value', 'common': {'states': {"0": 'SYSTEM', "1": 'MANUAL', "2": 'BUTTON', "3": 'AUTOMATIC', "4": 'WEB', "5": 'APP'}}},
		
		// CONFIG
		{'state': 'config', 'description': 'Configuration of %name%', 'role': 'channel'},
		{'state': 'config.gpsLatitude', 'description': 'Latitude', 'status': 'config.latitude', 'role': 'gps.latitude'},
		{'state': 'config.gpsLongitude', 'description': 'Longitude', 'status': 'config.longitude', 'role': 'gps.longitude'},
		{'state': 'config.autoUnlatch', 'description': 'True if the door should be unlatched on unlocking (knob)', 'status': 'config.autoUnlatch', 'role': 'indicator'},
		{'state': 'config.pairingEnabled', 'description': 'True if the pairing is allowed via the smartlock button', 'status': 'config.pairingEnabled', 'role': 'indicator'},
		{'state': 'config.buttonEnabled', 'description': 'True if the button on the smartlock is enabled', 'status': 'config.buttonEnabled', 'role': 'indicator'},
		{'state': 'config.ledEnabled', 'description': 'True if the LED on the smartlock is enabled', 'status': 'config.ledEnabled', 'role': 'indicator'},
		{'state': 'config.ledBrightness', 'description': 'The brightness of the LED: 0 (off) to 5 (max)', 'status': 'config.ledBrightness', 'role': 'value.brightness'},
		{'state': 'config.fobPaired', 'description': 'True if a fob is paired with the smartlock', 'status': 'config.fobPaired', 'role': 'indicator'},
		{'state': 'config.fobAction1', 'description': 'The fob action if button is pressed once', 'status': 'config.fobAction1', 'role': 'value', 'common': {'states': {"0": 'NONE', "1": 'UNLOCK', "2": 'LOCK', "3": 'LOCK_N_GO', "4": 'INTELLIGENT'}}},
		{'state': 'config.fobAction2', 'description': 'The fob action if button is pressed twice', 'status': 'config.fobAction2', 'role': 'value', 'common': {'states': {"0": 'NONE', "1": 'UNLOCK', "2": 'LOCK', "3": 'LOCK_N_GO', "4": 'INTELLIGENT'}}},
		{'state': 'config.fobAction3', 'description': 'The fob action if button is pressed 3 times', 'status': 'config.fobAction3', 'role': 'value', 'common': {'states': {"0": 'NONE', "1": 'UNLOCK', "2": 'LOCK', "3": 'LOCK_N_GO', "4": 'INTELLIGENT'}}},
		{'state': 'config.singleLock', 'description': 'True if the smartlock should only lock once (instead of twice)', 'status': 'config.singleLock', 'role': 'indicator'},
		{'state': 'config.advertisingMode', 'description': 'The advertising mode (battery saving)', 'status': 'config.advertisingMode', 'role': 'value', 'common': {'states': {"0": 'AUTOMATIC', "1": 'NORMAL', "2": 'SLOW', "3": 'SLOWEST'}}},
		{'state': 'config.keypadPaired', 'description': 'True if a keypad is paired with the smartlock', 'status': 'config.keypadPaired', 'role': 'indicator'},
		{'state': 'config.homekitState', 'description': 'The homekit state', 'status': 'config.homekitState', 'role': 'indicator', 'common': {'states': {"0": 'UNAVAILABLE', "1": 'DISABLED', "2": 'ENABLED', "3": 'ENABLED & PAIRED'}}},
		{'state': 'config.timezoneId', 'description': 'The timezone id', 'status': 'config.timezoneId', 'role': 'value'},
		
		// ADVANCED CONFIG
		{'state': 'config.advanced', 'description': 'Advanced Configuration of %name%', 'role': 'channel'},
		{'state': 'config.advanced.totalDegrees', 'description': 'The absolute total position in degrees that has been reached during calibration', 'status': 'advancedConfig.totalDegrees', 'role': 'value'},
		{'state': 'config.advanced.unlockedPositionOffsetDegrees', 'description': 'Offset that alters the unlocked position', 'status': 'advancedConfig.unlockedPositionOffsetDegrees', 'role': 'value'},
		{'state': 'config.advanced.lockedPositionOffsetDegrees', 'description': 'Offset that alters the locked position', 'status': 'advancedConfig.lockedPositionOffsetDegrees', 'role': 'value'},
		{'state': 'config.advanced.singleLockedPositionOffsetDegrees', 'description': 'Offset that alters the single locked position', 'status': 'advancedConfig.singleLockedPositionOffsetDegrees', 'role': 'value'},
		{'state': 'config.advanced.unlockedToLockedTransitionOffsetDegrees', 'description': 'Offset that alters the position where transition from unlocked to locked happens', 'status': 'advancedConfig.unlockedToLockedTransitionOffsetDegrees', 'role': 'value'},
		{'state': 'config.advanced.lngTimeout', 'description': 'Timeout in seconds for lock ‘n’ go', 'status': 'advancedConfig.lngTimeout', 'role': 'value'},
		{'state': 'config.advanced.singleButtonPressAction', 'description': 'The desired action, if the button is pressed once', 'status': 'advancedConfig.singleButtonPressAction', 'role': 'value', 'common': {'states': LOCK.BUTTON}},
		{'state': 'config.advanced.doubleButtonPressAction', 'description': 'The desired action, if the button is pressed twice', 'status': 'advancedConfig.doubleButtonPressAction', 'role': 'value', 'common': {'states': LOCK.BUTTON}},
		{'state': 'config.advanced.detachedCylinder', 'description': 'Flag that indicates that the inner side of the used cylinder is detached from the outer side', 'status': 'advancedConfig.detachedCylinder', 'role': 'value'},
		{'state': 'config.advanced.batteryType', 'description': 'The type of the batteries present in the smart lock', 'status': 'advancedConfig.batteryType', 'role': 'value', 'common': {'states': {"0": 'ALKALI', "1": 'ACCUMULATOR', "2": 'LITHIUM'}}},
		{'state': 'config.advanced.automaticBatteryTypeDetection', 'description': 'Flag that indicates if the automatic detection of the battery type is enabled', 'status': 'advancedConfig.automaticBatteryTypeDetection', 'role': 'value'},
		{'state': 'config.advanced.unlatchDuration', 'description': 'Duration in seconds for holding the latch in unlatched position', 'status': 'advancedConfig.unlatchDuration', 'role': 'value'},
		{'state': 'config.advanced.autoLockTimeout', 'description': 'Seconds until the smart lock relocks itself after it has been unlocked. No auto relock if value is 0.', 'status': 'advancedConfig.autoLockTimeout', 'role': 'value'},
		
		// USERS
		{'state': 'users', 'description': 'Users of %name%', 'role': 'channel'},
	],
	
	USERS: [
		{'state': 'name', 'description': 'Name of user', 'status': 'name', 'role': 'text'},
		{'state': 'type', 'description': 'The type of the authorization', 'status': 'type', 'type': 'number', 'role': 'value', 'common': {'states': {"0": 'APP', "1": 'BRIDGE', "2": 'FOB', "3": 'KEYPAD', "13": 'KEYPAD CODE', "14": 'Z-KEY', "15": 'VIRTUAL'}}},
		{'state': 'id', 'description': 'The unique id of user', 'status': 'id', 'role': 'text'},
		{'state': 'authId', 'description': 'The smartlock authorization id', 'status': 'authId', 'role': 'text'},
		{'state': 'enabled', 'description': 'True if the user is enabled', 'status': 'enabled', 'role': 'indicator', 'type': 'boolean'},
		{'state': 'remoteAllowed', 'description': 'True if the auth has remote access', 'status': 'remoteAllowed', 'role': 'indicator', 'type': 'boolean'},
		{'state': 'lockCount', 'description': 'The lock count', 'status': 'lockCount', 'role': 'value'},
		{'state': 'dateLastActive', 'description': 'The last active date', 'status': 'lastActiveDate', 'role': 'date'},
		{'state': 'dateCreated', 'description': 'The creation date', 'status': 'creationDate', 'role': 'date'},
		{'state': 'dateUpdated', 'description': 'The update date', 'status': 'updateDate', 'role': 'date'},
		
		{'state': 'allowedFromDate', 'description': 'The allowed from date', 'status': 'allowedFromDate', 'role': 'text'},
		{'state': 'allowedUntilDate', 'description': 'The allowed until date', 'status': 'allowedUntilDate', 'role': 'text'},
		{'state': 'allowedWeekDays', 'description': 'The allowed weekdays', 'status': 'allowedWeekDays', 'role': 'value'}, // {64: 'Monday', 32: 'Tuesday', 16: 'Wednesday', 8: 'Thursday', 4: 'Friday', 2: 'Saturday', 1: 'Sunday'}
		{'state': 'allowedFromTime', 'description': 'The allowed from time (in minutes from midnight)', 'status': 'allowedFromTime', 'role': 'value'},
		{'state': 'allowedUntilTime', 'description': 'The allowed until time (in minutes from midnight)', 'status': 'allowedUntilTime', 'role': 'value'},
	]
}