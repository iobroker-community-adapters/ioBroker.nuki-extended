module.exports = {
	STATES: {
		"0": "UNCALIBRATED",
		"1": "LOCKED",
		"2": "UNLOCKING",
		"3": "UNLOCKED",
		"4": "LOCKING",
		"5": "UNLATCHED",
		"6": "UNLOCKED_LOCK_N_GO",
		"7": "UNLATCHING",
		"254": "MOTOR_BLOCKED",
		"255": "UNDEFINED"
	},

	ACTIONS: {
		"0": "NO_ACTION",
		"1": "UNLOCK",
		"2": "LOCK",
		"3": "UNLATCH",
		"4": "LOCK_N_GO",
		"5": "LOCK_N_GO_WITH_UNLATCH"
	},

	DOOR: {
		"0": "UNAVAILABLE",
		"1": "DEACTIVATED",
		"2": "DOOR_CLOSED",
		"3": "DOOR_OPENED",
		"4": "DOOR_STATE_UNKNOWN",
		"5": "CALIBRATING"
	},

	BUTTON: {
		"0": "NO_ACTION",
		"1": "INTELLIGENT",
		"2": "UNLOCK",
		"3": "LOCK",
		"4": "UNLATCH",
		"5": "LOCK_N_GO",
		"6": "SHOW_STATUS"
	}
};
