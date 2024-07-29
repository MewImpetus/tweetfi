import { Address, toNano } from '@ton/core';
import { TweetFi, loadMerkleAdmin } from '../wrappers/TweetFi';
import { TweetFiWallet } from '../build/TweetFi/tact_TweetFiWallet';
import { NetworkProvider } from '@ton/blueprint';

const Sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse("kQC0koqOyJIjG9IMmG3QjNbseucO9OoW9Zxg6sLzWuRn3WPo");


    const tf = provider.open(TweetFi.fromAddress(address));

   


    const user_wallet_address = await tf.getGetWalletAddress(Address.parse("0QCkfhhHphlGejkE9Pkq4B17D2MovSRi59NuFOgdARYxzLwL"))
    const user_wallet = provider.open(TweetFiWallet.fromAddress(user_wallet_address));

    console.log("claim now:", await user_wallet.getClaimAmountNow())

    console.log("staking info:", await user_wallet.getStakeInfo())

    console.log("stake minus claim", await user_wallet.getStakeAmountMinusAutoUnstake())

    ui.write('successfully!');
}