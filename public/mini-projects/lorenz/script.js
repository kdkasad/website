window.onload = main;

// DOM:

var container;
var canvas;
var ctx;

// Simulation:

const fps = 60;

const a = 10;
const b = 28;
const c = 8/3;
const dt = 0.01;

var x = 0.01;
var y = 0;
var z = 0;

var dx, dy, dz;

var h = 0;
var rgb = {r: 255, g: 255, b: 255};
var s = 1;

var points = [];

function main() {
	container = document.getElementById("container");
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	window.addEventListener("resize", resize);

	resize();

	setup();

	setInterval(loop, 1000 / fps);
}

function setup() {
	ctx.lineWidth = 2;
}

function resize() {
	canvas.width = container.offsetWidth;
	canvas.height = container.offsetHeight;

	var sw = canvas.width / 700 * 3;
	var sh = canvas.height / 1000 * 3;

	if (sw < sh) {
		s = sw;
	} else {
		s = sh;
	}

	ctx.translate(canvas.width / 2, canvas.height / 2);
}

function loop() {

	// Math:

	dx = (a * (y - x)) * dt;
	dy = (x * (b - z) - y) * dt;
	dz = (x * y - c * z) * dt;

	x += dx;
	y += dy;
	z += dz;

	points.push({x: x * 5, y: y * 5, z: z * 5});

	// Rendering:
	
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.restore();

	h = 0;

	for (var i = 0; i < points.length - 1; i++) {

		if (h > 1) h = 0;
		rgb = hslToRgb(h, 1, 0.5);
		ctx.strokeStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

		ctx.beginPath();

		ctx.moveTo(points[i].x * s, points[i].y * s);
		ctx.lineTo(points[i + 1].x * s, points[i + 1].y * s);

		ctx.stroke();

		h += 0.001;
	}
}

function hslToRgb(h, s, l){
	var r, g, b;

	if(s == 0){
		r = g = b = l; // achromatic
	}else{
		var hue2rgb = function hue2rgb(p, q, t){
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}

	return {r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255)};
}
