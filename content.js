function setupWebpage() {
	const elements = [];
	document.querySelectorAll('*').forEach(e => {
		if (
			e.localName == 'a' ||
			e.localName == 'select' ||
			e.localName == 'input' ||
			e.localName == 'button' ||
			e.localName == 'li' ||
			e.localName == 'textarea'
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

	return title || name || ariaLabel || innerText || generateRandomName();
}

function getMeaningfulNameForElement(htmlElement) {
	const name = getNameOfElement(htmlElement)
		.toLowerCase()
		.replace(' ', '-');
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
			suffix = type == 'submit' ? 'button' : 'input';
			break;

		case 'li':
			suffix = 'listitem';
			break;

		case 'textarea':
			suffix = 'input';
			break;

		case 'button':
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

setupWebpage();
