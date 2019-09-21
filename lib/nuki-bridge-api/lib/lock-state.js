/**
 * The possible lock states.
 *
 * @enum {Number}
 */
var LockState = {
  UNCALIBRATED: 0,
  LOCKED: 1,
  UNLOCKING: 2,
  UNLOCKED: 3,
  LOCKING: 4,
  UNLATCHED: 5,
  UNLOCKED_LOCK_N_GO: 6,
  UNLATCHING: 7,
  MOTOR_BLOCKED: 254,
  UNDEFINED: 255
};

var LockStateV1_2 = {
  UNCALIBRATED: 0,
  LOCKED: 1,
  UNLOCKING: 2,
  UNLOCKED: 3,
  LOCKING: 4,
  UNLATCHED: 5,
  UNLOCKED_LOCK_N_GO: 6,
  UNLATCHING: 7,
  MOTOR_BLOCKED: 254,
  UNDEFINED: 255
};

module.exports = LockState;
module.exports.V1_2 = LockStateV1_2;