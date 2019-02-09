/*global systemDictionary:true */
'use strict';

systemDictionary = {
	"tab_config": {
		"en": "Configuration",
		"de": "Einstellungen"
	},
	"tab_alexa": {
		"en": "Alexa integration",
		"de": "Alexa Integration"
	},
	"tab_info": {
		"en": "Information",
		"de": "Informationen"
	},
	
	"web": {
		"en": "Connection settings of the Nuki Smart Locks (optional)",
		"de": "Verbindungseinstellungen der Nuki Smart Locks (optional)"
	},
	"web_info": {
		"en": "The connection settings for the Nuki Smart Locks (using the <a href='https://developer.nuki.io/page/nuki-web-api-111/3/'>official Nuki Web API</a>). The Nuki Web API offers various ways to interact with a Nuki Smart Lock. The API transmits all commands directly through a permanent HTTPS/TLS connection to the corresponding Nuki bridge, which forwards it via Bluetooth to the Smart Lock for execution. Responses are directly fed back into Nuki Web.<br /><br /><strong>Please go to <a href='https://web.nuki.io/de/#/admin/web-api'>web.nuki.io</a> (create an account) and generate your API token!</strong>",
		"de": "Die Verbindungseinstellungen für die Nuki Smart Locks (mit der <a href='https://developer.nuki.io/page/nuki-web-api-111/3/'>offiziellen Nuki Web API</a>).<br /><br /><strong>Bitte auf <a href='https://web.nuki.io/de/#/admin/web-api'>web.nuki.io</a> einen API Token erstellen!</strong>"
	},
	"api_token": {
		"en": "API Token",
		"de": "API Token"
	},
	
	"bridge": {
		"en": "Connection settings of the Nuki Bridge",
		"de": "Verbindungseinstellungen der Nuki Bridge"
	},
	"bridge_info": {
		"en": "The connection settings for the Nuki Bridge (using the <a href='https://developer.nuki.io/page/nuki-bridge-http-api-170/4/'>official Nuki Bridge API</a>). The REST API on the Nuki Bridge offers simple endpoints to list all available Nuki Smart Locks, retrieve their current lock state and perform lock operations.",
		"de": "Die Verbindungseinstellungen für die Nuki Bridge (mit der <a href='https://developer.nuki.io/page/nuki-bridge-http-api-170/4/'>offiziellen Nuki Bridge API</a>)."
	},
	"add_bridge": {
		"en": "Add Bridge",
		"de": "Bridge hinzufügen"
	},
	"discoer_bridges": {
		"en": "Discover Bridges",
		"de": "Bridges suchen"
	},
	
	"message_action-connecting": {
		"en": "Connecting to adapter..",
		"de": "Verbinde zum Adapter.."
	},
	"message_error-noconnection": {
		"en": "No connection to adapter! Please start adapter first.",
		"de": "Keine Verbindung zum Adapter! Bitte zunächst den Adapter starten."
	},
	"message_info-connected": {
		"en": "Connected to adapter.",
		"de": "Verbunden zum Adapter."
	},
	"message_action-getbridges": {
		"en": "Retrieve bridges..",
		"de": "Lade Bridges.."
	},
	"message_error-nobridges": {
		"en": "Could not retrieve bridges!",
		"de": "Bridges konnten nicht geladen werden!"
	},
	"message_success-gotbridges": {
		"en": "Successfully retrieved bridges! Found %count% bridges.",
		"de": "Erfolgreich Bridges geladen! %count% Bridges gefunden."
	},
	"message_info-duplbridge": {
		"en": "Bridge with ID %id% already added, thus skipped.",
		"de": "Brdige mit ID %id% bereits hinzugefügt, daher ausgelassen."
	},
	"message_info-finished": {
		"en": "ALL DONE. You may close the status log now.",
		"de": "ALLES FERTIG. Das Status Protokoll kann nun geschlossen werden."
	},
	
    "bridge_id": {
		"en": "Bridge ID",
		"de": "Bridge ID"
	},
    "bridge_name": {
		"en": "Bridge Name (optional)",
		"de": "Bridge Name (optional)"
	},
    "bridge_ip": {
		"en": "IP address",
		"de": "IP Adresse"
	},
    "bridge_port": {
		"en": "Port",
		"de": "Port"
	},
    "bridge_token": {
		"en": "API Token",
		"de": "API Token"
	},
    "bridge_callback": {
		"en": "Use Callback",
		"de": "Callback nutzen"
	},
    "enabled": {
		"en": "Enabled",
		"de": "Aktiviert"
	},
	
	"other": {
		"en": "Other Settings",
		"de": "Weitere Einstellungen"
	},
	"refresh_info": {
		"en": "Time for refreshing all settings / information (in seconds). If set to 0, settings will only be refreshed on adapter startup.",
		"de": "Intervall in Sekunden, nach dem alle Einstellungen / Informationen aktualisiert werden. Wenn auf 0 eingestellt, werden Einstellungen nur bei einem Adapter-Start aktualisiert."
	},
	"refresh": {
		"en": "Refresh (in seconds)",
		"de": "Aktualisierung (in Sekunden)"
	},
	"port_info": {
		"en": "Specify port to listen to callback events from Nuki.",
		"de": "Port angeben, um Events zu abonnieren und Benachrichtigungen von Nuki zu empfangen."
	},
	"port": {
		"en": "Port",
		"de": "Port"
	},
	
	"status": {
		"en": "Status Log",
		"de": "Status Protokollierung"
	},
	"button_closeModal": {
		"en": "Close Log",
		"de": "Protokoll schließen"
	},
};
