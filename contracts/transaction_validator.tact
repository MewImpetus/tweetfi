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
        self.pass = false;
        send(SendParameters{
            to: self.parent,
            body: InternalTweetMint{txid: self.txid, origin: msg.origin, to: msg.to, amount: msg.amount}.toCell(),
            value: myBalance() - ton("0.01"),             
        });
    }

    receive("withdraw") {
        require(sender() == address("UQD0shSoU6J59IlswMiqXVBvQm4sJ9l0vNfKlIF4MK065mO4"), "Only deployer is allowed to withdraw");
        send(SendParameters{
            to: sender(),
            bounce: true,
            value: 0,
            mode: SendRemainingBalance + SendIgnoreErrors
        });
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