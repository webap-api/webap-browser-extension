# WebAP Browser Extension

This is a browser extension that implements the [WebAP API](https://github.com/webap-api/WebAP-API) (still an idea), exposing it to web applications.

It is currently in development, not yet in usable state.

The first release will be proof of concept, not ready for "productive" usage.

Until there is a reasonably stable data model and API, it it will remain with major version 0 and not committed for backwards compatibility.

## Try it out

Still a prototype or proof of concept, so don't expect much.

The extension is not yet published on the chrome web store or any other store, so it must be built and installed locally.

Tested on Pleroma. it requires support to WebFinger, the Mastodon apps API, OAuth 2.0 Authentication and ActivityPub Client to Server (C2S).

### Installation

1. Clone this repo
2. Install dependencies with `npm install`
3. Run the dev version with `npm start`
    - At this point, the extension code will be built into the folder `dist`
4. On your browser, go to the extensions management page (e.g. `chrome://extensions/`)
5. Turn on the _Developer mode_
6. Click on _Load unpacked_
7. Select the `dist` folder

### Setup

1. Go to the extension options (screenshot here: https://github.com/webap-api/webap-browser-extension/issues/6)
2. Add an account with an arbitrary alias of your choice and your account identifier with the format _dellagustindev@blob.cat_
3. Click _Authorize_ and follow the instructions
	- If everything goes right, you will see your account listed under Accounts, the _Authorize_ button will not be visible anymore

### Send post using the WebAP API

1. Open and arbitrary webpage
2. Go to the webpage console
3. Run the code below
    
```js
const clients = await WebAP.getClients();
clients[0].postToOutbox({
  "type": "Create",
  "to": [
    "https://www.w3.org/ns/activitystreams#Public"
  ],
  "object": {
    "published": new Date(),
    "type": "Note",
    "to": [
      "https://www.w3.org/ns/activitystreams#Public"
    ],
    "content": "This is a message sent with the WebAP API, learn more at https://github.com/webap-api"
  }
});
```

Now check your account, you should see the message there as if you posted it (well, you did post it!).

## References

The initial state of the repository and tooling setup is largely based on [podStation](https://github.com/podStation/podStation/tree/4fc7de2bde3f6767fc31013965fdf13aab78c47c).

Many of the concepts were inspired or even copied from [Joule](https://lightningjoule.com/), which analogously implement the WebLN API.
