use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{
        MasterEditionAccount,
        Metadata,
        MetadataAccount,
        mpl_token_metadata::instructions::{
            FreezeDelegatedAccountCpi,
            FreezeDelegatedAccountCpiAccounts,
        },
    },
    token::{ approve, Approve, Mint, Token, TokenAccount },
};

use crate::state::{ StakeAccount, StakeConfig, UserAccount };
use crate::error::StakeError;

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub collection_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub mint_ata: Account<'info, TokenAccount>,
    #[account(
        seeds = [b"metadata".as_ref(), metadata_program.key().as_ref(), mint.key().as_ref()],
        seeds::program = metadata_program.key(),
        bump,
        constraint = metadata.collection.as_ref().unwrap().key.as_ref() ==
        collection_mint.key().as_ref(),
        constraint = metadata.collection.as_ref().unwrap().verified == true
    )]
    pub metadata: Account<'info, MetadataAccount>,
    #[account(
        seeds = [b"metadata".as_ref(), metadata_program.key().as_ref(), mint.key().as_ref()],
        seeds::program = metadata_program.key(),
        bump
    )]
    pub edition: Account<'info, MasterEditionAccount>,
    pub metadata_program: Program<'info, Metadata>,
    #[account(seeds = [b"config".as_ref()], bump = config.bump)]
    pub config: Account<'info, StakeConfig>,
    #[account(
        init,
        payer = user,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake".as_ref(), mint.key().as_ref(), config.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
    #[account(
        mut,
        seeds=[b"user".as_ref(),user.key().as_ref()],
        bump=user_account.bump,
    )]
    pub user_account: Account<'info, UserAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Stake<'info> {
    pub fn stake(&mut self, bumps: &StakeBumps) -> Result<()> {
        require!(
            self.user_account.amount < self.config.max_stake,
            StakeError::MaxStakeAmountExceeded
        );
        self.stake_account.set_inner(StakeAccount {
            owner: self.user.key(),
            mint: self.mint.key(),
            staked_at: Clock::get()?.unix_timestamp,
            bump: bumps.stake_account,
        });
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Approve {
            authority: self.user.to_account_info(),
            delegate: self.stake_account.to_account_info(),
            to: self.mint_ata.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        approve(cpi_ctx, 1)?;

        let seeds: &[&[&[u8]]] = &[
            &[
                b"stake".as_ref(),
                self.mint.to_account_info().key.as_ref(),
                self.config.to_account_info().key.as_ref(),
                &[bumps.stake_account],
            ],
        ];
        let delegate = &self.stake_account.to_account_info();
        let token_account = &self.mint_ata.to_account_info();
        let edition = &self.edition.to_account_info();
        let mint = &self.mint.to_account_info();
        let token_program = &self.token_program.to_account_info();
        let metadata_program = &self.metadata_program.to_account_info();
        let cpi_accounts = FreezeDelegatedAccountCpiAccounts {
            delegate,
            token_account,
            edition,
            mint,
            token_program,
        };
        FreezeDelegatedAccountCpi::new(metadata_program, cpi_accounts).invoke_signed(seeds)?;
        self.user_account.amount += 1;
        Ok(())
    }
}
