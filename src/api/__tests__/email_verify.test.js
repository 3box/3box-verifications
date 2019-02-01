const EmailVerifyHandler = require('../email_verify')

describe('EmailVerifyHandler', () => {
  let sut
  let jwt
  let emailMgrMock = {
    verify: jest.fn()
  }
  let claimMgrMock = {
    decode: jest.fn()
  }

  beforeAll(() => {
    sut = new EmailVerifyHandler(emailMgrMock, claimMgrMock)
  })

  test('empty constructor', () => {
    expect(sut).not.toBeUndefined()
  })

  test('handle null body', done => {
    sut.handle({}, {}, (err, res) => {
      expect(err).not.toBeNull()
      expect(err.code).toEqual(400)
      expect(err.message).toBeDefined()
      done()
    })
  })

  test('no verification', done => {
    sut.handle(
      { headers: { origin: 'https://subdomain.3box.io' }, body: JSON.stringify({ other: 'other' }) },
      {},
      (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(403)
        expect(err.message).toEqual('no verification')
        done()
      }
    )
  })

  test('code not found', done => {
    sut.claimMgr.decode = jest.fn(() => { return { claim: { 'code': '123456' }, iss: 'did:3:somebody' } })
    sut.emailMgr.verify = jest.fn(() => { return false })
    sut.handle(
      {
        headers: { origin: 'https://subdomain.3box.io' },
        body: JSON.stringify({ did: 'did:https:test', verification: 'abcd' })
      },
      {},
      (err, res) => {
        expect(err.code).toEqual(403)
        expect(err.message).toEqual('code not found or expired')
        done()
      }
    )
  })
})
