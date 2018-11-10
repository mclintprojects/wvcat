(function(window) {
	window.wvcat = this;

	this.controls = [];

	this.initialize = function(options) {
		this.options = options || { lang: 'en-US' };

		findControllableElementsInDocument();

		if ('webkitSpeechRecognition' in window) {
			attachRecognitionContainerToDocument();
			startSpeechRecognizer();
		} else console.error('This browser does not support voice control.');
	};

	this.execute = command => executeCommand(command);

	function attachRecognitionContainerToDocument() {
		const card = document.createElement('div');
		card.classList.add('wvcat-recognition-container');

		this.recognitionText = document.createElement('p');
		recognitionText.appendChild(document.createTextNode('Sample recognition'));
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
	}

	function setText(text) {
		recognitionText.innerText = text;
	}

	function generateTranscript({ results }) {
		setText('Parsing command..');
		let transcript = '';
		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			if (result.isFinal) transcript += result[0].transcript;
		}

		setText(`Executing command -> [${transcript}]`);
		executeCommand(transcript);
		transcript = '';
	}

	function executeCommand(transcript) {
		transcript = transcript.toLowerCase();
		const words = transcript.split(' ');

		try {
			switch (words[0]) {
				case 'type':
					executeTypingIntent(words);
					break;

				case 'click':
					executeClickIntent(words);
					break;

				case 'focus':
					executeFocusIntent(words);
					break;

				default:
					throw new Error('Invalid command.');
			}
		} catch (err) {
			console.log(err);
		}
	}

	// ------- Intent executors

	function executeFocusIntent(words) {
		if (hasValidSemantics('focus', words)) {
			let controlName = words.substring(2);
			const control = findControl(controlName);
			if (control) control.focus();
		} else throw new Error('Invalid focus intent command.');
	}

	function executeTypingIntent(words) {
		if (hasValidSemantics('type', words)) {
			let whatToTypeEndIndex = words.lastIndexOf('into');

			let whatToType = words.substring(1, whatToTypeEndIndex - 1, ' ');
			let controlName = words.substring(whatToTypeEndIndex + 1);

			const control = findControl(controlName);
			if (control && control.localName == 'input') control.value = whatToType;
		} else throw new Error('Invalid type intent command.');
	}

	function executeClickIntent(words) {
		if (hasValidSemantics('click', words)) {
			let controlName = words.substring(2);
			const control = findControl(controlName);
			if (control) control.click();
		} else throw new Error('Invalid click intent command.');
	}

	// ------- Intent executors

	function hasValidSemantics(type, words) {
		switch (type) {
			case 'click':
			case 'focus':
				return words[1] == 'on' && words.length > 2;

			case 'type':
				return words.includes('into') && words.length >= 4;
		}
	}

	function findControl(identifier) {
		const control = controls.find(c => c.identifier == identifier);
		if (control) return document.getElementsByClassName(control.uuid)[0];
		return null;
	}

	function getUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (Math.random() * 16) | 0,
				v = c == 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
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
