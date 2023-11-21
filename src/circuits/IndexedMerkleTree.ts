import { Bool, Field, Gadgets, Poseidon, Provable, Struct } from 'o1js';

export class IndexedMerkleTreeLeaf extends Struct({
  value: Field,
  nextValue: Field,
  nextIndex: Field,
}) {}

export const insertLeaf = (
  oldRoot: Field,
  lowLeaf: IndexedMerkleTreeLeaf,
  lowLeafProof: Field[],
  lowLeafProofHelper: Bool[],
  newRoot: Field,
  newLeaf: IndexedMerkleTreeLeaf,
  newLeafIndex: Field,
  newLeafProof: Field[],
  newLeafProofHelper: Bool[],
  isNewLeafLargest: Bool
) => {
  verifyNonInclusion(
    oldRoot,
    lowLeaf,
    lowLeafProof,
    lowLeafProofHelper,
    newLeaf.value,
    isNewLeafLargest
  );

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
    lowLeafProof,
    lowLeafProofHelper
  );

  verifyMerkleProof(
    Field(0),
    interimRoot,
    newLeafProof,
    newLeafProofHelper
  ).assertTrue();

  newLeaf.nextValue.assertEquals(lowLeaf.nextValue);
  newLeaf.nextIndex.assertEquals(lowLeaf.nextIndex);

  computeMerkleRoot(
    Poseidon.hash([newLeaf.value, newLeaf.nextValue, newLeaf.nextIndex]),
    newLeafProof,
    newLeafProofHelper
  ).assertEquals(newRoot);
};

export const verifyNonInclusion = (
  root: Field,
  lowLeaf: IndexedMerkleTreeLeaf,
  lowLeafProof: Field[],
  lowLeafProofHelper: Bool[],
  newLeafValue: Field,
  isNewLeafLargest: Bool
) => {
  Provable.if(
    isNewLeafLargest,
    lowLeaf.nextValue.equals(Field(0)),
    lowLeaf.nextValue.greaterThan(newLeafValue)
  ).assertEquals(true);

  verifyMerkleProof(
    Poseidon.hash([lowLeaf.value, lowLeaf.nextValue, lowLeaf.nextIndex]),
    root,
    lowLeafProof,
    lowLeafProofHelper
  ).assertTrue();

  newLeafValue.assertGreaterThan(lowLeaf.value);
};

const verifyMerkleProof = (
  leaf: Field,
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
