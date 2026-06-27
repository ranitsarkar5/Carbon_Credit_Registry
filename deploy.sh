#!/bin/bash
set -e

echo "Building contracts..."
cd contracts
cargo build --target wasm32-unknown-unknown --release

echo "Setting up Stellar CLI network..."
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015" || true

echo "Generating deployer account..."
stellar keys generate deployer --network testnet || true

echo "Deploying Carbon Asset Contract..."
ASSET_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/carbon_asset.wasm \
  --source deployer \
  --network testnet)

echo "Carbon Asset Deployed at: $ASSET_ID"

echo "Deploying Carbon Registry Contract..."
REGISTRY_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/carbon_registry.wasm \
  --source deployer \
  --network testnet)

echo "Carbon Registry Deployed at: $REGISTRY_ID"

echo "Initializing Carbon Asset..."
stellar contract invoke \
  --id $ASSET_ID \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin $(stellar keys address deployer) \
  --registry $REGISTRY_ID \
  --name "Carbon Credit Token" \
  --symbol "CCT"

echo "Initializing Carbon Registry..."
stellar contract invoke \
  --id $REGISTRY_ID \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin $(stellar keys address deployer) \
  --asset_contract $ASSET_ID

echo "Deployment and Initialization Complete!"
echo "ASSET_CONTRACT_ID=$ASSET_ID"
echo "REGISTRY_CONTRACT_ID=$REGISTRY_ID"
