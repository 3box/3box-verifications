import AWS from 'aws-sdk'
import MockAWS from 'aws-sdk-mock'
MockAWS.setSDKInstance(AWS)

const apiHandler = require('../api_handler')

describe('apiHandler', () => {
    beforeAll(() => {
        let secrets = {
            TWITTER_CONSUMER_KEY: 'FAKE',
            TWITTER_CONSUMER_SECRET: 'FAKE',
            KEYPAIR_PRIVATE_KEY: 'fa09a3ff0d486be2eb69545c393e2cf47cb53feb44a3550199346bdfa6f53245',
            KEYPAIR_DID: 'did:https:test.com'
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
