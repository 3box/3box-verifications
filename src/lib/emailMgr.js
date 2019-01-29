const AWS = require('aws-sdk')

class EmailMgr {
  constructor (redisStore) {
    this.ses = new AWS.SES()
    this.redisStore = redisStore
  }

  async sendVerification (email) {
    const code = this.generateCode()
    await this.storeCode(email, code)
    let params = {
      Destination: {
        ToAddresses: [email]
      },
      Source: 'verifications@3box.io' /* required */,
      Template: 'TEMPLATE_NAME' /* required */,
      TemplateData:
        '{ "VERIFICATION_CODE":code }' /* required */,
      ReplyToAddresses: ['verifications@3box.io']
    }

    let sendPromise = this.ses.sendTemplatedEmail(params).promise()

    sendPromise
      .then(function (data) {
        console.log(data)
      })
      .catch(function (err) {
        console.error(err, err.stack)
      })
  }

  async checkVerification () {
    throw new Error('not implemented yet')
  }

  generateCode () {
    return Math.floor(100000 + Math.random() * 900000)
  }

  async storeCode (email, code) {
    this.redisStore.write(email, code)
  }
}

module.exports = EmailMgr
