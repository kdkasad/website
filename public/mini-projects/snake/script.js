window.addEventListener("load", main);

// Canvas:
var canvas;
var ctx;
var pauseButton;
var scorelabel;

// Game:
var timer;
var fps = 10;

// Board:
var ts = 20;
var gw = gh = 20;

// Snake:
var vx = vy = 0;
var sx = sy = 10;
var px = py = 10;
var tail = 5;
var trail = [];

// Apple:
var ax = ay = 15;
var score = 0;

// Swipe gestures:
var xdown = ydown = null;

function main() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	pauseButton = document.getElementById("pause-button");
	scorelabel = document.getElementById("score-label");

	resizegame();

	sx = Math.floor(gw / 2);
	sy = Math.floor(gh / 2);

	window.addEventListener("resize", resizegame);

	document.addEventListener("keydown", keypress);

	canvas.addEventListener("touchstart", touchdown, false);
	canvas.addEventListener("touchmove", touchmove, false);

	pauseButton.addEventListener("click", togglepause);

	start();
}

function touchdown(e) {
	const firsttouch = e.touches[0];
	xdown = firsttouch.clientX;
	ydown = firsttouch.clientY;
}

function touchmove(e) {
	if (!xdown || !ydown) {
		return;
	}

	var xup = e.touches[0].clientX;
	var yup = e.touches[0].clientY;

	var xdiff = xdown - xup;
	var ydiff = ydown - yup;

	var direction;
	if (Math.abs(xdiff) > Math.abs(ydiff)) {
		if (xdiff > 0) {
			direction = "left";
		} else {
			direction = "right";
		}
	} else {
		if (ydiff > 0) {
			direction = "up";
		} else {
			direction = "down";
		}
	}

	handleSwipe(direction);

	xdown = ydown = null;
}

function handleSwipe(direction) {
	switch (direction) {
		case "left":
			if (vx != 0) {
				break;
			}
			vx = -1;
			vy = 0;
			break;
		case "up":
			if (vy != 0) {
				break;
			}
			vx = 0;
			vy = -1;
			break;
		case "right":
			if (vx != 0) {
				break;
			}
			vx = 1;
			vy = 0;
			break;
		case "down":
			if (vy != 0) {
				break;
			}
			vx = 0;
			vy = 1;
			break;
	}
}

function start() {
	tail = 5;
	trail = []
	px = sx;
	py = sy;
	for (var i = 0; i < 5; i++) {
		trail.push({x: px, y: py + 5 - i});
	}
	vx = 0;
	vy = -1;

	ax = Math.floor(Math.random() * gw);
	ay = Math.floor(Math.random() * gh);

	play();
}

function update() {
	px += vx;
	py += vy;

	if (px < 0 || px >= gw || py < 0 || py >= gh) {
		die();
	}

	for (var i = 0; i < trail.length; i++) {
		if (px == trail[i].x && py == trail[i].y) {
			die();
		}
	}

	trail.push({x: px, y: py});
	while (trail.length > tail) {
		trail.shift();
	}

	if (px == ax && py == ay) {
		gotapple();
	}
}

function fillRoundedRect(x1, y1, w, h, cornerRadius) {
	let x2 = x1 + w; // right side
	let y2 = y1 + h; // bottom

	ctx.beginPath();
	ctx.moveTo(x1 + cornerRadius, y1);
	ctx.lineTo(x2 - cornerRadius, y1);
	ctx.quadraticCurveTo(x2, y1, x2, y1 + cornerRadius);
	ctx.lineTo(x2, y2 - cornerRadius);
	ctx.quadraticCurveTo(x2, y2, x2 - cornerRadius, y2);
	ctx.lineTo(x1 + cornerRadius, y2);
	ctx.quadraticCurveTo(x1, y2, x1, y2 - cornerRadius);
	ctx.lineTo(x1, y1 + cornerRadius);
	ctx.quadraticCurveTo(x1, y1, x1 + cornerRadius, y1);
	ctx.fill();
}

function render() {
	// clear canvas
	ctx.fillStyle = "#1d1e20";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	// draw the apple
	ctx.fillStyle = "#E74C3C";
	fillRoundedRect(ax * ts, ay * ts, ts - 2, ts - 2, ts / 8);

	// draw the snake except for the head
	ctx.fillStyle = "#2ECC71";
	for (let i = 1; i < trail.length - 1; i++) {
		fillRoundedRect(trail[i].x * ts, trail[i].y * ts, ts - 2, ts - 2, ts / 8);
	}

	// draw the head darker
	ctx.fillStyle = "#1D8348";
	fillRoundedRect(trail[trail.length - 1].x * ts, trail[trail.length - 1].y * ts, ts - 2, ts - 2, ts / 8);
}

function keypress(e) {
	if (timer == -1 && e.keyCode != 32) {
		return;
	}
	switch (e.keyCode) {
		case 32:
			togglepause();
			break;
		case 37:
			if (vx != 0) {
				break;
			}
			vx = -1;
			vy = 0;
			break;
		case 38:
			if (vy != 0) {
				break;
			}
			vx = 0;
			vy = -1;
			break;
		case 39:
			if (vx != 0) {
				break;
			}
			vx = 1;
			vy = 0;
			break;
		case 40:
			if (vy != 0) {
				break;
			}
			vx = 0;
			vy = 1;
			break;
	}
}

function gotapple() {
	tail++;
	score++;
	scorelabel.innerHTML = score;
	ax = Math.floor(Math.random() * gw);
	ay = Math.floor(Math.random() * gh);
}

function die() {
	score = 0;
	scorelabel.innerHTML = "0";
	tail = 5;
	trail = []
	px = sx;
	py = sy;
	for (var i = 0; i < 5; i++) {
		trail.push({x: px, y: py + 5 - i});
	}
	vx = 0;
	vy = -1;
}

function pause() {
	clearInterval(timer);
	timer = -1;
	pauseButton.classList.replace('fa-pause-circle', 'fa-play-circle');
}

function play() {
	timer = setInterval(function() {
		update();
		render();
	}, 1000 / fps);
	pauseButton.classList.replace('fa-play-circle', 'fa-pause-circle');
}

function togglepause() {
	if (timer == -1) {
		play();
	} else {
		pause();
	}
}

function resizegame() {
	canvas.width = window.innerWidth - 2;
	canvas.height = window.innerHeight - 2;

	gw = Math.floor(canvas.width / ts);
	gh = Math.floor(canvas.height / ts);

	canvas.width = gw * ts;
	canvas.height = gh * ts;

	if (ax >= gw) {
		ax = Math.floor(Math.random() * gw);
	}
	if (ay >= gh) {
		ay = Math.floor(Math.random() * gh);
	}
}
