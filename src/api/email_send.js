class EmailSendHandler {
  constructor (emailMgr, isV2 = false) {
    this.name = 'EmailSendHandler'
    this.emailMgr = emailMgr
    this.isV2 = isV2
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
      if (!body.address) {
        await this.emailMgr.sendVerification(body.email_address, body.did, null)
      } else if (!this.isV2) {
        await this.emailMgr.sendVerification(body.email_address, body.did, body.address)
      } else {
        cb({ code: 400, message: 'adress is not allowed' })
        return
      }
    } catch (e) {
      cb({ code: 500, message: 'error while trying to send the verification code' })
      return
    }

    if (this.isV2) {
      cb(null, { status: 'success' })
    } else {
      cb(null)
    }
  }
}

module.exports = EmailSendHandler
