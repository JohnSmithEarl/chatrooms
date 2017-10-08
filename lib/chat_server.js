var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var currentRoom = {};
var namesUsed = [];
var roomsUsed = [];

// 启动Socket.IO服务器
exports.listen = function(server) {
  // 启动Socket.IO服务器，允许它搭载在已有的HTTP服务器上
  io = socketio.listen(server);
  
  // 定义每个用户连接的处理逻辑
  io.sockets.on('connection', function(socket) {
    // 在用户连接上来时赋予其一个访客名
    guestNumber = assignGuestName(socket);
    // 在用户连接上来时把他放入聊天室defaultRoom里
    joinRoom(socket, 'myRoom1');
    // 处理用户的消息、更名，以及聊天室的创建和变更
    handleMessageBroadcasting(socket);
    handleNameChangeAttempts(socket);
    handleRoomJoining(socket);
   
    console.log("char_server: rooms.length=" +roomsUsed.length +", rooms=" +roomsUsed);
    
    // 用户发出请求时，向其提供已经被占用的聊天室列表
    socket.on('rooms', function() {
      socket.emit('rooms', roomsUsed);
    });
    
    // 定义用户断开连接后的清除逻辑
    handleClientDisconnection(socket);
  });
};

// 分配用户昵称
function assignGuestName(socket) {
  // 生成新昵称
  var name = 'Guest' + guestNumber;
  nickNames[socket.id] = name;
  // 让用户知道他们的昵称
  socket.emit('nameResult', {
    success: true,
    name: name
  });
  // 存放已经被占用的昵称
  namesUsed.push(name);
  console.log("assignGuestName is called. name=" +name +", id=" +socket.id +", namesUsed=" +namesUsed);
  // 增加用来生成昵称的计数器
  return guestNumber+1;
}

// 进入聊天室
function joinRoom(socket, room) {
  // 让用户进入房间
  socket.join(room);
  if (roomsUsed.indexOf(room) == -1) {
    roomsUsed.push(room);
  }
  
  // 记录用户的当前房间
  currentRoom[socket.id] = room;
  // 让用户知道他们进入了新的房间
  socket.emit('joinResult', {room: room});
  // 让房间里的其他用户知道有新用户进入了房间
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + ' has joined ' + room + '.'
  });
  
  // 查找并记录有哪些用户在这个房间里
  var usersInRoomSummary = 'Users currently in ' + room + ': ';
  var userArray = [];
  for (var croom in currentRoom) {
    if (room === currentRoom[croom]) {
      for (var index in nickNames) {
        if (croom === index) {
          userArray.push(nickNames[index]);
          console.log("joinRoom: find a user in the room. id=" +croom +", room=" +currentRoom[croom] +", user=" +nickNames[index]);
        }
      }
    }
  }
  usersInRoomSummary += userArray.join(",") + '.';
  // 将房间里其他用户的汇总发送给这个用户
  socket.emit('message', {text: usersInRoomSummary});
}

// 更名请求的处理逻辑
function handleNameChangeAttempts(socket) {
  // 添加nameAttempt事件的监听器
  socket.on('nameAttempt', function(name) {
    // 昵称不能以Guest开头
    if (name.indexOf('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest".'
      });
    } else {
      // 如果该昵称未被注册，则注册
      if (namesUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        // 删掉之前用的昵称，让其他用户可以使用
        delete namesUsed[previousNameIndex];
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + ' is now known as ' + name + '.'
        });
      } else {
        // 如果昵称已经被占用，给客户端发送错误消息
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use.'
        });
      }
    }
  });
}

// 发送聊天消息
function handleMessageBroadcasting(socket) {
  socket.on('message', function(message) {
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ': ' + message.text
    });
  });
}

// 创建房间
function handleRoomJoining(socket) {
  socket.on('join', function(room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}

// 用户断开连接
function handleClientDisconnection(socket) {
  socket.on('disconnect', function() {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
}


