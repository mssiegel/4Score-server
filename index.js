const express = require('express')
const http = require('http')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: './config/.env' })

const setupSocketIO = require('./socketIOSetup/socketIOSetup')

const app = express()
const server = http.Server(app)

const port = process.env.PORT || 4000
server.listen(port, () => console.log(`listening to requests on port ${port}`))

setupSocketIO(server)
