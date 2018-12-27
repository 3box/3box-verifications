const didJWT = require('did-jwt')


class ClaimMgr {
    constructor() {
        this.signerKey = null
        this.signerDid = null
    }

    isSecretsSet() {
        return (this.signerKey !== null || this.signerDid !== null)
    }

    setSecrets(secrets) {
        this.signerKey = secrets.KEYPAIR_PRIVATE_KEY
        this.signerDid = secrets.KEYPAIR_DID
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

    getEthereumAddress(){
       if (!this.signerDid) throw new Error("no keypair configured yet")
       return this.signerDid.split(':')[2]
   }

}

module.exports = ClaimMgr;
