import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, Cell, beginCell } from '@ton/core';
import { TweetFi } from '../wrappers/TweetFi';
import { TransactionValidator } from '../build/TweetFi/tact_TransactionValidator';
import { TweetFiWallet } from '../build/TweetFi/tact_TweetFiWallet';
import { buildOnchainMetadata, createProofCells } from "../utils/jetton-helpers";
import '@ton/test-utils';

describe('TweetFi', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let tweetFi: SandboxContract<TweetFi>;

    const merkle_root = "26897624267897450626577964544641320798"
    const mint_to_address = Address.parse("EQAX21A4fIw7hX1jmRjvJT0DX7H_FUItj2duCBWtK4ayEiC_")

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

        tweetFi = blockchain.openContract(await TweetFi.fromInit(deployer.address, max_supply, admin.address, jetton_content));



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

    it('Test Merkle Proof', async () => {

        const proof = ['137371635651936680969379878616821974210', '162898467532614113139102293973951447618', '242086117365407805641239866846385681918', '44923117045185218089151686612699295889'];
        let cell1 = createProofCells(proof)

        let root = await tweetFi.getTestMerkle({
            $$type: 'TweetMint',
            index: 0n,
            to: Address.parse("UQAEg6xitp3M_Pj9pjHQpLeGZ8PxIEH2RwGCTpMNE6sOjycs"),
            amount: 10000000000000n,
            proof: cell1,
            proof_length: 4n,
            to_str: "UQAEg6xitp3M_Pj9pjHQpLeGZ8PxIEH2RwGCTpMNE6sOjycs"
        })
        console.log("root:",  root)
        expect(root).toEqual("193586101654378613795069811892660852148")

    });

    it('Test: Process', async () => {
        // the check is done inside beforeEach
        // blockchain and tweetFi are ready to use

        // test set merkle root
        const merkle_root_set_res = await tweetFi.send(
            admin.getSender(),
            {
                value: toNano("0.01")
            },
            {
                $$type: 'MerkleRoot',
                value: merkle_root
            }
        )

        expect(merkle_root_set_res.transactions).toHaveTransaction({
            from: admin.address,
            to: tweetFi.address,
            success: true,
        });

        expect(await tweetFi.getMerkleTreeRoot()).toEqual(merkle_root);

        console.log("Balance:", Number(await tweetFi.getBalance()) / Number(10 ** 9))

        // 1. test mint

        const merkle_root_set_res_of_deployer = await tweetFi.send(
            deployer.getSender(),
            {
                value: toNano("0.01")
            },
            {
                $$type: 'MerkleRoot',
                value: merkle_root
            }
        )

        expect(merkle_root_set_res_of_deployer.transactions).toHaveTransaction({
            from: deployer.address,
            to: tweetFi.address,
            success: false,
        });

        const proof = ['243052184862730552831173493240295568361', '62441927769055755477180168126141137939', '196593695453870821696552450653663539271']
        let cell1 = createProofCells(proof)

        const tweetfi_mint_result = await tweetFi.send(
            deployer.getSender(),
            {
                value: toNano('2'),
            },
            {
                $$type: 'TweetMint',
                index: 5n,
                to: Address.parse("EQAX21A4fIw7hX1jmRjvJT0DX7H_FUItj2duCBWtK4ayEiC_"),
                amount: 10000000000000n,
                proof: cell1,
                proof_length: 3n,
                to_str: "EQAX21A4fIw7hX1jmRjvJT0DX7H_FUItj2duCBWtK4ayEiC_"
            }
        )

        const proof2 = ['44448095261040177048120122290640361471', '289351099812664640297345691799185602310', '247507015075663163591899548770982451154']
        cell1 = createProofCells(proof2)


        const transaction_validator_address = await tweetFi.getGetTransactionValidatorAddress(5n);
        const transaction_validator = blockchain.openContract(TransactionValidator.fromAddress(transaction_validator_address));


        const deployer_mint_result = await tweetFi.send(
            deployer.getSender(),
            {
                value: toNano('2'),
            },
            {
                $$type: 'TweetMint',
                index: 0n,
                to: deployer.address,
                amount: 990000000000000n,
                proof: cell1,
                proof_length: 3n,
                to_str: "EQBGhqLAZseEqRXz4ByFPTGV7SVMlI4hrbs-Sps_Xzx01x8G"
            }
        )


        // 1.1 from owner to tweetfi contract
        expect(tweetfi_mint_result.transactions).toHaveTransaction({
            from: deployer.address,
            to: tweetFi.address,
            success: true,
        });

        // 1.2 from tweetfi contract to transaction validator contract
        expect(tweetfi_mint_result.transactions).toHaveTransaction({
            from: tweetFi.address,
            to: transaction_validator_address,
            success: true,
        });

        console.log("transaction_validator Balance:", Number(await transaction_validator.getBalance()) / 10 ** 9)

        // 1.3 from transaction validator contract to tweetfi contract
        expect(tweetfi_mint_result.transactions).toHaveTransaction({
            from: transaction_validator_address,
            to: tweetFi.address,
            success: true,
        });

        console.log("master balance:", await tweetFi.getBalance())

        // 1.4 InternalTweetMint from master to wallet
        const admin_wallet_address = await tweetFi.getGetWalletAddress(admin.address);
        const admin_wallet = blockchain.openContract(TweetFiWallet.fromAddress(admin_wallet_address));
        expect(tweetfi_mint_result.transactions).toHaveTransaction({
            from: tweetFi.address,
            to: admin_wallet_address,
            success: true,
        });

        console.log("twiffi Balance after InternalTweetMint:", Number(await tweetFi.getBalance()) / 10 ** 9);

        // wallet should be 2000000000000n lock should be 8000000000000n
        expect(await admin_wallet.getReleasedAmount()).toEqual(2000000000000n)
        expect((await admin_wallet.getLockInfo()).amount).toEqual(8000000000000n)

        const deployer_wallet_address = await tweetFi.getGetWalletAddress(deployer.address);
        const deployer_wallet = blockchain.openContract(TweetFiWallet.fromAddress(deployer_wallet_address));
        expect(await deployer_wallet.getReleasedAmount()).toEqual(198000000000000n)
        expect((await deployer_wallet.getLockInfo()).amount).toEqual(792000000000000n)
       

        // claim
        const admin_claim_amount = await admin_wallet.getClaimAmountNow();
        expect(admin_claim_amount).toEqual(2000000000000n)


        const admin_claim_result = await admin_wallet.send(
            admin.getSender(),
            {
                value: toNano('0.2'),
            },
            {
                $$type: 'Claim',
                amount: admin_claim_amount
            }
        )

        console.log("admin balance:", (await admin_wallet.getGetWalletData()).balance);

        expect(admin_claim_result.transactions).toHaveTransaction({
            from: admin.address,
            to: admin_wallet_address,
            success: true,
        });
        expect(((await admin_wallet.getGetWalletData()).balance)).toEqual(admin_claim_amount)


        const deployer_claim_amount = await deployer_wallet.getClaimAmountNow();
        expect(deployer_claim_amount).toEqual(198000000000000n)

        const deployer_claim_result = await deployer_wallet.send(
            deployer.getSender(),
            {
                value: toNano('0.2'),
            },
            {
                $$type: 'Claim',
                amount: deployer_claim_amount
            }
        )

        console.log("deployer balance:", (await deployer_wallet.getGetWalletData()).balance);

        console.log("deployer locked:", await deployer_wallet.getLockAmountMinusAutoUnlock());
        console.log("deployer staked:", await deployer_wallet.getStakeAmountMinusAutoUnstake());
        expect(await deployer_wallet.getLockAmountMinusAutoUnlock()).toEqual(792000000000000n);
        expect(await deployer_wallet.getStakeAmountMinusAutoUnstake()).toEqual(0n);

        expect(deployer_claim_result.transactions).toHaveTransaction({
            from: deployer.address,
            to: deployer_wallet_address,
            success: true,
        });
        expect(((await deployer_wallet.getGetWalletData()).balance)).toEqual(deployer_claim_amount)



        // 2. test stake
        const stake_result = await admin_wallet.send(
            admin.getSender(),
            {
                value: toNano('1'),
            },
            {
                $$type: 'Stake',
                amount: 1000000000000n,
                inviter: deployer.address,
            }
        )
        expect(stake_result.transactions).toHaveTransaction({
            from: admin.address,
            to: admin_wallet_address,
            success: true,
        });

        console.log("admin staked:", await admin_wallet.getStakeAmountMinusAutoUnstake());
        expect(await admin_wallet.getStakeAmountMinusAutoUnstake()).toEqual(1000000000000n);
        expect((await admin_wallet.getStakeInfo()).amount).toEqual(1000000000000n)
        // expect((await deployer_wallet.getLockInfo()).amount).toEqual(791900000000000n)


        // 3. test tip
        const tip_result = await deployer_wallet.send(
            deployer.getSender(),
            {
                value: toNano("5")
            },
            {
                $$type: 'Tip',
                query_id: 0n,
                amount: toNano("50000"),
                destination: admin.address,
                response_destination: deployer.address,
                forward_payload: beginCell().endCell()
            }
        )

        expect(tip_result.transactions).toHaveTransaction({
            from: deployer.address,
            to: deployer_wallet.address,
            success: true,
        });

        // get inviter
        const inviter = await deployer_wallet.getGetInviter();
        console.log("inviter:", inviter)

    
  

    });
});
