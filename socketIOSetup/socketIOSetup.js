const socket = require('socket.io')

const notifyAdmin = require('./notifications')

module.exports = function setupSocketIO(server) {
  const io = socket(server, {
    cors: {
      origin: ['https://www.4scorechat.com', 'http://localhost:8000'],
    },
  })

  //Global variables to store socket data for all online users
  const chatQueue = [] // array of sockets waiting to chat
  const rooms = {} // map socket.id => room
  const names = {} // map socket.id => userName (character)
  const allUsers = {} // map socket.id => socket

  const privateRooms = {} // map socket.id => room
  const privateNames = {} // map socket.id => userName (real)

  const privateIO = io.of('/private')
  privateIO.on('connection', socket => {
    // PRIVATE ROOM EVENTS

    // A new person enters a private room
    socket.on('enter private room', user => {
      privateRooms[socket.id] = user.roomId
      privateNames[socket.id] = user.realName
      socket.join(user.roomId)
      socket.to(user.roomId).emit('user entered', user.realName)
    })

    // New chat message received
    socket.on('private chat message', message => {
      const privateRoom = privateRooms[socket.id]
      socket.to(privateRoom).emit('private chat message', message)
    })

    // Someone is typing a new chat message
    socket.on('typing', username => {
      const privateRoom = privateRooms[socket.id]
      socket.to(privateRoom).emit('typing', username)
    })

    socket.on('disconnect', () => {
      if (privateNames[socket.id]) {
        const privateRoom = privateRooms[socket.id]
        if (privateRoom) {
          const username = privateNames[socket.id]
          socket.to(privateRoom).emit('user left', username)
        }

        delete privateNames[socket.id]
        delete privateRooms[socket.id]
      }
    })
  })

  io.on('connection', socket => {
    // REGULAR CHATROOM EVENTS

    //Handle new person entering chatQueue
    socket.on('enter chatQueue', userName => {
      names[socket.id] = userName
      allUsers[socket.id] = socket
      //check if someone is in queue
      findPeerForLoneSocket(userName)
    })

    //Handle person clicking button to leave chatQueue
    socket.on('leave chatQueue', () => {
      removeSocketFromChatQueue(socket)
    })

    //Handle new chat message
    socket.on('chat message', msg => {
      const room = rooms[socket.id]
      socket.to(room).emit('chat message', msg)
    })

    //Handle someone is typing a new chat message
    socket.on('typing', userName => {
      const room = rooms[socket.id]
      socket.to(room).emit('typing', userName)
    })

    //Handle client clicked endChatBtn
    socket.on('end chat', endChat)

    socket.on('disconnect', () => {
      endChat()
      //remove socket from queue; necessary when socket joined queue then disconnects before pairing
      removeSocketFromChatQueue(socket)

      //delete socket data from our objects
      delete names[socket.id]
      delete allUsers[socket.id]
      //note: rooms[socket.id] already deleted in endChat()
    })

    //SOCKET HELPER FUNCTIONS

    function findPeerForLoneSocket(userName) {
      const clientUrl = socket.handshake.headers.origin

      if (chatQueue.length) {
        // somebody is in queue, pair them!
        const peer = chatQueue.pop()
        const room = socket.id + '#' + peer.id
        // join them both to room
        peer.join(room)
        socket.join(room)
        // register rooms to their names
        rooms[peer.id] = room
        rooms[socket.id] = room
        // exchange names between the two of them and start the chat
        peer.emit('chat start', userName)
        socket.emit('chat start', names[peer.id])

        // Notify admin that a chat has started
        const message = {
          message: `Chat started: "${userName}" and "${names[peer.id]}"`,
        }
        // Disabling notify admin as 4score is now in maintenance mode
        // if (!clientUrl.includes('localhost')) notifyAdmin(message)
      } else {
        // queue is empty, add our lone socket
        chatQueue.unshift(socket)

        // Notify admin that a lone user has entered the chat queue
        const message = {
          message: `"${userName}" entered chat queue`,
          url: 'https://www.4scorechat.com/chatroom/',
          url_title: 'Visit chatroom',
        }
        // Disabling notify admin as 4score is now in maintenance mode
        // if (!clientUrl.includes('localhost')) notifyAdmin(message)
      }
    }

    function endChat() {
      const room = rooms[socket.id]
      //room may not exist if client loses internet, clicks end chat, and later reconnects after the chat was already ended by the other person
      //upon connecting the new socket will emit 'chat end' yet will obviously not have a room
      if (room) {
        socket.to(room).emit('chat end')
        const socketAndPeerIDs = room.split('#')
        socketAndPeerIDs.forEach(socketID => {
          const curSocket = allUsers[socketID]
          if (curSocket) curSocket.leave(room)
          delete rooms[socketID]
        })
      }
    }

    function removeSocketFromChatQueue(socket) {
      const socketIndex = chatQueue.indexOf(socket)
      if (socketIndex !== -1) chatQueue.splice(socketIndex, 1)
    }
  })
}
