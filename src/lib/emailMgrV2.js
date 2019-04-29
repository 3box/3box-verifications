const nacl = require('tweetnacl')
nacl.util = require('tweetnacl-util')
const resolve = require('did-resolver').default
const registerResolver = require('muport-did-resolver')
const Multihash = require('multihashes')
const sha256 = require('js-sha256').sha256
const EmailMgr = require('./emailMgr')
const { RedisStore } = require('./store')
const IPFS = require('ipfs-mini')

const IPFS_NODE = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })
registerResolver(IPFS_NODE)

const SESSION_TTL = 1000 * 3600 * 12 // 12 hours in ms
const ENCRYPTION_KEY_SUFFIX = '#encryptionKey'

/**
 * Overrides the regular EmailMgr and tooling
 * to provide the special behavior of the new API.
 *
 * The old API is temporary, this is designed to keep the change
 * as tight as possible, so that removing the old code is easy
 * (merge the classes).
 */
class EmailMgrV2 extends EmailMgr {
  async sendVerification (email, did) {
    if (!email) throw new Error('no email')

    const ts = (new Date()).getTime()
    const code = this.generateCode()
    const encryptionKey = this.getDIDDetails(did)

    const hashedCode = this.hashCode(code)
    const { nonce, ciphertext, publicKey } = this.encryptCode(encryptionKey, code)

    await this.storeSession({ did, email, hashedCode, ts })

    const name = await this.getUserNameFromDID(did)

    // Prepare the payload
    const payloadStr = JSON.stringify({ nonce, ciphertext, publicKey })
    const payload = nacl.util.encodeBase64(nacl.utils.decodeUTF8(payloadStr))

    const url = `https://accounts.3box.io/verify-email?code=${payload}`

    const content =
      `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        </head>
        <body>
            <p>Hi ${name},<br /></p>
            <p>To complete the verification of this email address, visit the following address:</p>
            <p><a href="${url}">${url}</a></p>
            <p>This code will expire in 12 hours. If you do not successfully verify your email before then, you will need to
              restart the process.</p>
            <p>If you believe that you have received this message in error, please email support@3box.io.</p>
        </body>
        </html>`

    return this.sendEmail({ email, content })
  }

  async verify (did, userCode) {
    try {
      const session = await this.getStoredSession(did)
      const hashedCode = this.hashCode(code)

      // TODO: we should verify the claim from the user somehow

      const now = (new Date()).getTime()

      if (now + SESSION_TTL > session.ts) {
        return null
      } else if (hashedCode === session.hashedCode) {
        return session.email
      } else {
        return null
      }
    } catch (e) {
      console.log('error while trying to retrieve the code', e.message)
    }
  }

  encryptCode (encryptionKey, code) {
    const nonce = nacl.randomBytes(24)
    const toPublic = nacl.util.decodeBase64(encryptionKey.publicKeyBase64)

    code = nacl.util.decodeUTF8('' + code)

    const ephemeralKeyPair = nacl.box.keyPair()

    const ciphertext = nacl.box(code, nonce, toPublic, ephemeralKeyPair.secretKey)

    return {
      nonce: nacl.util.encodeBase64(nonce),
      ciphertext: nacl.util.encodeBase64(ciphertext),
      publicKey: ephemeralKeyPair.publicKey
    }
  }

  generateCode () {
    // Cast to string to simplify encoding, ciphering, and storage
    return '' + super.generateCode()
  }

  hashCode (code) {
    const digest = Buffer.from(sha256.digest(code))
    return Multihash.encode(digest, 'sha2-256').toString('hex')
  }

  async getDIDDetails (did) {
    const doc = await resolve(did)

    const publicKeys = doc.publicKey
    const encryptionKeys = publicKeys.filter(x => {
      x.id.endsWith(ENCRYPTION_KEY_SUFFIX)
    })

    if (encryptionKeys.length !== 1) {
      throw new Error(`Invalid number of encryption key in the did doc: ${encryptionKeys}`)
    }

    return encryptionKeys[0]
  }

  storeSession ({ did, email, hashedCode, ts }) {
    // TODO: store the session info in redis
    this.redisStore = new RedisStore({ host: this.redis_host, port: 6379 })
    try {
      const content = JSON.stringify({ email, hashedCode, ts })
      this.redisStore.write(`v2:${did}`, content)
    } catch (e) {
      console.log('error while trying to store the code', e.message)
    } finally {
      this.redisStore.quit()
    }
  }

  async getStoredSession (did) {
    this.redisStore = new RedisStore({ host: this.redis_host, port: 6379 })
    try {
      const session = await this.redisStore.read(`v2:${did}`)
      return JSON.parse(session)
    } catch (e) {
      console.log('error while trying to retrieve the session content', e.message)
    } finally {
      this.redisStore.quit()
    }
  }
}

module.exports = EmailMgrV2
