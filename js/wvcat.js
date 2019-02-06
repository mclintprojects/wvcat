(function(window) {
	window.wvcat = this;
	window.SpeechRecognition =
		window.webkitSpeechRecognition || window.SpeechRecognition;

	this.controls = [];
	this.customCommands = [];
	this.isListening = false;
	this.currentControl = null;
	this.currentControlIndex = 0;

	this.initialize = function(options) {
		this.options = options || { lang: 'en-US' };

		findControllableElementsInDocument();

		if (window.SpeechRecognition && this.controls.length > 0) {
			highlightFirstControllableElement();
			attachRecognitionContainerToDocument();
			startSpeechRecognizer();
		} else console.error('This browser does not support voice control.');
	};

	this.execute = command => executeCommand(command);

	this.addCustomCommand = (command, callback) => {
		const regex = commandToRegExp(command);
		this.customCommands.push({
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
		this.currentControl = findControlByUUID(controls[0].uuid);
		this.currentControl.classList.add('wvcat-highlight');
	}

	function setCurrentControl() {
		if (this.currentControl)
			this.currentControl.classList.remove('wvcat-highlight');

		this.currentControl = findControlByUUID(
			controls[this.currentControlIndex].uuid
		);
		this.currentControl.classList.add('wvcat-highlight');
		this.currentControl.focus();
	}

	function attachRecognitionContainerToDocument() {
		const card = document.createElement('div');
		card.setAttribute('role', 'alert');
		card.classList.add('wvcat-container');

		this.recognitionText = document.createElement('p');
		this.recognitionText.appendChild(document.createTextNode(''));
		card.appendChild(this.recognitionText);

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
		setText('Listening...');

		this.recognizer = new SpeechRecognition();
		recognizer.lang = this.options.lang;
		recognizer.start();
		recognizer.onresult = generateTranscript;
		recognizer.onend = () => recognizer.start();

		this.isListening = true;
	}

	function setText(text) {
		this.recognitionText.innerText = text;
	}

	function generateTranscript({ results }) {
		let transcript = '';
		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			if (result.isFinal) transcript += result[0].transcript;
		}

		setText(`Executing command "${transcript}"`);
		executeCommand(transcript);
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
					for (let i = 0; i < this.customCommands.length; i++) {
						const command = this.customCommands[i];
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
	}

	// ------- Intent executors

	function executeSelectControlIntent(words) {
		const controlName = words.substring(1);
		const controlIndex = this.controls.findIndex(
			c => c.identifier == controlName
		);
		if (controlIndex != -1) {
			this.currentControlIndex = controlIndex;
			setCurrentControl();
		}
	}

	function executePreviousElementIntent() {
		--this.currentControlIndex;
		if (this.currentControlIndex < 0)
			this.currentControlIndex = controls.length - 1;

		setCurrentControl();
	}

	function executeNextElementIntent() {
		++this.currentControlIndex;
		if (this.currentControlIndex >= this.controls.length)
			this.currentControlIndex = 0;
		setCurrentControl();
	}

	function executeNavigateToLinkIntent(words) {
		if (hasValidSemantics('link', words)) {
			if (words.length == 1) {
				this.currentControl.click();
			} else {
				let target = words.substring(2);
				const control = this.currentControl;

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

		if (this.currentControl.localName == 'input') {
			switch (action) {
				case 'type':
					this.currentControl.value = whatToType;
					break;

				case 'append':
					this.currentControl.value += ` ${whatToType}`;
					break;

				case 'clear':
					this.currentControl.value = '';
					break;
			}
		} else throw Error('Currently selected element is not an input element.');
	}

	function executeClickIntent() {
		this.currentControl.click();
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
