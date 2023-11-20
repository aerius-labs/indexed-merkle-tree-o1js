import { Bool, Field, Poseidon } from 'o1js';

export class MerkleTree {
  tree: Array<Array<Field>>;
  root: Field;

  constructor(leaves: Array<Field>) {
    if (leaves.length === 0)
      throw new Error('Cannot create Merkle Tree with no leaves');
    if (leaves.length === 1) {
      this.tree = [leaves];
      this.root = leaves[0];
      return;
    }
    if (leaves.length % 2 === 1) throw new Error('Leaves must be even');

    this.tree = [leaves];
    let level = 0;
    let currentLevel = leaves;

    while (currentLevel.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1];
        nextLevel.push(Poseidon.hash([left, right]));
      }
      this.tree.push(nextLevel);
      currentLevel = nextLevel;
      level++;
    }
    this.root = currentLevel[0];
  }

  getRoot(): Field {
    return this.root;
  }

  getProof(index: number): [Array<Field>, Array<Bool>] {
    const proof = [];
    const proofHelper = [];
    let currentIndex = index;
    for (let i = 0; i < this.tree.length - 1; i++) {
      const level = this.tree[i];
      const isLeftNode = currentIndex % 2 === 0;
      const siblingIndex = isLeftNode ? currentIndex + 1 : currentIndex - 1;
      const sibling = level[siblingIndex];
      proof.push(sibling);
      proofHelper.push(Bool(isLeftNode));
      currentIndex = Math.floor(currentIndex / 2);
    }
    return [proof, proofHelper];
  }

  verifyProof(
    leaf: Field,
    index: number,
    root: Field,
    proof: Array<Field>
  ): Bool {
    let computedHash = leaf;
    let currentIndex = index;
    for (let i = 0; i < proof.length; i++) {
      const proofElement = proof[i];
      const isLeftNode = currentIndex % 2 === 0;
      computedHash = isLeftNode
        ? Poseidon.hash([computedHash, proofElement])
        : Poseidon.hash([proofElement, computedHash]);
      currentIndex = Math.floor(currentIndex / 2);
    }
    return computedHash.equals(root);
  }
}
