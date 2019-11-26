const didJWT = require('did-jwt')
import { initIPFS } from "ipfs-s3-dag-get"
const register3idResolver = require('3id-resolver')
const registerMuPortResolver = require("muport-did-resolver")

// Register resolvers
function register (ipfs) {
  register3idResolver(ipfs)
  registerMuPortResolver(ipfs)
}

class ClaimMgr {
  constructor () {
    this.signerPrivate = null
    this.signerPublic = null
  }

  isSecretsSet () {
    return ( this.ipfs !== null && (this.signerPrivate !== null || this.signerPublic !== null))
  }

  async setSecrets (secrets) {
    this.signerPrivate = secrets.KEYPAIR_PRIVATE_KEY
    this.signerPublic = secrets.KEYPAIR_PUBLIC_KEY
    const ipfsPath = secrets.IPFS_PATH
    const bucket = secrets.AWS_BUCKET_NAME
    this.ipfs = await initIPFS({ ipfsPath, bucket})
    register(this.ipfs)
  }

  async issueTwitter (did, handle, url) {
    const signer = didJWT.SimpleSigner(this.signerPrivate)
    return didJWT.createJWT(
      {
        sub: did,
        iat: Math.floor(Date.now() / 1000),
        claim: {
          twitter_handle: handle,
          twitter_proof: url
        }
      },
      {
        issuer: 'did:https:verifications.3box.io',
        signer
      }).then(jwt => {
      return jwt
    })
      .catch(err => {
        console.log(err)
      })
  }

  async issueEmail (did, email) {
    const signer = didJWT.SimpleSigner(this.signerPrivate)
    return didJWT.createJWT(
      {
        sub: did,
        iat: Math.floor(Date.now() / 1000),
        claim: {
          email_address: email
        }
      },
      {
        issuer: 'did:https:verifications.3box.io',
        signer
      }).then(jwt => {
      return jwt
    })
      .catch(err => {
        console.log(err)
      })
  }

  decode (jwt) {
    if (!this.signerPublic) throw new Error('no keypair created yet')
    return didJWT.decodeJWT(jwt)
  }

  getPublicKeyHex () {
    if (!this.signerPublic) throw new Error('no keypair created yet')
    return this.signerPublic
  }

  async verifyToken(token) {
    if (!token) throw new Error("no token");
    return didJWT.verifyJWT(token);
  }
}

module.exports = ClaimMgr
