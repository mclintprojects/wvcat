(function() {
	window.wvcat = this;
	window.SpeechRecognition =
		window.webkitSpeechRecognition || window.SpeechRecognition;

	var controls = [],
		speechRecognizerRunning = false,
		customCommands = [],
		currentControl = null,
		currentControlIndex = 0,
		_options = {},
		card = null,
		indicatorText = null,
		recognitionText = null,
		wvcatKeywords = [
			'next',
			'previous',
			'clear',
			'click',
			'click',
			'open',
			'select'
		];

	this.initialize = function(options) {
		_options = options || { lang: 'en-GH' };

		findControllableElementsInDocument();

		if (window.SpeechRecognition && controls.length > 0) {
			attachHotkey();
			attachContextAwareListener();
			attachRecognitionContainerToDocument();
			highlightFirstControllableElement();
			initializeSpeechRecognizer();
		} else console.error('This browser does not support voice control.');
	};

	// ---- PUBLIC FUNCTIONS ----

	this.execute = command => executeCommand(command);

	this.addCustomCommand = (command, callback) => {
		command = command.toLowerCase();
		const regex = commandToRegExp(command);
		customCommands.push({
			regex,
			callback,
			command
		});
	};

	// ---- END PUBLIC FUNCTIONS ----

	// The command matching code is a modified version of Aanyang.js by Tel Atel, under the MIT license.
	let namedParam = /(\(\?)?:\w+/g;
	let splatParam = /\*\w+/g;
	let escapeRegExp = /[-{}[\]+?.,\\$|#]/g;
	function commandToRegExp(command) {
		command = command
			.replace(escapeRegExp, '\\$&')
			.replace(namedParam, function(match, optional) {
				return optional ? match : '([\\s]+)';
			})
			.replace(splatParam, '(.*?)');
		return new RegExp('' + command + '$', 'i');
	}

	function highlightFirstControllableElement() {
		currentControl = findControlByUUID(controls[0].uuid);
		currentControl.classList.add('wvcat-highlight');
		currentControl.focus();
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
		card.setAttribute('aria-live', 'assertive');
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
								color: black;
								font-size: 16px;
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
				e.setAttribute('data-wvcatUUID', uuid);
				controls.push({
					identifier: e.dataset.wvcatId.replace(/-/g, ' '),
					name: e.localName,
					type: e.type,
					uuid
				});
			}
		}
	}

	function attachHotkey() {
		document.addEventListener(
			'keyup',
			function(event) {
				if (event.key == 'Control' && !speechRecognizerRunning)
					startSpeechRecognizer();
			},
			true
		);
	}

	function attachContextAwareListener() {
		document.addEventListener(
			'focus',
			function(event) {
				const control = event.target;
				if (control.dataset.wvcatuuid) {
					if (control.classList.contains('wvcat-element')) {
						indicatorText.innerText = `Currently selected element: ${control.dataset.wvcatId.replace(
							/-/g,
							' '
						)}. ${
							control.dataset.wvcatCommand
								? `You can say '${
										control.dataset.wvcatCommand
								  }' to perform this action.`
								: ''
						}`;
					}

					const uuid = control.dataset.wvcatuuid;
					currentControlIndex = controls.findIndex(c => c.uuid == uuid);
					setCurrentControl();
				}
			},
			true
		);
	}

	function initializeSpeechRecognizer() {
		recognizer = new SpeechRecognition();
		recognizer.lang = _options.lang;
		recognizer.onstart = () => {
			indicatorText.innerText = 'Listening for your command...';
			speechRecognizerRunning = true;
		};
		recognizer.onresult = generateTranscript;
		recognizer.onend = () => {
			speechRecognizerRunning = false;
			setTimeout(() => (indicatorText.innerText = ''), 1000);
		};
	}

	function startSpeechRecognizer() {
		recognizer.start();
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
	}

	function executeCommand(transcript) {
		console.log('wvcat: ' + transcript);
		const words = transcript.split(' ');

		try {
			switch (words[0].toLowerCase()) {
				case 'next':
					executeNextElementIntent();
					break;

				case 'previous':
					executePreviousElementIntent();
					break;

				case 'clear':
					executeTypingIntent('clear', words);
					break;

				case 'click':
					executeClickIntent(words);
					break;

				case 'open':
					executeNavigateToLinkIntent(words);
					break;

				case 'select':
					executeSelectControlIntent(words);
					break;

				default:
					handleCustomCommand(words[0], words);
					break;
			}
		} catch (err) {
			setText(err.message);
			console.log(err);
		}
	}

	function handleCustomCommand(keyword, words) {
		const nearestKeywordMatch = nearestMatch(keyword, wvcatKeywords);
		if (nearestKeywordMatch)
			executeCommand(`${nearestKeywordMatch} ${words.substring(1)}`);
		else executeCustomCommand(words.substring(0));
	}

	function executeCustomCommand(transcript) {
		let commandExists = false,
			command;
		for (let i = 0; i < customCommands.length; i++) {
			command = customCommands[i];
			commandExists = command.regex.test(transcript);

			if (commandExists) break;
		}

		if (commandExists) {
			const result = command.regex.exec(transcript);
			command.callback.apply(this, result.slice(1));
		} else {
			const nearestCommandMatch = nearestMatch(
				transcript,
				customCommands.map(c => c.command)
			);

			if (nearestCommandMatch) {
				executeCommand(nearestCommandMatch);
			} else throw new Error(`Could not execute '${transcript}'.`);
		}
	}

	function levenshtein(s1, s2) {
		// based on original implementation by diogo gomes https://gist.github.com/graphnode/979790
		if (s1 == s2) {
			return 0;
		}

		const s1_len = s1.length;
		const s2_len = s2.length;
		if (s1_len === 0) {
			return s2_len;
		}
		if (s2_len === 0) {
			return s1_len;
		}

		let v0 = [s1_len + 1];
		let v1 = [s1_len + 1];
		let s1_idx = 0,
			s2_idx = 0,
			cost = 0;
		for (s1_idx = 0; s1_idx < s1_len + 1; s1_idx++) {
			v0[s1_idx] = s1_idx;
		}
		let char_s1 = '',
			char_s2 = '';
		for (s2_idx = 1; s2_idx <= s2_len; s2_idx++) {
			v1[0] = s2_idx;
			char_s2 = s2[s2_idx - 1];

			for (s1_idx = 0; s1_idx < s1_len; s1_idx++) {
				char_s1 = s1[s1_idx];
				cost = char_s1 == char_s2 ? 0 : 1;
				let m_min = v0[s1_idx + 1] + 1;
				const b = v1[s1_idx] + 1;
				const c = v0[s1_idx] + cost;
				if (b < m_min) {
					m_min = b;
				}
				if (c < m_min) {
					m_min = c;
				}
				v1[s1_idx + 1] = m_min;
			}
			const v_tmp = v0;
			v0 = v1;
			v1 = v_tmp;
		}
		return v0[s1_len];
	}

	function nearestMatch(original, testWords) {
		let results = testWords.map(w => ({
			distance: levenshtein(original, w),
			word: w
		}));

		let closeResults = [];
		results = results.forEach(result => {
			if (result.distance <= 2) closeResults.push(result);
		});

		if (closeResults.length > 0)
			return closeResults.sort(
				(result1, result2) => result1.distance > result2.distance
			)[0].word;

		return null;
	}

	// ------- Intent executors

	function setSuccessExecutionMessage() {
		setText(`Executed command: successfully.`);
	}

	function executeSelectControlIntent(words) {
		const controlName = words.substring(1);
		const controlIndex = controls.findIndex(c => c.identifier == controlName);
		if (controlIndex != -1) {
			currentControlIndex = controlIndex;
			setCurrentControl();
			setSuccessExecutionMessage();
		}
	}

	function executePreviousElementIntent() {
		--currentControlIndex;
		if (currentControlIndex < 0) currentControlIndex = controls.length - 1;

		setCurrentControl();
		setSuccessExecutionMessage();
	}

	function executeNextElementIntent() {
		++currentControlIndex;
		if (currentControlIndex >= controls.length) currentControlIndex = 0;
		setCurrentControl();
		setSuccessExecutionMessage();
	}

	function executeNavigateToLinkIntent(words) {
		if (hasValidSemantics('link', words)) {
			if (words.length == 1) {
				if (currentControl.localName != 'a')
					throw new Error('Invalid intent on element.');
				window.location.replace(control.href);
			} else {
				if (control && control.localName == 'a' && target == 'new tab') {
					window.open(control.href);
				} else throw new Error('Invalid link navigation intent command.');
			}

			setSuccessExecutionMessage();
		} else throw new Error('Invalid link navigation intent command.');
	}

	function executeClickIntent(words) {
		const controlName = words.substring(1);
		const controlIndex = controls.findIndex(c => c.identifier == controlName);
		if (controlIndex != -1) {
			currentControlIndex = controlIndex;
			setCurrentControl();
			currentControl.click();
			setSuccessExecutionMessage();
		} else throw new Error('Invalid click intent command.');
	}

	// ------- Intent executors

	function hasValidSemantics(type, words) {
		switch (type) {
			case 'link':
				return words.length == 1 || (words.length > 2 && words[1] == 'in');
		}
	}

	function findControlByUUID(uuid) {
		return document.querySelector(`[data-wvcatuuid="${uuid}"]`);
	}

	function getUUID() {
		return 'xxxxxxxx'.replace(/[xy]/g, function(c) {
			let r = (Math.random() * 16) | 0,
				v = c == 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
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
