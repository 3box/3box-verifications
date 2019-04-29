const EmailMgr = require('./emailMgr')

/**
 * Overrides the regular EmailMgr and tooling
 * to provide the special behavior of the new API.
 *
 * The old API is temporary, this is designed to keep the change
 * as tight as possible, so that removing the old code is easy
 * (merge the classes).
 */
class EmailMgrV2 extends EmailMgr {
}

module.exports = EmailMgrV2
