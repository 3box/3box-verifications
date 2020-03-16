import { checkIsFromDashboard } from './utils';

class EmailVerifyHandler {
  constructor (emailMgr, claimMgr, analytics) {
    this.name = 'EmailVerifyHandler'
    this.emailMgr = emailMgr
    this.claimMgr = claimMgr
    this.analytics = analytics
  }

  async handle (event, context, cb) {
    let body
    try {
      body = JSON.parse(event.body)
    } catch (e) {
      cb({ code: 400, message: 'no json body: ' + e.toString() })
      return
    }
    console.log('eventtttt', event)
    const isFromDashboard = checkIsFromDashboard(event.headers, body)

    if (!body.verification) {
      cb({ code: 403, message: 'no verification' })
      this.analytics.trackVerifyEmail(null, 403)
      return
    }

    let decodedJWT
    let verificationClaim
    let did
    try {
      console.log('received verification', body.verification)
      const verified = await this.claimMgr.verifyToken(body.verification)
      console.log(' verification verified', verified)
      decodedJWT = verified.payload
      console.log('payload', verified.payload)
      did = decodedJWT.iss
      let userCode = decodedJWT.claim.code
      console.log('userCode', userCode)
      let email = await this.emailMgr.verify(did, userCode)
      console.log('verification email', email)
      if (email) {
        try {
          verificationClaim = await this.claimMgr.issueEmail(did, email, userCode)
          console.log('verificationClaim', verificationClaim)
        } catch (e) {
          cb({ code: 500, message: 'could not issue a verification claim' })
          this.analytics.trackVerifyEmail(did, 500)
          return
        }

        // if (isFromDashboard) {
        //   // save claim to user db
        // } else {
          cb(null, { verification: verificationClaim })
        // }

        this.analytics.trackVerifyEmail(did, 200)
      } else {
        cb({ code: 403, message: 'code not found or expired' })
        this.analytics.trackVerifyEmail(did, 403)
        return
      }
    } catch (e) {
      cb({ code: 500, message: 'error while verify the code given by the user' })
      this.analytics.trackVerifyEmail(did, 500)
    }
  }
}
module.exports = EmailVerifyHandler
