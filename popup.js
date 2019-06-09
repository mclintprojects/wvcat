const pageCbox = document.querySelector('#pageCbox');
const domainCbox = document.querySelector('#domainCbox');

pageCbox.addEventListener('click', disableOnPage);
domainCbox.addEventListener('click', disableOnDomain);

function disableOnPage() {
	chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
		chrome.tabs.sendMessage(tabs[0].id, {
			type: 'disable_page',
			url: tabs[0].url,
			action: pageCbox.checked ? 'add' : 'remove'
		});
	});
}

function disableOnDomain() {
	chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
		chrome.tabs.sendMessage(tabs[0].id, {
			type: 'disable_domain',
			url: tabs[0].url,
			action: pageCbox.checked ? 'add' : 'remove'
		});
	});
}

chrome.runtime.getBackgroundPage(
	bg =>
		(bg.onTabChange = function(info) {
			console.log('popup ontabchange received');
			domainCbox.checked = info.domainDisabled;
			pageCbox.checked = info.pageDisabled;
		})
);
