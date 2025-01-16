import wallet from "../wba-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionArgs,
  DataV2Args,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

// Define our Mint address
const mint = publicKey("6FdqtX3gcZ4P25A36ngY4jW1eJx33EjGNShAdJBTsf5R");

// Create a UMI connection
const umi = createUmi("https://api.devnet.solana.com");
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));

(async () => {
  try {
    // Start here
    let accounts: CreateMetadataAccountV3InstructionAccounts = {
      mint: mint,
      updateAuthority: keypair.publicKey,
      mintAuthority: signer,
    };

    let data: DataV2Args = {
      name: "DorkyDino",
      symbol: "DDN",
      uri: "https://imgs.search.brave.com/WPK0HmXUwAU7iNcniENjTT_COkwARXFJ64Edu-PJIhs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLmt5/bS1jZG4uY29tL3Bo/b3Rvcy9pbWFnZXMv/bmV3c2ZlZWQvMDAy/LzYwMS80MDcvYTdi/LnBuZw",
      creators: null,
      collection: null,
      sellerFeeBasisPoints: 1,
      uses: null,
    };

    let args: CreateMetadataAccountV3InstructionArgs = {
      collectionDetails: null,
      data: data,
      isMutable: true,
    };

    let tx = createMetadataAccountV3(umi, {
      ...accounts,
      ...args,
    });

    let result = await tx.sendAndConfirm(umi);
    console.log(bs58.encode(result.signature));
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
