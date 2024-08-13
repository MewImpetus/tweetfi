import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, Cell, beginCell } from '@ton/core';
import { TweetFi } from '../wrappers/TweetFi';
import { TransactionValidator } from '../build/TweetFi/tact_TransactionValidator';
import { TweetFiWallet } from '../build/TweetFi/tact_TweetFiWallet';
import { buildOnchainMetadata, createProofCells } from "../utils/jetton-helpers";
import '@ton/test-utils';
import { mnemonicToWalletKey, mnemonicNew, sign } from 'ton-crypto';

describe('TweetFi', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let tweetFi: SandboxContract<TweetFi>;

    let mnemonic: string[];

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


        
        const mint_to_address = Address.parse("EQAX21A4fIw7hX1jmRjvJT0DX7H_FUItj2duCBWtK4ayEiC_")

        mnemonic = await mnemonicNew();

        const keyPair = await mnemonicToWalletKey(mnemonic);

        const publicKeyBigInt = BigInt(`0x${keyPair.publicKey.toString('hex')}`);

        tweetFi = blockchain.openContract(await TweetFi.fromInit(deployer.address, max_supply, admin.address, publicKeyBigInt, jetton_content));



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

        const keyPair = await mnemonicToWalletKey(mnemonic);

        console.log("pub:", keyPair.publicKey)
        let publicKeyBigInt = BigInt(`0x${keyPair.publicKey.toString('hex')}`);
        
        console.log("publicKeyBigInt:", publicKeyBigInt)
        

        let signatureData: Cell = beginCell().storeAddress(Address.parse("UQAEg6xitp3M_Pj9pjHQpLeGZ8PxIEH2RwGCTpMNE6sOjycs")).storeCoins(10000000000000n).endCell();
        const signature = sign(signatureData.hash(), keyPair.secretKey);

        const base64String = signature.toString('base64');
        console.log("signature base64String:", base64String);

        console.log("signature:", signature)

        const bufferFromBase64 = Buffer.from(base64String, 'base64');
        console.log("signature:", bufferFromBase64);

        let signatureCell = beginCell().storeBuffer(signature).endCell();

        
        // const mint_result = await tweetFi.getTestcheckSignature({
        //     $$type: 'TweetMint',
        //     index: 0n,
        //     to: Address.parse("UQAEg6xitp3M_Pj9pjHQpLeGZ8PxIEH2RwGCTpMNE6sOjycs"),
        //     amount: 10000000000000n,
        //     signature: signatureCell
        // })

        // expect(mint_result).toEqual(true);

        // const mint_result2 = await tweetFi.getTestcheckSignature({
        //     $$type: 'TweetMint',
        //     index: 1n,
        //     to: Address.parse("UQAEg6xitp3M_Pj9pjHQpLeGZ8PxIEH2RwGCTpMNE6sOjycs"),
        //     amount: 100000000000000n,
        //     signature: signatureCell
        // })

        // expect(mint_result2).toEqual(false);




        // test power

        const amount = await tweetFi.getTestpow(toNano("10"), 300n);

        const amount2 = await tweetFi.getTestpow2(toNano("10"), 300n);

        console.log("amount1:", amount/BigInt(10**9))
        console.log("amount2:", amount2/BigInt(10**9))

        console.log("amount3:", Number(toNano("10"))*0.99**300/10**9)
        


    });

    it('Test: Process', async () => {


        const keyPair = await mnemonicToWalletKey(mnemonic);
        
        // the check is done inside beforeEach
        // blockchain and tweetFi are ready to use
        const publicKeyBigInt = BigInt(`0x${keyPair.publicKey.toString('hex')}`);
        // test set pub
        const merkle_root_set_res = await tweetFi.send(
            admin.getSender(),
            {
                value: toNano("0.01")
            },
            {
                $$type: 'Pub',
                value: publicKeyBigInt
            }
        )

        expect(merkle_root_set_res.transactions).toHaveTransaction({
            from: admin.address,
            to: tweetFi.address,
            success: true,
        });

        // expect(await tweetFi.getMerkleTreeRoot()).toEqual(merkle_root);

        console.log("Balance:", Number(await tweetFi.getBalance()) / Number(10 ** 9))

        // 1. test mint

        // const merkle_root_set_res_of_deployer = await tweetFi.send(
        //     deployer.getSender(),
        //     {
        //         value: toNano("0.01")
        //     },
        //     {
        //         $$type: 'MerkleRoot',
        //         value: merkle_root
        //     }
        // )

        // expect(merkle_root_set_res_of_deployer.transactions).toHaveTransaction({
        //     from: deployer.address,
        //     to: tweetFi.address,
        //     success: false,
        // });

        const signatureData: Cell = beginCell().storeAddress(Address.parse("EQAX21A4fIw7hX1jmRjvJT0DX7H_FUItj2duCBWtK4ayEiC_")).storeCoins(10000000000000n).endCell();
        const signature = sign(signatureData.hash(), keyPair.secretKey);
        const signatureCell = beginCell().storeBuffer(signature).endCell();

        const tweetfi_mint_result = await tweetFi.send(
            deployer.getSender(),
            {
                value: toNano('2'),
            },
            {
                $$type: 'TweetMint',
                index: 0n,
                to: Address.parse("EQAX21A4fIw7hX1jmRjvJT0DX7H_FUItj2duCBWtK4ayEiC_"),
                amount: 10000000000000n,
                signature: signatureCell
            }
        )


        const signatureData2: Cell = beginCell().storeAddress(deployer.address).storeCoins(990000000000000n).endCell();
        const signature2 = sign(signatureData2.hash(), keyPair.secretKey);
        const signatureCell2 = beginCell().storeBuffer(signature2).endCell();

        const transaction_validator_address = await tweetFi.getGetTransactionValidatorAddress(0n);
        const transaction_validator = blockchain.openContract(TransactionValidator.fromAddress(transaction_validator_address));


        const deployer_mint_result = await tweetFi.send(
            deployer.getSender(),
            {
                value: toNano('2'),
            },
            {
                $$type: 'TweetMint',
                index: 1n,
                to: deployer.address,
                amount: 990000000000000n,
                signature: signatureCell2
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
        const inviter = await admin_wallet.getGetInviter();
        expect(inviter.toString()).toEqual(deployer.address.toString())
        console.log("inviter:", inviter)
        console.log(deployer.address)

        
        // ====== test claim just for test =====

        // const test_claim_res = await admin_wallet.send(
        //     admin.getSender(),
        //     {
        //         value: toNano("0.05")
        //     },
        //     "test claim"
        // )

        // expect(test_claim_res.transactions).toHaveTransaction({
        //     from: admin.address,
        //     to: admin_wallet.address,
        //     success: true,
        // });

        // expect(test_claim_res.transactions).toHaveTransaction({
        //     from: admin_wallet.address,
        //     to: deployer_wallet.address,
        //     success: true,
        // });

        // expect(test_claim_res.transactions).toHaveTransaction({
        //     from: admin_wallet.address,
        //     to: admin.address,
        //     success: true,
        // });


    });
});
