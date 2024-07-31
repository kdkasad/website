const bgcolor = '#1d1e20';

const scale = 20;
const cols = 50;
const rows = cols;

const noiseScaleSlider = document.getElementsByName('noiseScale')[0];
let noiseScale = 0.3;

const heightScaleSlider = document.getElementsByName('heightScale')[0];
let heightScale = 10;

const rotationSpeed = Math.PI / 180 / 5;

window.setup = function() {
	createCanvas(windowWidth, windowHeight, WEBGL);

	// cols = windowWidth / scale;
	// rows = windowHeight / scale;

	/* Set scales from saved values */
	noiseScale = parseFloat(window.localStorage.getItem(window.location.pathname + '-noiseScale') ?? noiseScale);
	noiseScaleSlider.value = noiseScale;
	heightScale = parseFloat(window.localStorage.getItem(window.location.pathname + '-heightScale') ?? heightScale);
	heightScaleSlider.value = heightScale;
}

window.draw = function() {
	rotateX(PI / 3);
	rotateZ(rotationSpeed * frameCount);
	translate(-cols * scale / 2, -rows * scale / 2, 70);
	background(bgcolor);
	stroke(255);
	noFill();

	for (let y = 0; y < rows; y++) {
		beginShape(TRIANGLE_STRIP);
		for (let x = 0; x < cols; x++) {
			vertex(x * scale, y * scale, noise(x * noiseScale, y * noiseScale) * heightScale * 2 - heightScale);
			vertex(x * scale, (y + 1) * scale, noise(x * noiseScale, y * noiseScale) * heightScale * 2 - heightScale);
		}
		endShape();
	}
}

window.windowResized = function() {
	resizeCanvas(windowWidth, windowHeight);

	// cols = windowWidth / scale;
	// rows = windowHeight / scale;
}

noiseScaleSlider.addEventListener('input', () => {
	noiseScale = noiseScaleSlider.value;
	window.localStorage.setItem(window.location.pathname + '-noiseScale', noiseScale);
});

heightScaleSlider.addEventListener('input', () => {
	heightScale = heightScaleSlider.value;
	window.localStorage.setItem(window.location.pathname + '-heightScale', heightScale);
});
