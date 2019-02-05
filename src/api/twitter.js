class TwitterHandler {
  constructor (twitterMgr, claimMgr) {
    this.name = 'TwitterHandler'
    this.twitterMgr = twitterMgr
    this.claimMgr = claimMgr
  }

  async handle (event, context, cb) {
    let body
    try {
      body = JSON.parse(event.body)
    } catch (e) {
      cb({ code: 400, message: 'no json body: ' + e.toString() })
      return
    }

    let domains = /https:\/\/(\w+\.)?3box.io/i

    if (!domains.test(event.headers.origin)) {
      cb({ code: 401, message: 'unauthorized' })
      return
    }

    if (!body.did) {
      cb({ code: 403, message: 'no did' })
      return
    }
    if (!body.twitter_handle) {
      cb({ code: 400, message: 'no twitter handle' })
      return
    }

    let verification_url = ''
    try {
      verification_url = await this.twitterMgr.findDidInTweets(body.twitter_handle, body.did)
    } catch (e) {
      cb({ code: 500, message: 'error while trying to verify the did' })
      return
    }

    if (verification_url == '') {
      cb({ code: 400, message: 'no valid proof available' })
      return
    }

    let verification_claim = ''
    try {
      verification_claim = await this.claimMgr.issueTwitter(body.did, body.twitter_handle, verification_url)
    } catch (e) {
      cb({ code: 500, message: 'could not issue a verification claim' })
      return
    }

    cb(null, { verification: verification_claim })
  }
}
module.exports = TwitterHandler
