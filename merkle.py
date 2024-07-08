import hashlib

class MerkleTree:
    def __init__(self, data_blocks):
        self.leaves = [self.hash_data(data) for data in data_blocks]
        self.tree = self.build_merkle_tree(self.leaves)

    def hash_data(self, data):
        """返回数据的SHA-256哈希值"""
        hasher = hashlib.sha256()
        if isinstance(data, str):
            data = data.encode('utf-8')
        hasher.update(data)
        digest = hasher.digest()
        full_hash = int.from_bytes(digest, 'big')
        truncated_hash = full_hash >> 128

        return str(truncated_hash)

    def build_merkle_tree(self, leaves):
        """从叶子构建Merkle树"""
        tree = [leaves]
        while len(leaves) > 1:
            if len(leaves) % 2 != 0:
                leaves.append(leaves[-1])
            level = []
            for i in range(0, len(leaves), 2):
                combined_hash = self.hash_data(leaves[i] + leaves[i + 1])
                level.append(combined_hash)
            tree.append(level)
            leaves = level
        return tree

    def get_root(self):
        """返回Merkle树的根"""
        return self.tree[-1][0] if self.tree else None

    def validate_transaction(self, transaction, index):
        """验证交易是否属于Merkle树"""
        transaction_hash = self.hash_data(transaction)
        if transaction_hash not in self.leaves:
            return False
        proof = self.get_proof(index)
        current_hash = transaction_hash

        for sibling_hash in proof:
            if index % 2 == 0:
                current_hash = self.hash_data(current_hash + sibling_hash)
            else:
                current_hash = self.hash_data(sibling_hash + current_hash)
            index //= 2

        return current_hash == self.get_root()

    def get_proof(self, index):
        """生成给定索引的证明（哈希路径）"""
        proof = []
        for level in self.tree[:-1]:
            if index % 2 == 0:
                sibling_index = index + 1 if index + 1 < len(level) else index
            else:
                sibling_index = index - 1
            proof.append(level[sibling_index])
            index //= 2
        return proof


# 示例交易数据
data_blocks = [
  'UQAEg6xitp3M_Pj9pjHQpLeGZ8PxIEH2RwGCTpMNE6sOjycs10000000000000',
  'EQDY-uI3LXl12N1cBduBMN911HM3MdPMijWxLnZPOpbMX6Fi20000000000000',
  'UQAEg6xitp3M_Pj9pjHQpLeGZ8PxIEH2RwGCTpMNE6sOjycs30000000000000',
  'UQAEg6xitp3M_Pj9pjHQpLeGZ8PxIEH2RwGCTpMNE6sOjycs40000000000000',
  'UQAEg6xitp3M_Pj9pjHQpLeGZ8PxIEH2RwGCTpMNE6sOjycs50000000000000',
  'EQDY-uI3LXl12N1cBduBMN911HM3MdPMijWxLnZPOpbMX6Fi600000000000000'
]

# 构建Merkle树并验证交易
merkle_tree = MerkleTree(data_blocks)
root = merkle_tree.get_root()
print(f'Merkle Root: {root}')

# 验证某个交易
for target_index in range(0, 6):
    transaction = data_blocks[target_index]

    is_valid = merkle_tree.validate_transaction(transaction, target_index)
    print(f'Index:{target_index}, Transaction: {transaction} is valid: {is_valid}, proof is: {merkle_tree.get_proof(target_index)}')
