const EmailSendHandler = require('../email_send')

describe('EmailSendHandler', () => {
  let sut
  let emailMgrMock = {
    sendVerification: jest.fn()
  }

  beforeAll(() => {
    sut = new EmailSendHandler(emailMgrMock)
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

  test('no email address', done => {
    sut.handle(
      {
        headers: { origin: 'https://3box.io' },
        body: JSON.stringify({ did: 'did:https:test' })
      },
      {},
      (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(400)
        expect(err.message).toEqual('no email address')
        done()
      }
    )
  })

  test('happy path', done => {
    emailMgrMock.sendVerification.mockReturnValue(true)

    sut.handle(
      {
        headers: { origin: 'https://subdomain.3box.io' },
        body: JSON.stringify({ did: 'did:https:test', email_address: 'test@3box.io' })
      },
      {},
      (err, res) => {
        expect(err).toBeNull()
        expect(res).toBeDefined()
        done()
      }
    )
  })

  test('happy path with address', done => {
    emailMgrMock.sendVerification.mockReturnValue(true)

    sut.handle(
      {
        headers: { origin: 'https://subdomain.3box.io' },
        body: JSON.stringify({ did: 'did:https:test', email_address: 'test@3box.io', address: '0x' })
      },
      {},
      (err, res) => {
        expect(err).toBeNull()
        expect(res).toBeDefined()
        done()
      }
    )
  })
})

describe('EmailSendHandlerV2', () => {
  let sut
  let emailMgrMock = {
    sendVerification: jest.fn()
  }

  beforeAll(() => {
    sut = new EmailSendHandler(emailMgrMock, true)
  })

  test('unhandled address path', done => {
    emailMgrMock.sendVerification.mockReturnValue(true)

    sut.handle(
      {
        headers: { origin: 'https://subdomain.3box.io' },
        body: JSON.stringify({ did: 'did:https:test', email_address: 'test@3box.io', address: '0x' })
      },
      {},
      (err, res) => {
        expect(err).not.toBeNull()
        expect(err.code).toEqual(400)
        expect(err.message).toEqual('adress is not allowed')
        done()
      }
    )
  })
})
