use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{
        MasterEditionAccount,
        Metadata,
        mpl_token_metadata::instructions::{
            ThawDelegatedAccountCpiAccounts,
            ThawDelegatedAccountCpi,
        },
    },
    token::{ revoke, Revoke, Mint, Token, TokenAccount },
};
use crate::error::StakeError;

use crate::state::{ StakeAccount, StakeConfig, UserAccount };

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub mint_ata: Account<'info, TokenAccount>,
    #[account(
        seeds = [
            b"metadata".as_ref(),
            metadata_program.key().as_ref(),
            mint.key().as_ref(),
            b"edition".as_ref(),
        ],
        seeds::program = metadata_program.key(),
        bump
    )]
    pub edition: Account<'info, MasterEditionAccount>,
    #[account(seeds = [b"config".as_ref()], bump = config.bump)]
    pub config: Account<'info, StakeConfig>,
    #[account(
        mut,
        seeds = [b"stake".as_ref(), mint.key().as_ref(), config.key().as_ref()],
        close = user,
        bump=stake_account.bump
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
    pub metadata_program: Program<'info, Metadata>,
}

impl<'info> Unstake<'info> {
    pub fn unstake(&mut self) -> Result<()> {
        let time_elapsed = ((Clock::get()?.unix_timestamp - self.stake_account.staked_at) /
            86400) as u32;
        // Check if the freeze period has passed
        require!(time_elapsed >= self.config.freeze_period, StakeError::FreezePeriodNotPassed);
        // add points to user account
        self.user_account.amount += ((time_elapsed as u32) *
            (self.config.points_per_stake as u32)) as u8;
        let signers_seeds: &[&[&[u8]]] = &[
            &[
                b"stake".as_ref(),
                &self.mint.key().to_bytes()[..],
                &self.config.key().to_bytes()[..],
                &[self.stake_account.bump],
            ],
        ];

        let delegate = &self.stake_account.to_account_info();
        let metadata_program = &self.metadata_program.to_account_info();
        let token_account = &self.mint_ata.to_account_info();
        let edition = &self.edition.to_account_info();
        let mint = &self.mint.to_account_info();
        let token_program = &self.token_program.to_account_info();
        ThawDelegatedAccountCpi::new(metadata_program, ThawDelegatedAccountCpiAccounts {
            delegate,
            token_account,
            edition,
            mint,
            token_program,
        }).invoke_signed(signers_seeds)?;

        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Revoke {
            authority: self.user.to_account_info(),
            source: self.mint_ata.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        revoke(cpi_ctx)?;
        self.user_account.amount -= 1;
        Ok(())
    }
}
