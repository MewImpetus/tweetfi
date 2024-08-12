import { Address, toNano } from '@ton/core';
import { TweetFi } from '../wrappers/TweetFi';
import { TweetFiWallet } from '../build/TweetFi/tact_TweetFiWallet';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata, createProofCells } from "../utils/jetton-helpers";

const Sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse("kQDlOAuiTdQLpDGKJu3JPZ9cwPwSccYTakoxjoTJVlonNeim");


    const tf = provider.open(TweetFi.fromAddress(address));


   
    // const amount = await tf.getTestpow(toNano("100000000"), 1000n)
    // console.log("amount:", amount)

    // const user_wallet_address = await tf.getGetWalletAddress(Address.parse("0QCkfhhHphlGejkE9Pkq4B17D2MovSRi59NuFOgdARYxzLwL"))
    // const user_wallet = provider.open(TweetFiWallet.fromAddress(user_wallet_address));

    // console.log("claim now:", await user_wallet.getClaimAmountNow())

    // console.log("staking info:", await user_wallet.getStakeInfo())

    // console.log("stake minus claim", await user_wallet.getStakeAmountMinusAutoUnstake())

    // ui.write('successfully!');
}