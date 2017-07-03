/* eslint-disable new-cap, max-len, no-var, key-spacing, quotes, no-unused-vars, valid-jsdoc */
// To-do
// Add scroll to load more messages for Admins
"use strict";

// Initialize variables
var $window = $(window);
var $newUser = $('#windowSound')[0];
var $newChat = $('#chatSound')[0];
var $newChatConn = $('#newConnectionSound')[0];
var $pokeAdmin = $('#pokeSound')[0];
var $usernameInput = $('.usernameInput'); // Input for username
var $passwordInput = $('.passwordInput'); // Input for password
var $loginPage = $('.login.page'); // The login page
var $errorPage = $('.error.page'); // The error page
var $chatPage = $('.chat.page'); // The chat page
var $userList = $('.adminList'); // List of online admins
var $inputMessage; // Input message input box
var $messages; // Messages area
var $acceptClient = $('.accept-client');
var $noClientQ = $('#no-clients-q');

var username;	// Store admin username
var password;  	// Store admin password - need to find out  a way to strore as hash - may be use md5
var company; 	// store company
var authenticated = false; // Boolean to check if admin is authenticated
var connected = false;
var typing = false; // Boolean to check if admin is typing
var timeout = undefined; // Timeout to monitor typing
var socket = io({transports: ['websocket']}); // io socket
var clientsWaiting = 0;
var listOfClients = [];
$newUser.loop = true;
$usernameInput.focus();
try {
	Notification.requestPermission();
}
catch(e) {
	console.log('Notification not supported by browser');
}

var totalChats = 1; // Used to rotate colors for new chats
var colorClasses = ['paletton-blue', 'paletton-purple', 'paletton-green', 'paletton-orange'];
var disconnectTimers = []; // Holde the timers to show disconnect button for chats

console.log('from admin js', _admin);
username = _admin.username;

// username = "ADMIN";

// ask for Login authentication to server
setUsername(username);

socket.on('login', function(data) {
	$userList.empty();
	authenticated = data.login;
	if (authenticated) {
		$loginPage.fadeOut();
		$chatPage.show();
		console.log('100');
		socket.emit('add admin', {
			admin: username,
			isAdmin: true,
		});
		$userList.append('<li id=' + username + '>' + username + '</li>');
		connected = true;
		clientsWaiting = parseInt(data.clientsInQueue);
		clock.setCounter(clientsWaiting);
	} else {
		alert(data.err);
		$errorPage.show();
		$usernameInput.val('');
		$passwordInput.val('');
		username = null;
		$usernameInput.focus();
	}
});

/* socket.on('chat message', function(data) {
	console.log('200');
	$inputMessage = $('#' + data.roomID);
	var $parent = $inputMessage.parent();
	var $messages = $parent.children(".messages");
	if (data.isAdmin)
		var $usernameDiv = $('<span class="username"/>').text("CronJ");
	else
		var $usernameDiv = $('<span class="username"/>').text("Client");

	var $messageBodyDiv = $('<span class="messageBody">').text(data.msg);
	var $timestampDiv = $('<span class="timestamp">').text((data.timestamp).toLocaleString().substr(15, 6));
	var $messageDiv = $('<li class="message"/>').append($usernameDiv, $messageBodyDiv, $timestampDiv);
	$messages.append($messageDiv);
	$messages[0].scrollTop = $messages[0].scrollHeight;
	$newChat.play();
});*/
// When admin clicks on accept client
//
$acceptClient.click(function() {
	acceptNewClient();
});

socket.on('chat message', function(data) {
	console.log('200');
	$inputMessage = $('#' + data.roomID);
	var $chatContainer = $('#chat-' + data.roomID);
	var $messageContainer = $chatContainer.find('.chat-messages');

	var $message = createMessage(data.msg, null, null, data.isAdmin);
	console.log(data);

	// var $timestampDiv = $('<span class="timestamp">').text((data.timestamp).toLocaleString().substr(15, 6));
	// var $messageDiv = $('<li class="message"/>').append($usernameDiv, $messageBodyDiv, $timestampDiv);

	if ($chatContainer.hasClass('hidden')) {
		addNotification(data.roomID);
	}

	$messageContainer.append($message);
	$messageContainer[0].scrollTop = $messageContainer[0].scrollHeight;
	$newChat.play();
});

socket.on('admin added', function(username) {
	console.log('300', username);
	// $userList.append('<li id=' + username + '>' + username + '</li>');
	adminListListener(username);
});

socket.on('admin removed', function(username) {
	console.log('500');
	$('#' + username).remove();
});

socket.on('New Client', function(data) {
	console.log('400');
	$inputMessage = $('#' + data.roomID);
	listOfClients.push(data.roomID);
	if ($inputMessage.length < 1) {
		addNewClient(data);
	} else {
		$('#chat-' + data.roomID).find('.chat-messages').append(newTimestamp('Resuming Previous Chat'));
		clearTimeout(disconnectTimers[data.roomID]);
	}

	if ($('#chat-' + data.roomID).hasClass('hidden')) {
		addNotification(data.roomID);
	}
	// Make sure to update client Q.
	var clientsWaiting = parseInt(data.clientsInQueue);
	clock.setCounter(clientsWaiting);
});

socket.on('typing', function(data) {
	console.log('600');
	var $messages = $('#chat-' + data.roomID).find('.chat-messages');

	if (data.isTyping) {
		$messages.append("<small class='typing'>" + data.person + " is typing...<small>");
	} else {
		$messages.find($('.typing')).remove();
	}
});

socket.on('client ack', function() {
	console.log('700');
	$newUser.pause();
});

socket.on('User Disconnected', function(roomID) {
	console.log('800');
	$newUser.pause();
	$inputMessage = $('#' + roomID);
	var $messageContainer = $('#chat-' + roomID).find('.chat-messages');

	$messageContainer.append(newTimestamp('Client Connection Lost'));

	$messageContainer[0].scrollTop = $messageContainer[0].scrollHeight;
});

socket.on('User Terminated', function(roomID) {
	console.log('850');
	$newUser.pause();
	$inputMessage = $('#' + roomID);
	var $messageContainer = $('#chat-' + roomID).find('.chat-messages');

	$messageContainer.append(newTimestamp('Client Session Terminated'));

	disconnectTimers = setTimeout(function() {
		$('#chat-' + roomID).find('.chat-messages').append(newCloseChatButton(roomID));
	}, 5*60*1000);

	$messageContainer[0].scrollTop = $messageContainer[0].scrollHeight;
});

socket.on('User Reconnected', function(roomID) {
	console.log('880');

	$('#chat-' + roomID).find('.chat-messages').append(newTimestamp('Client Reconnected'));
		clearTimeout(disconnectTimers[roomID]);
});

socket.on('poke admin', function() {
	$pokeAdmin.play();
});

socket.on('reconnect', function() {
	console.log('900');
	console.log("Reconnected!");
	$userList.empty();
	$('.container').empty();
	$errorPage.fadeOut();
	$userList.append('<li id=' + username + '>' + username + '</li>');
	console.log('reconneted, reconnecting to existing rooms ', listOfClients);
	if (authenticated) {
		socket.emit('add admin', {
			admin: username,
			isAdmin: true,
			listOfClients: listOfClients,
		});
	}
});

socket.on('disconnect', function() {
	console.log('1000');
	console.log("Disconnected!");
	$errorPage.show();
});

socket.on('reconnect_failed', function() {
	console.log('1100');
	console.log("Reconnection Failed!");
	var $errorMsg = $errorPage.children(".title");
	$errorMsg.text("Reconection Failed. Please refresh your page. ");
	$window.alert("Disconnected from chat.");
});

socket.on('more chat history', function(data) {
	console.log('1300');
	console.log(data);
	var $messages = $('#chat-' + data.roomID).find('.chat-messages');

	var len = data.history.length;
	for (var i = 0; i < len; i++) {
		$messages.prepend(createMessage(data["history"][i]["what"], null, data["history"][i]["when"], data["history"][i]["who"]));
	}
});

socket.on('queue update', function(data) {
	console.log('2000');
	console.log('queue update', data);
	clientsWaiting = parseInt(data.clientsInQueue);
	clock.setCounter(clientsWaiting);
});

socket.on('upload', function(data) {
	console.log('2100');
	var $messages = $('#chat-' + data.roomID).find('.chat-messages');

	$messages.append(createUploadMessage(data.filename));
});

var clock = $('.counter').FlipClock(clientsWaiting, {
	clockFace: 'Counter',
});

// $passwordInput.keypress(function(event) {
// 	if (event.which === 13)
// 		setUsername();
// });

/**
 * [sendMessage description]
 * @method  sendMessage
 * @param   {[type]}    id [description]
 * This is a function
 * @author Somenath Ghosh
 * @version [version]
 * @date    2017-06-12
 */
function sendMessage(id) {
	$inputMessage = $('#' + id);
	var $chatContainer = $('#chat-' + id);
	var $messageContainer = $chatContainer.find('.chat-messages');
	var message = $inputMessage.val();
	// Prevent markup from being injected into the message
	message = cleanInput(message);
	// if there is a non-empty message and a socket connection
	if (message && connected) {
		$inputMessage.val('');
		// tell server to execute 'new message' and send along one parameter
		var time = ("" + new Date());
		console.log('1200');
		socket.emit('chat message', {
			roomID: id,
			msg: message,
			timestamp: time,
		});

		var newMessage = '<div class="message message-sender">' + '<div class="message-text">' + message + '</div>' + '</div>';

		// var $timestampDiv = $('<span class="timestamp">').text((data.timestamp).toLocaleString().substr(15, 6));
		// var $messageDiv = $('<li class="message"/>').append($usernameDiv, $messageBodyDiv, $timestampDiv);

		// console.log($messageContainer);

		$messageContainer.append(newMessage);
		$messageContainer[0].scrollTop = $messageContainer[0].scrollHeight;
	}
}

/**
 * [isTyping description]
 * @method  isTyping
 * @param   {[type]}   event [description]
 * This is a function
 * @author Somenath Ghosh
 * @version [version]
 * @date    2017-06-12
 */
function isTyping(event) {
	var id = event.target.id;
	if (event.which !== 13 && event.which !== undefined) {
		if (typing === false && $('#' + id).is(":focus")) {
			typing = true;
			socket.emit("typing", {
				isTyping: true,
				roomID: id,
				person: username,
			});
		} else {
			clearTimeout(timeout);
			timeout = setTimeout(function() {
				timeoutFunction(id);
			}, 2000);
		}
	} else {
		sendMessage(id);
		clearTimeout(timeout);
		timeoutFunction(id);
	}
}

/**
 * [timeoutFunction description]
 * @method  timeoutFunction
 * @param   {[type]}        id [description]
 * This is a function
 * @author Somenath Ghosh
 * @version [version]
 * @date    2017-06-12
 */
function timeoutFunction(id) {
	typing = false;
	socket.emit("typing", {
		isTyping: false,
		roomID: id,
		person: username,
	});
}

/**
 * [adminListListener description]
 * @method  adminListListener
 * @param   {[type]}          target [description]
 * This is a function
 * @author Somenath Ghosh
 * @version [version]
 * @date    2017-06-12
 */
function adminListListener(target) {
	$('#' + target).on('click', function(event) {
		var pokeAdmin = event.target.id;
		socket.emit('poke admin', pokeAdmin);
	});
}

/**
 * [getChatArea description]
 * @method  getChatArea
 * @param   {[type]}    id [description]
 * @return  {[type]}       [description]
 * This is a function
 * @author Somenath Ghosh
 * @version [version]
 * @date    2017-06-12
 */
function getChatArea(id) {
	return ("<div class='chatArea'><div class='chatHeader'></div><ul class='messages'>" +
		"</ul><div class='typing'></div><input class='inputMessage' id='" + id + "'' placeholder='Type here...'/></div>");
}

/**
 * [setUsername description]
 * @method  setUsername
 * @param   {[type]}    _username [description]
 * This is a function
 * @author Somenath Ghosh
 * @version [version]
 * @date    2017-06-12
 */
function setUsername(_username) {
	// username = cleanInput($usernameInput.val().trim());
	username = _username;
	password = 'password';
	username = username.toLowerCase();
	// password = $passwordInput.val();
	if (username) {
		// If the username is valid
		socket.emit('login', {
			admin: username,
			password: password,
		});
	}
}

/**
 * [notifyAdmin description]
 * @method  notifyAdmin
 * @param   {[type]}    title [description]
 * @param   {[type]}    body  [description]
 * This is a function
 * @author Somenath Ghosh
 * @version [version]
 * @date    2017-06-12
 */
function notifyAdmin(title, body) {
	if (Notification.permission !== "granted") {
		Notification.requestPermission();
	} else {
		var notification = new Notification(title, {
			icon: '',
			body: body,
		});
		notification.onclick = function() {
			$window.focus();
			this.cancel();
		};
	}
}

// Prevents input from having injected markup
/**
 * [cleanInput description]
 * @method  cleanInput
 * @param   {[type]}   input [description]
 * @return  {[type]}         [description]
 * This is a function
 * @author Somenath Ghosh
 * @version [version]
 * @date    2017-06-12
 */
function cleanInput(input) {
	return $('<div/>').text(input).text();
}


// Full additions
/**
 * @param  {} id
 * @param  {} username
 * @param  {} company
 * @param  {} order
 */
function newChatContainer(id, username, company, order) {
	// TODO: Rotate color class
	var chatContainer = '';

	chatContainer += '<div class="chat-container hidden" id="chat-' + id + '">' +
		'<div class="main-chat-header ' + colorClasses[order % colorClasses.length] +'">' +
			'<button type="button" class="close" aria-hidden="true" onclick="removeChat(\'' + id + '\')">×</button>' +
			'<div>' + username + '</div>' +
			'<div><small>' + company + '</small></div>' +
		'</div>' +
		'<div class="chat-messages"></div>' +
		'<div class="chat-input">' +
            '<div class="row">' +
                '<div class="col-xs-9 form-group">' +
                    '<input type="text" class="form-control" id="' + id +'" placeholder="Type Message">' +
                '</div>' +
                '<div class="col-xs-3 form-group">' +
                    '<button type="button" class="btn btn-primary form-control" onclick="sendMessage(\'' + id + '\')">Send</button>' +
                '</div>' +
            '</div>' +
        '</div>' +
	'</div>';

	return chatContainer;
}
/**
 * @param  {} id
 * @param  {} username
 * @param  {} company
 * @param  {} order
 */
function newSidebarChat(id, username, company, order) {
	// TODO: Rotate color class
	var chatContainer = '';

	chatContainer += '<div class="sidebar-chat ' + colorClasses[order % colorClasses.length] +'" id="sidebar-chat-' + id +'" onclick="showChat(\'' + id + '\')">' +
        '<div>' + username + '</div>' +
        '<div><small>' + company + '</small></div>' +
        '<span class="sidebar-chat-notification">0</span>' +
    '</div>';

	return chatContainer;
}
/**
 * @param  {} data
 */
function addNewClient(data) {
	var order = totalChats++;
	// console.log(data);

	$('.chat-area').append(newChatContainer(data.roomID, data.details[0], data.details[3], order));
	$('#sidebar').append(newSidebarChat(data.roomID, data.details[0], data.details[3], order));

	var $messages = $('#chat-' + data.roomID).find('.chat-messages');
	var $chatContainer = $('#chat-' + data.roomID);
	var $messageContainer = $chatContainer.find('.chat-messages');

	var len = data.history.length;
	var isSender;
	if (len > 0) {
		$('#chat-' + data.roomID).find('.chat-messages').append(newTimestamp('History'));

		for (var i = len - 1; i >= 0; i--) {
			if (data["history"][i]["who"]) {
				isSender = true;
			} else {
				isSender = false;
			}
			$messages.append(createMessage(data["history"][i]["what"], null, data["history"][i]["when"], isSender));
		}
	}

	$('#chat-' + data.roomID).find('.chat-messages').append(newTimestamp('Chat Start'));
	$messageContainer[0].scrollTop = $messageContainer[0].scrollHeight;

	$inputMessage = $('#' + data.roomID);
	$inputMessage.on('keypress', function(e) {
		isTyping(e);
	});

	var messageHistoryLength = data.MsgHistoryLen;
	$messages.on("scroll", function() {
		if ($messages.scrollTop() === 0) {
			// console.log('loading history');
			socket.emit("more messages", {
				roomID: data.roomID,
				MsgHistoryLen: messageHistoryLength,
			});

			messageHistoryLength += 10;
		}
	});

	$newChatConn.play();
	// socket.emit('accept client', data)
}
/**
 * @param  {} id
 */
function showChat(id) {
	$('.chat-container').addClass('hidden');
	$('#chat-' + id).removeClass('hidden');

	var $notification = $('#sidebar-chat-' + id).find('.sidebar-chat-notification');
	$notification.text(0);
}
/**
 * @param  {} message
 * @param  {} name
 * @param  {} time
 * @param  {} isSender
 */
function createMessage(message, name, time, isSender) {
	var $message = '';

	message = '<div class="message ' + (isSender ? 'message-sender' : 'message-receiver') + '">' +
        '<div class="message-text">' + message + '</div>' +
    '</div>';

    return message;
}

/**
 * @param  {} filename
 * @param  {} isSender
**/
function createUploadMessage(filename, isSender) {
	var message = '';

	message = '<div class="message ' + (isSender ? 'message-sender' : 'message-receiver') + '">' +
        '<div class="message-text"><img class="download-icon" src="./img/paperclip.png" /><a href="#" onclick="downloadFile(\'' + filename + '\')">' + filename + '</a></div>' +
    '</div>';

    return message;
}

/**
 * @param  {} description
 */
function newTimestamp(description) {
	var timestamp = '';
	var date = new Date();
	var hours = date.getHours();
	var minutes = date.getMinutes();

	if (hours < 10) {
		hours = "0" + hours;
	}
	if (minutes < 10) {
		minutes = "0" + minutes;
	}

	var currentTime = hours + ':' + minutes;

	timestamp += '<div class="time-message">' +
        '<div class="mid-horizontal-line"></div>' +
        '<div class="time-text">' +
            '<div>' + description +'</div>' +
            '<div>' + currentTime +'</div>' +
        '</div>' +
    '</div>';

	return timestamp;
}
/**
 * @param  {} id
 */
function newCloseChatButton(id) {
	var button = '';

	button = '<div class="close-chat">' +
		'<button class="btn btn-primary" onclick="removeChat(\'' + id + '\')">Close Chat</button>' +
	'</div>';

	return button;
}
/**
 * @param  {} id
 */
function addNotification(id) {
	var $notification = $('#sidebar-chat-' + id).find('.sidebar-chat-notification');

	$notification.text(parseInt($notification.text()) + 1);
}
/**
 * @param  {} id
 */
function removeChat(id) {
	console.log('1500');
	var $chatWindow = $('#chat-' + id);
	var $chartSidebar = $('#sidebar-chat-' + id);
	var $firstChat = $('.chat-area').find('.chat-container').first();

	if ($firstChat.length > 0) {
		$firstChat.removeClass('hidden');
	}

	$chatWindow.remove();
	$chartSidebar.remove();

	socket.emit('leave', {
		roomID: id,
	});
}
/**
 */
function acceptNewClient() {
	socket.emit('accept client');
}

function downloadFile(filename) {
	/*$.post('/download', {
		filename: filename,
		_csrf: $('input[name=_csrf]').val()
	}, function(data) {
		//$('#download-frame')[0].src = data;
		console.log('Starting download');
	});	*/

	let form = $('<form></form>').attr('action', '/download').attr('method', 'post').attr('target', 'download_frame');
	form.append($('<input></input>').attr('type', 'hidden').attr('name', '_csrf').attr('value', $('input[name=_csrf]').val()));
	form.append($('<input></input>').attr('type', 'hidden').attr('name', 'filename').attr('value', filename));

	form.appendTo('body').submit().remove();
}
