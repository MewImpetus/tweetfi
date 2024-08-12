import { Address, toNano } from '@ton/core';
import { TweetFi } from '../wrappers/TweetFi';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from "../utils/jetton-helpers";
import { mnemonicToWalletKey, mnemonicNew, sign } from 'ton-crypto';


export async function run(provider: NetworkProvider) {


        const mnemonic = await mnemonicNew();

        console.log("mnemonic:", mnemonic)

        const keyPair = await mnemonicToWalletKey(mnemonic);

        const publicKeyBigInt = BigInt(`0x${keyPair.publicKey.toString('hex')}`);

        console.log("publicKeyBigInt:", publicKeyBigInt)

    const jettonParams = {
        name: "TweetFI",
        description: "TweetFI (TEF) is an innovative social media mining platform that aims to provide social media users with a share to earn channel by combining AI technology and blockchain token economics.",
        symbol: "TEF",
        image: "https://raw.githubusercontent.com/MewImpetus/tweetfi/main/logo.png",
    };

    const jetton_content = buildOnchainMetadata(jettonParams);
    const max_supply = toNano("1000000000");

    const owner = Address.parse("UQD0shSoU6J59IlswMiqXVBvQm4sJ9l0vNfKlIF4MK065mO4")
    const admin = Address.parse("EQDY-uI3LXl12N1cBduBMN911HM3MdPMijWxLnZPOpbMX6Fi")

    const tweetFi = provider.open(await TweetFi.fromInit(owner, max_supply, admin, publicKeyBigInt, jetton_content));

    await tweetFi.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(tweetFi.address);

    // run methods on `tweetFi`
}
