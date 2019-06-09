var onTabChange = function() {
	console.log('background ontabchange received');
};

function getPageInfo(url, callback) {
	chrome.storage.sync.get('blockedList', result => {
		const blockedList = result.blockedList || [];
		console.log(JSON.stringify(result));
		const info = { url, domainDisabled: false, pageDisabled: false };
		const domainEntry = blockedList.find(u => u.includes(url));

		if (domainEntry) {
			info.domainDisabled = true;
			info.pageDisabled = true;
		} else {
			const pageEntry = blockedList.find(u => u == url);
			if (pageEntry) info.pageDisabled = true;
		}

		callback(info);
	});
}

chrome.tabs.onActivated.addListener(_ => {
	chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
		getPageInfo(tabs[0].url, info => {
			console.log(info);
			onTabChange(info);
		});
	});
});
