function divEscapedContentElement(message) {
  return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
  return $('<div></div>').html('<i>' + message + '</i>');
}

// ����ԭʼ���û�����
function processUserInput(chatApp, socket) {
  var message = $('#send-message').val();
  var systemMessage;
  
  // ����û�����������б�ܿ�ͷ��������Ϊ��������
  if (message.charAt(0) == '/') {
    systemMessage = chatApp.processCommand(message);
    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  } else {
    // ������������㲥�������û�
    chatApp.sendMessage($('#room').text(), message);
    $('#messages').append(divEscapedContentElement(message));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }
  $('#send-message').val('');
}

var socket = io.connect();
$(document).ready(function() {
  var chatApp = new Chat(socket);
  socket.on('nameResult', function(result) {
    var message;
    if (result.success) {
      message = 'You are now known as ' + result.name + '.';
    } else {
      message = result.message;
    }
    $('#messages').append(divSystemContentElement(message));
  });
  
  socket.on('joinResult', function(result) {
    $('#room').text(result.room);
    $('#messages').append(divSystemContentElement('Room changed.'));
  });
  
  socket.on('message', function(message) {
    $('#messages').append(divEscapedContentElement(message.text));
  });
  
  socket.on('rooms', function(rooms) {
    $('#room-list').empty();
    console.log("chat_ui: length=" +rooms.length +", rooms=" +rooms);
    var i;
    for (i=0; i<rooms.length; i++) {
      if (rooms[i].length > 0) {
        $('#room-list').append(divEscapedContentElement(rooms[i]));
      }
    }
    
    $('#room-list div').click(function() {
      console.log("chat_ui: room-list div is clicked.");
      chatApp.processCommand('/join ' + $(this).text());
      $('#send-message').focus();
    });
  });
  
  setInterval(function() {
    socket.emit('rooms');    
  }, 1000);
  
  $('#send-message').focus();
  
  $('#send-form').submit(function() {
    processUserInput(chatApp, socket);
    return false;
  });
});


