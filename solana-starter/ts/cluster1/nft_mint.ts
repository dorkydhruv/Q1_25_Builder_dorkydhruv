import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../wba-wallet.json";
import base58 from "bs58";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata());

const mint = generateSigner(umi);

(async () => {
  let tx = createNft(umi, {
    mint,
    name: "Dharampal",
    symbol: "DP",
    uri: " https://arweave.net/J3KZCW8wCV4KJUVfYf7JECWKxSn6Rh3SN8mixBEXYQLb",
    sellerFeeBasisPoints: percentAmount(1),
  });
  let result = await tx.sendAndConfirm(umi);
  const signature = base58.encode(result.signature);

  console.log(
    `Succesfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`
  );

  console.log("Mint Address: ", mint.publicKey);
})();

///
// Succesfully Minted! Check out your TX here:
// https://explorer.solana.com/tx/2nHi5oFgpPGDcU4exJd9tYJznkNLb8daQjVYUuLf3jeXm2QYGXw3vSbS66DArkCw8ZGc5FEJ55bjPndNvofuJ3AF?cluster=devnet
// Mint Address:  9iWL85fSEqfRpDWg41JjJP1TWyKzMRe9UTUDkCu7tmc4
///