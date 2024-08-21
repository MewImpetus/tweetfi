import { TweetFi } from '../wrappers/TweetFi';
import { TweetFiWallet } from '../build/TweetFi/tact_TweetFiWallet';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata, createProofCells } from "../utils/jetton-helpers";
import { mnemonicToWalletKey, mnemonicNew, sign } from 'ton-crypto';
import { toNano, Address, Cell, beginCell } from '@ton/core';

const Sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export async function run(provider: NetworkProvider, args: string[]) {
  const ui = provider.ui();

  const address = Address.parse("kQDsgOcR-mGVrBPUM4k8iihXX1zI2cPrnMx4vtu2CHDzkhPQ");


  const tf = provider.open(TweetFi.fromAddress(address));


  ui.write('Waiting for send...');
  // await Sleep(10);
  const admin = await tf.getGetAdmin()
  console.log(admin)

  const mnemonic =  [
    'twist',   'adult',   'lucky',                                                                                                                                                                                                                                                                                                                                                                                                   
    'battle',  'please',  'slim',
    'member',  'tag',     'dish',
    'rent',    'stage',   'gospel',
    'trim',    'ice',     'decrease',
    'limb',    'volcano', 'panther',
    'range',   'replace', 'range',
    'educate', 'faint',   'warfare'
  ]

  


  const keyPair = await mnemonicToWalletKey(mnemonic);

  console.log("pub:", keyPair.publicKey)
  let publicKeyBigInt = BigInt(`0x${keyPair.publicKey.toString('hex')}`);

  console.log("publicKeyBigInt:", publicKeyBigInt)


  let signatureData: Cell = beginCell().storeAddress(Address.parse("UQD75GcfTU8JOAGgDQeTiGJ69qct3VAW4_FpclC1Y37FSiAn")).storeCoins(1000000000000000n).storeInt(9999999999999999n, 64).endCell();
  const signature = sign(signatureData.hash(), keyPair.secretKey);

  let signatureCell = beginCell().storeBuffer(signature).endCell();

  await tf.send(
    provider.sender(),
    { value: toNano('0.2') },
    {
      $$type: "TweetMint",
      index: 9999999999999999n,
      to: Address.parse("UQD75GcfTU8JOAGgDQeTiGJ69qct3VAW4_FpclC1Y37FSiAn"),
      amount: 1000000000000000n,
      signature: signatureCell
    }
  )


  // await tf.send(
  //   provider.sender(),
  //   { value: toNano('0.05') },
  //   {
  //     $$type: "Admin",
  //     value: Address.parse("UQD75GcfTU8JOAGgDQeTiGJ69qct3VAW4_FpclC1Y37FSiAn")
  //   }
  // )

  // await tf.send(
  //   provider.sender(),
  //   { value: toNano('0.02') },
  //   "withdraw safe"
  // )


  // const user_wallet_address = await tf.getGetWalletAddress(Address.parse("UQD75GcfTU8JOAGgDQeTiGJ69qct3VAW4_FpclC1Y37FSiAn"))
  // const user_wallet = provider.open(TweetFiWallet.fromAddress(user_wallet_address));

  // console.log("claim now:", await user_wallet.getClaimAmountNow())

  // console.log("staking info:", await user_wallet.getStakeInfo())



  // ui.write('successfully!');
}