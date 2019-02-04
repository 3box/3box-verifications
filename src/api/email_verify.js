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

    if (!body.did) {
      cb({ code: 403, message: 'no did' })
      return
    }

    if (!body.code) {
      cb({ code: 403, message: 'no verification code' })
      return
    }

    let verification_claim = ''
    let email = await this.emailMgr.verify(body.code, body.did)
    if (email) {
      try {
        verification_claim = await this.claimMgr.issueEmail(body.did, email)
      } catch (e) {
        cb({ code: 500, message: 'could not issue a verification claim' })
        return
      }
      cb(null, { verification: verification_claim })
    } else {
      cb({ code: 403, message: 'code not found or expired' })
    }
  }
}
module.exports = EmailVerifyHandler
