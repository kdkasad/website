/* COFIGURATION*/

let theme = 'light';

const size = 60; // Game size as a % of height and width

const insults = [	// Insults to display when the user ties or loses
	"You'll need to be smarter than that",
	"Must be your first time playing",
	"Did you even try?",
	"Where's the effort?",
	"Did you skip preschool?",
	"Ever tried winning?",
	"I'm disappointed",
];

/* END COFIGURATION*/

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const themediv = document.getElementById('theme-button');

const PI = Math.PI;
const HALF_PI = PI / 2;
const TWO_PI = PI * 2;

const player = {
	empty: 0,
	human: -1,
	ai: 1,
}

const board =
	[[0, 0, 0],
	 [0, 0, 0],
	 [0, 0, 0]];

let history = [];

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

function drawx(x, y) {
	x += (tilesize - drawsize) / 2;
	y += (tilesize - drawsize) / 2;
	line(x, y, x + drawsize, y + drawsize);
	line(x, y + drawsize, x + drawsize, y);
}

function drawo(x, y) {
	drawCircle(x + tilesize / 2, y + tilesize / 2, drawsize / 2);
}

function line(x1, y1, x2, y2) {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

function drawboard() {
	let fg, bg;
	if (theme == 'dark') {
		fg = 'rgba(255, 255, 255, 0.84)';
		bg = '#1d1e20';
	} else {
		fg = 'rgba(0, 0, 0, 0.81)';
		bg = '#fff';
	}

	ctx.fillStyle = bg;
	ctx.strokeStyle = bg;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = fg;
	ctx.strokeStyle = fg;

	line(tilesize, 0, tilesize, canvas.height);
	line(tilesize * 2, 0, tilesize * 2, canvas.height);
	line(0, tilesize, canvas.width, tilesize);
	line(0, tilesize * 2, canvas.width, tilesize * 2);

	for (let y = 0; y < 3; y++) {
		for (let x = 0; x < 3; x++) {
			if (board[x][y] === player.human)
				drawx(x * tilesize, y * tilesize);
			else if (board[x][y] === player.ai)
				drawo(x * tilesize, y * tilesize);
		}
	}
}

function resize() {
	themediv.style.top = themediv.style.left =
	themediv.style.width = themediv.style.height =
		Math.min(window.innerHeight, window.innerWidth) * 0.03 + 'px';

	canvas.height = window.innerHeight * (size / 100);
	canvas.width = window.innerWidth * (size / 100);
	canvas.width = canvas.height = Math.min(canvas.width, canvas.height);
	tilesize = canvas.width / 3;
	drawsize = tilesize * 0.7;
	drawboard();
}

function clickhandler(ev) {
	if (ev == undefined)
		return;

	let x, y, gx, gy;

	x = ev.clientX - ev.target.getBoundingClientRect().left;
	y = ev.clientY - ev.target.getBoundingClientRect().top;

	gx = Math.floor(x / tilesize);
	gy = Math.floor(y / tilesize);

	if (board[gx][gy] === player.empty) {
		board[gx][gy] = player.human;
		history.push({ x: gx, y: gy, player: player.human });
		aimove();
	}

	drawboard();

	setTimeout(() => {
		switch (checkwin()) {
			case player.ai:
				lose();
				break;
			case player.human:
				win();
				break;
			case player.empty:
				tie();
				break;
		}
	}, 5);
}

function checkwin() {
	for (let y = 0; y < 3; y++)
		if (board[0][y] == board[1][y] && board[1][y] == board[2][y] && board[2][y] != player.empty)
			return board[0][y];
	for (let x = 0; x < 3; x++)
		if (board[x][0] == board[x][1] && board[x][1] == board[x][2] && board[x][2] != player.empty)
			return board[x][0];
	if (board[0][0] == board[1][1] && board[1][1] == board[2][2] && board[1][1] != player.empty)
		return board[1][1];
	if (board[2][0] == board[1][1] && board[1][1] == board[0][2] && board[1][1] != player.empty)
		return board[1][1];

	for (let y = 0; y < 3; y++) {
		for (let x = 0; x < 3; x++) {
			if (board[x][y] == player.empty)
				return null;
		}
	}
	return player.empty;
}

function aimove() {
	let bestscore = -Infinity;
	let bestmove = { x: undefined, y: undefined };

	let score;
	for (let y = 0; y < 3; y++) {
		for (let x = 0; x < 3; x++) {
			if (board[x][y] !== player.empty)
				continue;

			board[x][y] = player.ai;
			score = minimax(player.human, 0);
			board[x][y] = player.empty;

			if (score > bestscore) {
				bestscore = score;
				bestmove = { x: x, y: y };
			}
		}
	}

	if (bestscore > -Infinity) {
		board[bestmove.x][bestmove.y] = player.ai;
		history.push({ x: bestmove.x, y: bestmove.y, player: player.ai });
	}
}

function minimax(currentplayer, depth) {
	switch (checkwin()) {
		case player.ai:
			return 10;
			break;
		case player.human:
			return -10;
			break;
		case player.empty:
			return 0;
			break;
	}

	let bestscore, score;

	if (currentplayer === player.ai) {
		bestscore = -Infinity;

		for (let y = 0; y < 3; y++) {
			for (let x = 0; x < 3; x++) {
				if (board[x][y] != player.empty)
					continue;

				board[x][y] = player.ai;
				score = minimax(player.human, depth + 1) - depth;
				board[x][y] = player.empty;

				if (score > bestscore)
					bestscore = score;
			}
		}
		return bestscore;
	} else {
		bestscore = Infinity;

		for (let y = 0; y < 3; y++) {
			for (let x = 0; x < 3; x++) {
				if (board[x][y] != player.empty)
					continue;

				board[x][y] = player.human;
				score = minimax(player.ai, 0);
				board[x][y] = player.empty;

				if (score < bestscore)
					bestscore = score;
			}
		}
		return bestscore;
	}
}

function reset() {
	board[0][0] = player.empty;
	board[0][1] = player.empty;
	board[0][2] = player.empty;
	board[1][0] = player.empty;
	board[1][1] = player.empty;
	board[1][2] = player.empty;
	board[2][0] = player.empty;
	board[2][1] = player.empty;
	board[2][2] = player.empty;
	history = [];
}

function win() {
	if (confirm('You won! :)\nPress ok to submit results (I might add a list of people who have won).') == true)
		sendresults();
	reset();
	drawboard();
}

function sendresults() {
	let name = prompt("What's your name?");
	if (name == "") {
		sendresults();
		return;
	} else if (name === null)
		return;

	const xhr = new XMLHttpRequest();
	const fd  = new FormData();

	fd.append('name', name);
	fd.append('history', JSON.stringify(history));

	xhr.addEventListener('load', (ev) => {
		try {
			const res = JSON.parse(xhr.response);
			if (res.status === 'success')
				alert('Your entry was added');
			else
				alert('The following error occurred:\n' + res.message);
		} catch {
			alert('An error occurred. Sorry!');
		}
	});

	xhr.addEventListener('error', (ev) => {
		alert('An error occurred. Sorry!');
	});

	xhr.open('POST', 'scoreboard.php');
	xhr.send(fd);
}

function insult() {
	alert(
		insults[Math.floor(Math.random() * insults.length)]
	);
}

function lose() {
	insult();
	reset();
	drawboard();
}

function tie() {
	alert("It's a tie");
	reset();
	drawboard();
}

function toggletheme() {
	const prevtheme = theme;
	if (theme == 'dark')
		theme = 'light';
	else
		theme = 'dark';
	document.body.classList.replace(prevtheme, theme);
	themediv.children[0].src = 'theme-' + theme + '.svg';
	drawboard();
	localStorage.setItem('theme', theme);
}

function setinitialtheme() {
	let initialtheme = localStorage.getItem('theme');
	if (initialtheme)
		theme = initialtheme;
	else
		theme = light;
	document.body.classList.replace('light', theme);
	themediv.children[0].src = 'theme-' + theme + '.svg';
	drawboard();
}

window.addEventListener('resize', resize);
canvas.addEventListener('click', clickhandler);
themediv.addEventListener('click', toggletheme);

resize();

setinitialtheme();
