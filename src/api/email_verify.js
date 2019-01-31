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
    try {
      decodedJWT = this.claimMgr.decode(body.verification)
      if (this.emailMgr.verify(decodedJWT.claim.code, decodedJWT.iss)) {
        cb(null)
      } else {
        cb({ code: 403, message: 'code not found or expired' })
      }
    } catch (e) {
      cb({ code: 500, message: 'error while verify the code given by the user' })
    }
  }
}
module.exports = EmailVerifyHandler
