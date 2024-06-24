import { Address, toNano } from '@ton/core';
import { TweetFi, loadMerkleAdmin } from '../wrappers/TweetFi';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from "../utils/jetton-helpers";

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse("0QCe6-RwMOHP1DR8ZWaOfCvtGhYW8nqij-t65iqQCSK9cA6k");


    const tf = provider.open(TweetFi.fromAddress(address));

   
    // set merkle admin
    await tf.send(
        provider.sender(),
        {
            value: toNano('0.02'),
        },
        {
            $$type: "MerkleAdmin",
            value: Address.parse("EQDY-uI3LXl12N1cBduBMN911HM3MdPMijWxLnZPOpbMX6Fi")
        }
    );

    ui.write('Waiting for send...');
    const merkle_admin = await tf.getMerkleAdmin()
    console.log(merkle_admin)

    ui.write('successfully!');
}