var arguments = require('minimist')(process.argv.slice(2));

var nukiApiBridge = require('./../index');
var Bridge = nukiApiBridge.Bridge;

var myBridge = new Bridge(arguments.ip, arguments.port, arguments.token);

myBridge.list().then(function getNuki (nukis) {
  // First get a nuki
  return nukis[0].nuki;
}).then(function checkNuki (nuki) {
  // Register some example callbacks on the nuki
  // Action is called for every callback
  nuki.on('action', function gotAction (state, response) {
    console.log('nuki got action ' + state); // State is a number responding to the `nukiApiBridge.lockState` ones
    console.log(response);
  });
  // You can listen for specific ones too
  nuki.on(nukiApiBridge.lockState.LOCKED, function gotLocked (response) {
    console.log('nuki got locked');
    console.log(response);
  });
  nuki.on(nukiApiBridge.lockState.UNLOCKED, function gotUnlocked (response) {
    console.log('nuki got unlocked');
    console.log(response);
  });

  // Remove all Callbacks and add ours
  return nuki.getCallbacks().map(function removeCallbacks (callback) {
    return callback.remove();
  }).then(function addCallback () {
    return nuki.addCallback('192.168.8.104', '14889', true);
  }).then(function doSomething (callback) {
    // The sae as the ones on the nuki, both works
    callback.on('action', function gotAction (state, response) {
      console.log('callback got action ' + state);
      console.log(response);
    });
    callback.on(nukiApiBridge.lockState.LOCKED, function gotLocked (response) {
      console.log('callback got locked');
      console.log(response);
    });
    callback.on(nukiApiBridge.lockState.UNLOCKED, function gotUnlocked (response) {
      console.log('callback got unlocked');
      console.log(response);
    });

    // Do something to trigger a callback
    return nuki.lockState().then(function doTheOther (state) {
      if (state === nukiApiBridge.lockState.UNLOCKED) {
        return nuki.lockAction(nukiApiBridge.lockAction.LOCK);
      } else {
        return nuki.lockAction(nukiApiBridge.lockAction.UNLOCK);
      }
    }).delay(15000).then(function endTest () { // Wait 15 seconds for all callbacks to be received
      return callback.remove(); // Remove ours
    })
  });
}).then(function endAll () {
  setTimeout(process.exit.bind(process, 0), 5000);
}).catch(function showError (error) {
  setTimeout(process.exit.bind(process, 1), 5000);
  throw error;
});