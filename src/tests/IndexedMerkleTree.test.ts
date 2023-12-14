import {
  Bool,
  Cache,
  Field,
  Poseidon,
  Provable,
  ZkProgram,
  verify,
} from 'o1js';
import { MerkleTree } from '../utils/MerkleTreeUtils';
import {
  IndexedMerkleTreeLeaf,
  insertLeaf,
} from '../circuits/IndexedMerkleTree';

const IMTInsertionCircuit = ZkProgram({
  name: 'Dummy Circuit',

  publicInput: undefined,

  methods: {
    insertLeaf: {
      privateInputs: [
        Field,
        IndexedMerkleTreeLeaf,
        Provable.Array(Field, 3),
        Provable.Array(Bool, 3),
        Field,
        IndexedMerkleTreeLeaf,
        Field,
        Provable.Array(Field, 3),
        Provable.Array(Bool, 3),
        Bool,
      ],

      method(
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
      ) {
        insertLeaf(
          oldRoot,
          lowLeaf,
          lowLeafProof,
          lowLeafProofHelper,
          newRoot,
          newLeaf,
          newLeafIndex,
          newLeafProof,
          newLeafProofHelper,
          isNewLeafLargest
        );
      },
    },
  },
});

describe('Indexed Merkle Tree Insertion Tests', () => {
  const circuitCache = Cache.FileSystem(
    '/Users/shreyaslondhe/Desktop/dev/aerius-repos/indexed-merkle-tree-o1js/keys'
  );

  let treeSize = 2 ** 3;

  let indexedMerkleTree: MerkleTree;
  let leaves: Field[] = [];

  it('should initialise an Indexed Merkle Tree', async () => {
    leaves = Array.from({ length: treeSize }, (_, i) => {
      if (i == 0) return Poseidon.hash([Field(0), Field(0), Field(0)]);
      else return Field(0);
    });
    indexedMerkleTree = new MerkleTree(leaves);
  });

  it('should insert a single element into the tree', async () => {
    const newVal = Field(69);

    const oldRoot = indexedMerkleTree.getRoot();
    const lowLeaf = new IndexedMerkleTreeLeaf({
      value: Field(0),
      nextValue: Field(0),
      nextIndex: Field(0),
    });
    const [lowLeafProof, lowLeafProofHelper] = indexedMerkleTree.getProof(0);

    // compute the iterim state change
    const newLowLeaf = new IndexedMerkleTreeLeaf({
      value: lowLeaf.value,
      nextValue: newVal,
      nextIndex: Field(1),
    });
    leaves[0] = Poseidon.hash([
      newLowLeaf.value,
      newLowLeaf.nextValue,
      newLowLeaf.nextIndex,
    ]);
    indexedMerkleTree = new MerkleTree(leaves);
    const [newLeafProof, newLeafProofHelper] = indexedMerkleTree.getProof(1);
    expect(
      indexedMerkleTree
        .verifyProof(leaves[1], 1, indexedMerkleTree.getRoot(), newLeafProof)
        .toBoolean()
    ).toBe(true);

    leaves[1] = Poseidon.hash([newVal, Field(0), Field(0)]);
    indexedMerkleTree = new MerkleTree(leaves);

    const newRoot = indexedMerkleTree.getRoot();
    const newLeaf = new IndexedMerkleTreeLeaf({
      value: newVal,
      nextValue: Field(0),
      nextIndex: Field(0),
    });
    const newLeafIndex = Field(1);
    const isNewLeafLargest = Bool(true);

    const { verificationKey } = await IMTInsertionCircuit.compile({
      cache: circuitCache,
    });

    const proof = await IMTInsertionCircuit.insertLeaf(
      oldRoot,
      lowLeaf,
      lowLeafProof,
      lowLeafProofHelper,
      newRoot,
      newLeaf,
      newLeafIndex,
      newLeafProof,
      newLeafProofHelper,
      isNewLeafLargest
    );

    const result = await verify(proof, verificationKey);
    expect(result).toBe(true);
  });

  it('should insert element less than largest into the tree', async () => {
    const newVal = Field(42);

    const oldRoot = indexedMerkleTree.getRoot();
    const lowLeaf = new IndexedMerkleTreeLeaf({
      value: Field(0),
      nextValue: Field(69),
      nextIndex: Field(1),
    });
    const [lowLeafProof, lowLeafProofHelper] = indexedMerkleTree.getProof(0);

    // compute the iterim state change
    const newLowLeaf = new IndexedMerkleTreeLeaf({
      value: lowLeaf.value,
      nextValue: newVal,
      nextIndex: Field(2),
    });
    leaves[0] = Poseidon.hash([
      newLowLeaf.value,
      newLowLeaf.nextValue,
      newLowLeaf.nextIndex,
    ]);
    indexedMerkleTree = new MerkleTree(leaves);
    const [newLeafProof, newLeafProofHelper] = indexedMerkleTree.getProof(2);
    expect(
      indexedMerkleTree
        .verifyProof(leaves[2], 2, indexedMerkleTree.getRoot(), newLeafProof)
        .toBoolean()
    ).toBe(true);

    leaves[2] = Poseidon.hash([newVal, Field(69), Field(1)]);
    indexedMerkleTree = new MerkleTree(leaves);

    const newRoot = indexedMerkleTree.getRoot();
    const newLeaf = new IndexedMerkleTreeLeaf({
      value: newVal,
      nextValue: Field(69),
      nextIndex: Field(1),
    });
    const newLeafIndex = Field(2);
    const isNewLeafLargest = Bool(false);

    const { verificationKey } = await IMTInsertionCircuit.compile({
      cache: circuitCache,
    });

    const proof = await IMTInsertionCircuit.insertLeaf(
      oldRoot,
      lowLeaf,
      lowLeafProof,
      lowLeafProofHelper,
      newRoot,
      newLeaf,
      newLeafIndex,
      newLeafProof,
      newLeafProofHelper,
      isNewLeafLargest
    );

    const result = await verify(proof, verificationKey);
    expect(result).toBe(true);
  });
});
