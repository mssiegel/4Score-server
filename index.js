//App setup
const express = require('express');
const socket = require('socket.io');

const app = express();
const server = require('http').Server(app);

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`listening to requests on port ${port}`));

//Socket setup
//pingInterval sends ping every 10 seconds to make sure client is still connected - necessary if client loses connection to internet
const io = socket(server, {pingInterval: 10000});

//Enables CORS for socket.io from specified client urls with * port
//urls are separated by a space; * means any port
io.origins('https://www.4scorechat.com:* http://localhost:*');


//Global variables to store socket data for all online users
const chatQueue = []; // array of sockets waiting to chat
const rooms = {}; // map socket.id => room
const names = {}; // map socket.id => userName
const allUsers = {}; // map socket.id => socket



io.on('connection', socket => {
  //Handle new person entering chatQueue
  socket.on('enter chatQueue', userName => {
    names[socket.id] = userName;
    allUsers[socket.id] = socket;
    //check if someone is in queue
    findPeerForLoneSocket();
  });

  //Handle person clicking button to leave chatQueue
  socket.on('leave chatQueue', () => {
    removeSocketFromChatQueue(socket);
  });

  //Handle new chat message
  socket.on('chat message', msg => {
    const room = rooms[socket.id];
    socket.to(room).emit('chat message', msg);
  });

  //Handle someone is typing a new chat message
  socket.on('typing', userName => {
    const room = rooms[socket.id];
    socket.to(room).emit('typing', userName);
  });

  //Handle client clicked endChatBtn
  socket.on('end chat', endChat);

  socket.on('disconnect', () => {
    endChat();
    //remove socket from queue; necessary when socket joined queue then disconnects before pairing
    removeSocketFromChatQueue(socket);

    //delete socket data from our objects
    delete names[socket.id];
    delete allUsers[socket.id];
    //note: rooms[socket.id] already deleted in endChat()
  });


  //SOCKET HELPER FUNCTIONS

  function findPeerForLoneSocket() {
    if (chatQueue.length) {
      // somebody is in queue, pair them!
     const peer = chatQueue.pop();
     const room = socket.id + '#' + peer.id;
     // join them both to room
     peer.join(room);
     socket.join(room);
     // register rooms to their names
     rooms[peer.id] = room;
     rooms[socket.id] = room;
     // exchange names between the two of them and start the chat
     peer.emit('chat start', names[socket.id]);
     socket.emit('chat start', names[peer.id]);
    }
    // else queue is empty, add our lone socket
    else chatQueue.unshift(socket);
  }

  function endChat(){
    const room = rooms[socket.id];
    //room may not exist if client lost internet during a chat and later reconnected as a brand new socket
    //upon connecting the new socket will emit 'chat end' yet will obviously not have a room
    if(room) {
      socket.to(room).emit('chat end');
      const socketAndPeerIDs = room.split('#');
      socketAndPeerIDs.forEach(socketID => {
        const curSocket = allUsers[socketID];
        if(curSocket) curSocket.leave(room);
        delete rooms[socketID];
      });
    }
  }

  function removeSocketFromChatQueue(socket){
    const socketIndex = chatQueue.indexOf(socket);
    if(socketIndex !== -1) chatQueue.splice(socketIndex, 1);
  }

});
