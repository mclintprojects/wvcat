function setup() {
	const elements = [];
	const customizer = new Customizer();

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

	customizer.customize(window.location.href);

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
			suffix = type == 'submit' || type == 'reset' ? 'button' : 'input';
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
