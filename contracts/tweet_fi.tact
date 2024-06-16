import "@stdlib/deploy";
import "./jetton/master";
import "./jetton/wallet";
import "./transaction_validator";
import "./token_vault";

message TweetMint {
    index: Int;
    to: Address;
    amount: Int;
    proof: Cell;
    proof_length: Int;
    to_str: String;
}

message Tip {
    query_id: Int as uint64;
    amount: Int as coins;
    destination: Address; 
    response_destination: Address;
    forward_payload: Slice as remaining;
}

message MerkleRoot {
    value: String;
}

message MerkleAdmin {
    value: Address;
}



contract TweetFiWallet with JettonWallet {
    balance: Int as coins = 0;
    owner: Address;
    jetton_master: Address;
    init(owner: Address, jetton_master: Address){
        self.owner = owner;
        self.jetton_master = jetton_master;
    }

    receive(msg: Tip) {
        let ctx: Context = context();
        self.balance = self.balance - msg.amount;
        require(self.balance >= 0, "JettonWallet: Not enough jettons to tip");
        let trans_msg: JettonTransfer = JettonTransfer {
            query_id: msg.query_id,
            amount: msg.amount,
            destination: msg.destination,
            response_destination: ctx.sender,
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: msg.forward_payload
        };
        self._transfer_validate(ctx, trans_msg);
        self._transfer_estimate_remain_value(ctx, trans_msg);
        self._transfer_jetton(ctx, trans_msg);
        let burn_msg: JettonBurn = JettonBurn {
            query_id:  msg.query_id,
            amount: msg.amount,
            response_destination: ctx.sender,
            custom_payload: emptyCell() 
        };
        self._burn_tokens(ctx, burn_msg);
    }

    override inline fun calculate_jetton_wallet_init(owner_address: Address): StateInit {
        return initOf TweetFiWallet(owner_address, self.jetton_master);
    }
}

contract TweetFi with JettonMaster, Deployable {
    // Empty init() function is present by default in all Tact contracts
    // since v1.3.0, so the following may be omitted:
    //
    total_supply: Int as coins = 0;
    max_supply: Int as coins;
    mintable: Bool = true;
    owner: Address;
    jetton_content: Cell;
    merkle_root: String;
    admin: Address;
    init(owner: Address, max_supply: Int, admin: Address, jetton_content: Cell){
        self.owner = owner;
        self.max_supply = max_supply;
        self.jetton_content = jetton_content;
        self.merkle_root = "";
        self.admin = admin;
    }

    receive(msg: TweetMint) {
        let ctx: Context = context();
        // Merkle tree verification
        let target_hash: String = self.calculate_transaction_hash(msg.index, msg.to_str, msg.amount);
        require(self.verify_proof(target_hash, msg.proof, msg.proof_length), "Merkle verification failed.");
        let init: StateInit = self.calculate_transaction_validator_init(msg.index);
        send(SendParameters{
                to: contractAddress(init),
                value: ton("0.01"),
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
        
        let cash: Int = msg.amount/10*2;

        // TODO record 80% to token vault  lock
        let initCode: StateInit = self.calculate_vault_init(msg.to);
        let vault_address: Address = contractAddress(initCode);
        send(SendParameters{
            to: vault_address,
            body: Lock { amount: msg.amount - cash }.toCell(),
            value: ton("0.01"),             
            mode: SendPayGasSeparately,
            code: initCode.code,  
            data: initCode.data
        });

        // send cash 20% to receiver
        let _msg: JettonMint = JettonMint{
            origin: msg.origin,
            receiver: msg.to,
            amount: cash,
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: emptySlice()
        };
        let next_supply:Int = self.total_supply + msg.amount;
        require(self.max_supply - next_supply > 0 && next_supply > 0, "Exceeded the limit of supply");
        self._mint_validate(ctx, _msg);
        self._mint(ctx, _msg);
        
    }

    receive(msg: WithdrawMint) {
        let ctx: Context = context();
        require(ctx.sender == contractAddress(self.calculate_vault_init(msg.to)), "Only for token vault");
        let _msg: JettonMint = JettonMint{
            origin: msg.to,
            receiver: msg.to,
            amount: msg.amount,
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: emptySlice()
        };
        self._mint_validate(ctx, _msg);
        self._mint(ctx, _msg);
    }

    receive(msg: MerkleRoot) {
        require(sender() == self.admin, "Only for merkle admin");
        self.merkle_root = msg.value;
    }

    receive(msg: MerkleAdmin) {
        require(sender() == self.owner, "Only for owner");
        self.admin = msg.value;
    }


    inline fun sha128(s: String) : String {
        return (sha256(s) >> 128).toString();
    }

    inline fun calculate_transaction_hash(index: Int, to_str: String, amount: Int): String {
        let sb: StringBuilder = beginString();
        sb.append(index.toString());
        sb.append(to_str);
        sb.append(amount.toString());
        return self.sha128(sb.toString());
    }

    inline fun verify_proof(target_hash: String, proof: Cell, proof_length: Int): Bool {
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
            let _position: Int = parser.loadUint(1);
            let sb: StringBuilder = beginString();

            if (_position == 1) {
                sb.append(_hash.toString());
                sb.append(current_hash);
            } else {
                sb.append(current_hash);
                sb.append(_hash.toString());
            }

            current_hash = self.sha128(sb.toString());
            frist_cell = false;
        }

        return current_hash == self.merkle_root;
    }


    inline fun calculate_transaction_validator_init(txid: Int): StateInit {
        return initOf TransactionValidator(txid, myAddress());
    }

    inline fun calculate_vault_init(owner: Address): StateInit {
        return initOf TokenVault(owner, myAddress());
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

    get fun get_vault_address(owner: Address): Address {
        let initCode: StateInit = self.calculate_vault_init(owner);
        return contractAddress(initCode);
    }
}