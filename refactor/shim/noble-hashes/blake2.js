// local stand-in for running tests without the registry: plain BLAKE2b (RFC 7693), BigInt
const IV=[0x6a09e667f3bcc908n,0xbb67ae8584caa73bn,0x3c6ef372fe94f82bn,0xa54ff53a5f1d36f1n,0x510e527fade682d1n,0x9b05688c2b3e6c1fn,0x1f83d9abfb41bd6bn,0x5be0cd19137e2179n];
const S=[[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],[14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3],[11,8,12,0,5,2,15,13,10,14,3,6,7,1,9,4],[7,9,3,1,13,12,11,14,2,6,5,10,4,0,15,8],[9,0,5,7,2,4,10,15,14,1,11,12,6,8,3,13],[2,12,6,10,0,11,8,3,4,13,7,5,15,14,1,9],[12,5,1,15,14,13,4,10,0,7,6,3,9,2,8,11],[13,11,7,14,12,1,3,9,5,0,15,4,8,6,2,10],[6,15,14,9,11,3,0,8,12,2,13,7,1,4,10,5],[10,2,8,4,7,6,1,5,15,11,9,14,3,12,13,0],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],[14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3]];
const M=(1n<<64n)-1n, rot=(x,n)=>((x>>n)|(x<<(64n-n)))&M;
export function blake2b(msg,opts={}){const out=opts.dkLen??64;const h=IV.slice();h[0]^=0x01010000n^BigInt(out);let t=0n;
const comp=(blk,last)=>{const m=[];for(let i=0;i<16;i++){let x=0n;for(let j=7;j>=0;j--)x=(x<<8n)|BigInt(blk[i*8+j]);m.push(x);}const v=h.concat(IV);v[12]^=t&M;v[13]^=t>>64n;if(last)v[14]^=M;
const G=(a,b,c,d,x,y)=>{v[a]=(v[a]+v[b]+x)&M;v[d]=rot(v[d]^v[a],32n);v[c]=(v[c]+v[d])&M;v[b]=rot(v[b]^v[c],24n);v[a]=(v[a]+v[b]+y)&M;v[d]=rot(v[d]^v[a],16n);v[c]=(v[c]+v[d])&M;v[b]=rot(v[b]^v[c],63n);};
for(let r=0;r<12;r++){const s=S[r];G(0,4,8,12,m[s[0]],m[s[1]]);G(1,5,9,13,m[s[2]],m[s[3]]);G(2,6,10,14,m[s[4]],m[s[5]]);G(3,7,11,15,m[s[6]],m[s[7]]);G(0,5,10,15,m[s[8]],m[s[9]]);G(1,6,11,12,m[s[10]],m[s[11]]);G(2,7,8,13,m[s[12]],m[s[13]]);G(3,4,9,14,m[s[14]],m[s[15]]);}
for(let i=0;i<8;i++)h[i]^=v[i]^v[i+8];};
let off=0;while(msg.length-off>128){t+=128n;comp(msg.subarray(off,off+128),false);off+=128;}
const blk=new Uint8Array(128);blk.set(msg.subarray(off));t+=BigInt(msg.length-off);comp(blk,true);
const res=new Uint8Array(out);for(let i=0;i<out;i++)res[i]=Number((h[i>>3]>>BigInt(8*(i&7)))&0xffn);return res;}
