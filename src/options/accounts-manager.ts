import {Browser} from 'webextension-polyfill';
import axios from 'axios';

const ACTIVITY_STREAMS_MEDIA_TYPE = 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"';

type Account = {
	alias: string,
	id: string,
	actorId: string,
}

class AccountsManager {
	private browser: Browser;

	constructor(browser: Browser) {
		this.browser = browser;
	}

	async addAccount(alias: string, identifier: string): Promise<Account> {
		// TODO check if account already exists
		// Save account

		const domain = AccountsManager.calculateDomainFromUserIdentifier(identifier);

		const webFingerResponse = await axios.get('https://' + domain + '/.well-known/webfinger', {
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

		return account;
	}
	
	async getAccounts(): Promise<Account[]> {
		const persistedAccounts = await this.browser.storage.local.get('accounts');

		return persistedAccounts.accounts || [];
	}

	async persistAccount(account: Account) {
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
		const activityPubActorLink = webFingerJRDOject.links && webFingerJRDOject.links.find((link) => link.rel === 'self' && link.type === ACTIVITY_STREAMS_MEDIA_TYPE);

		return activityPubActorLink && activityPubActorLink.href;
	}
}

export default AccountsManager;