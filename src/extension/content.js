chrome.runtime.onMessage.addListener((message, sender, response) => {
	console.log(message);
	switch (message.type) {
		case 'disable_page':
			message.action == 'add' ? addUrl(message.url) : removeUrl(message.url);
			break;

		case 'disable_domain':
			if (message.url.length > 0) {
				const domain = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/gim.match(
					message.url
				)[0];
				addUrl(domain);
			}
			break;
	}
});

function addUrl(url) {
	chrome.storage.sync.get('blockedList', result => {
		const blockedList = result.blockedList || [];
		console.log(JSON.stringify(blockedList));
		if (!blockedList.includes(url)) blockedList.push(url);
		chrome.storage.sync.set({ blockedList }, () =>
			console.log('blocklist saved')
		);
	});
}

function removeUrl(url) {
	chrome.storage.sync.get('blockedList', result => {
		const blockedList = result.blockedList || [];
		const index = blockedList.indexOf(url);
		if (index != -1) blockedList.splice(index, 1);
		chrome.storage.sync.set({ blockedList }, () =>
			console.log('blockList removed')
		);
	});
}

function setup() {
	const elements = [];
	new Plugin().initialize(wvcat, window.location.href);

	document.querySelectorAll('*').forEach(e => {
		if (
			e.localName == 'a' ||
			e.localName == 'select' ||
			e.localName == 'input' ||
			e.localName == 'button' ||
			e.localName == 'li' ||
			e.localName == 'textarea' ||
			e.getAttribute('tabindex') ||
			e.getAttribute('contenteditable')
		)
			elements.push(e);
	});

	elements.forEach(e => {
		e.classList.add('wvcat-element');
		e.setAttribute(
			e.localName != 'li' ? 'data-wvcat-id' : 'data-wvcat-listitem',
			getMeaningfulNameForElement(e)
		);
	});

	wvcat.initialize();
}

function getNameOfElement(htmlElement) {
	const ariaLabel = htmlElement.getAttribute('aria-label');
	const title = htmlElement.getAttribute('title');
	const name = htmlElement.name;
	const innerText = htmlElement.innerText;

	return ariaLabel || title || name || innerText || generateRandomName();
}

function getMeaningfulNameForElement(htmlElement) {
	const nameArray = getNameOfElement(htmlElement)
		.toLowerCase()
		.replace(/ /gi, '-')
		.replace(/[^-\w]/gi, '')
		.split('-');

	const name =
		nameArray.length > 2 ? nameArray.substring(0, 1) : nameArray.substring(0);

	let suffix = '';

	switch (htmlElement.localName) {
		case 'a':
			suffix = 'link';
			break;

		case 'select':
			suffix = 'dropdown';
			break;

		case 'input':
			const type = htmlElement.getAttribute('type');
			switch (type) {
				case ('submit', 'reset'):
					suffix = 'button';
					break;

				case 'file':
					suffix = 'file-picker';
					break;

				case 'checkbox':
					suffix = 'checkbox';
					break;

				case 'radio':
					suffix = 'radio-button';
					break;

				default:
					suffix = 'input';
			}
			break;

		case 'li':
			suffix = 'listitem';
			break;

		case 'textarea':
			suffix = 'input';
			break;

		case 'button':
		default:
			suffix = 'button';
			break;
	}

	return `${name}-${suffix}`;
}

function generateRandomName() {
	return 'xxxxxxxx'.replace(/[xy]/g, function(c) {
		let r = (Math.random() * 16) | 0,
			v = c == 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

window.onload = setup;
