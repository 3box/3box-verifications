const AWS = require('aws-sdk')
const fs = require('fs')

class EmailMgr {
  constructor(redisStore) {
    this.ses = new AWS.SES()
    this.redisStore = redisStore
  }

  async sendVerification(email, did, address) {
    if (!email) throw new Error('no email')
    const code = this.generateCode()
    await this.storeCode(email, code)
    let name = 'there 👋'
    if (address) {
      //ToDo: Obtain name from profile
    }

    const params = {
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: template({
              name: name,
              code: code
            })
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Your 3Box Email Verification Code'
        }
      },
      Source: 'verifications_do-not-reply@3box.io'
    }

    // let params = {
    //   to: email,
    //   from: 'verifications_do-not-reply@3box.io',
    //   subject: 'Your 3Box Email Verification Code',
    //   message: template({
    //     name: name,
    //     code: code
    //   })
    // }

    const sendPromise = this.ses.sendEmail(params).promise()

    sendPromise
      .then(data => {
        console.log('email sent', data)
      })
      .catch(err =>  {
        console.log(err)
      })

    const template = data =>
    `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        </head>
        <body>
            <p>Hi ${data.name},<br /></p>
            <p>To complete the verification of this email address, enter the six digit code found below into the 3Box app: </p>
            <p><strong>${data.code}</strong></p>
            <p>This code will expire in 12 hours. If you do not successfully verify your email before then, you will need to
              restart the process.</p>
            <p>If you believe that you have received this message in error, please email support@3box.io.</p>
        </body>
        </html>`
  }

  async checkVerification() {
    throw new Error('not implemented yet')
  }

  generateCode() {
    return Math.floor(100000 + Math.random() * 900000)
  }

  async storeCode(email, code) {
    try {
      this.redisStore.write(email, code)
    } catch (e) {
      console.log('error while trying to store the code', e.message)
    }
  }
}

module.exports = EmailMgr
