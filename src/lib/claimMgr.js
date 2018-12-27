const didJWT = require('did-jwt')


class ClaimMgr {
    constructor() {
        this.signerKey = null
    }

    isSecretsSet() {
        return (this.signerKey !== null)
    }

    setSecrets(secrets) {
        this.signerKey = secrets.KEYPAIR_PRIVATE_KEY
    }

   async issue(did, handle, url){
       const signer = didJWT.SimpleSigner(this.signerKey)
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
            });

   }

}

module.exports = ClaimMgr;
