const AWS = require('aws-sdk')
const {
  RedisStore,
  NullStore
} = require('./store')
const fetch = require('node-fetch')

const hubEmail = (data) => `<!DOCTYPE html>
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
</html>`;

const dashboardEmail = (data) => `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
</head>

<body style="background-color: #F5F6FA; display: flex; justify-content: center; align-items: center; padding: 50px 0">
  <div style="background-color: white; border-radius: 20px; width: 400px; border: 1px solid rgb(218, 218, 218)">
    <div style="padding: 18px 24px; background: linear-gradient(to bottom, #1168df 0%, #27a1f1 100%); border-top-left-radius: 20px; border-top-right-radius: 20px">
      <h2 style="color: white">
        Confirm your email
    </h2>
    </div>

    <div style="padding: 18px 24px 24px 24px">
      <p>Hi ${data.name},<br /><br /></p>
      <p>Complete your 3Box Dashboard registration by clicking on the link below.</p>
      <p>If you did not request email verification from 3Box Dashboard, do not click this link! </p>

      <span>
        Complete registration by clicking
        <a href="http://localhost:3001/verify?code=${data.code}" style="marginLeft: 4px">
            here
        </a>
      </span>

      <p>
        This code will expire in 12 hours. If you do not successfully verify your email before then, you will need to
        restart the process.
      </p>
      <p>If you believe that you have received this message in error, please email support@3box.io.</p>
    </div>
  </div>
</body>
</html>`

class EmailMgr {
  constructor(store = new NullStore()) {
    AWS.config.update({
      region: 'us-west-2'
    })
    this.ses = new AWS.SES()
    this.redis_host = null
    this.redisStore = store
  }

  isSecretsSet() {
    return (this.redis_host !== null)
  }

  setSecrets(secrets) {
    this.redis_host = 'localhost'
    // this.redis_host = secrets.REDIS_HOST
  }

  async sendVerification(email, did, address, isFromDashboard) {
    if (!email) throw new Error('no email')
    const code = this.generateCode()
    await this.storeCode(email, code)
    await this.storeDid(email, did)
    let name
    if (address) {
      try {
        const res = await fetch(`https://ipfs.3box.io/profile?address=${address}`)
        let profile = await res.json()
        name = profile.name ? `${profile.name} ${profile.emoji ? profile.emoji : ''}` : 'there 👋';
      } catch (error) {
        console.log('error trying to get profile', error)
      }
    }

    let template
    let emailData = {
      name,
      code,
      did,
    }

    if (isFromDashboard) {
      template = dashboardEmail(emailData)
    } else {
      template = hubEmail(emailData);
    }

    const params = {
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: template
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

  async verify(did, userCode) {
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

  generateCode() {
    return Math.floor(100000 + Math.random() * 900000)
  }

  async storeCode(email, code) {
    this.redisStore = new RedisStore({
      host: this.redis_host,
      port: 6379
    })
    try {
      this.redisStore.write(email, code)
    } catch (e) {
      console.log('error while trying to store the code', e.message)
    } finally {
      this.redisStore.quit()
    }
  }

  async storeDid(email, did) {
    this.redisStore = new RedisStore({
      host: this.redis_host,
      port: 6379
    })
    try {
      this.redisStore.write(did, email)
    } catch (e) {
      console.log('error while trying to store the did', e.message)
    } finally {
      this.redisStore.quit()
    }
  }

  async getStoredCode(did) {
    let email
    let storedCode
    this.redisStore = new RedisStore({
      host: this.redis_host,
      port: 6379
    })
    try {
      email = await this.redisStore.read(did)
      storedCode = await this.redisStore.read(email)
    } catch (e) {
      console.log('error while trying to store the did', e.message)
    } finally {
      this.redisStore.quit()
    }
    return {
      email,
      storedCode
    }
  }
}

module.exports = EmailMgr