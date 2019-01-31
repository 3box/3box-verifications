const didJWT = require('did-jwt')

class ClaimMgr {
  constructor () {
    this.signerPrivate = null
    this.signerPublic = null
  }

  isSecretsSet () {
    return (this.signerPrivate !== null || this.signerPublic !== null)
  }

  setSecrets (secrets) {
    this.signerPrivate = secrets.KEYPAIR_PRIVATE_KEY
    this.signerPublic = secrets.KEYPAIR_PUBLIC_KEY
  }

  async issue (did, handle, url) {
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

  decode (jwt) {
    return didJWT.decodeJWT(jwt)
  }

  getPublicKeyHex () {
    if (!this.signerPublic) throw new Error('no keypair created yet')
    return this.signerPublic
  }
}

module.exports = ClaimMgr
