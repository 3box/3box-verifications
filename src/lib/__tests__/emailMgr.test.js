const EmailMgr = require('../emailMgr')
const NullStore = require('../store').NullStore

describe('EmailMgr', () => {
  let store
  let sut
  let userEmail
  let userDid
  let userName

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
    store = new NullStore()
    sut = new EmailMgr(store)
    userEmail = 'mollie@3box.io'
    userDid = 'did:3:sample did'
    userName = 'Mollie the Narwhal'
  })

  test('empty constructor', () => {
    expect(sut).not.toBeUndefined()
  })

  test('sendVerification() no email', () => {
    sut
      .sendVerification()
      .then(resp => {
        fail('shouldn not return')
        done()
      })
      .catch(error => {
        expect(error.message).toEqual('no email')
      })
  })

  test('sendVerification() happy path', async done => {
    sut
      .sendVerification(userEmail, userDid, userName)
      .then(resp => {
        expect(resp).toBeDefined()
        done()
      })
  })
})
