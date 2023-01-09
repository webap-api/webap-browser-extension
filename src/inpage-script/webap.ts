class ActivityPubClient {
	private alias: string;

	constructor(alias: string) {
		this.alias = alias;
	}

	async postToOutbox(activity: any) {
		return postMessageToContentScript('postToOutbox', {alias: this.alias, activity: activity})
	}
} 

export default class WebAP {
	async getClients(): Promise<ActivityPubClient[]> {
		const clients = (await postMessageToContentScript('getClients')).map((clientInMessageResponse: any) => 
		new ActivityPubClient(clientInMessageResponse.alias)
		);
		return clients;
	}
}

async function postMessageToContentScript(type: string, body?: any) {
	window.postMessage({
		application: 'WebAP',
		type: type,
		body: body
	});

	return new Promise<any>((resolve, reject) => {
		function handleWindowMessage(ev: MessageEvent) {
			if (!ev.data || ev.data.application !== 'WebAP' || !ev.data.isResponse) {
			  return;
			}
			if (ev.data.error) {
			  reject(ev.data.error);
			} else {
			  resolve(ev.data.body);
			}
			window.removeEventListener('message', handleWindowMessage);
		}

		// Listen for message response
		window.addEventListener('message', handleWindowMessage);
	});
}