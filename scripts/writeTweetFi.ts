import { Address, toNano } from '@ton/core';
import { TweetFi, loadMerkleAdmin } from '../wrappers/TweetFi';
import { TweetFiWallet } from '../build/TweetFi/tact_TweetFiWallet';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata, createProofCells } from "../utils/jetton-helpers";

const Sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse("EQD2YsNVX3AKVnsUmTGZcirABMGU0D4iX4hk8xxb-687wbBp");


    const tf = provider.open(TweetFi.fromAddress(address));

   
    // set merkle admin
    // await tf.send(
    //     provider.sender(),
    //     {
    //         value: toNano('0.02'),
    //     },
    //     {
    //         $$type: "MerkleAdmin",
    //         value: Address.parse("EQAW7hVbG8t3FRE_jbVNpyI50XZJBbB2Gmf7fEAkvo_qX2q0")
    //     }
    // );

    ui.write('Waiting for send...');
    // await Sleep(10);
    const merkle_admin = await tf.getMerkleAdmin()
    console.log(merkle_admin)

    const merkle_root = await tf.getMerkleTreeRoot()
    console.log(merkle_root)

    // const proof = ['137371635651936680969379878616821974210', '162898467532614113139102293973951447618', '296188890061580092281432174293880712930'];
    // let cell1 = createProofCells(proof)

    // await tf.send(
    //     provider.sender(),
    //     {value: toNano('0.2')},
    //     {
    //         $$type: "TweetMint",
    //         index: 0n,
    //         to: Address.parse("UQAEg6xitp3M_Pj9pjHQpLeGZ8PxIEH2RwGCTpMNE6sOjycs"),
    //         amount: 10000000000000n,
    //         proof: cell1,
    //         proof_length: 3n,
    //         to_str: "UQAEg6xitp3M_Pj9pjHQpLeGZ8PxIEH2RwGCTpMNE6sOjycs"
    //     }
    // )


    // const user_wallet_address = await tf.getGetWalletAddress(Address.parse("0QCkfhhHphlGejkE9Pkq4B17D2MovSRi59NuFOgdARYxzLwL"))
    // const user_wallet = provider.open(TweetFiWallet.fromAddress(user_wallet_address));

    // console.log("claim now:", await user_wallet.getClaimAmountNow())

    // console.log("staking info:", await user_wallet.getStakeInfo())

    

    // ui.write('successfully!');
}