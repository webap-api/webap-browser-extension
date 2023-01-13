import {Browser} from 'webextension-polyfill';
import axios from 'axios';
import ClientAppsManager from './client-apps-manager';

const ACTIVITY_STREAMS_MEDIA_TYPE = 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"';

type Account = {
	alias: string,
	/** e.g. user@server.org */
	id: string,
	/** ActivityPub actor Id of the user */
	actorId: string,
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
	
	async getAccounts(): Promise<Account[]> {
		const persistedAccounts = await this.browser.storage.local.get('accounts');

		return persistedAccounts.accounts || [];
	}

	private async getAccount(alias: string): Promise<Account> {
		const account = (await this.getAccounts()).find((a) => a.alias = alias);

		return account;
	}

	async getAuthorizationRequestProperties(alias: string) {
		const account = await this.getAccount(alias);
		const baseUrl = 'https://' + AccountsManager.calculateDomainFromUserIdentifier(account.id);
		const clientApp = await this.clientAppsManager.getClient(baseUrl);

		return {
			baseUrl: baseUrl,
			client_id: clientApp.client_id
		};
	}

	private async persistAccount(account: Account) {
		const persistedAccounts = await this.browser.storage.local.get('accounts');

		if(!persistedAccounts.accounts) {
			persistedAccounts.accounts = [];
		}

		if(!Array.isArray(persistedAccounts.accounts)) {
			throw Error('Persisted accounts is not an Array');
		}
		
		if(persistedAccounts.accounts.find((persistedAccount: any) => persistedAccount.alias === account.alias)) {
			throw Error(`Account already exist with alias: ${account.alias}`);
		}

		persistedAccounts.accounts.push({
			alias: account.alias,
			id: account.id,
			actorId: account.actorId
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
}

export default AccountsManager;