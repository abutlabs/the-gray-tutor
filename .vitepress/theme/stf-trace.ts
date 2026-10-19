// The start page's state-transition widget: the storage trace's first 12 tiny blocks, each as
// σ′ ≡ Υ(σ, B): the state root before, the block (its slot, its author, its parent, how
// many of each extrinsic part it carries), and the state root after. Copied from
// vectors/traces/storage as they are; tools/widget-stf-step.test.ts compares them with the
// files where vectors/ is downloaded.

/** [slot, author, σ's root, σ′'s root, parent header hash, [tickets, preimages, guarantees, assurances, disputes]] */
export type Transition = [number, number, string, string, string, number[]];
export const TRANSITIONS: Transition[] = [
  [1, 0, "0xd6e78dc07a9ae915ada8306bf0da89b11044a2d4ee71ae0c5faf61f34f6b3a0c", "0x48dc323d05aa152a53fb4f38b690d8198994f9fdb86bf1a6300b306cc79f86f9", "0x245becfe7f091e38fcc013ce7d8dff1f2838588837d57ba6b6fbcdaf89abb76c", [0, 0, 0, 0, 0]],
  [2, 3, "0x48dc323d05aa152a53fb4f38b690d8198994f9fdb86bf1a6300b306cc79f86f9", "0xd5ca7716c78bd4bce3155652aa337e668f92f0d8e648d508b5b3fb5050609056", "0x5592b088d8760232d117f90a2a962e640f2a7254f52658ee6af9664289d9620a", [0, 0, 1, 0, 0]],
  [3, 3, "0xd5ca7716c78bd4bce3155652aa337e668f92f0d8e648d508b5b3fb5050609056", "0x14e852848bc13bdad2c3a7791de08e185158e141154b38adfb6af9a6a273bbd0", "0x88502d3d3a62d26c076c09e4e2ae7dc5582ee59dfde55912996264b771515267", [0, 0, 1, 4, 0]],
  [4, 5, "0x14e852848bc13bdad2c3a7791de08e185158e141154b38adfb6af9a6a273bbd0", "0x94ae66d3750add441871e00b72bdc950dcd197a1f2c20cc52ff305bfa6223d0c", "0x9a9cac195d0bd7b6f2565abbd3b0c5f48366c70870ab5fa9f5b595c59803accc", [0, 0, 0, 4, 0]],
  [5, 2, "0x94ae66d3750add441871e00b72bdc950dcd197a1f2c20cc52ff305bfa6223d0c", "0xac4306d37e873057bfae953e12b3dfe5c0c11740a94b4ccf6010255006876425", "0x1129d2c61c4ac5771fb8b5e62e82b35549dfaec884a0afc2d36b7d37f835cbc9", [0, 0, 0, 4, 0]],
  [6, 5, "0xac4306d37e873057bfae953e12b3dfe5c0c11740a94b4ccf6010255006876425", "0xa48f5bc03fd89c2995e37af4d68f046796ea7ca4ae03e89ad0cfa45e4b4b7270", "0x618aab2eedd4453acd42d9fafefcc5e619d10a3f1547e39d0e968e62ec8fe790", [0, 0, 2, 6, 0]],
  [7, 4, "0xa48f5bc03fd89c2995e37af4d68f046796ea7ca4ae03e89ad0cfa45e4b4b7270", "0x3794c6d34dc5052e0e90815499ef3cfff243de1d1e7e3bfca06dd8751a94fe1a", "0x8c6b9eb74867cbbfd8f16fefb9f2eee1304f6881bae872feb30cc673eb23661c", [0, 0, 1, 6, 0]],
  [8, 3, "0x3794c6d34dc5052e0e90815499ef3cfff243de1d1e7e3bfca06dd8751a94fe1a", "0xa0bb2059c6052a4133646842d635f893493b84406c2907eb5a677187fb6a54be", "0xbcf92c7bdc154d327c6f3fef878af8357f13bdbf5206b1027faa2d42b464af0a", [0, 0, 1, 6, 0]],
  [9, 4, "0xa0bb2059c6052a4133646842d635f893493b84406c2907eb5a677187fb6a54be", "0x42f9611dd97fc0ef1a83bcea31bbd935f2f18857cf566ebf546d77b0ab719b74", "0x87f07e482cc1be9cd0c435ce12d51e34f80b9bdfd8e24e441a2d0050112459a0", [0, 0, 1, 3, 0]],
  [10, 0, "0x42f9611dd97fc0ef1a83bcea31bbd935f2f18857cf566ebf546d77b0ab719b74", "0x844c054607dba4a9e0c06b2a35554711f37ac9b8a04338a54539126920dcd898", "0xaa83ff69cdd3b128fe3835a4f85408dceae2472c424a77264b7832ce5f5ff67b", [0, 0, 1, 6, 0]],
  [11, 3, "0x844c054607dba4a9e0c06b2a35554711f37ac9b8a04338a54539126920dcd898", "0x3a5935db7bed8699df9d54c16cbe3239af9c27085a86f4fd06308bcc28819dd4", "0x994ad1f220537188775dc8a3a8aed87c45e714ef87e0568d3fe2ad27db497974", [0, 0, 2, 6, 0]],
  [12, 5, "0x3a5935db7bed8699df9d54c16cbe3239af9c27085a86f4fd06308bcc28819dd4", "0xd3eb0c2ea6765fef1c4cc356c2702420d2f6e69c7ea8910925ad5d09cb19c7bb", "0xd0e5de01fc2107a27d726655419fa0aea1febf42cff47d6da4272dcc671a293d", [0, 0, 1, 6, 0]],
];
