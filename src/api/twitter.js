class TwitterHandler {
    constructor (){

    }

    async handle(event, context, cb){
        let body
        try {
            body = JSON.parse(event.body)
        } catch (e) {
            cb({ code: 400, message: 'no json body: ' + e.toString() })
            return
        }

        if (Headers.Origin != "Origin: https://3box.io") {
            cb({ code: 401, message: 'unauthorized'})
        }

        if (!body.did) {
            cb({ code: 403, message: 'no did' })
            return
        }
        if (!body.twitter_handle) {
            cb({ code: 400, message: 'no twitter handle' })
            return
        }

        cb(null, "success")
    }
}
module.exports = TwitterHandler