use anchor_lang::prelude::*;
mod instructions;
mod state;
declare_id!("BXUpYnT6hP61Yr5TjECydorEkySMKmiySqdx3eUZWJKg");
use crate::instructions::*;
#[program]
pub mod amm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee: u16, seeds: u64) -> Result<()> {
        ctx.accounts.initialize(fee, seeds, ctx.bumps)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64, max_x: u64, max_y: u64) -> Result<()> {
        ctx.accounts.deposit(amount, max_x, max_y)
    }
}
