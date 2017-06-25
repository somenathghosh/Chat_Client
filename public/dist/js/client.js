/* eslint-disable new-cap, max-len, no-var, key-spacing, quotes */

"use strict";

// Initialize variables
// var $window = $(window);
var $newChat = $('#chatSound')[0];
var $messages = $('.messages'); // Message area
var $inputMessage = $('.inputMessage');  // Text area to input msg
// var $nameInput = $('.nameInput') // Name input
// var $phoneInput = $('.phoneInput') // Phone number input
// var $emailInput = $('.emailInput') // Email input
var $form = $('.formArea'); // Details form
var $widgetBox = $('.contentArea'); // Widget box
// var $Input = $('.inputFields'); // Input fields in form
var $chatBox = $('.chatArea'); // Chat page after filling form
var $Typing = $(".typing"); // Typing notification
var $newMsg = $('.msg_push_new'); // Dummy to push new msgs
var $oldMsg = $('.msg_push_old'); // Dummy to push msg history
var $submitBtn = $('.submitBtn');

var socket = io({transports: ['websocket']}); // io socket
var typing = false; // Boolean to check if user is typing
var timeout = undefined; // Timeout to monitor typing
// var id; //Room ID in sessionStorage
var active; // Check if chat has been opened.
// console.log(_client.uuid);
console.log('removing roomID from localstore');
// unset roomID
localStorage.removeItem("roomID");
console.log('setting roomID to localstore');
// set roomID
localStorage.setItem("roomID", _client.uuid);
var id = localStorage.getItem("roomID");
console.log('roomID from localstore', id);
// unset active ind
sessionStorage.removeItem('active');

if (active && id) {
	$form.hide();
	$chatBox.show();
	console.log('100');
	socket.emit('add user', {
		isNewUser: false,
		roomID: id,
	});
	$widgetBox.show();
}

$('.msg_head').click(function() {
	console.log('200');
	$widgetBox.slideToggle('slow');
	if (id != null && !active) {
		socket.emit('add user', {
			isNewUser: true,
			roomID: id,
			Name: _client.firstName + ' '+ _client.lastName,
			Email: _client.email,
			Phone: _client.phone,
			Company: _client.company,
		});
		console.log('new user');
		$form.hide();
		$chatBox.show();
		$inputMessage.focus();
		sessionStorage.setItem('active', true);
		active = true;
	}
});

$submitBtn.click(function() {
	console.log('300');
	console.log('submit');
	$form.hide();
	$chatBox.show();
	$inputMessage.focus();
	sessionStorage.setItem('active', true);
	console.log('brand new user');
	socket.emit('add user', {
		isNewUser: true,
		Name: _client.firstName + ' '+ _client.lastName,
		Email: _client.email,
		Phone: _client.phone,
		Company: _client.company,
		roomID: _client.uuid,
	});

	return false;
});


// $Input.submit(function() {
//
// 	console.log('300');
// 	console.log('submit');
// 	$form.hide();
// 	$chatBox.show();
// 	$inputMessage.focus();
// 	sessionStorage.setItem('active', true);
// 	console.log('new user');
// 	socket.emit('add user', {
// 		isNewUser: true,
// 		Name:  $nameInput.val().trim(),
// 		Email: $emailInput.val().trim(),
// 		Phone: $phoneInput.val().trim()
// 	});
// 	return false;
// });
$inputMessage.keypress(function(event) {
	if (event.which !== 13) {
		if (typing === false && $inputMessage.is(":focus")) {
			typing = true;
			console.log('400');
			socket.emit("typing", {
				isTyping: true,
				roomID: id,
				person: "Client",
			});
		} else {
			clearTimeout(timeout);
			timeout = setTimeout(timeoutFunction, 2000);
		}
	} else {
		sendMessage();
		clearTimeout(timeout);
		timeoutFunction();
	}
});

$messages.on("scroll", function() {
	if ($messages.scrollTop() == 0) {
		socket.emit("more messages", {});
	}
});

// socket.on('roomID', function(roomID) {
// 	console.log('500');
// 	id = roomID;
// 	localStorage.setItem("roomID", roomID);
// });

socket.on('chat message', function(data) {
	console.log('600');
	var sender;
	if (data.isAdmin) {
		sender = "msg_a";
	} else {
		sender = "msg_b";
	}
	var $messageBodyDiv = $('<div class="' + sender + '">' + data.msg + '<span class="timestamp">' +
		((data.timestamp).toLocaleString().substr(15, 6)) + '</span></div>').insertBefore($newMsg);
	$messages[0].scrollTop = $messages[0].scrollHeight;

	$newChat.play();
});

socket.on('typing', function(data) {
	console.log('700');
	if (data.isTyping && data.person != 'Client') {
		$Typing.append("Admin is typing...");
	} else {
		$Typing.text('');
	}	
});

socket.on('chat history', function(data) {
	console.log('800');
	var len = data.history.length;
	for (var i = len - 1; i >= 0; i--) {
		addMessages(data.history[i], false);
	}
});

socket.on('more chat history', function(data) {
	console.log('900');
	var len = data.history.length;
	for (var i = 0; i < len; i++) {
		addMessages(data.history[i], true);
	}
});

socket.on('log message', function(text) {
	console.log('1000');
	var time = ("" + new Date());
	var $messageDiv = $('<div class="msg_a">' + text + '<span class="timestamp">' +
		(time.toLocaleString().substr(15, 6)) + '</span></div>').insertBefore($newMsg);
	$messages[0].scrollTop = $messages[0].scrollHeight;
});

socket.on('disconnect', function() {
	console.log('1100');
	localStorage.removeItem("roomID");
	sessionStorage.removeItem('active');
	console.log("Disconnected!");
	$inputMessage.prop('disabled', true);
	$inputMessage.prop('placeholder', "Connection Lost! Reconnecting..");
});

socket.on('reconnect_failed', function() {
	console.log('1200');
	console.log("Reconnection Failed!");
	$inputMessage.prop('placeholder', "No active connection. Please refresh page.");
});

socket.on('reconnect', function() {
	console.log('1300');
	setTimeout(function() {
		console.log("Reconnected!");
		$inputMessage.prop('disabled', false);
		$inputMessage.prop('placeholder', "Type here...");
		if (active && id) {
			socket.emit('add user', {
				isNewUser: false,
				roomID: id,
			});
		}
	}, 4000);
});

socket.on('admin disconnected', function() {
	console.log('1600');

	$Typing.append("Admin disconnected. Session ended.");
});
/**
 */
function timeoutFunction() {
	typing = false;
	socket.emit("typing", {
		isTyping: false,
		roomID: id,
		person: "Client",
	});
}
/**
 */
function sendMessage() {
	var message = $inputMessage.val();
	// Prevent markup from being injected into the message
	message = cleanInput(message);
	// if there is a non-empty message
	if (message) {
		$inputMessage.val('');
		var time = ("" + new Date());
		// tell server to execute 'new message' and send along one parameter
		//
		console.log('1400');
		socket.emit('chat message', {
			roomID: "null",
			msg: message,
			timestamp: time,
		});
		var $messageBodyDiv = $('<div class="msg_b">' + message + '<span class="timestamp">' +
			(time.toLocaleString().substr(15, 6)) + '</span></div>').insertBefore($newMsg);
		$messages[0].scrollTop = $messages[0].scrollHeight;
	}
}
/**
 * @param  {} data
 * @param  {} getMore
 */
function addMessages(data, getMore) {
	var sender;
	if (data["who"]) {
		sender = "msg_a";
	} else {
		sender = "msg_b";
	}	
	var $messageBodyDiv = $('<div class="' + sender + '">' + data["what"] + '<span class="timestamp">' +
		(data["when"]).toLocaleString().substr(15, 6) + '</span></div>');
	if (getMore) {
		$messageBodyDiv.insertAfter($oldMsg);
		$messages[0].scrollTop += $messageBodyDiv.outerHeight();
	} else {
		$messageBodyDiv.insertBefore($newMsg);
		$messages[0].scrollTop = $messages[0].scrollHeight;
	}
}

// Prevents input from having injected markup
/**
 * @param  {} input
 */
function cleanInput(input) {
	return $('<div/>').text(input).text();
}


// initialize Dropzone
$("#client-dropzone").dropzone({
	url: "/upload",
	addRemoveLinks : true,
	maxFilesize: 5,
	dictDefaultMessage: '<span class="text-center"><span class="font-lg visible-xs-block visible-sm-block visible-lg-block"><span class="font-lg"><i class="fa fa-caret-right text-danger"></i> Drop files <span class="font-xs">to upload</span></span><span>&nbsp&nbsp<h4 class="display-inline"> (Or Click)</h4></span>',
	dictResponseError: 'Error uploading file!',
	headers: {
		'X-CSRF-Token': $('input[name="_csrf"]').val()
	},
});
