const EmailMgr = require('../emailMgr')

describe('EmailMgr', () => {
  let sut

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
    sut = new EmailMgr()
  })

  test('empty constructor', () => {
    expect(sut).not.toBeUndefined()
  })

  test('send verification code', async done => {
    sut
      .sendVerification('did', 'email')
      .then(resp => {
        fail("shouldn't return")
        done()
      })
      .catch(err => {
        expect(err.message).toEqual('not implemented yet')
        done()
      })
  })
})
