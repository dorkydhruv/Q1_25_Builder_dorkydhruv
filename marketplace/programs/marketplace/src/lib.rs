#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("7967YUxKKAm7hLEgJmLDLMn3upC9tijeDqK454sDnc8m");
mod state;
mod contexts;
mod error;

use crate::contexts::*;

#[program]
pub mod marketplace {
    use super::*;

    pub fn initialize_market(ctx: Context<Initialize>, fee: u16, name: String) -> Result<()> {
        ctx.accounts.init(fee, name, ctx.bumps)
    }

    pub fn list(ctx: Context<List>, price: u64) -> Result<()> {
        ctx.accounts.create_listing(price, ctx.bumps)?;
        ctx.accounts.deposit_nft()
    }

    pub fn delist(ctx: Context<Delist>) -> Result<()> {
        ctx.accounts.refund_nft()?;
        ctx.accounts.close_vault()
    }

    pub fn purchase(ctx: Context<Purchase>) -> Result<()> {
        ctx.accounts.transfer_sol()?;
        ctx.accounts.transfer_nft()?;
        ctx.accounts.close_listing()
    }
}
