const EmailMgrV2 = require('../emailMgrV2')
const AWS = require('aws-sdk-mock')
const NullStore = require('../store').NullStore

describe('EmailMgrV2', () => {
  let store
  let sut
  let userEmail
  let userDid
  let userName

  let mockResponse = {
    ResponseMetadata: { RequestId: '6c4b41b4-24c1-11e9-a415-efc225a7e54a' },
    MessageId: '01010168a0230a86-0e8ba89b-3339-4979-a138-d036e959192d-000000'
  }
  AWS.mock('SES', 'sendEmail', function (params, callback) {
    callback(null, mockResponse)
  })

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
    store = new NullStore()
    sut = new EmailMgrV2(store)
    userEmail = 'mollie@3box.io'
    userDid = 'did:3:sample did'
    userName = 'Mollie the Narwhal'
  })

  test('verify encryptCode', () => {
    const encryptionKey = {
      id: 'did:muport:QmRhjfL4HLdB8LovGf1o43NJ8QnbfqmpdnTuBvZTewnuBV#encryptionKey',
      type: 'Curve25519EncryptionPublicKey',
      owner: 'did:muport:QmRhjfL4HLdB8LovGf1o43NJ8QnbfqmpdnTuBvZTewnuBV',
      publicKeyBase64: 'uYGr6nD/c/2hQ3hNFrWUWAdlNoelPqduYyyafrALf2U='
    }

    const payload = sut.encryptCode(encryptionKey, 4242)
    expect(payload).toBeTruthy()
    expect(payload.nonce).toBeTruthy()
    expect(payload.ciphertext).toBeTruthy()
    expect(payload.publicKey).toBeTruthy()
  })

  test('verify hashCode', () => {
    const code = sut.generateCode()
    const hash = sut.hashCode(code)

    expect(hash).toBeTruthy()
    expect(hash).not.toEqual(code)
  })

  afterAll(() => {
    AWS.restore('SES')
  })
})
