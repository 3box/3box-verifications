import AWS from 'aws-sdk'
import MockAWS from 'aws-sdk-mock'
MockAWS.setSDKInstance(AWS)

const apiHandler = require('../api_handler')

describe('apiHandler', () => {
    beforeAll(() => {
        // this keypair is a test one, not a secret really
        let secrets = {
            TWITTER_CONSUMER_KEY: 'FAKE',
            TWITTER_CONSUMER_SECRET: 'FAKE',
            KEYPAIR_PRIVATE_KEY: '4baba8f4a',
            KEYPAIR_PUBLIC_KEY: '04fff936f805ee2'
        }
        MockAWS.mock('KMS', 'decrypt', Promise.resolve({ Plaintext: JSON.stringify(secrets) }))
        process.env.SECRETS = secrets
    })

    test('twitter', done => {
        apiHandler.twitter({}, {}, (err, res) => {
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            done()
        })
    })

    test('diddoc', done => {
        apiHandler.diddoc({}, {}, (err, res) => {
            expect(err).toBeNull()
            expect(res).not.toBeNull()
            done()
        })
    })

})
