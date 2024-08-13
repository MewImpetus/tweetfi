import "@stdlib/deploy";
import "./jetton/master";
import "./tweetfi_wallet";
import "./transaction_validator";

message TweetMint {
    index: Int;
    to: Address;
    amount: Int;
    signature: Slice;
}


message Admin {
    value: Address;
}

message Pub {
    value: Int;
}


contract TweetFi with JettonMaster, Deployable {

    total_supply: Int as coins = 0;
    max_supply: Int as coins;
    mintable: Bool = true;
    owner: Address;
    jetton_content: Cell;
    admin: Address;
    pub: Int;
    day_supply: Int as coins = 0;
    day_limit: Int as coins = ton("10000000");
    day_start: Int = 0;
    init(owner: Address, max_supply: Int, admin: Address, pub: Int, jetton_content: Cell){
        self.owner = owner;
        self.max_supply = max_supply;
        self.jetton_content = jetton_content;
        self.admin = admin;
        self.pub = pub;
    }

    receive(msg: TweetMint) {
        let ctx: Context = context();
        if (now() - self.day_start > 86400) {
            self.day_supply = 0;
            self.day_start = now();
        }
        require(self.day_supply + msg.amount <= self.day_limit, "Exceeded the daily mining limit");
        // check signature 
        require(self.verify_signature(msg), "Merkle verification failed.");
        let init: StateInit = self.calculate_transaction_validator_init(msg.index);
        send(SendParameters{
                to: contractAddress(init),
                value: 0,
                mode: SendRemainingValue,
                body: TransactionExistCheck{origin:ctx.sender, to: msg.to, amount: msg.amount}.toCell(),
                code: init.code,
                data: init.data
            }
        );
    }

    receive(msg: InternalTweetMint) {
        let ctx: Context = context();
        require(ctx.sender == contractAddress(self.calculate_transaction_validator_init(msg.txid)), "Only for transaction validator");

        let initCode: StateInit = self.calculate_jetton_wallet_init(msg.to);
        self.total_supply = self.total_supply + msg.amount;
        require(self.total_supply <= self.max_supply, "JettonMaster: Cannot exceed the maximum issuance");
        self.day_supply = self.day_supply + msg.amount;
        send(SendParameters{
                to: contractAddress(initCode),
                value: 0,
                bounce: true,
                mode: SendRemainingValue,
                body: TweetFiTransfer{
                    query_id: 0,
                    amount: msg.amount,
                    response_address: msg.origin,
                    from: myAddress(),
                    forward_ton_amount: 0,
                    forward_payload: emptySlice()
                }.toCell(),
                code: initCode.code,
                data: initCode.data
            }
        );
        
    }




    receive(msg: Admin) {
        require(sender() == self.owner, "Only for owner");
        self.admin = msg.value;
    }

    receive(msg: Pub) {
        require((sender() == self.owner || sender() == self.admin), "Only for owner");
        self.pub = msg.value;
    }

    receive("withdraw safe") {
        require(sender() == self.owner, "Only owner is allowed to withdraw");
        send(SendParameters{
            to: sender(),
            bounce: true,
            value: myBalance() - context().value - ton("0.01"),
            mode: SendRemainingValue + SendIgnoreErrors
        });
    }


    inline fun verify_signature(msg: TweetMint): Bool {
        let signatureData: Cell = beginCell().storeAddress(msg.to).storeCoins(msg.amount).endCell();
        return checkSignature(signatureData.hash(), msg.signature, self.pub);
    }



    inline fun calculate_transaction_validator_init(txid: Int): StateInit {
        return initOf TransactionValidator(txid, myAddress());
    }

    override fun _mint_validate(ctx: Context, msg: JettonMint) {
        require(msg.amount == 0, "JettonMaster: Cannot Mint form here");
        require(ctx.sender == self.owner, "JettonMaster: Sender is not a Jetton owner");
        require(self.mintable, "JettonMaster: Jetton is not mintable");
    }

    override inline fun calculate_jetton_wallet_init(owner_address: Address): StateInit {
        return initOf TweetFiWallet(owner_address, myAddress());
    }

    get fun get_max_supply(): Int {
        return self.max_supply;
    }

    // get functions
    get fun get_admin(): Address {
        return self.admin;
    }

    get fun get_pub(): Int {
        return self.pub;
    }

    get fun get_transaction_validator_address(index: Int): Address {
        let init: StateInit = self.calculate_transaction_validator_init(index);
        return contractAddress(init);
    }


    get fun balance(): Int {
        return myBalance();
    }



    // just for test TODO remove
    //==================================================

    // get fun testcheckSignature(msg: TweetMint): Bool {
    //     // Merkle tree verification
    //     return self.verify_signature(msg);
    // }

     get fun testpow2(amount: Int, rep: Int): Int {
        let n: Int = 0;
        while (n < rep && amount > 0) {      
            n = n + 1;
            amount = amount/100*99;
        }
        return amount;
    }

    get fun testpow(amount: Int, days: Int): Int {
        if(days <=50) {
            let n: Int = 0;
            while (n < days && amount > 0) {      
                n = n + 1;
                amount = amount/100*99;
            }
            return amount;
        } else {
            let t: Int = days / 50;
            let r: Int = days % 50;
            repeat(t){
                amount = amount * 605006067 / 1000000000;
            }
            let n: Int = 0;
            while (n < r && amount > 0) {      
                n = n + 1;
                amount = amount/100*99;
            }
            return amount;
        }
    }
}