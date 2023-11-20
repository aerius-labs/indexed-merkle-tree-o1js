import { Bool, Field, Gadgets, Poseidon, Provable, Struct } from 'o1js';

export class IndexedMerkleTreeLeaf extends Struct({
  value: Field,
  nextValue: Field,
  nextIndex: Field,
}) {}

export const insertIndexedMerkleTreeLeaf = (
  oldRoot: Field,
  lowLeaf: IndexedMerkleTreeLeaf,
  lowLeafIndex: Field,
  lowLeafProof: Field[],
  lowLeafProofHelper: Bool[],
  newRoot: Field,
  newLeaf: IndexedMerkleTreeLeaf,
  newLeafIndex: Field,
  newLeafProof: Field[],
  newLeafProofHelper: Bool[],
  isNewLeafLargest: Bool
) => {
  Provable.if(
    isNewLeafLargest,
    lowLeaf.nextValue.equals(Field(0)),
    lowLeaf.nextValue.greaterThan(newLeaf.value)
  ).assertEquals(true);

  verifyMerkleProof(
    Poseidon.hash([lowLeaf.value, lowLeaf.nextValue, lowLeaf.nextIndex]),
    lowLeafIndex,
    oldRoot,
    lowLeafProof,
    lowLeafProofHelper
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
    lowLeafProof,
    lowLeafProofHelper
  );

  verifyMerkleProof(
    Field(0),
    newLeafIndex,
    interimRoot,
    newLeafProof,
    newLeafProofHelper
  ).assertTrue();

  newLeaf.nextValue.assertEquals(lowLeaf.nextValue);
  newLeaf.nextIndex.assertEquals(lowLeaf.nextIndex);

  computeMerkleRoot(
    Poseidon.hash([newLeaf.value, newLeaf.nextValue, newLeaf.nextIndex]),
    newLeafIndex,
    newLeafProof,
    newLeafProofHelper
  ).assertEquals(newRoot);
};

const verifyMerkleProof = (
  leaf: Field,
  index: Field,
  root: Field,
  proof: Field[],
  proofHelper: Bool[]
) => {
  let computedHash = leaf;
  for (let i = 0; i < proof.length; i++) {
    const proofElement = proof[i];
    computedHash = Provable.if(
      proofHelper[i],
      Poseidon.hash([computedHash, proofElement]),
      Poseidon.hash([proofElement, computedHash])
    );
  }
  return computedHash.equals(root);
};

const computeMerkleRoot = (
  leaf: Field,
  index: Field,
  proof: Field[],
  proofHelper: Bool[]
) => {
  let computedHash = leaf;
  for (let i = 0; i < proof.length; i++) {
    const proofElement = proof[i];
    computedHash = Provable.if(
      proofHelper[i],
      Poseidon.hash([computedHash, proofElement]),
      Poseidon.hash([proofElement, computedHash])
    );
  }
  return computedHash;
};
