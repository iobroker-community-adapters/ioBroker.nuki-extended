# nuki-bridge-api
An API for Nuki Bridge

## How it works

### Get Bridge Connection
```js
var NukiBridgeApi = require('nuki-bridge-api');

var ip = '127.0.0.1';
var port = 12345;
var token = 'token';

var bridge = new NukiBridgeApi.Bridge(ip, port, token);
```

### Bridge Discovery
```js
var NukiBridgeApi = require('nuki-bridge-api');

var bridge = NukiBridgeApi.DiscoveredBridge.discover().then(function connectNow (bridges) {
    // Connect to a bridge
    return bridges[0].connect();
}).then(function gotRealBridge (bridge) {
    // Do something with the bridge
});
```

### Get Nukis
```js
var bridge = new NukiBridgeApi.Bridge(ip, port, token);

bridge.list().then(function gotNukis (nukis) {
    // Do something with the nukis
});

```

### Do something with the bridge
Get info:
```js
bridge.info().then(function gotInfo (info) {
...
})
```

Get and remove logs:
```js
bridge.log().then(function gotLogs (logs) {
  return bridge.clearlog();
})
```

Do a firmware update
```js
bridge.fwupdate();
```

Reboot
```js
bridge.reboot();
```


### What can i do with a nuki instance
``` js
var NukiBridgeApi = require('nuki-bridge-api');
var lockStates = NukiBridgeApi.lockState;
var lockActions = NukiBridgeApi.lockAction;

...

nuki.lockState().then(function (lockState) {
    if (lockState === lockStates.LOCKED) {
        return nuki.lockAction(lockActions.UNLOCK);
    } else if (lockState === lockStates.UNLOCKED) {
        return nuki.lockAction(lockActions.LOCK);
    }
});
```

Getting Callbacks
```js
nuki.getCallbacks().then(function doSomethingWithThe (callbacks) {
...
});
```

or add one (and with the 3rd 'listen' flag, it is easy to listen on the callbacks too)
```js
nuki.addCallback('localhost', 12321, true).then(function gotCallbackRegistered (callback) {
...
});
```

### Callbacks
The callbacks which you get with `getCallbacks` or `addCallback` have the functions
`remove` which removes the callback from the bridge (and closes the webserver which
gets created when you call `addCallback` with `listen=true`) and `startListen` which
starts a webserver and listens for callbacks from the bridge.

If a callback is received, the nuki-instance and the callback itself emits events.
The `action` event is fired with the `state` (a number corresponding to the `LockStates`)
as first parameter and the full body as second.
Additional a event is fired, with the name of the lock-state (e.g. 1 for an Locked-Event).

### Does it warn me if the battery is low?
Yes, every nuki instance is an event-emitter, which emits a `batteryCritical` event if any request receives the flag.
