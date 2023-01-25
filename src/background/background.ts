import browser from 'webextension-polyfill';
import AccountsManager from '../core/accounts-manager';

const accountsManager = new AccountsManager(browser);

browser.runtime.onMessage.addListener(async (message, sender): Promise<void> => {
	let responseBody: any;
	let error: any;

	try {
		switch(message.type) {
			case 'postToOutbox':
				// responseBody = await postToOutbox(ev.data.body);
				responseBody = await postToOutbox(message.body);
				break;
		}
	}
	catch(e) {
		error = e;
	}

	return responseBody;
})

async function postToOutbox(body: any) {
	const alias = body.alias as string;
	const activity = body.activity;

	const account = await accountsManager.getAccount(alias);

	// Maybe it would be better to cache the outbox, but at
	// this point I'm still avoiding optimizations
	const response = await fetch(account.actorId, {
		headers: {
			// TODO: Reuse constant for media type
			'Accept': 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
		}
	})

	const outbox = (await response.json()).outbox;
	const requestBody = {
		...activity,
		'@context': 'https://www.w3.org/ns/activitystreams'
	}

	await fetch(outbox, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"',
			'Authorization': `Bearer ${account.accessToken}`
		},
		body: JSON.stringify(requestBody)
	})

	return;
}