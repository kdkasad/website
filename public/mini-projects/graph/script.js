const canvas = document.getElementById('canvas');
const wrapper = document.getElementById('canvas-wrapper');
const ctx = canvas.getContext('2d');
const equationForm = document.getElementById('equation-form');
const equationBox = document.getElementById('equation-box');
const interpolationSlider = document.getElementById('interpolation-slider');

const mql = window.matchMedia('(prefers-color-scheme: dark)');

let graphWidth, graphHeight;
let mouseX, mouseY;
let equation = '';
let linecolor = '#ffffffd7';
let scalecolor = '#ffffff40';
let thickscalecolor = '#ffffff80';
let interpolationInterval = 0.1;

function round(x, p) {
	return Math.round(x * (10 ** p)) / (10 ** p);
}

function clearCanvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function resizeCanvas() {
	canvas.width = wrapper.clientWidth;
	canvas.height = wrapper.clientHeight;

	graphWidth = canvas.width / 50;
	graphHeight = canvas.height / 50;

	drawGraph();
}

function setEquation(eq) {
	equation = eq;
	equationBox.value = eq;
}

function solveEquation(x) {
	let y;
	const e = Math.E;
	const pi = Math.PI;
	const cos = Math.cos;
	const sin = Math.sin;
	const tan = Math.tan;
	const abs = Math.abs;
	const log = Math.log;
	const sqrt = Math.sqrt;
	eval(equation.replace(/\^/, '**'));
	return y;
}

function drawScales() {
	ctx.font = '12px sans-serif';

	// vertical lines and numbers
	for (let x = Math.floor(-(graphWidth / 2)); x <= graphWidth / 2; x++) {
		let cc = graphToCanvasCoords(x, 0);
		if (x === 0)
			ctx.fillStyle = thickscalecolor;
		else
			ctx.fillStyle = scalecolor;
		ctx.fillRect(cc.x, 0, 1, canvas.height);
		if (x !== 0) {
			ctx.fillStyle = thickscalecolor;
			ctx.fillText(`${x}`, cc.x - (x < 0 ? 4 : 2), cc.y + 15, 20);
		}
	}

	// horizontal lines and numbers
	for (let y = Math.floor(-(graphHeight / 2)); y <= graphHeight / 2; y++) {
		let cc = graphToCanvasCoords(0, y);
		if (y === 0)
			ctx.fillStyle = thickscalecolor;
		else
			ctx.fillStyle = scalecolor;
		ctx.fillRect(0, cc.y, canvas.width, 1);
		if (y !== 0) {
			ctx.fillStyle = thickscalecolor;
			ctx.fillText(`${y}`, cc.x + 5, cc.y + 3, 20);
		}
	}

	// 0 label
	ctx.fillStyle = thickscalecolor;
	ctx.fillText('0', canvas.width / 2 + 5, canvas.height /  2 + 15, 20);
}

function drawMouseCoords() {
	ctx.fillStyle = linecolor;
	ctx.font = 'bold 12px sans-serif';
	ctx.fillText(`x: ${round(mouseX, 4)}`, 0, 20);
	ctx.fillText(`y: ${round(mouseY, 4)}`, 0, 30);
}

/* Draw the graph */
function drawGraph() {
	clearCanvas();
	drawScales();

	ctx.strokeStyle = linecolor;
	ctx.beginPath();
	let x, y;
	let d;
	x = -(graphWidth / 2);
	y = solveEquation(x);
	d = graphToCanvasCoords(x, y);
	ctx.moveTo(d.x, d.y);
	for (x = -(graphWidth / 2); x < graphWidth / 2; x += interpolationInterval) {
		y = solveEquation(x);
		d = graphToCanvasCoords(x, y);
		ctx.lineTo(d.x, d.y);
	}
	ctx.stroke();
	ctx.stroke();
	ctx.stroke();
}

/* Show (x, y) coordinates for the mouse's x position */
function drawTooltip(gx, gy) {
	drawGraph();

	d = graphToCanvasCoords(gx, gy);

	ctx.beginPath();
	ctx.ellipse(d.x, d.y, 4, 4, 0, 0, 360);
	ctx.fillStyle = linecolor;
	ctx.fill();

	ctx.font = 'bold 12px sans-serif';
	ctx.fillText(`(${round(gx, 4)}, ${round(gy, 4)})`, d.x + 20, d.y + 20, 500);
}

/* Set drawing colors according to browser's color scheme */
function setColors(e) {
	if (e.matches) {
		// dark theme
		linecolor = '#ffffffd7';
		scalecolor = '#ffffff40';
		thickscalecolor = '#ffffff80';
	} else {
		// light theme
		linecolor = '#000000e0';
		scalecolor = '#00000040';
		thickscalecolor = '#00000080';
	}
	drawGraph();
}

/*
 * Convert canvas pixel coordinates to graph coordinates
 */
function canvasToGraphCoords(x, y) {
	return {
		x: x / 50 - (graphWidth / 2),
		y: (graphHeight / 2) - y / 50
	};
}

/*
 * Convert graph coordinates to canvas pixel coordinates
 */
function graphToCanvasCoords(x, y) {
	return {
		x: (canvas.width / 2) + (x * 50),
		y: (canvas.height / 2) - (y * 50)
	};
}

function handleDrag(e) {
	let dx; /* drag physical x coordinate */
	let gx, gy; /* graph coordinates */

	switch (e.type) {
		case 'touchmove':
			dx = e.touches[0].clientX;
			break;
		case 'mousemove':
			if (e.buttons !== 1)
				return;
			/* falls through */
		default:
			dx = e.clientX;
			break;
	}

	/* convert physical coordinate to canvas coordinate */
	dx -= canvas.getBoundingClientRect().left;

	/* get graph x coordinate */
	gx = canvasToGraphCoords(dx, 0).x;
	gy = solveEquation(gx);

	drawTooltip(gx, gy);
}

/* definitions above this line, actions below it */

/* Change canvas drawing colors when browser's preferred color scheme changes */
mql.addEventListener('change', setColors);

interpolationSlider.addEventListener('input', () => {
	interpolationInterval = Math.abs(interpolationSlider.valueAsNumber);
	drawGraph();
});

equationForm.addEventListener('submit', (e) => {
	setEquation(equationBox.value);
	drawGraph();
	e.preventDefault();
});

canvas.addEventListener('mousedown', handleDrag);
canvas.addEventListener('touchmove', handleDrag);
canvas.addEventListener('mousemove', handleDrag);

canvas.addEventListener('mouseup', drawGraph);
canvas.addEventListener('touchend', drawGraph);

window.addEventListener('resize', resizeCanvas);

setColors({ matches: mql.matches });
setEquation('y = x ** 2');
resizeCanvas();
