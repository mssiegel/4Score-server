const Push = require('pushover-notifications')

const p = new Push({
  user: process.env.PUSHOVER_USER,
  token: process.env.PUSHOVER_TOKEN,
})

function notifyAdmin(userName) {
  const msg = {
    // These values correspond to the parameters detailed on https://pushover.net/api
    // 'message' is required. All other values are optional.
    message: `"${userName}" entered chat queue`,
    url: 'https://www.4scorechat.com/chatroom/',
    url_title: 'Visit chatroom',
  }

  p.send(msg, function (err, result) {
    if (err) throw err

    console.log(result)
  })
}

module.exports = notifyAdmin
