var Chat = function(socket) {
  this.socket = socket;
};

// ����������Ϣ
Chat.prototype.sendMessage = function(room, text) {
  var message = {
    room: room,
    text: text
  };
  this.socket.emit('message', message);
};

// �������
Chat.prototype.changeRoom = function(room) {
  this.socket.emit('join', {
    newRoom: room
  });
};

// ������������
Chat.prototype.processCommand = function(command) {
  var words = command.split(' ');
  // �ӵ�һ�����ʿ�ʼ��������
  var command = words[0].substring(1, words[0].length).toLowerCase();
  var message = false;
  
  switch(command) {
    case 'join':
      words.shift();
      var room = words.join(' ');
      // ������ı任/����
      this.changeRoom(room);
      break;
    case 'nick':
      words.shift();
      var name = words.join(' ');
      // �����������
      this.socket.emit('nameAttempt', name);
      break;
    default:
      // ��������޷�ʶ�𣬷��ش�����Ϣ
      message = 'Unrecognized command.';
      break;
  }
  return message;
};


