const AWS = require('aws-sdk')
const { RedisStore, NullStore } = require('./store')
const fetch = require('node-fetch')

class EmailMgr {
  constructor (storeClass = RedisStore) {
    AWS.config.update({ region: 'us-west-2' })
    this.ses = new AWS.SES()
    this.storeHost = null
    this.storeClass = storeClass
  }

  isSecretsSet () {
    return (this.storeHost !== null)
  }

  setSecrets (secrets) {
    this.storeHost = secrets.REDIS_HOST
  }

  async getUserName (address = undefined) {
    if (address) {
      try {
        const res = await fetch(`https://ipfs.3box.io/profile?address=${address}`)
        let profile = await res.json()
        return `${profile.name} ${profile.emoji}`
      } catch (error) {
        console.log('error trying to get profile', error)
      }
    }

    // Default case, just be friendly
    return 'there 👋'
  }

  async getUserNameFromDID (did = undefined) {
    if (address) {
      try {
        const res = await fetch(`https://ipfs.3box.io/profile?did=${did}`)
        let profile = await res.json()
        return `${profile.name} ${profile.emoji}`
      } catch (error) {
        console.log('error trying to get profile', error)
      }
    }

    // Default case, just be friendly
    return 'there 👋'
  }

  async sendEmail ({ email, content }) {
    const params = {
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: content
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Your 3Box Email Verification Code'
        }
      },
      ReplyToAddresses: ['verifications_do-not-reply@3box.io'],
      Source: 'verifications_do-not-reply@3box.io'
    }

    const sendPromise = this.ses.sendEmail(params).promise()

    return sendPromise
      .then(data => {
        console.log('email sent', data)
        return data
      })
      .catch(err => {
        console.log(err)
      })
  }

  async sendVerification (email, did, address) {
    if (!email) throw new Error('no email')

    const code = this.generateCode()
    await this.storeCode(email, code)
    await this.storeDid(email, did)

    const name = await this.getUserName(address)

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
            <p><span style="color:#B03A2E;font-weight:bold">${data.code}</span></p>
            <p>This code will expire in 12 hours. If you do not successfully verify your email before then, you will need to
              restart the process.</p>
            <p>If you believe that you have received this message in error, please email support@3box.io.</p>
        </body>
        </html>`

    const content = template({
      name: name,
      code: code
    })

    return this.sendEmail({ email, content })
  }

  async verify (did, userCode) {
    try {
      const res = await this.getStoredCode(did)

      if (userCode === res.storedCode) {
        return res.email
      } else {
        return null
      }
    } catch (e) {
      console.log('error while trying to retrieve the code', e.message)
    }
  }

  generateCode () {
    return Math.floor(100000 + Math.random() * 900000)
  }

  async storeCode (email, code) {
    const store = new this.storeClass({ host: this.storeHost, port: 6379 })
    try {
      store.write(email, code)
    } catch (e) {
      console.log('error while trying to store the code', e.message)
    } finally {
      store.quit()
    }
  }

  async storeDid (email, did) {
    const store = new this.storeClass({ host: this.storeHost, port: 6379 })
    try {
      store.write(did, email)
    } catch (e) {
      console.log('error while trying to store the did', e.message)
    } finally {
      store.quit()
    }
  }

  async getStoredCode (did) {
    let email
    let storedCode

    const store = new this.storeClass({ host: this.storeHost, port: 6379 })

    try {
      email = await store.read(did)
      storedCode = await store.read(email)
    } catch (e) {
      console.log('error while trying to retrieve the stored code', e.message)
    } finally {
      store.quit()
    }
    return { email, storedCode }
  }
}

module.exports = EmailMgr
