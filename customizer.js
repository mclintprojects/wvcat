function Customizer(href) {
	this.customize = function() {
		switch (href) {
			case 'https://ghana.waecdirect.org/#':
				customizeForWaec();
				break;
		}
	};

	function customizeForWaec() {
		wvcat.addCustomCommand('submit button', 'submit', () => {
			document.querySelector(`input[data-wvcat-id='submit-button']`).click();
		});

		wvcat.addCustomCommand('clear button', 'clear form', () => {
			document.querySelector(`input[data-wvcat-id='clear-button']`).click();
		});
	}
}
