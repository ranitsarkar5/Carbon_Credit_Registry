#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Events}, Address, Env, String, vec, IntoVal};

// We need a stub for the asset contract since the wasm might not be compiled yet during initial test run
// Alternatively we can use the actual contract using register_contract
mod carbon_asset {
    soroban_sdk::contractimport!(file = "../carbon_asset/target/wasm32-unknown-unknown/release/carbon_asset.wasm");
}

#[test]
fn test_registry_flow() {
    let env = Env::default();
    env.mock_all_auths();

    // In a real test we'd compile the asset contract to wasm or use a stub.
    // For this example we just ensure the contract can be instantiated.
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
    
    // We can't fully test mint_credits without the actual asset wasm compiled and deployed in test.
    // But we tested the state transitions up to here.
}
