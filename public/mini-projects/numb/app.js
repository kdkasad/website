const form = document.getElementById('queryform');
const querybox = document.getElementById('querybox');
const outbox = document.getElementById('outbox');
const sharebtn = document.getElementById('sharebtn');
const ttcontent = document.getElementsByClassName('tooltip-content')[0];

/* Prevent form submission */
form.addEventListener('submit', ev => {
	ev.preventDefault();
});

function perform_fetch() {
	const apiurl = new URL('api/v1/numb/', window.location.origin + window.location.pathname);
	apiurl.searchParams.append('stdin', querybox.innerText);
	fetch(apiurl, {
			method: 'GET',
			credentials: 'omit',
		})
		.then(response => response.json())
		.then(data => {
			if (data.exitCode == 0) {
				outbox.innerText = data.stdout;
			}
		});
};

function copy_text(text) {
	if (navigator.clipboard)
		navigator.clipboard.writeText(text).catch(err => console.log('Error:', err));
}

/* Perform query when input changes */
querybox.addEventListener('input', perform_fetch);

/* Get initial query from 'query' or 'q' URL parameters */
(function() {
	let up = new URLSearchParams(window.location.search);
	let query;
	if (up.has('q'))
		query = up.get('q');
	if (up.has('query'))
		query = up.get('query');
	if (query) {
		querybox.innerText = query;
		perform_fetch();
	}
})();

/* Copy link with query parameters */
sharebtn.addEventListener('click', () => {
	/* Set page URL */
	let url = new URL(window.location);
	url.searchParams.delete('q');
	url.searchParams.delete('query');
	url.searchParams.set('q', querybox.innerText);
	window.history.pushState({}, '', url);

	copy_text(url);

	/* Temprarily change tooltip text */
	let oldtttxt = ttcontent.textContent;
	ttcontent.textContent = 'Link copied to clipboard';
	setTimeout(() => {
		ttcontent.textContent = oldtttxt;
	}, 3500);
});
