const LOCK = require(__dirname + '/_LOCK.js');
const OPENER = require(__dirname + '/_OPENER.js');

module.exports =
{
	// CHANNELS
	'bridges': {'node': 'bridges', 'description': 'Nuki Bridges', 'role': 'channel'},
	'smartlocks': {'node': 'smartlocks', 'description': 'Nuki Smartlocks', 'role': 'channel'},
	'boxes': {'node': 'boxes', 'description': 'Nuki Boxes', 'role': 'channel'},
	'openers': {'node': 'openers', 'description': 'Nuki Opener', 'role': 'channel'},


	// INFO
	'bridgeApiCallback': {'node': 'info.bridgeApiSync', 'description': 'Indicates whether syncing via Bridge API is activated', 'role': 'indicator', 'type': 'boolean'},
	'bridgeApiSync': {'node': 'info.bridgeApiSync', 'description': 'Indicates whether syncing via Bridge API is activated', 'role': 'indicator', 'type': 'boolean'},
	'bridgeApiLast': {'node': 'info.bridgeApiLast', 'description': 'Timestamp of last Bridge API sync or callback', 'role': 'date'},
	'webApiSync': {'node': 'info.webApiSync', 'description': 'Indicates whether syncing via Web API is activated', 'role': 'indicator', 'type': 'boolean'},
	'webApiLast': {'node': 'info.webApiLast', 'description': 'Timestamp of last Web API sync', 'role': 'date'},

	// INFO - NOTIFICATIONS
	'notifications': {'description': 'Notifications', 'role': 'channel'},
	'notifications.settings.authIds': {'description': 'A set of auth IDs to filter push notifications to certain users or keypads. If no entry push notifications are triggered for all users and keypads', 'type': 'string', 'role': 'text', 'convert': 'array'},
	'notifications.settings.triggerEvents': {'description': 'A set on which push notifications should be triggered: lock, unlock, unlatch, lockngo, open, ring, doorsensor, warnings, smartlock', 'type': 'string', 'role': 'text', 'convert': 'array'},
	'notifications.settings.smartlockId': {'description': 'The smartlock ID, if not set all Smart Locks of the account are enabled for push notifications', 'type': 'number', 'role': 'value'},
	'notifications.settings': {'description': 'Settings per Smart Lock', 'role': 'channel'},
	'notifications.lastActiveDate': {'description': 'The last active date', 'type': 'string', 'role': 'text'},
	'notifications.status': {'description': 'Current activation state', 'type': 'number', 'role': 'indicator', 'common': {'states': {'0': 'INIT', '1': 'ACTIVE', '2': 'FAILED'}}},
	'notifications.language': {'description': 'The language of push messages', 'type': 'string', 'role': 'text'},
	'notifications.os': {'description': 'The operating system', 'type': 'number', 'role': 'text', 'common': {'states': {'0': 'Android', '1': 'iOS', '2': 'Webhook'}}},
	'notifications.pushId': {'description': 'The push ID or the POST URL for a webhook', 'type': 'string', 'role': 'text'},
	'notifications.secret': {'description': 'The 40 byte hex string to sign the checksumof the POST payload if the notification is webhook (os=2)', 'type': 'string', 'role': 'text'},
	'notifications.notificationId': {'description': 'The unique notificationId for the notification', 'type': 'string', 'role': 'text'},
	'notifications.referenceId': {'description': 'The reference ID, an ID to identify a foreign system', 'type': 'string', 'role': 'text'},


	// BRIDGE
	'bridgeType': {'state': 'bridgeType', 'description': 'Type of bridge', 'type': 'number', 'role': 'value', 'common': {'states': {'1': 'Hardware Bridge', '2': 'Software Bridge'}}},
	'ids.serverId': {'state': 'bridgeId', 'description': 'ID of the bridge / server', 'role': 'value', 'type': 'number'},
	'ip': {'state': 'bridgeIp', 'description': 'IP address of the bridge', 'role': 'info.ip'},
	'port': {'state': 'bridgePort', 'description': 'Port of the bridge', 'role': 'info.port'},
	'ids.hardwareId': {'state': 'hardwareId', 'description': 'ID of the hardware bridge', 'role': 'value', 'type': 'number'},

	'uptime': {'state': 'uptime', 'description': 'Uptime of the bridge in seconds', 'role': 'value', 'type': 'number'},
	'currentTime': {'state': 'refreshed', 'description': 'Timestamp of last update', 'role': 'date'},
	'serverConnected': {'state': '_connected', 'description': 'Flag indicating whether or not the bridge is connected to the Nuki server', 'type': 'boolean', 'role': 'indicator.reachable'},
	'wlanConnected': {'description': 'Flag indicating whether connected to WLAN', 'type': 'boolean', 'role': 'indicator'},

	'versions.firmwareVersion': {'state': 'versFirmware', 'description': 'Version of the bridges firmware (hardware bridge only)', 'role': 'text'},
	'versions.wifiFirmwareVersion': {'state': 'versWifi', 'description': 'Version of the WiFi modules firmwarehardware bridge only', 'role': 'text'},
	'versions.appVersion': {'state': 'versApp', 'description': 'Version of the bridge appsoftware bridge only', 'role': 'text'},

	// BRIDGE - CALLBACKS
	'callbacks': {'description': 'Callbacks of the Bridge', 'role': 'channel'},
	'callbacks.list': {'description': 'List of callbacks', 'role': 'json'},
	'callbacks.callback': {'description': 'Callback', 'role': 'channel'},
	'callbacks.callback.id': {'description': 'ID of the callback', 'role': 'value', 'type': 'number'},
	'callbacks.callback.url': {'description': 'URL of the callback', 'role': 'text'},
	'callbacks.callback.delete': {'description': 'Delete the callback', 'role': 'button'},


	// SMARTLOCK
	'nukiId': {'state': 'id', 'description': 'ID of the Nuki', 'type': 'number', 'role': 'value'},
	'nukiHexId': {'state': 'hex', 'description': 'Hex ID of the Nuki', 'type': 'string', 'role': 'text'},
	'name': {'state': 'name', 'description': 'Name of the Bridge / Nuki', 'type': 'string', 'role': 'text'},
	'bridge': {'state': 'bridgeId', 'description': 'Bridge ID of the Nuki', 'type': 'number', 'role': 'value'},
	'deviceType': {'state': 'type', 'description': 'Type of device', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'Nuki Smart Lock', '2': 'Nuki Opener'}}},
	'action': {'description': 'Trigger an action', 'def': 0, 'type': 'number', 'role': 'value'},

	// SMARTLOCK - INFO
	'info': {'state': 'info', 'description': 'Additional Information', 'role': 'channel'},
	'smartlockId': {'state': 'info.smartlockId', 'description': 'The smartlock ID', 'type': 'number', 'role': 'value'},
	'accountId': {'state': 'info.accountId', 'description': 'The account ID', 'type': 'number', 'role': 'value'},
	'authId': {'state': 'info.authId', 'description': 'The authorization ID', 'type': 'number', 'role': 'value'},
	'favorite': {'state': 'info.favorite', 'description': 'The favorite flag', 'type': 'boolean', 'role': 'indicator'},
	'firmwareVersion': {'state': 'info.firmwareVersion', 'description': 'The firmware version', 'type': 'number', 'role': 'value'},
	'hardwareVersion': {'state': 'info.hardwareVersion', 'description': 'The hardware version', 'type': 'number', 'role': 'value'},
	'operationId': {'state': 'info.operationId', 'description': 'The operation id - if set the device is locked for another operation', 'type': 'string', 'role': 'text'},
	'serverState': {'state': 'info.serverState', 'description': 'The server state', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'OK', '1': 'UNREGISTERED', '2': 'AUTH UUID INVALID', '3': 'AUTH INVALID', '4': 'OFFLINE'}}},
	'adminPinState': {'state': 'info.adminPinState', 'description': 'The admin pin state', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'OK', '1': 'MISSING', '2': 'INVALID'}}},
	'virtualDevice': {'state': 'info.virtualDevice', 'description': 'The flag indicating a virtual Smart Lock', 'type': 'boolean', 'role': 'indicator'},
	'creationDate': {'state': 'info.dateCreated', 'description': 'The creation date', 'type': 'string', 'role': 'date'},
	'updateDate': {'state': 'info.dateUpdated', 'description': 'The update date', 'type': 'string', 'role': 'date'},

	// SMARTLOCK - STATE
	'state': {'description': 'Current states', 'role': 'channel'},
	'state.batteryCritical': {'description': 'Indicates critical battery level', 'role': 'indicator.lowbat', 'type': 'boolean'},
	'state.batteryCharging': {'description': 'Indicates battery charging', 'role': 'indicator', 'type': 'boolean'},
	'state.batteryChargeState': {'description': 'Indicates battery charge level', 'role': 'value', 'type': 'number'},
	'state.operationId': {'description': 'The operation id - if set the device is locked for another operation', 'type': 'string', 'role': 'text'},
	'state.doorsensorState': {'state': 'state.doorState', 'description': 'Current door-state of the Nuki', 'type': 'number', 'role': 'value', 'common': {'states': LOCK.DOOR}},
	'state.doorsensorStateName': {'state': 'state.doorStateName', 'description': 'Current door-state name of the Nuki', 'type': 'string', 'role': 'text'},
	'state.lastAction': {'description': 'Last triggered action', 'type': 'number', 'role': 'value'},
	'state.state': {'state': 'state.lockState', 'description': 'Current lock-state of the Nuki or Opener', 'type': 'number', 'role': 'value'},
	'state.stateName': {'state': 'state.lockStateName', 'description': 'Current lock-state name of the Nuki or Opener', 'type': 'string', 'role': 'text'},
	'state.mode': {'description': 'Operation Mode of the Nuki or Opener', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'UNINITIALIZED', '1': 'PAIRING', '2': 'NORMAL', '3': 'CONTINUOUS', '4': 'MAINTENANCE'}}},
	'state.ringToOpenTimer': {'description': 'Remaining ring to open time', 'type': 'number', 'role': 'value'},
	'state.trigger': {'description': 'The state trigger', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'SYSTEM', '1': 'MANUAL', '2': 'BUTTON', '3': 'AUTOMATIC', '4': 'WEB', '5': 'APP', '6': 'CONTINUOUS'}}},
	'state.timestamp': {'state': 'state.lastDataUpdate', 'description': 'Timestamp of last data update / refresh', 'role': 'date'},
	'state.lastStateUpdate': {'description': 'Timestamp of last state change', 'role': 'date', 'type': 'number'},
	'state.nightMode': {'description': 'Indicates if night mode is enabled', 'role': 'indicator', 'type': 'boolean'},
	'state.deviceType': {'description': 'Type of device', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'Nuki Smart Lock', '2': 'Nuki Opener'}}},

	'state.locked': {'state': 'state.locked', 'description': 'Indication if door is locked (boolean of lockState)', 'type': 'boolean', 'role': 'sensor.lock', 'common': {'states': {'0': 'false', '1': 'true', '2': 'false', '3': 'false', '4': 'true', '5': 'false', '6': 'false', '7': 'false', '254': 'false', '255': 'false'}}},
	'state.closed': {'state': 'state.closed', 'description': 'Indication if door is closed (boolean of doorState)', 'type': 'boolean', 'role': 'sensor.lock', 'common': {'states': {'0': 'false', '1': 'false', '2': 'true', '3': 'false', '4': 'true', '5': 'false'}}},

	// SMARTLOCK - USERS
	'users': {'description': 'Authorized Users', 'role': 'channel'},
	'users.enabled': {'description': 'True if the user is enabled', 'role': 'indicator', 'type': 'boolean'},
	'users.id': {'description': 'The unique id of user', 'type': 'string', 'role': 'text'},
	'users.lockCount': {'description': 'The lock count', 'type': 'number', 'role': 'value'},
	'users.name': {'description': 'Name of user', 'type': 'string', 'role': 'text'},
	'users.remoteAllowed': {'description': 'True if the auth has remote access', 'role': 'indicator', 'type': 'boolean'},
	'users.smartlockId': {'description': 'The Nuki ID', 'type': 'number', 'role': 'value'},
	'users.type': {'description': 'The type of the authorization', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'APP', '1': 'BRIDGE', '2': 'FOB', '3': 'KEYPAD', '13': 'KEYPAD CODE', '14': 'Z-KEY', '15': 'VIRTUAL'}}},
	'users.authId': {'state': 'authId', 'description': 'The smartlock authorization id', 'type': 'number', 'role': 'value'},
	'users.creationDate': {'state': 'dateCreated', 'description': 'The creation date', 'role': 'date'},
	'users.updateDate': {'state': 'dateUpdated', 'description': 'The update date', 'role': 'date'},
	'users.lastActiveDate': {'state': 'datelastActive', 'description': 'The last active date', 'role': 'date'},

	'users.allowedFromDate': {'description': 'The allowed from date', 'status': 'allowedFromDate', 'role': 'text'},
	'users.allowedUntilDate': {'description': 'The allowed until date', 'status': 'allowedUntilDate', 'role': 'text'},
	'users.allowedWeekDays': {'description': 'The allowed weekdays', 'status': 'allowedWeekDays', 'role': 'value'}, // {64: 'Monday', 32: 'Tuesday', 16: 'Wednesday', 8: 'Thursday', 4: 'Friday', 2: 'Saturday', 1: 'Sunday'}
	'users.allowedFromTime': {'description': 'The allowed from time (in minutes from midnight)', 'status': 'allowedFromTime', 'role': 'value'},
	'users.allowedUntilTime': {'description': 'The allowed until time (in minutes from midnight)', 'status': 'allowedUntilTime', 'role': 'value'},

	// SMARTLOCK - CONFIG
	'config': {'description': 'Configuration', 'role': 'channel'},
	'config.capabilities': {'description': 'The capabilities indicate whether door opening is possible via App, RTO or both', 'type': 'number', 'role': 'indicator', 'common': {'states': {'0': 'ONLY DOOR', '1': 'BOTH', '2': 'ONLY RTO'}}},
	'config.daylightSavingMode': {'description': 'The daylight saving mode', 'type': 'number', 'role': 'indicator', 'common': {'states': {'0': 'OFF', '1': 'EUROPEAN'}}},
	'config.name': {'description': 'The name of the smartlock for new users', 'type': 'string', 'role': 'text'},
	'config.operatingMode': {'description': 'The operating mode of the opener', 'type': 'number', 'role': 'indicator', 'common': {'states': {'0': 'GENERIC DOOR OPENER', '1': 'ANALOGUE INTERCOM', '2': 'DIGITAL INTERCOM'}}},
	'config.timezoneOffset': {'description': 'The timezone offset (in minutes)', 'type': 'number', 'role': 'value'},
	'config.latitude': {'state': 'config.gpsLatitude', 'description': 'Latitude', 'role': 'gps.latitude', 'type': 'number'},
	'config.longitude': {'state': 'config.gpsLongitude', 'description': 'Longitude', 'role': 'gps.longitude', 'type': 'number'},
	'config.autoUnlatch': {'description': 'True if the door should be unlatched on unlocking (knob)', 'role': 'indicator', 'type': 'boolean'},
	'config.pairingEnabled': {'description': 'True if the pairing is allowed via the smartlock button', 'role': 'indicator', 'type': 'boolean'},
	'config.buttonEnabled': {'description': 'True if the button on the smartlock is enabled', 'role': 'indicator', 'type': 'boolean'},
	'config.ledEnabled': {'description': 'True if the LED on the smartlock is enabled', 'role': 'indicator', 'type': 'boolean'},
	'config.ledBrightness': {'description': 'The brightness of the LED: 0 (off) to 5 (max)', 'role': 'value.brightness', 'type': 'number'},
	'config.fobPaired': {'description': 'True if a fob is paired with the smartlock', 'role': 'indicator', 'type': 'boolean'},
	'config.fobAction1': {'description': 'The fob action if button is pressed once', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'NONE', '1': 'UNLOCK', '2': 'LOCK', '3': 'LOCK_N_GO', '4': 'INTELLIGENT'}}},
	'config.fobAction2': {'description': 'The fob action if button is pressed twice', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'NONE', '1': 'UNLOCK', '2': 'LOCK', '3': 'LOCK_N_GO', '4': 'INTELLIGENT'}}},
	'config.fobAction3': {'description': 'The fob action if button is pressed 3 times', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'NONE', '1': 'UNLOCK', '2': 'LOCK', '3': 'LOCK_N_GO', '4': 'INTELLIGENT'}}},
	'config.singleLock': {'description': 'True if the smartlock should only lock once (instead of twice)', 'role': 'indicator', 'type': 'boolean'},
	'config.advertisingMode': {'description': 'The advertising mode (battery saving)', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'AUTOMATIC', '1': 'NORMAL', '2': 'SLOW', '3': 'SLOWEST'}}},
	'config.keypadPaired': {'description': 'True if a keypad is paired with the smartlock', 'role': 'indicator', 'type': 'boolean'},
	'config.homekitState': {'description': 'The homekit state', 'role': 'indicator', 'type': 'number', 'common': {'states': {'0': 'UNAVAILABLE', '1': 'DISABLED', '2': 'ENABLED', '3': 'ENABLED & PAIRED'}}},
	'config.timezoneId': {'description': 'The timezone id', 'role': 'value', 'type': 'number'},

	// SMARTLOCK - ADVANCED CONFIG
	'advancedConfig': {'description': 'Advanced Configuration', 'role': 'channel'},
	'advancedConfig.totalDegrees': {'description': 'The absolute total position in degrees that has been reached during calibration', 'role': 'value', 'type': 'number'},
	'advancedConfig.unlockedPositionOffsetDegrees': {'description': 'Offset that alters the unlocked position', 'role': 'value', 'type': 'number'},
	'advancedConfig.lockedPositionOffsetDegrees': {'description': 'Offset that alters the locked position', 'role': 'value', 'type': 'number'},
	'advancedConfig.singleLockedPositionOffsetDegrees': {'description': 'Offset that alters the single locked position', 'role': 'value', 'type': 'number'},
	'advancedConfig.unlockedToLockedTransitionOffsetDegrees': {'description': 'Offset that alters the position where transition from unlocked to locked happens', 'role': 'value', 'type': 'number'},
	'advancedConfig.lngTimeout': {'description': 'Timeout in seconds for lock ‘n’ go', 'role': 'value', 'type': 'number'},
	'advancedConfig.singleButtonPressAction': {'description': 'The desired action, if the button is pressed once', 'type': 'number', 'role': 'value', 'common': {'states': LOCK.BUTTON}},
	'advancedConfig.doubleButtonPressAction': {'description': 'The desired action, if the button is pressed twice', 'type': 'number', 'role': 'value', 'common': {'states': LOCK.BUTTON}},
	'advancedConfig.detachedCylinder': {'description': 'Flag that indicates that the inner side of the used cylinder is detached from the outer side', 'type': 'boolean', 'role': 'indicator'},
	'advancedConfig.batteryType': {'description': 'The type of the batteries present in the smart lock', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'ALKALI', '1': 'ACCUMULATOR', '2': 'LITHIUM'}}},
	'advancedConfig.automaticBatteryTypeDetection': {'description': 'Flag that indicates if the automatic detection of the battery type is enabled', 'type': 'boolean', 'role': 'indicator'},
	'advancedConfig.unlatchDuration': {'description': 'Duration in seconds for holding the latch in unlatched position', 'role': 'value', 'type': 'number'},
	'advancedConfig.autoLockTimeout': {'description': 'Seconds until the smart lock relocks itself after it has been unlocked. No auto relock if value is 0.', 'role': 'value', 'type': 'number'},

	// SMARTLOCK - CONFIG
	'webConfig': {'description': 'Web Configuration', 'role': 'channel'},
	'webConfig.batteryWarningPerMailEnabled': {'description': 'True if a battery warning is send via email', 'type': 'boolean', 'role': 'indicator'},

	// OPENER
	'state.ringactionState': {'state': 'state.ringState', 'description': 'Current ring-state of the Opener', 'type': 'boolean', 'role': 'indicator'},
	'state.ringactionTimestamp': {'state': 'state.ringStateUpdate', 'description': 'Timestamp of last ring-state update', 'role': 'date'},

	// OPENER - OPENER ADVANCED CONFIG
	'openerAdvancedConfig': {'description': 'Opener Configuration', 'role': 'channel'},
	'openerAdvancedConfig.intercomId': {'description': 'The database ID of the connected intercom', 'type': 'number', 'role': 'value'},
	'openerAdvancedConfig.busModeSwitch': {'description': 'Method to switch between data and analogue mode', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'DATA MODE', '1': 'ANALOGUE MODE'}}},
	'openerAdvancedConfig.shortCircuitDuration': {'description': 'Duration of the short circuit for BUS mode switching in ms', 'type': 'number', 'role': 'value'},
	'openerAdvancedConfig.electricStrikeDelay': {'description': 'Delay of electric strike activation in ms (after lock action 3 -electric strike actuation-)', 'type': 'number', 'role': 'value'},
	'openerAdvancedConfig.randomElectricStrikeDelay': {'description': 'Random electricStrikeDelay (range 3000 - 7000 ms) in order to simulate a person inside actuating the electric strike', 'type': 'boolean', 'role': 'indicator'},
	'openerAdvancedConfig.electricStrikeDuration': {'description': 'Duration in ms of electric strike actuation (lock action 3 -electric strike actuation-)', 'type': 'number', 'role': 'value'},
	'openerAdvancedConfig.disableRtoAfterRing': {'description': 'Flag to disable RTO after ring', 'type': 'boolean', 'role': 'value'},
	'openerAdvancedConfig.rtoTimeout': {'description': 'After this period of time in minutes, RTO gets deactivated automatically', 'type': 'number', 'role': 'value'},
	'openerAdvancedConfig.doorbellSuppression': {'description': 'The doorbell supression mode', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'NEVER', '1': 'CONTINUOUS', '2': 'RTO', '3': 'CONTINUOUS+RTO', '4': 'DOORBELL', '5': 'CONTINUOUS + DOORBELL', '6': 'RTO + DOORBELL', '7': 'CONTINUOUS + RTO + DOORBELL'}}},
	'openerAdvancedConfig.doorbellSuppressionDuration': {'description': 'Duration in ms of doorbell suppression (only in Operating mode 2 -digital Intercom-)', 'type': 'number', 'role': 'value'},
	'openerAdvancedConfig.soundRing': {'description': 'The sound for ring', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'NO SOUND', '1': 'SOUND 1', '2': 'SOUND 2', '3': 'SOUND 3'}}},
	'openerAdvancedConfig.soundOpen': {'description': 'The sound for open', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'NO SOUND', '1': 'SOUND 1', '2': 'SOUND 2', '3': 'SOUND 3'}}},
	'openerAdvancedConfig.soundRto': {'description': 'The sound for RTO', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'NO SOUND', '1': 'SOUND 1', '2': 'SOUND 2', '3': 'SOUND 3'}}},
	'openerAdvancedConfig.soundCm': {'description': 'The sound for CM', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'NO SOUND', '1': 'SOUND 1', '2': 'SOUND 2', '3': 'SOUND 3'}}},
	'openerAdvancedConfig.soundConfirmation': {'description': 'The sound confirmation', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'NO SOUND', '1': 'SOUND'}}},
	'openerAdvancedConfig.soundLevel': {'description': 'The sound level', 'type': 'number', 'role': 'value'},
	'openerAdvancedConfig.singleButtonPressAction': {'description': 'The desired action, if the button is pressed once', 'type': 'number', 'role': 'value', 'common': {'states': OPENER.BUTTON}},
	'openerAdvancedConfig.doubleButtonPressAction': {'description': 'The desired action, if the button is pressed twice', 'type': 'number', 'role': 'value', 'common': {'states': OPENER.BUTTON}},
	'openerAdvancedConfig.batteryType': {'description': 'The type of the batteries present in the smart lock', 'type': 'number', 'role': 'value', 'common': {'states': {'0': 'ALKALI', '1': 'ACCUMULATOR', '2': 'LITHIUM'}}},
	'openerAdvancedConfig.automaticBatteryTypeDetection': {'description': 'Flag that indicates if the automatic detection of the battery type is enabled', 'type': 'boolean', 'role': 'indicator'},
	'openerAdvancedConfig.operationId': {'description': 'The operation id - if set device is locked for another operation', 'type': 'string', 'role': 'text'},
}
