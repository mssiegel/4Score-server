var Push = require('pushover-notifications')

var p = new Push({
  user: process.env.PUSHOVER_USER,
  token: process.env.PUSHOVER_TOKEN,
})

var msg = {
  // These values correspond to the parameters detailed on https://pushover.net/api
  // 'message' is required. All other values are optional.
  message: 'Someone entered chat queue',
  url: 'https://www.4scorechat.com/chatroom/',
  url_title: 'Visit chatroom',
}

function notifyAdmin() {
  p.send(msg, function (err, result) {
    if (err) throw err

    console.log(result)
  })
}

module.exports = notifyAdmin
