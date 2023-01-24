import {Browser} from 'webextension-polyfill';
import axios from 'axios';
import ClientAppsManager, { Client } from './client-apps-manager';

const ACTIVITY_STREAMS_MEDIA_TYPE = 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"';

type Account = {
	alias: string,
	/** e.g. user@server.org */
	id: string,
	/** ActivityPub actor Id of the user */
	actorId: string,
	accessToken?: string,
}

type AuthorizationRequestProperties = {
	baseUrl: string,
	client_id: string
}

class AccountsManager {
	private browser: Browser;
	private clientAppsManager: ClientAppsManager;

	constructor(browser: Browser) {
		this.browser = browser;
		this.clientAppsManager = new ClientAppsManager(browser);
	}

	async addAccount(alias: string, identifier: string): Promise<Account> {
		// TODO check if account already exists
		// Save account

		const domain = AccountsManager.calculateDomainFromUserIdentifier(identifier);
		const baseUrl = 'https://' + domain;

		const webFingerResponse = await axios.get(baseUrl + '/.well-known/webfinger', {
			headers: {
				Accept: 'application/jrd+json'
			},
			params: {
				resource: 'acct:' + identifier,
				rel: 'self',
			}
		});

		const actorId = AccountsManager.deriveActivityPubActorIdFromWebfingerJRD(webFingerResponse.data);

		const account = {
			alias: alias,
			id: identifier,
			actorId: actorId
		};

		await this.persistAccount(account);

		try {
			if(!await this.clientAppsManager.getClient(baseUrl)) {
				this.clientAppsManager.createClient(baseUrl);
			}
		}
		catch(e) {
			// Will treat as a warning here because this can be solved later in the process
			console.warn('Client creation failed during account registration', e);
		}

		return account;
	}

	async deleteAccount(alias: string): Promise<void> {
		const persistedAccounts = await this.getAccounts();

		const accounts = persistedAccounts.filter((account) => account.alias !== alias);

		await this.browser.storage.local.set({
			accounts: accounts
		});
	}
	
	async getAccounts(): Promise<Account[]> {
		const persistedAccounts = await this.browser.storage.local.get('accounts');

		return persistedAccounts.accounts || [];
	}

	private async getAccount(alias: string): Promise<Account> {
		const account = (await this.getAccounts()).find((a) => a.alias = alias);

		return account;
	}

	async getAuthorizationRequestProperties(alias: string): Promise<AuthorizationRequestProperties> {
		const clientApp = await this.getClientForAccount(alias);

		return {
			baseUrl: clientApp.baseUrl,
			client_id: clientApp.client_id
		};
	}

	private async persistAccount(account: Account, replaceExisting?: boolean) {
		const persistedAccounts = await this.browser.storage.local.get('accounts');

		if(!persistedAccounts.accounts) {
			persistedAccounts.accounts = [];
		}

		if(!Array.isArray(persistedAccounts.accounts)) {
			// should only happen if persistency is corrupted
			throw Error('Persisted accounts is not an Array');
		}
		
		if(!replaceExisting && persistedAccounts.accounts.find((persistedAccount: any) => persistedAccount.alias === account.alias)) {
			throw Error(`Account already exist with alias: ${account.alias}`);
		}
		else if(replaceExisting) {
			persistedAccounts.accounts = persistedAccounts.accounts.filter((persistedAccount) => persistedAccount.alias !== account.alias);
		}

		persistedAccounts.accounts.push({
			alias: account.alias,
			id: account.id,
			actorId: account.actorId,
			accessToken: account.accessToken,
		});

		await this.browser.storage.local.set({
			accounts: persistedAccounts.accounts
		});
	}

	private static calculateDomainFromUserIdentifier(identifier: string): string {
		const parts = identifier.split('@');

		if(parts.length !== 2) {
			return '';
		}

		return parts[1];
	}

	private static deriveActivityPubActorIdFromWebfingerJRD(webFingerJRDOject: any): string {
		const activityPubActorLink = webFingerJRDOject.links && webFingerJRDOject.links.find((link: any) => link.rel === 'self' && link.type === ACTIVITY_STREAMS_MEDIA_TYPE);

		return activityPubActorLink && activityPubActorLink.href;
	}

	async fetchAndPersistToken(alias: string, authCode: string) {
		const clientApp = await this.getClientForAccount(alias);

		const bodyFormData = new FormData();

		bodyFormData.append('grant_type', 'authorization_code');
		bodyFormData.append('code', authCode);
		bodyFormData.append('scopes', 'write read');
		bodyFormData.append('client_id', clientApp.client_id);
		bodyFormData.append('client_secret', clientApp.client_secret);
		// I don't see why redirect_uris is necessary for this request, but is required according to the
		// API documentation: https://docs.joinmastodon.org/methods/oauth/
		bodyFormData.append('redirect_uris', 'urn:ietf:wg:oauth:2.0:oob');

		const response = await axios.post(clientApp.baseUrl + '/oauth/token', bodyFormData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		});

		// Here is documentation on the Access Token Response
		// https://www.oauth.com/oauth2-servers/access-tokens/access-token-response/

		// TODO: Error handling, access_token must exist, token_type must be Bearer
		// TODO: persist token
		console.log(response);

		await this.updateAccountToken(alias, response.data.access_token);
	}

	async updateAccountToken(alias: string, accessToken: string) {
		const account = await this.getAccount(alias);
		
		account.accessToken = accessToken;

		await this.persistAccount(account, true);
	}

	async getClientForAccount(alias: string) : Promise <Client> {
		const account = await this.getAccount(alias);
		const baseUrl = 'https://' + AccountsManager.calculateDomainFromUserIdentifier(account.id);
		return this.clientAppsManager.getClient(baseUrl);
	}
}

export default AccountsManager;