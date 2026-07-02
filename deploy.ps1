Write-Host "Building contracts..."
cd contracts
cargo build --target wasm32-unknown-unknown --release
cd ..

Write-Host "Setting up Stellar CLI network..."
stellar network add --global testnet --rpc-url https://soroban-testnet.stellar.org:443 --network-passphrase "Test SDF Network ; September 2015" 2>$null

Write-Host "Generating deployer account..."
stellar keys generate deployer --network testnet 2>$null
$DEPLOYER_ADDRESS = (stellar keys address deployer).Trim()
Write-Host "Deployer Address: $DEPLOYER_ADDRESS"

Write-Host "Funding deployer account via Friendbot..."
try {
    $fundRes = Invoke-RestMethod -Uri "https://friendbot.stellar.org/?addr=$DEPLOYER_ADDRESS"
    Write-Host "Funding succeeded!"
} catch {
    Write-Host "Funding attempt completed. If account already has funds, proceeding..."
}

Write-Host "Deploying Carbon Asset Contract..."
$ASSET_ID = (stellar contract deploy --wasm contracts/target/wasm32-unknown-unknown/release/carbon_asset.wasm --source deployer --network testnet).Trim()
Write-Host "Carbon Asset Deployed at: $ASSET_ID"

Write-Host "Deploying Carbon Registry Contract..."
$REGISTRY_ID = (stellar contract deploy --wasm contracts/target/wasm32-unknown-unknown/release/carbon_registry.wasm --source deployer --network testnet).Trim()
Write-Host "Carbon Registry Deployed at: $REGISTRY_ID"

Write-Host "Initializing Carbon Asset..."
stellar contract invoke --id $ASSET_ID --source deployer --network testnet -- initialize --admin $DEPLOYER_ADDRESS --registry $REGISTRY_ID --name "Carbon Credit Token" --symbol "CCT"

Write-Host "Initializing Carbon Registry..."
stellar contract invoke --id $REGISTRY_ID --source deployer --network testnet -- initialize --admin $DEPLOYER_ADDRESS --asset_contract $ASSET_ID

Write-Host "Deployment and Initialization Complete!"
Write-Host "ASSET_CONTRACT_ID=$ASSET_ID"
Write-Host "REGISTRY_CONTRACT_ID=$REGISTRY_ID"
