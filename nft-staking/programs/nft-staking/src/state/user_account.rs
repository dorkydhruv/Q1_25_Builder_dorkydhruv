use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub point: u8,
    pub amount: u8,
    pub bump: u8,
}
