class EmailVerifyHandler {
  constructor (emailMgr, claimMgr) {
    this.name = 'EmailVerifyHandler'
    this.emailMgr = emailMgr
    this.claimMgr = claimMgr
  }

  async handle (event, context, cb) {
    let body
    try {
      body = JSON.parse(event.body)
    } catch (e) {
      cb({ code: 400, message: 'no json body: ' + e.toString() })
      return
    }

    if (!body.verification) {
      cb({ code: 403, message: 'no verification' })
      return
    }

    let decodedJWT
    let verificationClaim
    try {
      decodedJWT = this.claimMgr.decode(body.verification).payload
      let did = decodedJWT.iss
      let userCode = decodedJWT.claim.code
      let email = await this.emailMgr.verify(did, userCode)
      if (email) {
        try {
          verificationClaim = await this.claimMgr.issueEmail(did, email, userCode)
        } catch (e) {
          cb({ code: 500, message: 'could not issue a verification claim' })
          return
        }
        cb(null, { verification: verificationClaim })
      } else {
        cb({ code: 403, message: 'code not found or expired' })
        return
      }
    } catch (e) {
      cb({ code: 500, message: 'error while verify the code given by the user' })
    }
  }
}
module.exports = EmailVerifyHandler
