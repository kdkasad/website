window.addEventListener("load", main);

// Constants:
const PI = Math.PI;
const HALF_PI = PI / 2;
const TWO_PI = PI * 2;

// DOM:
var container;
var canvas;
var ctx;
var pausebutton;

// Program:
var timer = -1;

// Table:
var angle = 0;
var w = 80;
var cols, rows;

var curves;

function main() {
	container = document.getElementById("container");
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	pausebutton = document.getElementById("pause-button");

	pausebutton.addEventListener("click", togglestate);
	window.addEventListener("keydown", keypress);
	window.addEventListener("resize", resize);

	resize();

	play();
}

var iteration = 2;
function loop() {
	ctx.fillStyle = "#1d1e20";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	var radius = (w * 0.8) / 2;

	// Top:
	for (var i = 1; i < cols; i++) {
		var cx = i * w + w / 2;
		var cy = w / 2;

		ctx.strokeStyle = "rgba(255, 255, 255, 0.84)"; // white
		drawCircle(cx, cy, radius);

		var x = radius * Math.cos(angle * i - HALF_PI);
		var y = radius * Math.sin(angle * i - HALF_PI);

		ctx.strokeStyle = "rgba(255, 255, 255, 0.56)"; // gray
		line(cx + x, 0, cx + x, canvas.height);

		ctx.fillStyle = "rgba(255, 255, 255, 0.84)"; // white
		fillCircle(cx + x, cy + y, 4);

		if (angle < TWO_PI && iteration % 2 == 0) {
			for (var j = 0; j < rows - 1; j++) {
				curves[i - 1][j].vertices.push({x: cx + x});
			}
		}
	}
	
	// Left:
	for (var i = 1; i < rows; i++) {
		var cx = w / 2;
		var cy = i * w + w / 2;

		ctx.strokeStyle = "white";
		drawCircle(cx, cy, radius);

		var x = radius * Math.cos(angle * i - HALF_PI);
		var y = radius * Math.sin(angle * i - HALF_PI);

		ctx.strokeStyle = "gray";
		line(0, cy + y, canvas.width, cy + y);

		ctx.fillStyle = "white";
		fillCircle(cx + x, cy + y, 4);

		if (angle < TWO_PI && iteration % 2 == 0) {
			for (var j = 0; j < cols - 1; j++) {
				var cc = curves[j][i - 1];
				cc.vertices[cc.vertices.length - 1].y = cy + y;
			}
		}
	}

	for (var x = 0; x < cols - 1; x++) {
		for (var y = 0; y < rows - 1; y++) {
			ctx.beginPath();
			ctx.moveTo(curves[x][y].vertices[0].x, curves[x][y].vertices[0].y);
			for (var i = 1; i < curves[x][y].vertices.length; i++) {
				ctx.lineTo(curves[x][y].vertices[i].x, curves[x][y].vertices[i].y);
			}
			ctx.stroke();
		}
	}

	angle += TWO_PI / (8 * 60);

	if (iteration % 2 == 0) {
		iteration = 2;
	}

	iteration++;
}

function play() {
	if (timer == -1) {
		timer = setInterval(loop, 1000 / 60);
		pausebutton.classList.replace('fa-play-circle', 'fa-pause-circle');
	}
}

function pause() {
	if (timer != -1) {
		clearInterval(timer);
		timer = -1;
		pausebutton.classList.replace('fa-pause-circle', 'fa-play-circle');
	}
}

function togglestate() {
	if (timer == -1) {
		play();
	} else {
		pause();
	}
}

function drawCircle(x, y, radius) {
	ctx.beginPath()
	ctx.arc(x, y, radius, 0, TWO_PI);
	ctx.closePath();
	ctx.stroke();
}

function fillCircle(x, y, radius) {
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, TWO_PI);
	ctx.closePath();
	ctx.fill();
}

function line(x1, y1, x2, y2) {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

function drawCurve(curve) {
	ctx.beginPath();
	ctx.moveTo(curve.vertices[0].x, curve.vertices[0].y);
	for (var i = 1; i < curve.vertices.length; i++) {
		ctx.lineTo(curve.vertices[i].x, curve.vertices[i].y);
	}
	ctx.stroke();
}

function resize() {
	pause();
	setTimeout(function() {

		canvas.width = container.offsetWidth;
		canvas.height = container.offsetHeight;

		if (canvas.width < canvas.height) {
			if (canvas.width / 4 < 80) {
				w = canvas.width / 4;
			} else {
				w = 80;
			}
		} else {
			if (canvas.height / 4 < 80) {
				w = canvas.height / 4;
			} else {
				w = 80;
			}
		}

		cols = Math.floor(canvas.width / w);
		rows = Math.floor(canvas.height / w);

		canvas.width -= canvas.width % w;
		canvas.height -= canvas.height % w;

		curves = new Array(cols - 1);
		for (var i = 0; i < curves.length; i++) {
			curves[i] = new Array(rows - 1);
			for (var j = 0; j < curves[i].length; j++) {
				curves[i][j] = {
					vertices: []
				}
			}
		}

		iteration = 2;
		angle = 0;

	}, 1000 / 20);

	play();
}

function reset() {
	pause();
	setTimeout(function() {
		angle = 0;
		iteration = 0;
		for (var i = 0; i < cols - 1; i++) {
			for (var j = 0; j < rows - 1; j++) {
				curves[i][j] = {
					vertices: []
				};
			}
		}
	}, 1000 / 20);
	play();
}

function keypress(e) {
	switch (e.keyCode) {
		case 32:
			togglestate();
			break;
	}
}
