struct Pool {
    update_at: Int as uint32;
    amount: Int as coins;
    release_amount: Int as coins;
}

message Lock {
    amount: Int as coins;
}

message Stake {
    amount: Int as coins;
    inviter: Address;
}

message VaultBalance {
    balance: Int as coins;
    lock_pool: Int as coins;
    stake_pool: Int as coins;
}

message WithdrawMint {
    to: Address;
    amount: Int as coins;
}

message Unstake {
    amount: Int;
}

message ShareRelease {
    origin: Address;
    amount: Int;
}


contract TokenVault {
    owner: Address;
    jetton_master: Address;
    lock_pool: Pool;
    stake_pool: Pool;
    inviter: Address;
    zero_address: Address;
    const day_second: Int = 86400;
    
    init(owner: Address, master: Address){
        self.owner = owner;
        self.jetton_master = master;
        self.lock_pool = Pool { update_at: 0, amount: 0, release_amount: 0};
        self.stake_pool = Pool { update_at: 0, amount: 0, release_amount: 0};
        self.zero_address = newAddress(0, 0);
        self.inviter = self.zero_address;
    }

    receive(msg: Lock) {
        require(sender() == self.jetton_master, "Only for jetton master");
        self.update_lock_pool(msg.amount);
    }

    receive(msg: ShareRelease) {
        require(sender() == contractAddress(self.calculate_vault_init(msg.origin)), "Only for token vault");
        self.update_stake_pool(0);
        if (msg.amount < self.lock_pool.amount) {
            self.lock_pool.amount = self.lock_pool.amount - msg.amount;
            self.lock_pool.release_amount = self.lock_pool.release_amount + msg.amount;
        } else {
            self.lock_pool.release_amount = self.lock_pool.release_amount + self.lock_pool.amount;
            self.lock_pool.amount = 0;
        }
    }

    receive(msg: Stake) {
        require(sender() == self.jetton_master, "Only for jetton master");
        self.update_stake_pool(msg.amount);
        if (self.inviter == self.zero_address && msg.inviter != self.zero_address && msg.inviter != self.owner) {
            self.inviter = msg.inviter;
            let unlock: Int = msg.amount / 10;
            if (unlock > 0) {
                let initCode: StateInit = self.calculate_vault_init(msg.inviter);
                let vault_address: Address = contractAddress(initCode);
                send(SendParameters{
                    to: vault_address,
                    body: ShareRelease { origin: sender(), amount: unlock }.toCell(),
                    value: 0,             
                    mode: SendRemainingValue,
                });
            }
        }
    }

    receive(msg: Unstake) {
        require(sender() == self.owner, "Only for owner");
        require(msg.amount <= self.stake_pool_withdrawal_limit(), "Exceeded unlock limit");
        self.update_stake_pool(0);
        self.stake_pool.release_amount = self.stake_pool.release_amount - msg.amount;
        require(self.stake_pool.release_amount >= 0, "Exceeded unlock limit");
        // send mint message
        send(SendParameters {
                    to: self.jetton_master,
                    value: 0,
                    mode: SendRemainingValue,
                    body: WithdrawMint{to: self.owner, amount: msg.amount}.toCell()
            }
        );
    }

    receive("Withdraw: Lock release") {
        require(sender() == self.owner, "Only owner use");
        self.update_lock_pool(0);
        // send mint message
        send(SendParameters {
                    to: self.jetton_master,
                    value: 0,
                    mode: SendRemainingValue,
                    body: WithdrawMint{to: self.owner, amount: self.lock_pool.release_amount}.toCell()
            }
        );
        self.lock_pool.release_amount = 0;
        
    }

    inline fun update_lock_pool(amount: Int) {
        
        let remaining :Int = self.calculate_released_amount(self.lock_pool.amount, self.lock_pool.update_at);    
        self.lock_pool.release_amount = self.lock_pool.amount - remaining;
        self.lock_pool.amount = remaining + amount;
        self.lock_pool.update_at = now();
        
    }

    inline fun update_stake_pool(amount: Int) {
        
        let remaining :Int = self.calculate_released_amount(self.stake_pool.amount, self.stake_pool.update_at);        
        self.stake_pool.release_amount = self.stake_pool.amount - remaining;
        self.stake_pool.amount = remaining + amount;
        self.stake_pool.update_at = now();
        
    }

    inline fun calculate_released_amount(amount: Int, update_at: Int): Int {
        let n: Int = 0;
        while (n < (now() - update_at)/self.day_second && amount > 0) {      
            n = n + 1;
            amount = amount/100*99;
        }
        return amount;
    }

    inline fun calculate_vault_init(owner: Address): StateInit {
        return initOf TokenVault(owner, self.jetton_master);
    }

    get fun balance(): VaultBalance {
        return VaultBalance {
            balance: self.lock_pool.amount + self.lock_pool.release_amount + self.stake_pool.amount + self.stake_pool.release_amount,
            lock_pool: self.lock_pool.amount + self.lock_pool.release_amount,
            stake_pool: self.stake_pool.amount + self.stake_pool.release_amount
        };
    }

    get fun lock_pool_withdrawal_limit(): Int {
        return self.lock_pool.release_amount + self.calculate_released_amount(self.lock_pool.amount, self.lock_pool.update_at);
    }

    get fun stake_pool_withdrawal_limit(): Int {
        return self.stake_pool.release_amount + self.calculate_released_amount(self.stake_pool.amount, self.stake_pool.update_at);
    }

    

}