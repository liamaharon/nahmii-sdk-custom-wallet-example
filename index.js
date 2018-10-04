/**
 * Example of using the experimental approach of allowing wallets to be
 * created either traditionally with a private key, or by passing a custom address and signing
 * functions
 */

const ethers = require("ethers");
const LedgerEth = require("@ledgerhq/hw-app-eth").default;
const Transport = require("@ledgerhq/hw-transport-node-hid").default;
const NahmiiProvider = require("../nahmii-sdk/lib/nahmii-provider");
const Wallet = require("../nahmii-sdk/lib/wallet");


// define a function to sign a message with the LNS
const signMessage = async message => {
  if (typeof message === "string") {
    message = ethers.utils.toUtf8Bytes(message);
  }

  let messageHex = ethers.utils.hexlify(message).substring(2);

  const transport = await Transport.create();
  const eth = new LedgerEth(transport);

  return eth.signPersonalMessage("m/44'/60'/0'", messageHex).then(signature => {
    signature.r = "0x" + signature.r;
    signature.s = "0x" + signature.s;
    return ethers.utils.joinSignature(signature);
  });
};

const signTransaction = async transaction => {
    const transport = await Transport.create();
    const eth = new LedgerEth(transport);
    const unsignedTx = ethers.utils.serializeTransaction(transaction).substring(2);
    const lnsSignature = await eth.signTransaction("m/44'/60'/0'/0", unsignedTx);
    const address = await eth.getAddress("m/44'/60'/0'/0");
    console.log('address: ' + JSON.stringify(address));
    const signature = {
      r: `0x${lnsSignature.r}`,
      s: `0x${lnsSignature.s}`,
      v: lnsSignature.v
    }
    return ethers.utils.serializeTransaction(transaction, signature);
};

// create a Wallet instance with a private key
const softwareWallet = new Wallet(
  "0x9616b2ab6330c7fda535042c820b55d992fa8c2c2a3d82603ea043aeb09ff411",
  new NahmiiProvider(
    "api2.dev.hubii.net",
    process.env.ROPSTEN_IDENTITY_SERVICE_APPID,
    process.env.ROPSTEN_IDENTITY_SERVICE_SECRET
  )
);

// create a Wallet instance with custom address and signing functions
const lnsWallet = new Wallet(
  {
    address: "0x1c7429f62595097315289cebac1fdbda587ad512",
    signMessage,
    signTransaction
  },
  new NahmiiProvider(
    "api2.dev.hubii.net",
    process.env.ROPSTEN_IDENTITY_SERVICE_APPID,
    process.env.ROPSTEN_IDENTITY_SERVICE_SECRET
  )
);

// log the address, and sign a message with both wallet instances
console.log(softwareWallet.address);
// console.log(lnsWallet.address);
// softwareWallet.signMessage('hello').then(console.log);
// softwareWallet.depositEth(0).then(console.log);
lnsWallet.depositEth(0);
// lnsWallet.getBalance().then((b) => {
//   const eth = ethers.utils.formatEther(b);
//   console.log(eth);
// });
// lnsWallet.signMessage('hello').then(console.log);
