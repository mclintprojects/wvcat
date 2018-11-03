(function(window) {
	window.wvcat = this;

	this.controls = [];

	this.initialize = function(options) {
		this.options = options || { lang: 'en-US' };
		if ('webkitSpeechRecognition' in window) {
			attachRecognitionContainerToDocument();
			startSpeechRecognizer();
			findControllableElementsInDocument();
		} else console.error('This browser does not support voice control.');
	};

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
				controls.push({
					identifier: e.dataset.wvcatId,
					name: e.localName,
					type: e.type
				});
			}
		}

		console.log(controls);
	}

	function startSpeechRecognizer() {
		setText('Listening for commands...');
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
		transcript = '';
		window.setTimeout(startSpeechRecognizer, 2000);
	}
})(window);
