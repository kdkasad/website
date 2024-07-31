import Segment from './segment.js';

const default_num = 4;
const default_length = 80;

function createTentacles(n, length) {
	colorMode(HSB, 100);
	let arr = [ new Segment(0, 0, length, 0, 0) ];
	for (let i = 1; i < n; i++) {
		arr.push(new Segment(
			arr[i - 1].a.x,
			arr[i - 1].a.y,
			length,
			0,
			i * 100 / n)
		);
	}
	return arr;
}

let arm;
let anchor;
let n, len;
let mouse;

window.setup = function() {
	const urlParams = new URLSearchParams(window.location.search);

	createCanvas(windowWidth, windowHeight);
	anchor = createVector(windowWidth / 2, windowHeight / 2);

	n = parseInt(urlParams.get('n') ?? default_num);
	len = parseInt(urlParams.get('w') ?? urlParams.get('l') ?? default_length);

	arm = createTentacles(n, len);

	mouse = createVector();
}

window.draw = function() {
	mouse.set(mouseX, mouseY);

	background(7);
	stroke(255);
	strokeWeight(4);

	let gap = p5.Vector.sub(mouse, anchor).mag();
	if (gap > len * n) {
		for (let i = 0; i < arm.length; i++) {
			arm[i].length = gap / n;
		}
	}

	arm[arm.length - 1].followPoint(mouseX, mouseY);
	for (let i = arm.length - 2; i >= 0; i--) {
		arm[i].follow(arm[i + 1]);
	}

	arm[0].moveTo(anchor).show();
	for (let i = 1; i < arm.length; i++) {
		arm[i].moveTo(arm[i - 1].b).show();
	}
}

window.windowResized = function() {
	resizeCanvas(windowWidth, windowHeight);
	anchor.set(windowWidth / 2, windowHeight / 2);
}
