import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { TweetFi } from '../wrappers/TweetFi';
import { buildOnchainMetadata } from "../utils/jetton-helpers";
import '@ton/test-utils';

describe('TweetFi', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let tweetFi: SandboxContract<TweetFi>;

    const merkle_root = "147596663615302291649424969521479109454"

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        admin = await blockchain.treasury('admin');

        const jettonParams = {
            name: "jettonMaster1",
            description: "jettonMaster (TEF) is an innovative social media mining platform that aims to provide social media users with a share to earn channel by combining AI technology and blockchain token economics.",
            symbol: "TEF",
            image: "https://raw.githubusercontent.com/MewImpetus/xfi/main/logo.png",
        };
        const jetton_content = buildOnchainMetadata(jettonParams);
        const max_supply = toNano("1000000000");

        tweetFi = blockchain.openContract(await TweetFi.fromInit(deployer.address, max_supply, admin.address, jetton_content ));

        

        const deployResult = await tweetFi.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: tweetFi.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and tweetFi are ready to use
    });
});
