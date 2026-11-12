
import fs from 'fs';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    // Read Solidity compiler output
    const outputPath = './build/output.json';

    if (!fs.existsSync(outputPath)) {
        throw new Error('build/output.json not found');
    }

    const output = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

    // Select the actual compiled contract
    const contractName = 'Helloworld';
    const sourceFile = 'contracts/HelloWorld.sol';

    const contractData = output.contracts?.[sourceFile]?.[contractName];

    if (!contractData) {
        throw new Error(`Contract ${contractName} not found`);
    }

    const abi = contractData.abi;
    const bytecode = contractData.evm.bytecode.object;

    if (!bytecode) {
        throw new Error('Contract bytecode is empty');
    }

    // Validate environment variables
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const rawKey = (process.env.SEPOLIA_PRIVATE_KEY || '')
        .trim()
        .replace(/^["']|["']$/g, '');

    if (!rpcUrl || !rawKey) {
        throw new Error('Missing Sepolia RPC URL or private key');
    }

    const privateKey = rawKey.startsWith('0x')
        ? rawKey
        : `0x${rawKey}`;

    if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
        throw new Error('Invalid private key format');
    }

    // Connect to Sepolia
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log('Deploying with account:', wallet.address);

    const network = await provider.getNetwork();

    if (network.chainId !== 11155111n) {
        throw new Error('Connected network is not Sepolia');
    }

    const balance = await provider.getBalance(wallet.address);
    console.log('Wallet balance:', ethers.formatEther(balance), 'ETH');

    // Constructor requires one string argument
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);

    console.log('Deploying Helloworld...');

    const contract = await factory.deploy(
        'Hello from Sepolia!'
    );

    await contract.waitForDeployment();

    const address = await contract.getAddress();
    const tx = contract.deploymentTransaction();

    console.log('Contract deployed:', address);
    console.log('Transaction hash:', tx.hash);
    console.log(`Etherscan: https://sepolia.etherscan.io/address/${address}`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
