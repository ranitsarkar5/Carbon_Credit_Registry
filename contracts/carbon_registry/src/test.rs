#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

// Import the compiled asset contract WASM from the shared workspace target directory
mod carbon_asset {
    soroban_sdk::contractimport!(file = "../target/wasm32-unknown-unknown/release/carbon_asset.wasm");
}

#[test]
fn test_registry_flow_basic() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CarbonRegistryContract);
    let client = CarbonRegistryContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let asset_contract = Address::generate(&env);
    
    client.initialize(&admin, &asset_contract);
    
    let auditor = Address::generate(&env);
    client.add_auditor(&auditor);
    
    let owner = Address::generate(&env);
    let project_id = String::from_str(&env, "proj_1");
    
    client.register_project(&owner, &project_id);
    client.verify_data(&auditor, &project_id, &1000);
}

#[test]
fn test_integration_flow() {
    let env = Env::default();
    env.mock_all_auths();

    // 1. Register Carbon Asset contract WASM
    let asset_id = env.register_contract_wasm(None, carbon_asset::WASM);
    let asset_client = carbon_asset::Client::new(&env, &asset_id);

    // 2. Register Carbon Registry contract
    let registry_id = env.register_contract(None, CarbonRegistryContract);
    let registry_client = CarbonRegistryContractClient::new(&env, &registry_id);

    // 3. Initialize both contracts
    let admin = Address::generate(&env);
    
    asset_client.initialize(
        &admin,
        &registry_id,
        &String::from_str(&env, "Carbon Credit Token"),
        &String::from_str(&env, "CCT"),
    );

    registry_client.initialize(&admin, &asset_id);

    // 4. Verify registry getters
    assert_eq!(registry_client.get_admin(), Some(admin.clone()));
    assert_eq!(registry_client.get_asset_contract(), Some(asset_id.clone()));

    // 5. Add Auditor
    let auditor = Address::generate(&env);
    assert!(!registry_client.is_auditor(&auditor));
    registry_client.add_auditor(&auditor);
    assert!(registry_client.is_auditor(&auditor));

    // 6. Register a Project
    let owner = Address::generate(&env);
    let project_id = String::from_str(&env, "solar_proj_99");
    registry_client.register_project(&owner, &project_id);

    // 7. Verify project details on-chain
    let project = registry_client.get_project(&project_id).unwrap();
    assert_eq!(project.owner, owner);
    assert_eq!(project.verified_data, 0);
    assert_eq!(project.minted_credits, 0);

    // 8. Auditor verifies project data (e.g. 5000 kWh solar generated)
    registry_client.verify_data(&auditor, &project_id, &5000);
    let project_updated = registry_client.get_project(&project_id).unwrap();
    assert_eq!(project_updated.verified_data, 5000);

    // 9. Owner triggers credit minting (calls cross-contract mint in Carbon Asset)
    registry_client.mint_credits(&project_id);
    let project_after_mint = registry_client.get_project(&project_id).unwrap();
    assert_eq!(project_after_mint.minted_credits, 5000);

    // 10. Verify owner's carbon credit token balance
    assert_eq!(asset_client.balance(&owner), 5000);
}
