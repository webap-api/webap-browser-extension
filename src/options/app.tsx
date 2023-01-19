import React from 'react';
import browser from 'webextension-polyfill';
import AccountsManager from '../core/accounts-manager';

type OptionsState = {
	accountToAddAlias: string;
	accountToAddIdentifier: string;
	accounts: OptionsStateAccount[]; 
}

type OptionsStateAccount = {
	alias: string;
	id: string;
	isAuthenticated: boolean;
	isWaitingAuthCode: boolean;
	authCode?: string;
};

class App extends React.Component<{},OptionsState> {
	private accountsManager: AccountsManager;
	
	constructor(props: Readonly<{}>) {
		super(props);
		this.state = {
			accountToAddAlias: '',
			accountToAddIdentifier: '',
			accounts: []
		}

		this.accountsManager = new AccountsManager(browser);
	}

	async componentDidMount() {
		this.upadateStateFromPersistedAccounts();
	}

	private async upadateStateFromPersistedAccounts() {
		const persistedAccounts = await this.accountsManager.getAccounts();

		this.setState({
			accounts: persistedAccounts.map((account) => ({
				alias: account.alias,
				id: account.id,
				isAuthenticated: false,
				isWaitingAuthCode: false,
			}))
		});
	}

	private setAccountToAddAlias(accountToAddAlias: string): void {
		this.setState({accountToAddAlias: accountToAddAlias});
	}

	private setAccountToAddIdentifier(accountToAddAlias: string): void {
		this.setState({accountToAddIdentifier: accountToAddAlias});
	}

	private async handleAddAccountClicked() {
		await this.accountsManager.addAccount(this.state.accountToAddAlias, this.state.accountToAddIdentifier);
		this.upadateStateFromPersistedAccounts();
	}

	private async handleAuthenticateAccountClicked(account: OptionsStateAccount) {
		const arp = await this.accountsManager.getAuthorizationRequestProperties(account.alias);

		const authorizationUrl = `${arp.baseUrl}/oauth/authorize?response_type=code&client_id=${arp.client_id}&redirect_uri=urn:ietf:wg:oauth:2.0:oob`;

		window.alert('A new tab/window will open where we will ask for your authorization. After approving, copy the authorization code, and enter it back in this page.');
		window.open(authorizationUrl);

		this.setAccountIsWaitingForAuthCodeToTrue(account);
	}
	
	setAccountIsWaitingForAuthCodeToTrue(account: OptionsStateAccount) {
		const newState = this.state;

		newState.accounts.forEach((a) => {
			if(a.alias === account.alias) {
				a.isWaitingAuthCode = true;
			}
		});

		this.setState(newState);
	}

	private setAccountAuthCode(account: OptionsStateAccount, authCode:string): void {
		const newState = this.state;

		newState.accounts.forEach((a) => {
			if(a.alias === account.alias) {
				a.authCode = authCode;
			}
		});

		this.setState(newState);
	}

	async handleAccountAuthCodeKeyDown(account: OptionsStateAccount, e: React.KeyboardEvent<HTMLInputElement>): Promise<void> {
		if(e.key === 'Enter' && account.authCode) {
			try {
				await this.accountsManager.fetchAndPersistToken(account.alias, account.authCode);
				// TODO: update account state, not waiting for authCode anymore, possibly show a dismissible success message
			}
			catch(e) {
				console.log(e);
			}
		}
	}

	render() {
		return (
			<div>
				<h1>WebAP Options</h1>
				<label>Account alias</label>
				<input onChange={(e) => this.setAccountToAddAlias(e.target.value)} value={this.state.accountToAddAlias}></input>
				<br/>
				<label>Account identifier</label>
				<input onChange={(e) => this.setAccountToAddIdentifier(e.target.value)} value={this.state.accountToAddIdentifier}></input>
				<br/>
				<button onClick={(e) => this.handleAddAccountClicked()}>Add Account</button>
				<h2>Accounts</h2>
				{this.state.accounts.length ? this.state.accounts.map((account) => (
					<div>
						<h3>{account.alias}</h3>
						<p>{account.id}</p>
						<button>Delete</button>
						{!account.isAuthenticated && <button onClick={(e) => this.handleAuthenticateAccountClicked(account)}>Authenticate</button>}
						{account.isWaitingAuthCode && 
							(<div>
								<label>Authcode (paste and press enter)</label>
								<input 
									onChange={(e) => this.setAccountAuthCode(account, e.target.value)}
									onKeyDown={(e) => this.handleAccountAuthCodeKeyDown(account, e)}
									value={account.authCode}></input>
							</div>)
						}
					</div>
				)) : <p>No accounts added yet.</p>}
			</div>
		)
	}
}

export default App;