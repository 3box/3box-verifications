class EmailSendHandler {
  constructor (emailMgr) {
    this.name = 'EmailSendHandler'
    this.emailMgr = emailMgr
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
    if (!body.email_address) {
      cb({ code: 400, message: 'no email address' })
      return
    }

    try {
      if (body.address) {
        await this.emailMgr.sendVerification(body.email_address, body.did, body.address)
      } else {
        await this.emailMgr.sendVerification(body.email_address, body.did)
      }
      cb(null)
      return
    } catch (e) {
      cb({ code: 500, message: 'error while trying to send the verification code' })
    }
  }
}
module.exports = EmailSendHandler
