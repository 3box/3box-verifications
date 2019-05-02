const redis = require('redis')
const HOUR12 = 43200

/**
 *  RedisStore Representation. Wrapped redis client. Read, write, and invalidate objects.
 */
class RedisStore {
  constructor (redisOpts = {}, ttl) {
    this.redis = redis.createClient(redisOpts)
    this.redis.on('error', function (err) {
      console.log('Error ' + err)
    })
    this.ttl = ttl || HOUR12
  }

  read (key) {
    return new Promise((resolve, reject) => {
      this.redis.get(key, (err, val) => {
        if (err) console.log(err)
        resolve(err ? null : JSON.parse(val))
      })
    })
  }

  write (key, obj) {
    this.redis.set(key, JSON.stringify(obj), 'EX', this.ttl)
  }

  invalidate (key) {
    this.redis.del(key)
  }

  quit () {
    this.redis.quit()
  }
}

/**
 *  NullStore implements an abstract store interface without caching any
 *  data. Primarly used for testing and development.
 */
const NULL_STORE_DATA = {}

class NullStore {
  read (key) {
    return Promise.resolve(NULL_STORE_DATA[key] || null)
  }

  write (key, obj) {
    NULL_STORE_DATA[key] = obj
    return Promise.resolve(true)
  }

  invalidate (key) {
    delete NULL_STORE_DATA[key]
    return Promise.resolve(true)
  }

  quit () {}
}

module.exports = { RedisStore, NullStore }
