const express = require('express')

const router = express.Router()

// @desc      Creates a new private room
// @route     POST /api/v1/private-rooms
router.route('/').post((req, res, next) => {
  // TODO: Test this controller!!!
  const roomId = 'asdfsafdasd'
  res.status(200).json({ roomId })
})

module.exports = router
