var assert = require('assert');
var API = require('../index');
var Promise = require('bluebird');

describe('Nuki Bridge API', function () {
  var bridgeInstance;
  var nuki;

  before(function (done) {
    // Start dummy bridge
    require('nukiio-dummy-bridge');

    this.timeout(10000);

    // Wait for the dummy bridge to listen
    setTimeout(function () {
      done();
    }, 5000);
  });

  it('should be able to get bridge instance', function () {
    bridgeInstance = new API.Bridge('127.0.0.1', 8881, 'token');

    assert.ok(bridgeInstance);
  });

  describe('Bridge Instance', function () {
    it('should be able to get a list of connected nukis', function () {
      return bridgeInstance.list().then(function (nukis) {
        assert.ok(nukis);
        assert.equal(nukis.length, 2);
        assert.ok(nukis[0].nuki);

        nuki = nukis[0].nuki;
      });
    });

    it('should be able to get one nuki with validation', function () {
      return bridgeInstance.list().then(function (nukis) {
        return bridgeInstance.get(nukis[0].nukiId);
      });
    });

    it('should be able to get an error on getting one nuki with wrong id with validation', function () {
      return bridgeInstance.get(-1).then(function () {
        throw new Error('did not validate nuki correctly');
      }, function () {
        return 'everything ok!';
      });
    });

    it('should be able to get one nuki with wrong id without validation', function () {
      return bridgeInstance.get(-1, true);
    });

    describe('Nuki Instance', function () {
      var counter = 0;

      before(function () {
        // Add `batteryCritical`-flag
        nuki._originalRequest = nuki._request;
        nuki._request = function mockRequest (action, actionParameter) {
          if (!actionParameter) {
            actionParameter = '';
          }

          actionParameter += '&batteryCritical=true';

          return nuki._originalRequest(action, actionParameter);
        };
      });

      it('should emit batteryCritical', function () {
        var batteryCriticalFired = false;

        nuki.on('batteryCritical', function () {
          batteryCriticalFired = true;
        });

        return nuki.lockState().then(function () {
          assert.equal(batteryCriticalFired, true);
        });
      });

      it('should do lock action', function () {
        return nuki.lockAction(API.lockAction.LOCK);
      });

      it('should get lock state', function () {
        return nuki.lockState().then(function (result) {
          assert.equal(result, API.lockState.LOCKED);
        });
      });
    });
  });

  describe('Bridge Discovery', function () {
    before(function () {
      API.DiscoveredBridge.enableTestMode();
    });

    it('should be able to get all local bridges', function () {
      return API.DiscoveredBridge.discover().then(function (bridges) {
        assert.ok(bridges.length);

        return bridges[0].connect('token').then(function (bridge) {
          assert.ok(bridge);
          assert.ok(bridge.token);

          bridgeInstance = bridge;
        });
      });
    });
  });
});
