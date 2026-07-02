#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, symbol_short};

// The asset contract interface we will call
mod asset_contract {
    soroban_sdk::contractimport!(
        file = "../target/wasm32v1-none/release/carbon_asset.wasm"
    );
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    AssetContract,
    Auditor(Address),
    Project(String), // String is project ID
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Project {
    pub owner: Address,
    pub verified_data: i128, // e.g. kWh of solar generated
    pub minted_credits: i128,
}

#[contract]
pub struct CarbonRegistryContract;

#[contractimpl]
impl CarbonRegistryContract {
    pub fn initialize(env: Env, admin: Address, asset_contract: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized")
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::AssetContract, &asset_contract);
    }

    pub fn add_auditor(env: Env, auditor: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Auditor(auditor), &true);
    }

    pub fn register_project(env: Env, owner: Address, project_id: String) {
        owner.require_auth();
        let key = DataKey::Project(project_id.clone());
        if env.storage().persistent().has(&key) {
            panic!("project already exists");
        }
        
        let project = Project {
            owner: owner.clone(),
            verified_data: 0,
            minted_credits: 0,
        };
        env.storage().persistent().set(&key, &project);
        
        env.events().publish((symbol_short!("project"), symbol_short!("register")), (project_id, owner));
    }

    pub fn verify_data(env: Env, auditor: Address, project_id: String, amount: i128) {
        auditor.require_auth();
        let is_auditor: bool = env.storage().persistent().get(&DataKey::Auditor(auditor.clone())).unwrap_or(false);
        if !is_auditor {
            panic!("not an auditor");
        }

        let key = DataKey::Project(project_id.clone());
        let mut project: Project = env.storage().persistent().get(&key).expect("project not found");
        
        project.verified_data += amount;
        env.storage().persistent().set(&key, &project);
        
        env.events().publish((symbol_short!("data"), symbol_short!("verify")), (project_id, amount));
    }

    pub fn mint_credits(env: Env, project_id: String) {
        let key = DataKey::Project(project_id.clone());
        let mut project: Project = env.storage().persistent().get(&key).expect("project not found");
        
        project.owner.require_auth();
        
        // 1 verified unit = 1 credit for simplicity
        let mintable = project.verified_data - project.minted_credits;
        if mintable <= 0 {
            panic!("no credits to mint");
        }
        
        project.minted_credits += mintable;
        env.storage().persistent().set(&key, &project);

        let asset_contract: Address = env.storage().instance().get(&DataKey::AssetContract).unwrap();
        let client = asset_contract::Client::new(&env, &asset_contract);
        
        // Cross contract call
        client.mint(&project.owner, &mintable);
        
        env.events().publish((symbol_short!("credits"), symbol_short!("mint")), (project_id, mintable));
    }

    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }

    pub fn get_asset_contract(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::AssetContract)
    }

    pub fn is_auditor(env: Env, auditor: Address) -> bool {
        env.storage().persistent().get(&DataKey::Auditor(auditor)).unwrap_or(false)
    }

    pub fn get_project(env: Env, project_id: String) -> Option<Project> {
        env.storage().persistent().get(&DataKey::Project(project_id))
    }
}

#[cfg(test)]
mod test;
