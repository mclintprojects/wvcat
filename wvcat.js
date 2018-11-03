(function(window) {
	window.wvcat = this;

	this.controls = [];

	this.initialize = function() {
		const elements = document.getElementsByClassName('wvcat-element');
		for (let i = 0; i < elements.length; i++) {
			let e = elements[i];

			if (e.dataset.wvcatId) {
				controls.push({
					identifier: e.dataset.wvcatId.replace('-', ' '),
					name: e.localName,
					type: e.type
				});
			}
		}

		console.log(controls);
	};
})(window);
