#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_mint_and_burn() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CarbonAssetContract);
    let client = CarbonAssetContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let registry = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(
        &admin,
        &registry,
        &String::from_str(&env, "Carbon Credit"),
        &String::from_str(&env, "CCT"),
    );

    assert_eq!(client.balance(&user), 0);

    client.mint(&user, &1000);
    assert_eq!(client.balance(&user), 1000);

    client.burn(&user, &500);
    assert_eq!(client.balance(&user), 500);
}
