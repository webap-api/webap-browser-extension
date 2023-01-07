import browser from 'webextension-polyfill';

export default function injectScript() {
	try {
		if (!document) throw new Error('No document');
		const container = document.head || document.documentElement;
		if (!container) throw new Error('No container element');
		const scriptElement = document.createElement('script');
		scriptElement.setAttribute('async', 'false');
		scriptElement.setAttribute('type', 'text/javascript');
		scriptElement.setAttribute('src', browser.runtime.getURL('inpage-script.js'));
		container.appendChild(scriptElement);
	} catch (err) {
	  	console.error('WebAP’s WebAP injection failed', err);
	}
}