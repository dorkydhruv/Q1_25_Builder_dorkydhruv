import * as anchor from "@coral-xyz/anchor";
import {
  createNft,
  findMasterEditionPda,
  findMetadataPda,
  mplTokenMetadata,
  verifySizedCollectionItem,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  KeypairSigner,
  PublicKey,
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
} from "@metaplex-foundation/umi";
import { Program } from "@coral-xyz/anchor";
import { NftStaking } from "../target/types/nft_staking";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { assert } from "chai";

describe("nft-staking", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftStaking as Program<NftStaking>;

  const umi = createUmi(provider.connection);

  const payer = provider.wallet as NodeWallet;

  let nftMint: KeypairSigner = generateSigner(umi);
  let collectionMint: KeypairSigner = generateSigner(umi);

  const creatorWallet = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(payer.payer.secretKey)
  );
  const creator = createSignerFromKeypair(umi, creatorWallet);
  umi.use(keypairIdentity(creator));
  umi.use(mplTokenMetadata());

  const collection: anchor.web3.PublicKey = new anchor.web3.PublicKey(
    collectionMint.publicKey.toString()
  );

  const config = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  )[0];

  const rewardsMint = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("rewards"), config.toBuffer()],
    program.programId
  )[0];

  const userAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user"), provider.publicKey.toBuffer()],
    program.programId
  )[0];

  const stakeAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("stake"),
      new anchor.web3.PublicKey(nftMint.publicKey as PublicKey).toBuffer(),
      config.toBuffer(),
    ],
    program.programId
  )[0];

  it("Mint Collection NFT", async () => {
    await createNft(umi, {
      mint: collectionMint,
      name: "GM",
      symbol: "GM",
      uri: "https://arweave.net/123",
      sellerFeeBasisPoints: percentAmount(5.5),
      creators: null,
      collectionDetails: {
        __kind: "V1",
        size: 10,
      },
    }).sendAndConfirm(umi);
    console.log(
      `Created Collection NFT: ${collectionMint.publicKey.toString()}`
    );
  });

  it("Mint NFT", async () => {
    await createNft(umi, {
      mint: nftMint,
      name: "GM",
      symbol: "GM",
      uri: "https://arweave.net/123",
      sellerFeeBasisPoints: percentAmount(5.5),
      creators: null,
      collection: {
        verified: false,
        key: collectionMint.publicKey,
      },
    }).sendAndConfirm(umi);
    console.log(`Created NFT: ${nftMint.publicKey.toString()}`);
  });

  it("verify collection", async () => {
    const collectionMetadata = findMetadataPda(umi, {
      mint: collectionMint.publicKey,
    });
    const collectionMasterEdition = findMasterEditionPda(umi, {
      mint: collectionMint.publicKey,
    });

    const nftMetadata = findMetadataPda(umi, { mint: nftMint.publicKey });
    await verifySizedCollectionItem(umi, {
      metadata: nftMetadata,
      collectionAuthority: creator,
      collectionMint: collectionMint.publicKey,
      collection: collectionMetadata,
      collectionMasterEditionAccount: collectionMasterEdition,
    }).sendAndConfirm(umi);
    console.log("Collection NFT Verified!");
  });

  it("init config", async () => {
    const tx = await program.methods
      .intializeConfig(10, 10, 0)
      .accountsPartial({
        admin: provider.wallet.publicKey,
        config,
        rewardsMint,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    const configAccount = await program.account.stakeConfig.fetch(config);
    assert.equal(configAccount.freezePeriod, 0);
  });

  it("init user", async () => {
    const tx = await program.methods
      .initializeUser()
      .accountsPartial({
        userAccount,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    const user = await program.account.userAccount.fetch(userAccount);
    assert.equal(user.amount, 0);
  });

  it("stake NFT", async () => {
    const tx = await program.methods
      .stake()
      .accountsPartial({
        userAccount,
        stakeAccount,
        collectionMint: collectionMint.publicKey,
        mint: nftMint.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        config,
        mintAta: getAssociatedTokenAddressSync(
          new anchor.web3.PublicKey(nftMint.publicKey as PublicKey),
          provider.wallet.publicKey
        ),
        metadata: new anchor.web3.PublicKey(
          findMetadataPda(umi, { mint: nftMint.publicKey })[0]
        ),
        edition: new anchor.web3.PublicKey(
          findMasterEditionPda(umi, { mint: nftMint.publicKey })[0]
        ),
      })
      .rpc();
    const stake = await program.account.stakeAccount.fetch(stakeAccount);
    assert.equal(stake.owner.toBase58(), provider.wallet.publicKey.toBase58());
  });

  it("unstake", async () => {
    const tx = await program.methods
      .unstake()
      .accountsPartial({
        config,
        edition: new anchor.web3.PublicKey(
          findMasterEditionPda(umi, { mint: nftMint.publicKey })[0]
        ),
        mint: nftMint.publicKey,
        mintAta: getAssociatedTokenAddressSync(
          new anchor.web3.PublicKey(nftMint.publicKey as PublicKey),
          provider.wallet.publicKey
        ),
        stakeAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        user: provider.wallet.publicKey,
        userAccount,
      })
      .rpc();
    try {
      await program.account.stakeAccount.fetch(stakeAccount);
    } catch (e) {
      assert.equal(
        e.message,
        `Account does not exist or has no data ${stakeAccount.toBase58()}`
      );
    }
  });

  it("claim rewards", async () => {
    const tx = await program.methods
      .claimRewards()
      .accountsPartial({
        config,
        rewardsMint,
        user: provider.wallet.publicKey,
        userAccount,
        rewardsAta: getAssociatedTokenAddressSync(
          new anchor.web3.PublicKey(rewardsMint),
          provider.wallet.publicKey
        ),
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    const user = await program.account.userAccount.fetch(userAccount);
    assert.equal(user.point, 0);
  });
});
