// Lesson 5.3's vector, stf/assurances/tiny/assurances_with_bad_signature-1.json: the two
// things its tests read, copied as they are (tools/widget-vector-step.test.ts compares them
// with the file where vectors/ is downloaded): input.assurances, and each validator's
// pre_state.curr_validators[i].ed25519.

export const ASSURANCES = [
  { anchor: "0xd61a38a0f73beda90e8c1dfba731f65003742539f4260694f44e22cabef24a8e", bitfield: "0x03", validator_index: 0, signature: "0x3dbe32bd0aa83969ab039ff3c15ee55670383e02ca84a062bfea24e3dacb85a1106252307e232838f8ea8c4f5cde85a9fb94fab60af281ef739544fba981700b" },
  { anchor: "0xd61a38a0f73beda90e8c1dfba731f65003742539f4260694f44e22cabef24a8e", bitfield: "0x02", validator_index: 1, signature: "0x44e668f7d744ec56e41f6aee0279f9165b711245bb4aa7745ebd21770e6bae276010b52dd19e1b4298754ed8b7681786d221ec12949cdfdedbd1fe170279cb07" },
  { anchor: "0xd61a38a0f73beda90e8c1dfba731f65003742539f4260694f44e22cabef24a8e", bitfield: "0x03", validator_index: 2, signature: "0x87993843280cc45a1a94e217de720acbf58bef8dfda09481eceb10eb284a2543e93da141f83f90eb0bb92f8daa8e17a3fec5d033a28cd887357d98dab5f6da0b" },
  { anchor: "0xd61a38a0f73beda90e8c1dfba731f65003742539f4260694f44e22cabef24a8e", bitfield: "0x03", validator_index: 3, signature: "0xa1edff37e39500bde98e6da96630c7b1d1a1334b2cb75335f225029a34654937115d7b1eb8238a22f2682b8785569ddd6a739931b905526118c5ae733e6e6d02" },
  { anchor: "0xd61a38a0f73beda90e8c1dfba731f65003742539f4260694f44e22cabef24a8e", bitfield: "0x03", validator_index: 4, signature: "0x2bf056ac948b468d9b169c3ac15e4ddfba22f7b2481787c5775f43bfecf98665a26143c49f5aeff9a97a85073d5a2011a1fa4b7cadb9d3779df651743233410d" },
  { anchor: "0xd61a38a0f73beda90e8c1dfba731f65003742539f4260694f44e22cabef24a8e", bitfield: "0x03", validator_index: 5, signature: "0x4353227aebbb56f8d99e6cd9b9ce6cfba6abda4cd901cbedaf55aaca3d9f52f9f3a961522c9d8ca96961e2aa9e4323ccf6c27150ebdb01e31985f84e2265680f" },
];

export const ED25519_KEYS = [
  "0x4418fb8c85bb3985394a8c2756d3643457ce614546202a2f50b093d762499ace",
  "0xad93247bd01307550ec7acd757ce6fb805fcf73db364063265b30a949e90d933",
  "0xcab2b9ff25c2410fbe9b8a717abb298c716a03983c98ceb4def2087500b8e341",
  "0xf30aa5444688b3cab47697b37d5cac5707bb3289e986b19b17db437206931a8d",
  "0x8b8c5d436f92ecf605421e873a99ec528761eb52a88a2f9a057b3b3003e6f32a",
  "0xab0084d01534b31c1dd87c81645fd762482a90027754041ca1b56133d0466c06",
];
