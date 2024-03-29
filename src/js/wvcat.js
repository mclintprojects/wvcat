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
			'select',
			'show reference'
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

	this.addCustomCommand = (control, command, callback) => {
		command = command.toLowerCase();
		const regex = commandToRegExp(command);
		customCommands.push({
			control: control.replace(/-/g, ' '),
			regex,
			callback,
			command
		});
		console.log(callback);
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
				return optional ? match : '([\\w]+)';
			})
			.replace(splatParam, '(.*?)');
		return new RegExp('^' + command + '$', 'i');
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
		setTimeout(() => showControlDetails(), 300);
	}

	function showControlDetails() {
		const control = controls[currentControlIndex];
		const name = control.item || control.identifier;
		setText(
			`Currently selected element: ${name}. You can say 'show reference' to know the possible commands for this element.`
		);
	}

	function attachRecognitionContainerToDocument() {
		card = document.createElement('div');
		card.classList.add('wvcat-container');

		recognitionText = document.createElement('p');
		recognitionText.appendChild(document.createTextNode(''));
		recognitionText.setAttribute('role', 'alert');
		recognitionText.setAttribute('aria-live', 'assertive');

		card.appendChild(recognitionText);

		indicatorText = document.createElement('p');
		indicatorText.appendChild(document.createTextNode(''));
		indicatorText.setAttribute('role', 'alert');
		indicatorText.setAttribute('aria-live', 'assertive');

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

			const uuid = getUUID();
			e.setAttribute('data-wvcatUUID', uuid);

			if (e.dataset.wvcatId) {
				controls.push({
					identifier: e.dataset.wvcatId.replace(/-/g, ' '),
					name: e.localName,
					type: e.type,
					uuid
				});
			} else if (e.dataset.wvcatListitem) {
				e.setAttribute('data-wvcat-id', uuid);
				controls.push({
					identifier: uuid,
					name: e.localName,
					type: e.type,
					uuid,
					item: e.dataset.wvcatListitem.replace(/-/g, ' '),
					meta: e.dataset.wvcatMeta
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
			recognitionText.innerText = '';
			indicatorText.innerText = 'Listening for your command...';
			speechRecognizerRunning = true;
		};
		recognizer.onresult = generateTranscript;
		recognizer.onend = () => {
			speechRecognizerRunning = false;
			setTimeout(() => (indicatorText.innerText = ''), 1000);
		};
		recognizer.onerror = () => {
			setText(
				'Failed to start speech recognizer. Please ensure that you have allowed this page to access your microphone.'
			);
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

		executeCommand(transcript.toLowerCase());
	}

	function executeCommand(transcript) {
		console.log('wvcat: ' + transcript);
		const words = transcript.split(' ');

		try {
			if (transcript == 'show reference') executeShowReferenceIntent();
			else {
				switch (words[0].toLowerCase()) {
					case 'next':
						executeNextElementIntent();
						break;

					case 'previous':
						executePreviousElementIntent();
						break;

					case 'clear':
						executeClearIntent();
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

		console.log({ commandExists });
		if (commandExists) {
			const result = command.regex.exec(transcript);
			const control = controls[currentControlIndex];
			control.meta
				? command.callback.call(this, control.meta, ...result.slice(1))
				: command.callback.apply(this, result.slice(1));

			setSuccessExecutionMessage();
		} else {
			const nearestCommandMatch = nearestMatch(
				transcript,
				customCommands.map(c => c.command),
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

	function nearestMatch(original, testWords, distance = 2) {
		let results = testWords.map(w => ({
			distance: levenshtein(original, w),
			word: w
		}));

		let closeResults = [];
		results = results.forEach(result => {
			if (result.distance <= distance) closeResults.push(result);
		});

		if (closeResults.length > 0)
			return closeResults.sort(
				(result1, result2) => result1.distance - result2.distance
			)[0].word;

		return null;
	}

	// ------- Intent executors

	function executeShowReferenceIntent() {
		const control = controls[currentControlIndex];
		const name = control.item || control.identifier;
		const commandsForCurrentControl = customCommands
			.filter(c => c.control == name)
			.map(c => c.command);
		const allCommands = [...wvcatKeywords, ...commandsForCurrentControl];

		const text = `Possible commands for ${name}\n\n${allCommands.join('\n')}`;
		setText(text);
	}

	function setSuccessExecutionMessage() {
		setText(`Executed command: successfully.`);
	}

	function executeSelectControlIntent(words) {
		const controlName = words.substring(1);
		const controlIndex = findControlIndex(controlName);
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
				window.location.replace(currentControl.href);
			} else {
				const target = words.substring(2);
				if (
					currentControl &&
					currentControl.localName == 'a' &&
					target == 'new tab'
				) {
					window.open(control.href);
				} else throw new Error('Invalid link navigation intent command.');
			}

			setSuccessExecutionMessage();
		} else throw new Error('Invalid link navigation intent command.');
	}

	function executeClickIntent(words) {
		const controlName = words.substring(1);
		const controlIndex = findControlIndex(controlName);
		if (controlIndex != -1) {
			currentControlIndex = controlIndex;
			setCurrentControl();
			currentControl.click();
			setSuccessExecutionMessage();
		} else throw new Error('Invalid click intent command.');
	}

	function executeClearIntent() {
		currentControl.value = '';
		currentControl.dispatchEvent(new Event('input'));
	}

	// ------- Intent executors

	function hasValidSemantics(type, words) {
		switch (type) {
			case 'link':
				return words.length == 1 || (words.length > 2 && words[1] == 'in');
		}
	}

	function findControlIndex(query) {
		const firstResult = controls.findIndex(
			c => c.identifier == query || c.item == query
		);
		if (firstResult == -1) {
			const nearestResult = nearestMatch(
				query,
				controls.map(c => c.item || c.identifier),
				3
			);
			return controls.findIndex(
				c => c.identifier == nearestResult || c.item == nearestResult
			);
		}

		return firstResult;
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
