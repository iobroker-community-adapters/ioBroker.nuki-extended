var TYPES = {
	"0": "SMARTLOCK",
	"2": "OPENER"
}

var ACTIONS = {
	"1": "UNLOCK",
	"2": "LOCK",
	"3": "UNLATCH",
	"4": "LOCK_N_GO",
	"5": "LOCK_N_GO_WITH_UNLATCH",
	"224": "DOORBELL_RECOGNITION",
	"240": "DOOR_OPENED",
	"241": "DOOR_CLOSED",
	"242": "DOOR_SENSOR_JAMMED",
	"250": "DOOR_LOG_ENABLED",
	"251": "DOOR_LOG_DISABLED",
	"252": "INITIALIZATION",
	"253": "CALIBRATION",
	"254": "LOG_ENABLED",
	"255": "LOG_DISABLED",
};

var TRIGGER = {
	"0": "SYSTEM",
	"1": "MANUAL",
	"2": "BUTTON",
	"3": "AUTOMATIC",
	"4": "WEB",
	"5": "APP",
	"6": "AUTO_LOCK",
	"255": "KEYPAD"
};

var STATES = {
	"0": "SUCCESS",
	"1": "MOTOR_BLOCKED",
	"2": "CANCELED",
	"3": "TOO_RECENT",
	"4": "BUSY",
	"5": "LOW_MOTOR_VOLTAGE",
	"6": "CLUTCH_FAILURE",
	"7": "MOTOR_POWER_FAILURE",
	"8": "INCOMPLETE",
	"254": "OTHER_ERROR",
	"255": "UNKNOWN_ERROR"
};
