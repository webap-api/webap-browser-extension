export default function registerWebAPWindowMessageHandler() { 
	window.addEventListener('message', webAPWindowMessageHandler);
}

function webAPWindowMessageHandler(ev: MessageEvent) {
	if(!ev.data || ev.data.application !== 'WebAP' || ev.data.isResponse) {
		return;
	}

	let responseBody: any;
	let error: any;

	try {
		switch(ev.data.type) {
			case 'getClients':
				responseBody = getClients();
				break;
			case 'postToOutbox':
				responseBody = postToOutbox(ev.data.body);
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

type GetClientsMessageBody = [{
	alias: string;
}];

function getClients(): GetClientsMessageBody {
	return [{
		alias: 'My account on fosstodon'
	}]
}

function postToOutbox(body: any) {
	console.log(body);
	return;
}