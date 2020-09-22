const Push = require('pushover-notifications')

const p = new Push({
  user: process.env.PUSHOVER_USER,
  token: process.env.PUSHOVER_TOKEN,
})

function notifyAdmin(message) {
  // message is an object whose values correspond to the parameters at https://pushover.net/api

  p.send(message, function (err, result) {
    if (err) throw err

    console.log(result)
  })
}

module.exports = notifyAdmin
