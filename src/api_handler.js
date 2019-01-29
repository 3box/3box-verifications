// eslint-disable-next-line import/prefer-default-export
const AWS = require('aws-sdk')

const TwitterHandler = require('./api/twitter')
const DidDocumentHandler = require('./api/diddoc')

const TwitterMgr = require('./lib/twitterMgr')
const ClaimMgr = require('./lib/claimMgr')

let twitterMgr = new TwitterMgr()
let claimMgr = new ClaimMgr()

const doHandler = (handler, event, context, callback) => {
  handler.handle(event, context, (err, resp) => {
    let body = JSON.stringify({})
    if (handler.name === 'DidDocumentHandler') {
      body = JSON.stringify(resp)
    } else {
      body = JSON.stringify({
        status: 'success',
        data: resp
      })
    }
    let response
    if (err == null) {
      response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: body
      }
    } else {
      let code = 500
      if (err.code) code = err.code
      let message = err
      if (err.message) message = err.message

      response = {
        statusCode: code,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          status: 'error',
          message: message
        })
      }
    }

    callback(null, response)
  })
}

const preHandler = (handler, event, context, callback) => {
  if (!twitterMgr.isSecretsSet() || !claimMgr.isSecretsSet()) {
    const kms = new AWS.KMS()
    kms
      .decrypt({ CiphertextBlob: Buffer.from(process.env.SECRETS, 'base64') })
      .promise()
      .then(data => {
        const decrypted = String(data.Plaintext)
        twitterMgr.setSecrets(JSON.parse(decrypted))
        claimMgr.setSecrets(JSON.parse(decrypted))
        doHandler(handler, event, context, callback)
      })
  } else {
    doHandler(handler, event, context, callback)
  }
}

let twitterHandler = new TwitterHandler(twitterMgr, claimMgr)
module.exports.twitter = (event, context, callback) => {
  preHandler(twitterHandler, event, context, callback)
}

let didDocumentHandler = new DidDocumentHandler(claimMgr)
module.exports.diddoc = (event, context, callback) => {
  preHandler(didDocumentHandler, event, context, callback)
}
