class EmailVerifyV2Handler {
  constructor (emailMgr, claimMgr) {
    this.name = 'EmailVerifyHandlerV2'
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

    try {
      const decodedJWT = this.claimMgr.decode(body.verification).payload
      const did = decodedJWT.iss
      const userCode = decodedJWT.claim.code

      const email = await this.emailMgr.verify(did, userCode)

      if (email) {
        try {
          const [fullVerification, hasEmailVerification] = await Promise.all([
            this.claimMgr.issueEmailFull(did, email),
            this.claimMgr.issueEmailHas(did)
          ])
          cb(null,
            {
              status: 'success',
              data: {
                'full-verification': fullVerification,
                'has-email-verification': hasEmailVerification,
              }
            })
        } catch (e) {
          cb({ code: 500, message: 'could not issue a verification claim' })
        }
      } else {
        cb({ code: 403, message: 'code not found or expired' })
      }
    } catch (e) {
      cb({ code: 500, message: 'error while verify the code given by the user' })
    }
  }
}

module.exports = EmailVerifyV2Handler
