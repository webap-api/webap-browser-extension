import React from 'react';
import browser from 'webextension-polyfill';
import AccountsManager from '../core/accounts-manager';

type OptionsState = {
	accountToAddAlias: string;
	accountToAddIdentifier: string;
	accounts: OptionsStateAccount; 
}

type OptionsStateAccount = {
	alias: string;
	id: string;
}[];

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
				id: account.id
			}))
		});
	}

	private setAccountToAddAlias(accountToAddAlias: string): void {
		this.setState({accountToAddAlias: accountToAddAlias});
	}

	private setAccountToAddIdentifier(accountToAddAlias: string): void {
		this.setState({accountToAddIdentifier: accountToAddAlias});
	}

	private async handleAddAccountClick() {
		await this.accountsManager.addAccount(this.state.accountToAddAlias, this.state.accountToAddIdentifier);
		this.upadateStateFromPersistedAccounts();
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
				<button onClick={(e) => this.handleAddAccountClick()}>Add Account</button>
				<h2>Accounts</h2>
				{this.state.accounts.length ? this.state.accounts.map((account) => (
					<div>
						<h3>{account.alias}</h3>
						<p>{account.id}</p>
						<button>Delete</button>
						<button>Authenticate</button>
					</div>
				)) : <p>No accounts added yet.</p>}
			</div>
		)
	}
}

export default App;