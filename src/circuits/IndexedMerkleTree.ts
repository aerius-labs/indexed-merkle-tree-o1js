import { Bool, Field, Gadgets, Poseidon, Provable, Struct } from 'o1js';

export class IndexedMerkleTreeLeaf extends Struct({
  value: Field,
  nextValue: Field,
  nextIndex: Field,
}) {
  insert(
    oldRoot: Field,
    lowLeaf: IndexedMerkleTreeLeaf,
    lowLeafIndex: Field,
    lowLeafProof: Field[],
    newRoot: Field,
    newLeaf: IndexedMerkleTreeLeaf,
    newLeafIndex: Field,
    newLeafProof: Field[],
    isNewLeafLargest: Bool
  ) {
    lowLeaf.nextValue.assertGreaterThan(newLeaf.value);

    Provable.if(isNewLeafLargest, lowLeaf.nextValue, Field(0)).assertEquals(
      Field(0)
    );

    verifyMerkleProof(
      Poseidon.hash([lowLeaf.value, lowLeaf.nextValue, lowLeaf.nextIndex]),
      lowLeafIndex,
      oldRoot,
      lowLeafProof
    ).assertTrue();

    newLeaf.value.assertGreaterThan(lowLeaf.value);

    const newLowLeaf = new IndexedMerkleTreeLeaf({
      value: lowLeaf.value,
      nextValue: newLeaf.value,
      nextIndex: newLeafIndex,
    });

    const interimRoot = computeMerkleRoot(
      Poseidon.hash([
        newLowLeaf.value,
        newLowLeaf.nextValue,
        newLowLeaf.nextIndex,
      ]),
      lowLeafIndex,
      lowLeafProof
    );

    verifyMerkleProof(
      Field(0),
      newLeafIndex,
      interimRoot,
      newLeafProof
    ).assertTrue();

    newLeaf.nextValue.assertEquals(lowLeaf.nextValue);
    newLeaf.nextIndex.assertEquals(lowLeaf.nextIndex);

    computeMerkleRoot(
      Poseidon.hash([newLeaf.value, newLeaf.nextValue, newLeaf.nextIndex]),
      newLeafIndex,
      newLeafProof
    ).assertEquals(newRoot);
  }
}

const verifyMerkleProof = (
  leaf: Field,
  index: Field,
  root: Field,
  proof: Field[]
) => {
  let computedHash = leaf;
  let currentIndex = index;
  for (let i = 0; i < proof.length; i++) {
    const proofElement = proof[i];
    const isLeftNode = currentIndex.isEven();
    computedHash = Provable.if(
      isLeftNode,
      Poseidon.hash([computedHash, proofElement]),
      Poseidon.hash([proofElement, computedHash])
    );
    currentIndex = currentIndex.div(2);
  }
  return computedHash.equals(root);
};

const computeMerkleRoot = (leaf: Field, index: Field, proof: Field[]) => {
  let computedHash = leaf;
  let currentIndex = index;
  for (let i = 0; i < proof.length; i++) {
    const proofElement = proof[i];
    const isLeftNode = currentIndex.isEven();
    computedHash = Provable.if(
      isLeftNode,
      Poseidon.hash([computedHash, proofElement]),
      Poseidon.hash([proofElement, computedHash])
    );
    currentIndex = currentIndex.div(2);
  }
  return computedHash;
};
