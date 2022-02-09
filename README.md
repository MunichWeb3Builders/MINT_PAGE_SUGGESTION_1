# W3B OG Token Mint Page Suggestion


## Installation 🛠️

If you are cloning the project then run this first, otherwise you can download the source code on the release page and skip this step.

```sh
git clone git@github.com:MunichWeb3Builders/MINT_PAGE_SUGGESTION_1.git
```

Make sure you have node.js installed so you can use npm, then run:

```sh
npm install
```

## Run 

```sh
npm run start
```

Or create the build if you are ready to deploy.

```sh
npm run build
```

## Change Configurations ℹ️

In order to make use of this dapp, all you need to do is change the configurations to point to your smart contract as well as update the images and theme file.

For the most part all the changes will be in the `public` folder.

To link up your existing smart contract, go to the `public/config/config.json` file and update the following fields to fit your smart contract, network and marketplace details. The cost field should be in wei.

Note: this dapp is designed to work with the intended NFT smart contract, that only takes one parameter in the mint function "mintAmount". But you can change that in the App.js file if you need to use a smart contract that takes 2 params.

```json
{
  "CONTRACT_ADDRESS": "0x827acb09a2dc20e39c9aad7f7190d9bc53534192",
  "SCAN_LINK": "https://polygonscan.com/token/0x827acb09a2dc20e39c9aad7f7190d9bc53534192",
  "NETWORK": {
    "NAME": "Polygon",
    "SYMBOL": "Matic",
    "ID": 137
  },
  "NFT_NAME": "",
  "SYMBOL": "",
  "MAX_SUPPLY": 1000,
  "WEI_COST": 75000000000000000,
  "DISPLAY_COST": 0.075,
  "GAS_LIMIT": 285000,
  "MARKETPLACE": "",
  "MARKETPLACE_LINK": "",
  "SHOW_BACKGROUND": true
}
```

Make sure you copy the contract ABI and paste it in the `public/config/abi.json` file.


Colors themes can be adjusted in the `public/config/theme.css` file.

```css
:root {
  --primary: #ebc908;
  --primary-text: #1a1a1a;
  --secondary: #ff1dec;
  --secondary-text: #ffffff;
  --accent: #ffffff;
  --accent-text: #000000;
}
```


## Reference
https://github.com/HashLips/hashlips_nft_minting_dapp
