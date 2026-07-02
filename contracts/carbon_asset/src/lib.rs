#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};
use soroban_token_sdk::{metadata::TokenMetadata, TokenUtils};

#[contracttype]
pub enum DataKey {
    Admin,
    Registry,
}

#[contract]
pub struct CarbonAssetContract;

#[contractimpl]
impl CarbonAssetContract {
    pub fn initialize(env: Env, admin: Address, registry: Address, name: String, symbol: String) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized")
        }
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Registry, &registry);
        
        let token_utils = TokenUtils::new(&env);
        token_utils.metadata().set_metadata(&TokenMetadata {
            decimal: 7,
            name,
            symbol,
        });
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let registry: Address = env.storage().instance().get(&DataKey::Registry).unwrap();
        // Only the registry contract can mint
        registry.require_auth();

        let token_utils = TokenUtils::new(&env);
        // Mint tokens directly to the recipient
        token_utils.events().mint(registry, to.clone(), amount);
        
        let mut balance = Self::balance(env.clone(), to.clone());
        balance += amount;
        env.storage().persistent().set(&to, &balance);
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();

        let mut balance = Self::balance(env.clone(), from.clone());
        if balance < amount {
            panic!("insufficient balance")
        }
        balance -= amount;
        env.storage().persistent().set(&from, &balance);
        
        let token_utils = TokenUtils::new(&env);
        token_utils.events().burn(from, amount);
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        env.storage().persistent().get(&id).unwrap_or(0)
    }

    pub fn name(env: Env) -> String {
        let token_utils = TokenUtils::new(&env);
        token_utils.metadata().get_metadata().name
    }

    pub fn symbol(env: Env) -> String {
        let token_utils = TokenUtils::new(&env);
        token_utils.metadata().get_metadata().symbol
    }
}

#[cfg(test)]
mod test;
