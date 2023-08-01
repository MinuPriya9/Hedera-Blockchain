const {
  Client,
  FileCreateTransaction,
  ContractCreateTransaction,
  PrivateKey,
  AccountCreateTransaction,
  AccountId,
  Hbar,
} = require("@hashgraph/sdk");

const fs = require('fs');



// Configure accounts and client
const operatorId = "0.0.99094";
const operatorKey =
  "3030020100300706052b8104000a042204208e5eef735c8541a3b714b6d1204deb19a5df21f118ff750d689cd894b4d33f8a";
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
  // Create other necessary accounts
  console.log(`\n- Creating accounts...`);
  const initBalance = 100;
  const treasuryKey = PrivateKey.generateED25519();
  const [treasuryAccSt, treasuryId] = await accountCreatorFcn(
    treasuryKey,
    initBalance
  );
  console.log(
    `- Created Treasury account ${treasuryId} that has a balance of ${initBalance} ℏ`
  );

  const aliceKey = PrivateKey.generateED25519();
  const [aliceAccSt, aliceId] = await accountCreatorFcn(aliceKey, initBalance);
  console.log(
    `- Created Alice's account ${aliceId} that has a balance of ${initBalance} ℏ`
  );

  // Import the compiled contract bytecode
  const contractBytecode = fs.readFileSync("hbarToAndFromContract.bin");

  // Deploy the smart contract on Hedera
  console.log(`\n- Deploying contract...`);
  let gasLimit = 100000;

  const [contractId, contractAddress] = await contractDeployFcn(
    contractBytecode,
    gasLimit
  );
  console.log(`- The smart contract ID is: ${contractId}`);
  console.log(
    `- The smart contract ID in Solidity format is: ${contractAddress}`
  );

  const tokenId = AccountId.fromString("0.0.47931765");
  console.log(`\n- Token ID (for association with contract later): ${tokenId}`);

}

async function accountCreatorFcn(pvKey, iBal) {
  const response = await new AccountCreateTransaction()
    .setInitialBalance(new Hbar(iBal))
    .setKey(pvKey.publicKey)
    .execute(client);
  const receipt = await response.getReceipt(client);
  return [receipt.status, receipt.accountId];
}

async function contractDeployFcn(bytecode, gasLim) {
  const contractCreateTx = await new ContractCreateTransaction()
    .setBytecode(bytecode)
    .setGas(gasLim)
    .execute(client);

  const contractCreateRx = await contractCreateTx.getReceipt(client);
  const contractId = contractCreateRx.contractId;
  const contractAddress = contractId.toSolidityAddress();
  return [contractId, contractAddress];
}

main();
