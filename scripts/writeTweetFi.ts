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

  const address = Address.parse("kQBIuubt4ug7--u-KCsKn9gB_fpOm-Kib-Quw046E3PbfFyC");


  const tf = provider.open(TweetFi.fromAddress(address));


  ui.write('Waiting for send...');
  // await Sleep(10);
  const admin = await tf.getGetAdmin()
  console.log(admin)

  const mnemonic = [
    'half',     'slim',  'lab',                                                                                                                                                                                                                                                                                                                                                                                                      
    'toward',   'syrup', 'bundle',
    'envelope', 'among', 'swallow',
    'brand',    'front', 'proof',
    'during',   'fetch', 'leopard',
    'essay',    'abuse', 'advice',
    'warm',     'cruel', 'attack',
    'length',   'throw', 'mandate'
  ]


  const keyPair = await mnemonicToWalletKey(mnemonic);

  console.log("pub:", keyPair.publicKey)
  let publicKeyBigInt = BigInt(`0x${keyPair.publicKey.toString('hex')}`);

  console.log("publicKeyBigInt:", publicKeyBigInt)


  let signatureData: Cell = beginCell().storeAddress(Address.parse("UQD75GcfTU8JOAGgDQeTiGJ69qct3VAW4_FpclC1Y37FSiAn")).storeCoins(10000000000000n).endCell();
  const signature = sign(signatureData.hash(), keyPair.secretKey);

  let signatureCell = beginCell().storeBuffer(signature).endCell();

  await tf.send(
    provider.sender(),
    { value: toNano('0.2') },
    {
      $$type: "TweetMint",
      index: 0n,
      to: Address.parse("UQD75GcfTU8JOAGgDQeTiGJ69qct3VAW4_FpclC1Y37FSiAn"),
      amount: 10000000000000n,
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

  // const user_wallet_address = await tf.getGetWalletAddress(Address.parse("UQD75GcfTU8JOAGgDQeTiGJ69qct3VAW4_FpclC1Y37FSiAn"))
  // const user_wallet = provider.open(TweetFiWallet.fromAddress(user_wallet_address));

  // console.log("claim now:", await user_wallet.getClaimAmountNow())

  // console.log("staking info:", await user_wallet.getStakeInfo())



  // ui.write('successfully!');
}