'use strict';
const Nuki = require("nuki-web-api");
const Library = require("./library");
const NukiTools = require("./nuki-tools");

class WebApiHandler {
    active = false;
    api = null;
    refreshCycleWebApi = null;
    adapter = null;
    /**
     *
     * @type {null | Library}
     */
    library = null;

    constructor() {
    }

    /**
     *
     * @param adapter
     * @param {Library} library
     * @returns {boolean}
     */
    initialize(adapter, library) {
        this.adapter = adapter;
        this.library = library;
        const hasWebApi = adapter.config.refreshWebApi !== 0;
        if (!hasWebApi) {
            return false;
        }
        if (!adapter.config.api_token) {
            adapter.log.info('No Nuki Web API token provided.');
            return false;
        }
        this.api = new Nuki(adapter.config.api_token);

        // periodically refresh settings
        if (!adapter.config.refreshWebApi) {
            adapter.config.refreshWebApi = 0;
        } else if (adapter.config.refreshWebApi > 0 && adapter.config.refreshWebApi < 5) {
            adapter.log.warn('Due to performance reasons, the refresh rate can not be set to less than 5 seconds. Using 5 seconds now for Nuki Web API.');
            adapter.config.refreshWebApi = 5;
        }

        if (adapter.config.refreshWebApi > 0) {
            this.active = true;

            adapter.log.info('Polling Nuki Web API with a frequency of ' + adapter.config.refreshWebApi + 's.');
            this.refreshCycleWebApi = setInterval(
                this.getWebApi.bind(this),
                Math.round(parseInt(adapter.config.refreshWebApi) * 1000)
            );

            // get locks
            this.getWebApi();
        } else {
            adapter.log.info('Polling Nuki Web API deactivated.');
        }
        library.set(Library.CONNECTION, true);
        return true;
    }

    /**
     * Retrieve from Web API.
     *
     */
    getWebApi() {
        if (!this.active) {
            return;
        }
        this.library.set(
            this.library.getNode('webApiSync'),
            true,
            {'force': true}
        );
        this.library.set(
            this.library.getNode('webApiLast'),
            new Date().toISOString().substring(0, 19) + '+00:00'
        );

        // get nukis
        this.adapter.log.silly('getWebApi(): Retrieving from Nuki Web API..');
        this.api.getSmartlocks()
            .then(this.processSmartLocksResponse.bind(this))
            .catch(err => {
                this.adapter.log.warn('getWebApi(): Error retrieving smartlocks: ' + err.message);
            });

        // get notifications
        this.api.getNotification().then(notifications => {
            this.library.readData('notifications', notifications, 'info');
        }).catch(err => {
            this.adapter.log.warn('getWebApi(): Error retrieving notifications: ' + err.message);
        });
    }

    processSmartLocksResponse(smartlocks) {
        this.adapter.log.debug('getWebApi(): ' + JSON.stringify(smartlocks));
        smartlocks.forEach(smartlock => {

            // remap states
            smartlock.nukiHexId = NukiTools.getNukiHex(smartlock.smartlockId);
            smartlock.deviceType = smartlock.type;
            if (smartlock.state) {
                smartlock.state.timestamp = new Date().toISOString().substring(0, 19) + '+00:00';
            }

            if (!this.active || this.adapter.config.bridges.length > 0) {
                // delete states (prefer Bridge API)
                delete smartlock.type;
                if (smartlock.state) {
                    delete smartlock.state.state;
                }
                if (smartlock.state) {
                    delete smartlock.state.mode;
                }

                // get config
                if (this.adapter.config.syncConfig !== true) {
                    if (smartlock.config) {
                        delete smartlock.config;
                    }
                    if (smartlock.advancedConfig) {
                        delete smartlock.advancedConfig;
                    }
                    if (smartlock.openerAdvancedConfig) {
                        delete smartlock.openerAdvancedConfig;
                    }
                    if (smartlock.webConfig) {
                        delete smartlock.webConfig;
                    }
                }
            }

            // update lock
            NukiTools.updateLock(smartlock, this.library, this.adapter);

            // get logs
            this.api.getSmartlockLogs(smartlock.smartlockId, {limit: 1000})
                .then(log => {
                    this.library.set({
                        node: NukiTools.DEVICES[smartlock.nukiHexId].path + '.logs',
                        description: 'Logs / History of Nuki',
                        role: 'history'
                    }, JSON.stringify(log.slice(0, 250)));

                }).catch(err => {
                this.adapter.log.warn('getWebApi(): Error retrieving logs: ' + err.message);
            });

            // get users
            if (!this.adapter.config.syncUsers) {
                return;
            }
            this.api.getSmartlockAuth(smartlock.smartlockId).then(users => {
                this.library.set({
                    ...this.library.getNode('users'),
                    'node': NukiTools.DEVICES[smartlock.nukiHexId].path + '.users'
                });
                users.forEach(user => {
                    user.name = user.name || 'unknown';

                    let nodePath = NukiTools.DEVICES[smartlock.nukiHexId].path + '.users.' + this.library.clean(user.name, true, '_');
                    this.library.set({node: nodePath, description: 'User ' + user.name, role: 'channel'});
                    this.library.readData('', user, nodePath);
                });

            }).catch(err => {
                this.adapter.log.warn('getWebApi(): Error retrieving users: ' + err.message);
            });
        });
    }

    unload() {
        if (this.refreshCycleWebApi !== null) {
            clearInterval(this.refreshCycleWebApi);
        }
    }

    setConfig(smartLockID, configuration, state) {
        this.api.setConfig(smartLockID, configuration)
            .then(() => {
                setTimeout(this.getWebApi.bind(this), 3 * 1000);
                this.adapter.log.info(`Set configuration ${state} to ${configuration[state]}.`);
            })
            .catch(err => this.adapter.log.warn(err));
    }

    setAdvancedConfig(smartLockID, configuration, state) {
        this.api.setAdvancedConfig(smartLockID, configuration)
            .then(() => {
                setTimeout(this.getWebApi.bind(this), 3 * 1000);
                this.adapter.log.info(`Set advanced configuration ${state} to ${configuration[state]}.`);
            })
            .catch(err => this.adapter.log.warn(err));
    }
}

module.exports = WebApiHandler;
