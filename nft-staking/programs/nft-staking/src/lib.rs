#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

mod state;
mod context;
mod error;
declare_id!("nyyZQE4W3T3F5zNku2vEeSLHACwGk8QLd9aygo1uSYQ");

use crate::context::*;

#[program]
pub mod nft_staking {
    use super::*;

    pub fn intialize_config(
        ctx: Context<InitializeConfig>,
        points_per_stake: u8,
        max_stake: u8,
        freeze_period: u32
    ) -> Result<()> {
        ctx.accounts.initialize_config(points_per_stake, max_stake, freeze_period, ctx.bumps)
    }

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        ctx.accounts.initialize_user(ctx.bumps)
    }

    pub fn stake(ctx: Context<Stake>) -> Result<()> {
        ctx.accounts.stake(&ctx.bumps)
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        ctx.accounts.unstake()
    }

    pub fn claim_rewards(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.claim_reward()
    }
}
