const TwitterMgr = require('../twitterMgr')

describe('TwitterMgr', () => {
    let sut
    let fakeDid = 'did:https:fake'
    let handle = '3boxuser'
    let statusUrl = 'https://twitter.com/3boxuser/status/1063229025156546601'

    beforeAll(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        sut = new TwitterMgr()
    })

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined()
    })

    test('setSecrets', () => {
        expect(sut.isSecretsSet()).toEqual(false)
        sut.setSecrets({
            TWITTER_CONSUMER_KEY: 'FAKE',
            TWITTER_CONSUMER_SECRET: 'FAKE'
        })
        expect(sut.isSecretsSet()).toEqual(true)
        expect(sut.consumer_key).not.toBeUndefined()
    })

    test('client authenticated', done => {
        sut.client.get('application/rate_limit_status', (err, body, res) => {
            console.log(body)
            done()
        })
    })

    test('findDidInTweets() no handle', done => {
        sut
            .findDidInTweets()
            .then(resp => {
                fail("shouldn't return")
                done()
            })
            .catch(err => {
                expect(err.message).toEqual('no twitter handle provided')
                done()
            })
    })

    test('findDidInTweets() no did', done => {
        sut
            .findDidInTweets(handle)
            .then(resp => {
                fail("shouldn't return")
                done()
            })
            .catch(err => {
                expect(err.message).toEqual('no did provided')
                done()
            })
    })

    test('findDidInTweets() did not found', done => {

        sut.findDidInTweets = jest.fn(() => { return Promise.resolve(statusUrl) })
        sut
            .findDidInTweets(handle, fakeDid)
            .then(resp => {
                expect(resp).toEqual(statusUrl)
                done()
            })
            .catch(err => {
                fail(err)
                done()
            })
    })
})
