const blurfocus = document.getElementById('blur-focus');
const mouse = document.getElementById('mouse');

const items = [
	blurfocus,
	mouse,
];

/* help button */
const help = document.getElementById('help-btn');
const help_modal = document.getElementById('help-modal');
const help_modal_close_btn = help_modal.getElementsByClassName('modal-close')[0];

help.addEventListener('click', (e) => {
	help_modal.style.display = 'block';
		setTimeout(() => {
			help_modal.style.opacity = '1';
		}, 0);
});

help_modal.addEventListener('click', (e) => {
	if (e.target === help_modal) {
		help_modal.style.opacity = '0';
		setTimeout(() => {
			help_modal.style.display = 'none';
		}, 500);
	}
});

help_modal_close_btn.addEventListener('click', () => {
		help_modal.style.opacity = '0';
		setTimeout(() => {
			help_modal.style.display = 'none';
		}, 500);
});

/* blur/focus logic */
window.addEventListener('blur', () => {
	blurfocus.classList.replace('active', 'inactive');
});

window.addEventListener('focus', () => {
	blurfocus.classList.replace('inactive', 'active');
});

/* mouse leave/enter logic */
document.addEventListener('mouseleave', () => {
	mouse.classList.replace('active', 'inactive');
});

document.addEventListener('mouseenter', () => {
	mouse.classList.replace('inactive', 'active');
});

/* set default classes */
for (item of items) {
	item.classList.add('active');
}
