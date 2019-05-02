const EmailMgrV2 = require('../emailMgrV2')
const AWS = require('aws-sdk-mock')
const NullStore = require('../store').NullStore

const DID_LAURENT = 'did:muport:Qmb9E8wLqjfAqfKhideoApU5g26Yz2Q2bSp6MSZmc5WrNr'

describe('EmailMgrV2', () => {
  let sut

  let MOCK_RESPONSE = {
    ResponseMetadata: { RequestId: '6c4b41b4-24c1-11e9-a415-efc225a7e54a' },
    MessageId: '01010168a0230a86-0e8ba89b-3339-4979-a138-d036e959192d-000000'
  }

  const sendMailSpy = jest.fn((params, callback) => {
    callback(null, MOCK_RESPONSE)
  })

  AWS.mock('SES', 'sendEmail', sendMailSpy)

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
    sut = new EmailMgrV2(NullStore)
  })

  test('verify encryptCode', () => {
    const encryptionKey = {
      id: 'did:muport:QmRhjfL4HLdB8LovGf1o43NJ8QnbfqmpdnTuBvZTewnuBV#encryptionKey',
      type: 'Curve25519EncryptionPublicKey',
      owner: 'did:muport:QmRhjfL4HLdB8LovGf1o43NJ8QnbfqmpdnTuBvZTewnuBV',
      publicKeyBase64: 'uYGr6nD/c/2hQ3hNFrWUWAdlNoelPqduYyyafrALf2U='
    }

    const payload = sut.encryptCode(encryptionKey, '4242')

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

  test('verify session', async () => {
    // Arrange
    const session = { did: 'some-did', email: 'my@email.com', hashedCode: 'helloworld', ts: 123123 }
    await sut.storeSession(session)

    // Act
    const retrieved = await sut.getStoredSession(session.did)

    // Assert
    expect({ did: session.did, ...retrieved }).toEqual(session)
  })

  test('retrieve keys from a DID', async () => {
    const doc = await sut.getEncryptionKeyFromDID(DID_LAURENT)

    expect(doc).toBeTruthy()
    expect(doc.publicKeyBase64).toBeTruthy()
    expect(doc.type).toBeTruthy()
  })

  test('encrypt code', async () => {
    const key = await sut.getEncryptionKeyFromDID(DID_LAURENT)

    const code = sut.encryptCode(key, '4242')

    expect(code).toBeTruthy()
    expect(code.nonce).toBeTruthy()
    expect(code.ciphertext).toBeTruthy()
    expect(code.publicKey).toBeTruthy()
  })

  test('send Verification', async () => {
    // Act
    await sut.sendVerification('my@email.com', DID_LAURENT)

    // Assert
    const call = sendMailSpy.mock.calls[0]
    const content = call[0].Message.Body.Html.Data

    expect(sendMailSpy.mock.calls.length).toEqual(1)
    expect(content).toBeTruthy()
    expect(content).toContain('To complete the verification')

    const match = content.match(/href="(.*)?code=(.*)"/)

    expect(match).toBeTruthy()
    expect(match[1]).toContain('accounts.3box.io')
    expect(match[2]).toBeTruthy()
  })

  afterAll(() => {
    AWS.restore('SES')
  })
})
