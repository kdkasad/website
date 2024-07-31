// render KaTeX
document.addEventListener('DOMContentLoaded', () => {
	renderMathInElement(document.body, {
		delimiters: [
			{left: '$$', right: '$$', display: true},
			{left: '$', right: '$', display: false},
			{left: '\\(', right: '\\)', display: false},
			{left: '\\[', right: '\\]', display: true},

		],
		throwOnError: false,
		fleqn: true,
	});
});

// get DOM elements
const form = document.getElementById('form');
const resultrounded = document.getElementById('res-rounded');
const resultprecise = document.getElementById('res-precise');
const inputs = document.querySelectorAll('input');

// function to calculate significant figures of a number
// note: number must be converted to a string before passing in
const getSigFigs = (numstr) => {
	if (numstr.indexOf('.') >= 0) {
		// remove leading zeroes and decimal point
		return numstr.replace(/^(0*\.?0*)(\d*)(\.)?(\d*)$/, '$2$4').length;
	} else {
		// remove leading and traliing zeroes
		return numstr.replace(/^(0*)(\d*?)(0*)$/, '$2').length;
	}
}

String.prototype.expToTex = function () {
	return this.replace(/(\d+\.?\d*)e\+?(-?\d+)/, '$1 \\times 10^{$2}');
}

const katexOptions = {
	displayMode: true,
	fleqn: true,
	throwOnError: false,
};

// function to calculate the resulting force
const calculate = () => {
	let m1 = parseFloat(form.m1.value) * Math.pow(10, parseFloat(form.m1exp.value));
	let m2 = parseFloat(form.m2.value) * Math.pow(10, parseFloat(form.m2exp.value));
	let d = parseFloat(form.d.value) * Math.pow(10, parseFloat(form.dexp.value));
	let G = parseFloat(form.G.value) * Math.pow(10, parseFloat(form.Gexp.value));

	let sigFigs = Math.min(
		getSigFigs(form.m1.value),
		getSigFigs(form.m2.value),
		getSigFigs(form.d.value),
	);

	let force = G * (m1 * m2) / (d * d);

	let scistring = force.toExponential().expToTex();
	let decstring = force.toFixed(20).toString();
	let roundedscistring = force.toPrecision(sigFigs).expToTex();

	let texprecise = `
	\\begin{align*}
		F &= ${scistring} \\text{ Newtons}\\\\
		F &= ${decstring} \\text{ Newtons}
	\\end{align*}
	`;
	let texrounded = `
	\\begin{align*}
		F &= ${roundedscistring} \\text{ Newtons}
	\\end{align*}
	`;

	katex.render(texrounded, resultrounded, katexOptions);
	katex.render(texprecise, resultprecise, katexOptions);
};

// save value of the input upon which the passed event was triggered
const saveInput = (ev) => localStorage.setItem(ev.target.name, ev.target.value);

// don't do anything when form is submitted
form.addEventListener('submit', (ev) => {
	ev.preventDefault();
});

// call calculate() when any input is changed
for (const input of inputs) {
	input.addEventListener('input', calculate);
	input.addEventListener('input', saveInput);
}

// load any saved inputs
for (const v of ['m1', 'm1exp', 'm2', 'm2exp', 'd', 'dexp', 'G', 'Gexp']) {
	const savedValue = localStorage.getItem(v);
	if (savedValue !== null && parseFloat(savedValue) !== NaN)
		form[v].value = savedValue;
}

// do initial calculation
document.addEventListener('DOMContentLoaded', calculate);
