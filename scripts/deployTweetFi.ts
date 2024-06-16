import { toNano } from '@ton/core';
import { TweetFi } from '../wrappers/TweetFi';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const tweetFi = provider.open(await TweetFi.fromInit());

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
