const EmailVerifyHandler = require('../email_verify')

describe('EmailVerifyHandler', () => {
  let sut
  let userCode = 123456
  let userDid = 'did:3:xyz'
  let userEmail = 'user@3box.io'
  let sampleJWT = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1MjU5Mjc1MTcsImF1ZCI6ImRpZDp1cG9ydDoyb3NuZko0V3k3TEJBbTJuUEJYaXJlMVdmUW43NVJyVjZUcyIsImV4cCI6MTU1NzQ2MzQyMSwibm'
  let emailMgrMock = {
    verify: jest.fn()
  }
  let claimMgrMock = {
    issueEmail: jest.fn()
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

  test('no did', done => {
    sut.handle(
      { headers: { origin: 'https://subdomain.3box.io' }, body: JSON.stringify({ other: 'other' }) },
      {},
      (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(403)
        expect(err.message).toEqual('no did')
        done()
      }
    )
  })

  test('no verification code', done => {
    sut.handle(
      { headers: { origin: 'https://subdomain.3box.io' }, body: JSON.stringify({ did: userDid }) },
      {},
      (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(403)
        expect(err.message).toEqual('no verification code')
        done()
      }
    )
  })

  test('code not found', done => {
    sut.emailMgr.verify = jest.fn(() => { return Promise.resolve(null) })
    sut.handle(
      {
        headers: { origin: 'https://subdomain.3box.io' },
        body: JSON.stringify({ did: userDid, code: userCode + 1 })
      },
      {},
      (err, res) => {
        expect(err.code).toEqual(403)
        expect(err.message).toEqual('code not found or expired')
        done()
      }
    )
  })

  test('code not found', done => {
    sut.emailMgr.verify = jest.fn(() => { return Promise.resolve(userEmail) })
    sut.claimMgr.issueEmail = jest.fn(() => { return Promise.resolve(sampleJWT) })
    sut.handle(
      {
        headers: { origin: 'https://subdomain.3box.io' },
        body: JSON.stringify({ code: userCode, did: userDid })
      },
      {},
      (err, res) => {
        expect(err).toBeNull()
        expect(res).toBeDefined()
        expect(res.verification).toEqual(sampleJWT)
        done()
      }
    )
  })
})
