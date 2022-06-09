const Library = require("./library");
const _LOCK = require("../_LOCK.js");
const _OPENER = require("../_OPENER");
class NukiTools {
    static DEVICES = {};
    /**
     * @see https://developer.nuki.io/t/nuki-opener-different-smartlock-id-in-bridge-api-compared-to-web-api/3195/2?u=zefau
     */
    static getNukiHex(nukiId) {
        return nukiId.toString(16).substr(-8);
    }

    /**
     * Update states of Nuki Door based on payload.
     * @param {Library} library
     */
    static updateLock(payload, library, adapter) {
        library.set(Library.CONNECTION, true);

        // get NukiHexId or NukiId
        if (payload.nukiId && !payload.nukiHexId) {
            payload.nukiHexId = NukiTools.getNukiHex(payload.nukiId);
        }
        else if (!payload.nukiId && payload.nukiHexId) {
            payload.nukiId = parseInt(payload.nukiHexId, 16);
        }
        else {
            return false;
        }

        // index Nuki
        let type, path;
        if (this.DEVICES[payload.nukiHexId] === undefined || !this.DEVICES[payload.nukiHexId].path) {
            let actions = null;

            //
            if (!payload.name || payload.deviceType === undefined) {
                adapter.log.debug('Error updating device due to missing data (' + JSON.stringify(payload) + ').');
                return false;
            }

            // Nuki Smartlock
            if (payload.deviceType === 0 || !payload.deviceType) {
                library.set(library.getNode('smartlocks'));
                type = 'Smartlock';
                actions = _LOCK.ACTIONS;
            }

            // Nuki Box
            else if (payload.deviceType === 1) {
                library.set(library.getNode('boxes'));
                type = 'Box';
            }

            // Nuki Opener
            else if (payload.deviceType === 2) {
                library.set(library.getNode('openers'));
                type = 'Opener';
                actions = _OPENER.ACTIONS;
            }

            // Nuki Smart Door
            if (payload.deviceType === 3) {
                library.set(library.getNode('smartlocks'));
                type = 'Smart Door';
                actions = _LOCK.ACTIONS;
            }

            // Nuki Smartlock 3.0
            if (payload.deviceType === 4) {
                library.set(library.getNode('smartlocks'));
                type = 'Smartlock';
                actions = _LOCK.ACTIONS;
            }

            // index device
            path = type.toLowerCase() + 's.' + library.clean(payload.name, true, '_');
            this.DEVICES[payload.nukiHexId] = { 'id': payload.nukiId, 'hex': payload.nukiHexId, 'smartlockId': parseInt(payload.deviceType + payload.nukiHexId, 16), 'name': payload.name, 'type': type, 'path': path, 'bridge': null };

            // add action
            if (actions !== null) {
                let actionPath = path + '._ACTION';
                library.set({ ...library.getNode('action'), 'node': actionPath, 'common': { 'write': true, 'states': actions }}, 0);
                adapter.subscribeStates(actionPath); // attach state listener

                for (let key in actions) {

                    if (key > 0) {
                        let action = actions[key];
                        library.set({ 'description': 'Trigger ' + action + ' action', 'type': 'boolean', 'role': 'button', 'node': actionPath + '.' + action.replace(/ /g, '_'), 'common': { 'write': true }}, false);
                        adapter.subscribeStates(actionPath + '.' + action.replace(/ /g, '_')); // attach state listener
                    }
                }
            }
        }

        // retrieve Nuki name
        else {
            path = this.DEVICES[payload.nukiHexId].path;
        }


        // update state
        if (payload.deviceType === 2 && payload.state && payload.state.state === 1 && payload.mode === 3) { // change ONLINE & CONTINOUS to RING_TO_OPEN
            payload.state.state = 3;
        }

        // update bridge
        if (payload.bridge !== undefined) {
            this.DEVICES[payload.nukiHexId].bridge = payload.bridge;
        }

        // update instance
        if (payload.nuki !== undefined) {
            this.DEVICES[payload.nukiHexId].instance = payload.nuki;
        }

        // update config
        if (payload.config !== undefined) {
            this.DEVICES[payload.nukiHexId].config = payload.config;
        }

        // update advancedConfig
        if (payload.advancedConfig !== undefined) {
            this.DEVICES[payload.nukiHexId].advancedConfig = payload.advancedConfig;
        }

        // update openerAdvancedConfig
        if (payload.openerAdvancedConfig !== undefined) {
            this.DEVICES[payload.nukiHexId].openerAdvancedConfig = payload.openerAdvancedConfig;
        }

        // add additional states
        if (this.DEVICES[payload.nukiHexId].type === 'Smartlock' && payload.state && payload.state.doorState) {
            payload.state.closed = payload.state.doorState;
        }

        if (this.DEVICES[payload.nukiHexId].type === 'Smartlock' && payload.state && payload.state.state) {
            payload.state.locked = payload.state.state;
        }

        if (this.DEVICES[payload.nukiHexId].type === 'Smart Door' && payload.state && payload.state.doorState) {
            payload.state.closed = payload.state.doorState;
        }

        if (this.DEVICES[payload.nukiHexId].type === 'Smart Door' && payload.state && payload.state.state) {
            payload.state.locked = payload.state.state;
        }

        if (payload.state && payload.state.state && payload.state.state !== library.getDeviceState(path + '.state.lockState')) {
            payload.state.lastStateUpdate = Date.now();
        }

        // remove unnecessary states
        if (payload.state && payload.state.stateName) {
            delete payload.state.stateName;
        }
        if (payload.state && payload.state.deviceType) {
            delete payload.state.deviceType;
        }
        if (payload.nuki) {
            delete payload.nuki;
        }

        // create / update device
        adapter.log.debug('Updating device ' + path + ' with payload: ' + JSON.stringify(payload));
        library.set({node: path, description: '' + this.DEVICES[payload.nukiHexId].name, role: 'channel'});
        library.readData('', payload, path);
    }
}

module.exports = { NukiTools };
