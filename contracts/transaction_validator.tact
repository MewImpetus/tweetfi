message TransactionExistCheck {
    origin: Address;
    to: Address;
    amount: Int;
}

message InternalTweetMint {
    txid: Int;
    origin: Address;
    to: Address;
    amount: Int;
}

// Check if the transaction exists.
contract TransactionValidator {
    txid: Int;
    parent: Address;
    pass: Bool;
    init(txid: Int, parent: Address){
        self.txid = txid;
        self.parent = parent;
        self.pass = true;
    }

    receive(msg: TransactionExistCheck){
        let ctx: Context = context();
        require(ctx.sender == self.parent && self.pass == true, "No permission");
        // self.reply(InternalTweetMint{txid: self.txid, origin: msg.origin, to: msg.to, amount: msg.amount}.toCell());
        send(SendParameters{
            to: self.parent,
            body: InternalTweetMint{txid: self.txid, origin: msg.origin, to: msg.to, amount: msg.amount}.toCell(),
            value: myBalance() - ton("0.01"),             
        });
        self.pass = false;
    }

    get fun get_pass(): Bool {
        return self.pass;
    }

    get fun get_parent(): Address {
        return self.parent;
    }

    get fun get_txid(): Int {
        return self.txid;
    }

    get fun balance(): Int {
        return myBalance();
    }
}