/**
 *
 *
 */
function L(lang, word)
{
	if (!word)
		return '';
	
	else if (!lang)
		return word;
	
	else
		return LANG[word] !== undefined && LANG[word][lang] !== undefined ? LANG[word][lang] : word;
}

/*
 *
 *
 */
var LANG = {
	'UNLOCK': {'en': 'Door unlocked %person%', 'de': 'Tür %person% aufgeschlossen'},
	'LOCK': {'en': 'Door locked %person%', 'de': 'Tür %person% verschlossen'},
	'UNLATCH': {'en': 'Door unlatched %person%', 'de': 'Tür %person% entriegelt'},
	'LOCK_N_GO': {'en': 'Door locked & go %person%', 'de': 'Tür %person% geschlossen und los'},
	'LOCK_N_GO_WITH_UNLATCH': {'en': 'Door unlatched & go %person%', 'de': 'Tür %person% entriegelt und los'},
	'DOOR_OPENED': {'en': 'Door opened %person%', 'de': 'Tür %person% geöffnet'},
	'DOOR_CLOSED': {'en': 'Door closed %person%', 'de': 'Tür %person% geschlossen'},
	'DOOR_SENSOR_JAMMED': {'en': 'Door Sensor jammed %person%', 'de': 'Tür Sensor %person% blockiert'},
	'DOOR_LOG_ENABLED': {'en': 'Door log enabled %person%', 'de': 'Türprotokoll %person% aktiviert'},
	'DOOR_LOG_DISABLED': {'en': 'Door log disabled %person%', 'de': 'Türprotokoll %person% deaktiviert'},
	'INITIALIZATION': {'en': 'Door initizalized %person%', 'de': 'Tür %person% initialisiert'},
	'CALIBRATION': {'en': 'Door calibrated %person%', 'de': 'Tür %person% kalibriert'},
	'LOG_ENABLED': {'en': 'Log enabled %person%', 'de': 'Protokoll %person% aktiviert'},
	'LOG_DISABLED': {'en': 'Log disabled %person%', 'de': 'Protokoll %person% deaktiviert'},
	
	'AUTO_UNLOCK': {'en': 'automatically unlocked', 'de': 'automatisch aufgeschlossen'},
	
	'SYSTEM': {'en': 'System', 'de': 'System'},
	'MANUAL': {'en': 'triggered manually', 'de': 'manuell ausgeführt'},
	'BUTTON': {'en': 'trigged via button', 'de': 'per Button ausgeführt'},
	'AUTOMATIC': {'en': 'trigged automatically', 'de': 'automatisch ausgeführt'},
	'WEB': {'en': 'trigged via Web', 'de': 'via Web ausgeführt'},
	'APP': {'en': 'trigged via App', 'de': 'per App ausgeführt'},
	'AUTO_LOCK': {'en': 'automatically locked', 'de': 'automatisch geschlossen'},
	'KEYPAD': {'en': 'trigged by keypad', 'de': 'mit Keypad ausgeführt'},
	
	'SUCCESS': {'en': 'success', 'de': 'erfolgreich'},
	'MOTOR_BLOCKED': {'en': 'motor blocked', 'de': 'Motor blockiert'},
	'CANCELED': {'en': 'canceled', 'de': 'abgebrochen'},
	'TOO_RECENT': {'en': 'too recent', 'de': 'zu häufig'},
	'BUSY': {'en': 'busy', 'de': 'beschäftigt'},
	'LOW_MOTOR_VOLTAGE': {'en': 'low motor voltage', 'de': 'niedrige Spannung'},
	'CLUTCH_FAILURE': {'en': 'clutch failure', 'de': 'Fehler der Kupplung'},
	'MOTOR_POWER_FAILURE': {'en': 'motor power failure', 'de': 'Spannungsfehler'},
	'OTHER_ERROR': {'en': 'unknown error', 'de': 'unbekannter Fehler'},
	'UNKNOWN_ERROR': {'en': 'unknown error', 'de': 'unbekannter Fehler'},
	
	'by': {'de': 'von'},
	'manually': {'de': 'manuell'},
	'not executed': {'en': 'not executed, because', 'de': 'nicht ausgeführt, da'},
};
