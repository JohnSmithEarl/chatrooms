var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};

// 所请求的文件不存在时发送404错误
function send404(response) {
	console.log('send404 is called.');
	response.writeHead(404, {'Content-Type': 'text/plain'});
	response.write('Error 404: resource not found.');
	response.end();
}

// 提供文件数据服务。先写出正确的HTTP头，然后发送文件的内容
function sendFile(response, filePath, fileContents) {
	console.log('sendFile is called. filePath=' +filePath);
	response.writeHead(
		200,
		{'Content-Type': mime.getType(path.basename(filePath))}
	);
	response.end(fileContents);
}

// 提供静态文件服务
function serveStatic(response, cache, absPath) {
	console.log('serveStatic is called. absPath=' +absPath);
  // 检查文件是否缓存在内存中
	if (cache[absPath]) {
    // 从内存中返回文件
		sendFile(response, absPath, cache[absPath]);
	} else {
    // 检查文件是否存在
		fs.exists(absPath, function(exists) {
			if (exists) {
        // 从硬盘中读取文件
				fs.readFile(absPath, function(err, data) {
					if (err) {
						send404(response);
					} else {
						cache[absPath] = data;
            // 从硬盘中读取文件并返回
						sendFile(response, absPath, data);
					}
				});
			} else {
        // 文件不存在，发送HTTP 404错误
				send404(response);
			}
		});
	}
}

// 创建HTTP服务器
var server = http.createServer(function(request, response) {
	var filePath = false;
	
	if (request.url == '/') {
    // 确定返回的默认HTML文件
		filePath = 'public/index.html';
	} else {
    // 将URL路径转为文件的相对路径
		filePath = 'public' + request.url;
	}
	var absPath = './' + filePath;
  // 返回静态文件
	serveStatic(response, cache, absPath);
});

// 启动HTTP服务器
server.listen(3000, function() {
	console.log("Server listening on port 3000.");
});

var chatServer = require('./lib/chat_server');
chatServer.listen(server);

