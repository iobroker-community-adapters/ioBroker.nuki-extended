/**
 * The possible lock actions.
 *
 * @enum {Number}
 */
var LockAction = {
  UNLOCK: 1,
  LOCK: 2,
  UNLATCH: 3,
  LOCK_N_GO: 4,
  LOCK_N_GO_WITH_UNLATCH: 5
};

module.exports = LockAction;