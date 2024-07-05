import hashlib


def hash_data(data):
    # 创建 sha256 哈希对象
    hasher = hashlib.sha256()
    if isinstance(data, str):
        data = data.encode('utf-8')
    hasher.update(data)
    digest = hasher.digest()
    full_hash = int.from_bytes(digest, 'big')
    truncated_hash = full_hash >> 128

    return str(truncated_hash)




class MerkleTree:
    def __init__(self, data):
        self.leaves = [hash_data(item) for item in data]
        self.tree = []
        self.build_tree()

    def build_tree(self):
        current_layer = self.leaves
        while len(current_layer) > 1:
            next_layer = []
            for i in range(0, len(current_layer), 2):
                left = current_layer[i]
                right = current_layer[i + 1] if i + 1 < len(current_layer) else left
                next_layer.append(hash_data(left + right))
            self.tree.append(current_layer)
            current_layer = next_layer
        self.tree.append(current_layer)  # Root

    def get_proof(self, index):
        proof = []
        layer_index = 0
        while layer_index < len(self.tree) - 1:
            layer = self.tree[layer_index]
            is_right_node = index % 2
            sibling_index = index + 1 if is_right_node == 0 else index - 1
            if sibling_index < len(layer):
                proof.append((layer[sibling_index], 'right' if is_right_node == 0 else 'left'))
            index = index // 2
            layer_index += 1
        return proof

    def verify_proof(self, proof, target_hash, root_hash):
        current_hash = target_hash
        for sibling_hash, position in proof:
            if position == 'left':
                current_hash = hash_data(sibling_hash + current_hash)
            else:
                current_hash = hash_data(current_hash + sibling_hash)
        return current_hash == root_hash


# Example Usage
data_blocks = ['123EQAX21A4fIw7hX1jmRjvJT0DX7H_FUItj2duCBWtK4ayEiC_10000000000000', '1EQBGhqLAZseEqRXz4ByFPTGV7SVMlI4hrbs-Sps_Xzx01x8G990000000000000', 'block3', 'block4']


data_blocks = [
  "0EQAX21A4fIw7hX1jmRjvJT0DX7H_FUItj2duCBWtK4ayEiC_10000000000000",
  "1EQDY-uI3LXl12N1cBduBMN911HM3MdPMijWxLnZPOpbMX6Fi990000000000000",
]
merkle_tree = MerkleTree(data_blocks)
target_index = 1
proof = merkle_tree.get_proof(target_index)
verified = merkle_tree.verify_proof(proof, merkle_tree.leaves[target_index], merkle_tree.tree[-1][0])

print("root:", merkle_tree.tree[-1][0])
print("Proof:", proof)
print("Verified:", verified)
print("Target hash:", merkle_tree.leaves[target_index])
