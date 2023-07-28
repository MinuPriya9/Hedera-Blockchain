const {
    Client,
    FileCreateTransaction,
    ContractCreateTransaction,
    PrivateKey,
    AccountId,
    accountCreatorFcn,
    ContractFunctionParameters,
    ContractCallQuery,
    ContractExecuteTransaction,
    Hbar,
  } = require("@hashgraph/sdk");


// Configure accounts and client
const operatorId = "0.0.14635326";
const operatorKey = "3030020100300706052b8104000a04220420c6e263f385009c6a868fdf9c37e1f5a9110e4d07e147e468183f5b413ea2c917";
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
  let contractBytecode = require("../artifacts/contracts/HbarToAndFromContract.sol/hbarToAndFromContract.json");
  const bytecode = contractBytecode.data.bytecode.object;
  //const contractBytecode = fs.readFileSync("../");

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
// async function accountCreatorFcn(pvKey, iBal) {
//     const response = await new AccountCreateTransaction()
//         .setInitialBalance(new Hbar(iBal))
//         .setKey(pvKey.publicKey)
//         .execute(client);
//     const receipt = await response.getReceipt(client);
//     return [receipt.status, receipt.accountId];
// }
// async function contractDeployFcn(bytecode, gasLim) {
//     const contractCreateTx = new ContractCreateFlow().setBytecode(bytecode).setGas(gasLim);
//     const contractCreateSubmit = await contractCreateTx.execute(client);
//     const contractCreateRx = await contractCreateSubmit.getReceipt(client);
//     const contractId = contractCreateRx.contractId;
//     const contractAddress = contractId.toSolidityAddress();
//     return [contractId, contractAddress];
// }

main();