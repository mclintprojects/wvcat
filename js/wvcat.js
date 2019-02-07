(function() {
	window.wvcat = this;
	window.SpeechRecognition =
		window.webkitSpeechRecognition || window.SpeechRecognition;

	var controls = [],
		customCommands = [],
		isListening = false,
		currentControl = null,
		currentControlIndex = 0,
		_options = {},
		card = null,
		indicatorText = null,
		recognitionText = null;

	this.initialize = function(options) {
		_options = options || { lang: 'en-GH' };

		findControllableElementsInDocument();

		if (window.SpeechRecognition && controls.length > 0) {
			highlightFirstControllableElement();
			attachRecognitionContainerToDocument();
			startSpeechRecognizer();
		} else console.error('This browser does not support voice control.');
	};

	this.execute = command => executeCommand(command);

	this.addCustomCommand = (command, callback) => {
		const regex = commandToRegExp(command);
		customCommands.push({
			regex,
			callback
		});
	};

	// The command matching code is a modified version of Aanyang.js by Tel Atel, under the MIT license.
	let namedParam = /(\(\?)?:\w+/g;
	let splatParam = /\*\w+/g;
	let escapeRegExp = /[-{}[\]+?.,\\^$|#]/g;
	function commandToRegExp(command) {
		command = command
			.replace(escapeRegExp, '\\$&')
			.replace(namedParam, function(match, optional) {
				return optional ? match : '([^\\s]+)';
			})
			.replace(splatParam, '(.*?)');
		return new RegExp('^' + command + '$', 'i');
	}

	function highlightFirstControllableElement() {
		currentControl = findControlByUUID(controls[0].uuid);
		currentControl.classList.add('wvcat-highlight');
	}

	function setCurrentControl() {
		if (currentControl) currentControl.classList.remove('wvcat-highlight');

		currentControl = findControlByUUID(controls[currentControlIndex].uuid);
		currentControl.classList.add('wvcat-highlight');
		currentControl.focus();
	}

	function attachRecognitionContainerToDocument() {
		card = document.createElement('div');
		card.setAttribute('role', 'alert');
		card.classList.add('wvcat-container');

		recognitionText = document.createElement('p');
		recognitionText.appendChild(document.createTextNode(''));
		card.appendChild(recognitionText);

		indicatorText = document.createElement('p');
		indicatorText.appendChild(document.createTextNode(''));
		card.appendChild(indicatorText);

		const style = document.createElement('style');
		style.innerHTML = `.wvcat-container {
								z-index: 99999;
								background: white;
								border: 2px solid lightblue;
								border-radius: 5px;
								position: fixed;
								bottom: 16px;
								left: 35%;
								width: 30%;
								margin: 0 auto;
								padding: 16px;
								font-family: 'Arial';
							}

							.wvcat-highlight {
								border: 2px solid lightblue !important;
							}`;

		document.head.appendChild(style);
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
		recognizer = new SpeechRecognition();
		recognizer.lang = _options.lang;
		recognizer.onstart = () => {
			indicatorText.innerText = 'Listening...';
			card.style.borderColor = 'lawngreen';
			setTimeout(() => (card.style.borderColor = 'lightblue'), 1000);
		};
		recognizer.start();
		recognizer.onresult = generateTranscript;
		recognizer.onend = () => recognizer.start();

		isListening = true;
	}

	function setText(text) {
		recognitionText.innerText = text;
		setTimeout(() => (recognitionText.innerText = ''), 2000);
	}

	function generateTranscript({ results }) {
		let transcript = '';
		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			if (result.isFinal) transcript += result[0].transcript;
		}

		executeCommand(addPunctuations(transcript));
	}

	function addPunctuations(transcript) {
		return transcript
			.replace(/^\s(at sign)\s*/g, '@')
			.replace(/^\s(and sign)\s*/g, '&')
			.replace(/^\s(question mark)\s*/g, '?')
			.replace(/^\s(comma)\s*/g, ',')
			.replace(/^\s(new line)\s*/g, '\r\n')
			.replace(/^\s(equal sign)\s*/g, '=')
			.replace(/^\s(hyphen)\s*/g, '-')
			.replace(/^\s(underscore)\s*/g, '_')
			.replace(/^\s(plus sign)\s*/g, '+')
			.replace(/^\s(forward slash)\s*/g, '/')
			.replace(/^\s(back slash)\s*/g, '\\')
			.replace(/^\s(single quote)\s*/g, "'")
			.replace(/^\s(percent sign)\s*/g, '%')
			.replace(/^\s(left parenthesis)\s*/g, '(')
			.replace(/^\s(right parenthesis)\s*/g, ')')
			.replace(/^\s(quote sign)\s*/g, '"');
	}

	function executeCommand(transcript) {
		const words = transcript.split(' ');

		try {
			switch (words[0].toLowerCase()) {
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

				case 'open':
					executeNavigateToLinkIntent(words);
					break;

				case 'select':
					executeSelectControlIntent(words);
					break;

				default:
					for (let i = 0; i < customCommands.length; i++) {
						const command = customCommands[i];
						const result = command.regex.exec(transcript);
						if (result) {
							command.callback.apply(this, result.slice(1));
							break;
						}
					}
					break;
			}
		} catch (err) {
			setText(err.message);
		}

		setText(`Executed command "${transcript}".`);
	}

	// ------- Intent executors

	function executeSelectControlIntent(words) {
		const controlName = words.substring(1);
		const controlIndex = controls.findIndex(c => c.identifier == controlName);
		if (controlIndex != -1) {
			currentControlIndex = controlIndex;
			setCurrentControl();
		}
	}

	function executePreviousElementIntent() {
		--currentControlIndex;
		if (currentControlIndex < 0) currentControlIndex = controls.length - 1;

		setCurrentControl();
	}

	function executeNextElementIntent() {
		++currentControlIndex;
		if (currentControlIndex >= controls.length) currentControlIndex = 0;
		setCurrentControl();
	}

	function executeNavigateToLinkIntent(words) {
		if (hasValidSemantics('link', words)) {
			if (words.length == 1) {
				currentControl.click();
			} else {
				let target = words.substring(2);
				const control = currentControl;

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
		} else throw Error('Currently selected element is not an input element.');
	}

	function executeClickIntent() {
		currentControl.click();
	}

	// ------- Intent executors

	function hasValidSemantics(type, words) {
		switch (type) {
			case 'link':
				return words.length == 1 || (words.length > 2 && words[1] == 'in');
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
				let r = (Math.random() * 16) | 0,
					v = c == 'x' ? r : (r & 0x3) | 0x8;
				return v.toString(16);
			})
		);
	}
})();

Array.prototype.substring = function(start, end, join = '') {
	end = end || this.length - 1;
	let word = '';
	for (start; start <= end; start++) {
		if (start != end) word += `${this[start]} ${join}`;
		else word += `${this[start]}`;
	}

	return word;
};
