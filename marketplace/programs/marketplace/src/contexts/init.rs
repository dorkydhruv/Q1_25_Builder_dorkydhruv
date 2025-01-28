use anchor_lang::prelude::*;
use anchor_spl::token_interface::{ Mint, TokenInterface };
use crate::state::MarketPlace;
use crate::error::MarketplaceError;
#[derive(Accounts)]
#[instruction(name:String)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        seeds = [b"marketplace", name.as_str().as_bytes()],
        bump,
        space = 8 + MarketPlace::INIT_SPACE
    )]
    pub marketplace: Account<'info, MarketPlace>,
    #[account(seeds = [b"treasury", marketplace.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,
    #[account(
        init,
        payer = admin,
        seeds = [b"rewards", marketplace.key().as_ref()],
        bump,
        mint::authority = marketplace,
        mint::decimals = 6
    )]
    pub rewards_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn init(&mut self, fee: u16, name: String, bumps: InitializeBumps) -> Result<()> {
        require!(name.len() <= 32, MarketplaceError::NameTooLong);
        self.marketplace.set_inner(MarketPlace {
            admin: self.admin.key(),
            fee,
            bump: bumps.marketplace,
            treasury_bump: bumps.treasury,
            rewards_bump: bumps.rewards_mint,
            name,
        });
        Ok(())
    }
}
