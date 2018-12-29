(function(window) {
	window.wvcat = this;

	this.controls = [];
	this.isListening = false;
	this.currentControl = null;
	this.currentControlIndex = 0;

	this.initialize = function(options) {
		this.options = options || { lang: 'en-US' };

		findControllableElementsInDocument();
		highlightFirstControllableElement();

		if ('webkitSpeechRecognition' in window) {
			attachRecognitionContainerToDocument();
			startSpeechRecognizer();
		} else console.error('This browser does not support voice control.');
	};

	this.execute = command => executeCommand(command);

	function highlightFirstControllableElement() {
		currentControl = findControlByUUID(controls[0].uuid);
		currentControl.classList.add('wvcat-highlight');
	}

	function setCurrentControl() {
		currentControl = findControlByUUID(controls[this.currentControlIndex].uuid);
		currentControl.classList.add('wvcat-highlight');
		currentControl.focus();
	}

	function attachRecognitionContainerToDocument() {
		const card = document.createElement('div');
		card.classList.add('wvcat-container');

		this.recognitionText = document.createElement('p');
		recognitionText.appendChild(document.createTextNode(''));
		card.appendChild(recognitionText);

		document.body.appendChild(card);
	}

	function findControllableElementsInDocument() {
		const elements = document.getElementsByClassName('wvcat-element');
		for (let i = 0; i < elements.length; i++) {
			let e = elements[i];

			if (e.dataset.wvcatId) {
				const uuid = getUUID();
				e.classList.add(uuid);
				controls.push({
					identifier: e.dataset.wvcatId.replace('-', ' '),
					name: e.localName,
					type: e.type,
					uuid
				});
			}
		}
	}

	function startSpeechRecognizer() {
		setText('Listening...');
		this.recognizer = new webkitSpeechRecognition();
		recognizer.lang = this.options.lang;
		recognizer.start();
		recognizer.onresult = generateTranscript;
		recognizer.onend = () => recognizer.start();
		this.isListening = true;
	}

	function setText(text) {
		recognitionText.innerText = text;
	}

	function generateTranscript({ results }) {
		let transcript = '';
		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			if (result.isFinal) transcript += result[0].transcript;
		}

		executeCommand(transcript);
		setText(`Executed command -> [${transcript}]`);
		transcript = '';
	}

	function executeCommand(transcript) {
		transcript = transcript.toLowerCase();
		const words = transcript.split(' ');

		try {
			switch (words[0]) {
				case 'next':
					executeNextElementIntent();
					break;

				case 'previous':
					executePreviousElementIntent();
					break;

				case 'type':
					executeTypingIntent('type', words);
					break;

				case 'append':
					executeTypingIntent('append', words);
					break;

				case 'clear':
					executeTypingIntent('clear', words);
					break;

				case 'click':
					executeClickIntent();
					break;

				case 'goto':
					executeNavigateToLinkIntent(words);
					break;

				default:
					throw new Error('Invalid command.');
			}
		} catch (err) {
			console.log(err);
		}
	}

	// ------- Intent executors

	function executePreviousElementIntent() {
		this.currentControl.classList.remove('wvcat-highlight');

		--this.currentControlIndex;
		if (this.currentControlIndex < 0)
			this.currentControlIndex = controls.length - 1;

		setCurrentControl();
	}

	function executeNextElementIntent() {
		this.currentControl.classList.remove('wvcat-highlight');

		++this.currentControlIndex;
		if (this.currentControlIndex >= this.controls.length)
			this.currentControlIndex = 0;
		setCurrentControl();
	}

	function executeNavigateToLinkIntent(words) {
		if (hasValidSemantics('link', words)) {
			if (!words.includes('in')) {
				let controlName = words.substring(1);
				const control = findControlById(controlName);
				if (control) control.click();
			} else {
				let indexOfIn = words.lastIndexOf('in');
				let controlName = words.substring(1, indexOfIn - 1);
				let target = words.substring(indexOfIn + 1);

				const control = findControlById(controlName);
				if (
					control &&
					control.localName == 'a' &&
					(target == 'same tab' || target == 'new tab')
				) {
					target == 'same tab'
						? window.location.replace(control.href)
						: window.open(control.href);
				}
			}
		} else throw new Error('Invalid link navigation intent command.');
	}

	function executeTypingIntent(action, words) {
		let whatToType = words.substring(1);

		if (currentControl.localName == 'input') {
			switch (action) {
				case 'type':
					currentControl.value = whatToType;
					break;

				case 'append':
					currentControl.value += ` ${whatToType}`;
					break;

				case 'clear':
					currentControl.value = '';
					break;
			}
		} else throw Error('Current control is not an input element.');
	}

	function executeClickIntent() {
		currentControl.click();
	}

	// ------- Intent executors

	function hasValidSemantics(type, words) {
		switch (type) {
			case 'click':
			case 'focus':
				return words[1] == 'on' && words.length > 2;

			case 'type':
				return words.includes('into') && words.length >= 4;

			case 'link':
				return words.length >= 2;
		}
	}

	function findControlById(identifier) {
		const control = controls.find(c => c.identifier == identifier);
		if (control) return document.getElementsByClassName(control.uuid)[0];
		return null;
	}

	function findControlByUUID(uuid) {
		const controls = document.getElementsByClassName(uuid);
		return controls.length > 0 ? controls[0] : null;
	}

	function getUUID() {
		return (
			'wvcat-' +
			'xxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = (Math.random() * 16) | 0,
					v = c == 'x' ? r : (r & 0x3) | 0x8;
				return v.toString(16);
			})
		);
	}
})(window);

Array.prototype.substring = function(start, end, join = '') {
	end = end || this.length - 1;
	let word = '';
	for (start; start <= end; start++) {
		if (start != end) word += `${this[start]} ${join}`;
		else word += `${this[start]}`;
	}

	return word;
};
