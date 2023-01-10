import {Browser} from 'webextension-polyfill';
import axios from 'axios';

type Client = {
	baseUrl: string,
	client_id: string,
	client_secret: string,
	vapid_key?: string 
}

/**
 * Client applications manager
 * 
 * Manages the registration of client applications on the 
 * instances. It requires the instances to support the
 * Mastodon apps API Methods (https://docs.joinmastodon.org/methods/apps/).
 * 
 * Client applications are used for OAuth 2.0 authentication
 * 
 * Client application data is persisted on the browser by this class.
 */
class ClientAppsManager {
	private browser: Browser;

	constructor(browser: Browser) {
		this.browser = browser;
	}

	async createClient(baseUrl: string) {
		let client: Client | null = await this.getClient(baseUrl);

		if(client) {
			throw Error(`Client already registered at ${baseUrl}`);
		}

		const bodyFormData = new FormData();

		bodyFormData.append('client_name', 'webap-browser-extension');
		bodyFormData.append('redirect_uris', 'urn:ietf:wg:oauth:2.0:oob');
		bodyFormData.append('scopes', 'write read');
		bodyFormData.append('website', 'https://github.com/webap-api/webap-browser-extension');

		const response = await axios.post(baseUrl + '/api/v1/apps', bodyFormData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		});

		// TODO: Error handling

		client = {
			baseUrl: baseUrl,
			client_id: response.data.client_id,
			client_secret: response.data.client_secret,
			vapid_key: response.data.vapid_key
		}

		// KNOWNISSUE: Persisting the client secret on local storage is a bad
		// practice, but there are no good alternatives at the moment
		// see https://github.com/w3c/webextensions/issues/154
		await this.persistClient(client);
	}

	async getClient(baseUrl: string) : Promise<Client | null> {
		let { clients } = await this.browser.storage.local.get('clients');

		if(!clients)
			return null;

		if(!Array.isArray(clients))
			throw Error('Persisted clients is not an array');

		const client = clients.find((clientToTest) => clientToTest.baseUrl = baseUrl);

		return client;
	}

	async getClients(): Promise<Client[] | null> {
		const { clients } = await this.browser.storage.local.get('clients');
		return clients;
	}

	private async persistClient(client: Client) {
		const clients = (await this.getClients()) || [];

		clients.push(client)

		await this.browser.storage.local.set({clients: clients});
	}
}

export default ClientAppsManager;