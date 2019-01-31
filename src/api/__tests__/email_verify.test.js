const EmailVerifyHandler = require('../email_verify')

describe('EmailVerifyHandler', () => {
  let sut
  let jwt
  let emailMgrMock = {
    verify: jest.fn()
  }

  beforeAll(() => {
    sut = new EmailVerifyHandler(emailMgrMock)
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

  test.skip('happy path', done => {
    sut.handle(
      {
        headers: { origin: 'https://subdomain.3box.io' },
        body: JSON.stringify({ did: 'did:https:test', jwt: jwt })
      },
      {},
      (err, res) => {
        expect(err).toBeNull()
        expect(res).toBeTruthy()
        done()
      }
    )
  })
})
