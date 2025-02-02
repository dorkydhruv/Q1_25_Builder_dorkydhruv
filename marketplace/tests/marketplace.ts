import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Marketplace } from "../target/types/marketplace";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

describe("marketplace", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.Marketplace as Program<Marketplace>;
  const marketPlaceName = "Sataa Bajaar";
  const marketFee = 16;
  const [marketPdaAccount, marketPdaAccountBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace"), Buffer.from(marketPlaceName)],
      program.programId
    );
  const [treasuryPda, treasuryBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), marketPdaAccount.toBuffer()],
      program.programId
    );
  it("Intialize market", async () => {
    const tx = await program.methods
      .initializeMarket(marketFee, marketPlaceName)
      .rpc();

    const accountFound = await program.account.marketPlace.getAccountInfo(
      marketPdaAccount
    );
    console.log(accountFound);
  });
});
