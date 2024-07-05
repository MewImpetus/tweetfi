import "@stdlib/deploy";
import "./jetton/master";
import "./tweetfi_wallet";
import "./transaction_validator";

message TweetMint {
    index: Int;
    to: Address;
    amount: Int;
    proof: Cell;
    proof_length: Int;
    to_str: String;
}



message MerkleRoot {
    value: String;
}

message MerkleAdmin {
    value: Address;
}


contract TweetFi with JettonMaster, Deployable {

    total_supply: Int as coins = 0;
    max_supply: Int as coins;
    mintable: Bool = true;
    owner: Address;
    jetton_content: Cell;
    merkle_root: String;
    admin: Address;
    day_supply: Int as coins = 0;
    day_limit: Int as coins = ton("10000000");
    day_start: Int = 0;
    init(owner: Address, max_supply: Int, admin: Address, jetton_content: Cell){
        self.owner = owner;
        self.max_supply = max_supply;
        self.jetton_content = jetton_content;
        self.merkle_root = "";
        self.admin = admin;
    }

    receive(msg: TweetMint) {
        let ctx: Context = context();
        if (now() - self.day_start > 86400) {
            self.day_supply = 0;
            self.day_start = now();
        }
        require(self.day_supply + msg.amount <= self.day_limit, "Exceeded the daily mining limit");
        // Merkle tree verification
        let target_hash: String = self.calculate_transaction_hash(msg.to_str, msg.amount);
        require(self.verify_proof(msg.index, target_hash, msg.proof, msg.proof_length), "Merkle verification failed.");
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
        self.total_supply = (self.total_supply + msg.amount);
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


    receive(msg: MerkleRoot) {
        require(sender() == self.admin, "Only for merkle admin");
        self.merkle_root = msg.value;
    }

    receive(msg: MerkleAdmin) {
        require(sender() == self.owner, "Only for owner");
        self.admin = msg.value;
    }

    receive("withdraw safe") {
        require(sender() == self.owner, "Only owner is allowed to withdraw");
        send(SendParameters{
            to: sender(),
            bounce: true,
            value: myBalance() - ton("0.01"),
            mode: SendRemainingValue + SendIgnoreErrors
        });
    }


    inline fun sha128(s: String) : String {
        return (sha256(s) >> 128).toString();
    }

    inline fun calculate_transaction_hash(to_str: String, amount: Int): String {
        let sb: StringBuilder = beginString();
        sb.append(to_str);
        sb.append(amount.toString());
        return self.sha128(sb.toString());
    }

    inline fun verify_proof(index: Int, target_hash: String, proof: Cell, proof_length: Int): Bool {
        let current_hash: String = target_hash;
        let frist_cell: Bool = true; 
        let parser : Slice = proof.beginParse();
        repeat (proof_length) {
            if (!frist_cell) {
                if !parser.refsEmpty() {
                    parser = parser.loadRef().beginParse();
                }
            }
            let _hash: Int = parser.loadUint(128);
            let sb: StringBuilder = beginString();


            if (index % 2 == 0) {
                sb.append(current_hash);
                sb.append(_hash.toString());
            } else {
                sb.append(_hash.toString());
                sb.append(current_hash);
            }
            current_hash = self.sha128(sb.toString());
            index = index / 2;
            frist_cell = false;
        }

        return current_hash == self.merkle_root;
    }


    inline fun calculate_transaction_validator_init(txid: Int): StateInit {
        return initOf TransactionValidator(txid, myAddress());
    }

    override fun _mint_validate(ctx: Context, msg: JettonMint) {
        require(self.mintable, "JettonMaster: Jetton is not mintable");
    }

    override inline fun calculate_jetton_wallet_init(owner_address: Address): StateInit {
        return initOf TweetFiWallet(owner_address, myAddress());
    }

    get fun get_max_supply(): Int {
        return self.max_supply;
    }

    // get functions
    get fun merkle_admin(): Address {
        return self.admin;
    }

    get fun merkle_tree_root(): String {
        return self.merkle_root;
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

    get fun testMerkle(msg: TweetMint): String {
        // Merkle tree verification
        let current_hash: String = self.calculate_transaction_hash(msg.to_str, msg.amount);
        let frist_cell: Bool = true; 
        let parser : Slice = msg.proof.beginParse();
        let index: Int = msg.index;
        
        repeat (msg.proof_length) {
            if (!frist_cell) {
                if !parser.refsEmpty() {
                    parser = parser.loadRef().beginParse();
                }
            }
            let _hash: Int = parser.loadUint(128);
            let sb: StringBuilder = beginString();


            if (index % 2 == 0) {
                sb.append(current_hash);
                sb.append(_hash.toString());
            } else {
                sb.append(_hash.toString());
                sb.append(current_hash);
            }
            current_hash = self.sha128(sb.toString());
            index = index / 2;
            frist_cell = false;
        }

        return current_hash;

    }
}