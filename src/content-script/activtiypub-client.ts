import browser from 'webextension-polyfill';
import AccountsManager from '../core/accounts-manager';

const accountsManager = new AccountsManager(browser);

export default function registerWebAPWindowMessageHandler() { 
	window.addEventListener('message', webAPWindowMessageHandler);
}

async function webAPWindowMessageHandler(ev: MessageEvent) {
	if(!ev.data || ev.data.application !== 'WebAP' || ev.data.isResponse) {
		return;
	}

	let responseBody: any;
	let error: any;

	try {
		switch(ev.data.type) {
			case 'getClients':
				responseBody = await getClients();
				break;
			case 'postToOutbox':
				// This had to be delegated to the background service worker, sending it
				// from the content script was not working due to a CORS error, even with
				// host_permissions set in the manifest.json file 
				responseBody = await browser.runtime.sendMessage(ev.data);
				break;
		}
	}
	catch(e) {
		error = e;
	}
	
	// Send response
	window.postMessage({
		application: 'WebAP',
		type: ev.data.type,
		isResponse: true,
		body: responseBody
	});
}

type GetClientsMessageBody = {
	alias: string;
}[];

async function getClients(): Promise<GetClientsMessageBody> {
	const accounts = await accountsManager.getAccounts();

	return accounts.map((account) => ({
		alias: account.alias
	}))
}