/* eslint-disable new-cap, max-len, no-var, key-spacing, quotes */

// To-do

// Add scroll to load more messages for Admins



// Initialize variables
var $window = $(window);
var $newUser = $('#windowSound')[0];
var $newChat = $('#chatSound')[0];
var $pokeAdmin = $('#pokeSound')[0];
var $usernameInput = $('.usernameInput'); // Input for username
var $passwordInput = $('.passwordInput'); // Input for password
var $loginPage = $('.login.page'); // The login page
var $errorPage = $('.error.page'); // The error page
var $chatPage = $('.chat.page'); // The chat page
var $userList = $('.adminList'); // List of online admins
var $inputMessage; // Input message input box
var $messages; // Messages area

var username;	// Store admin username
var authenticated = false; // Boolean to check if admin is authenticated
var connected = false;
var typing = false; // Boolean to check if admin is typing
var timeout = undefined; // Timeout to monitor typing
var socket = io({transports: ['websocket']}); // io socket
$newUser.loop = true;
$usernameInput.focus();
Notification.requestPermission();

var totalChats = 0; // Used to rotate colors for new chats
var colorClasses = ['paletton-blue', 'paletton-purple', 'paletton-green', 'paletton-orange'];

console.log('from admin js', _admin);
username = _admin.username;
//username = "ADMIN";

// ask for Login authentication to server
console.log(username);
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
			isAdmin: true
		});
		$userList.append('<li id=' + username + '>' + username + '</li>');
		connected = true;
	} else {
		alert(data.err);
		$usernameInput.val('');
		$passwordInput.val('');
		username = null;
		$usernameInput.focus();
	}
});

/*socket.on('chat message', function(data) {
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

socket.on('chat message', function(data) {
	console.log('200');
	$inputMessage = $('#' + data.roomID);
	let $chatContainer = $('#chat-' + data.roomID);
	let $messageContainer = $chatContainer.find('.chat-messages');

	let message = '<div class="message ' + (data.isAdmin ? 'message-sender' : 'message-receiver') + '">' +
        '<div class="message-text">' + data.msg + '</div>' +
    '</div>';

	//var $timestampDiv = $('<span class="timestamp">').text((data.timestamp).toLocaleString().substr(15, 6));
	//var $messageDiv = $('<li class="message"/>').append($usernameDiv, $messageBodyDiv, $timestampDiv);

	//TODO: If hidden, add 1 to the notification and blink

	$messageContainer.append(message);
	$messageContainer.scrollTop = $messageContainer.scrollHeight;
	$newChat.play();
});

socket.on('admin added', function(username) {
	console.log('300');
	$userList.append('<li id=' + username + '>' + username + '</li>');
	adminListListener(username);
});

socket.on('admin removed', function(username) {
	console.log('500');
	$('#' + username).remove();
});

/*socket.on('New Client', function(data) {
	console.log('400');
	$('.container').append(getChatArea(data.roomID));
	$inputMessage = $('#' + data.roomID);
	var $parent = $inputMessage.parent();
	var $messages = $parent.children(".messages");
	var $chatHeader = $parent.children(".chatHeader");
	var len = data.history.length;
	$chatHeader.append(data.details[0] + " , " + data.details[1] + " , " + data.details[2]);
	var sender;
	for (var i = len - 1; i >= 0; i--) {
		if (data["history"][i]["who"])
			sender = "You"
		else
			sender = "Client"
		var $usernameDiv = $('<span class="username"/>').text(sender);
		var $messageBodyDiv = $('<span class="messageBody">').text(data["history"][i]["what"]);
		var $timestampDiv = $('<span class="timestamp">').text((data["history"][i]["when"]).toLocaleString().substr(15, 6));
		var $messageDiv = $('<li class="message"/>').append($usernameDiv, $messageBodyDiv, $timestampDiv);
		$messages.append($messageDiv);
		$messages[0].scrollTop = $messages[0].scrollHeight;
	}
	if (!data.justJoined) {
		$newUser.play();
		notifyAdmin("New Client", "Hey there!" + data.details[0] + " needs help!");
		$parent.css('border', '2px solid red');
		$inputMessage = $('#' + data.roomID);
		$inputMessage.on("focus", function() {
			$newUser.pause();
			$parent.css('border', '1px solid black');
			$inputMessage.off('focus');
			socket.emit('client ack', {});
		});
	}
	$inputMessage.on('keypress', function(e) {
		isTyping(e);
	});
});*/

socket.on('New Client', function(data) {
	console.log('400');
	$inputMessage = $('#' + data.roomID);

	if(!$inputMessage) {
		let order = totalChats++;

		$('.chat-area').append(newChatContainer(data.roomID, data.details[0], "Company", order));
		$('#sidebar').append(newSidebarChat(data.roomID, data.details[0], "Company", order));
		$('#chat-' + data.roomID).find('.chat-messages').append(newTimestamp('Chat Start'));

		//TODO: Load history, check if new
		//TODO: Increment sidebar message count and flash

		$inputMessage.on('keypress', function(e) {
			isTyping(e);
		});
	}
	else {
		$('#chat-' + data.roomID).find('.chat-messages').append(newTimestamp('Client Reconnected'));
	}
});

socket.on('typing', function(data) {
	console.log('600');
	$inputMessage = $('#' + data.roomID);
	var $parent = $inputMessage.parent();
	var $typing = $parent.children(".typing");
	if (data.isTyping)
		$typing.append("<small>" + data.person + " is typing...<small>");
	else
		$typing.text('');
});

socket.on('client ack', function() {
	console.log('700');
	$newUser.pause();
});

socket.on('User Disconnected', function(roomID) {
	console.log('800');
	$newUser.pause();
	$inputMessage = $('#' + roomID);
	$inputMessage.off();
	var $parent = $inputMessage.parent();
	$parent.remove();
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
	if (authenticated)
		socket.emit('add admin', {
			admin: username,
			isAdmin: true,
		});
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
	let $chatContainer = $('#chat-' + id);
	let $messageContainer = $chatContainer.find('.chat-messages');
	let message = $inputMessage.val();
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
		
		let newMessage = '<div class="message message-sender">' +
	        '<div class="message-text">' + message + '</div>' +
	    '</div>';

		//var $timestampDiv = $('<span class="timestamp">').text((data.timestamp).toLocaleString().substr(15, 6));
		//var $messageDiv = $('<li class="message"/>').append($usernameDiv, $messageBodyDiv, $timestampDiv);

		console.log($messageContainer);

		$messageContainer.append(newMessage);
		$messageContainer.scrollTop = $messageContainer.scrollHeight;
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
	if (Notification.permission !== "granted")
		Notification.requestPermission();
	else {
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

function newChatContainer(id, username, company, order) {
	// TODO: Rotate color class
	let chatContainer = '';

	chatContainer += '<div class="chat-container" id="chat-' + id + '">' +
		'<div class="main-chat-header ' + colorClasses[order % colorClasses.length] +'">' +
			'<button type="button" class="close" aria-hidden="true">×</button>' +
			'<div>' + username + '</div>' +
			'<div>' + company + '</div>' +
		'</div>' +
		'<div class="chat-messages"></div>' +
		'<div class="chat-input">' +
            '<div class="row">' +
                '<div class="col-xs-9 form-group">' +
                    '<input type="text" class="form-control" id="' + id +'" placeholder="Type Message">' +
                '</div>' +
                '<div class="col-xs-3 form-group">' +
                    '<button type="button" class="btn btn-primary form-control">Send</button>' +
                '</div>' +
            '</div>' +
        '</div>' +
	'</div>';

	return chatContainer;
}

function newSidebarChat(id, username, company, order) {
	// TODO: Rotate color class
	let chatContainer = '';

	chatContainer += '<div class="sidebar-chat ' + colorClasses[order % colorClasses.length] +'" id="sidebar-chat-' + id +'" onclick="showChat(\'' + id + '\')">' +
        '<div>' + username + '</div>' +
        '<div>' + username + '</div>' +
        '<span class="sidebar-chat-notification">0</span>' +
    '</div>';

	return chatContainer;
}

function showChat(id) {
	$('.chat-container').addClass('hidden');
	$('#chat-' + id).removeClass('hidden');

	let $notification = $('#sidebar-chat-' + id).find('.sidebarChatNotification');
	$notification.text(0);
}

function newTimestamp(description) {
	let timestamp = '';
	let date = new Date();
	let currentTime = date.getHours() + ':' + date.getMinutes();

	timestamp += '<div class="time-message">' +
        '<div class="mid-horizontal-line"></div>' +
        '<div class="time-text">' +
            '<div>' + description +'</div>' +
            '<div>' + currentTime +'</div>' +
        '</div>' +
    '</div>';

	return timestamp;
}

function addNotification(id) {
	let $notification = $('#sidebar-chat-' + id).find('.sidebarChatNotification');

	$notification.text(parseInt($notification.text())++);
}
;
