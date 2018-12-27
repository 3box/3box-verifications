// eslint-disable-next-line import/prefer-default-export
const AWS = require('aws-sdk')

const TwitterHandler = require('./api/twitter')
const TwitterMgr = require('./lib/twitterMgr')

let twitterMgr = new TwitterMgr()

const doHandler = (handler, event, context, callback) => {
  handler.handle(event, context, (err, resp) => {
    let response
    if (err == null) {
      response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          status: 'success',
          data: resp
        })
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
          'Access-Control-Allow-Credentials': true,
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
  if (!addressMgr.isSecretsSet() || !linkMgr.isSecretsSet()) {
    const kms = new AWS.KMS()
    kms
      .decrypt({ CiphertextBlob: Buffer(process.env.SECRETS, 'base64') })
      .promise()
      .then(data => {
        const decrypted = String(data.Plaintext)
        twitterMgr.setSecrets(JSON.parse(decrypted))
        doHandler(handler, event, context, callback)
      })
  } else {
    doHandler(handler, event, context, callback)
  }
}

let twitterHandler = new TwitterHandler()
module.exports.twitter = (event, context, callback) => {
  preHandler(twitterHandler, event, context, callback)
}


