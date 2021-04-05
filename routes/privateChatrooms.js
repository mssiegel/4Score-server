const express = require('express')
const { createPrivateChatroom } = require('../controllers/privateChatrooms')

const router = express.Router()

router.route('/').post(createPrivateChatroom)

module.exports = router
