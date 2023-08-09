console.clear();
const {
	Client,
	PrivateKey,
	Hbar,
	TransferTransaction,
	AccountId,
	TransactionRecordQuery,
} = require("@hashgraph/sdk");
require("dotenv").config();
const axios = require("axios");
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
	// Generate ECDSA key pair
	console.log("- Generating a new key pair... \n");
	const newPrivateKey = PrivateKey.generateECDSA();
	const newPublicKey = newPrivateKey.publicKey;
	const newAliasAccountId = newPublicKey.toAccountId(0, 0);

	console.log(`- New account alias ID: ${newAliasAccountId} \n`);
	console.log(`- New private key (Hedera): ${newPrivateKey} \n`);
	console.log(`- New public key (Hedera): ${newPublicKey} \n`);
	console.log(`- New private key (RAW EVM): 0x${newPrivateKey.toStringRaw()} \n`);
	console.log(`- New public key (RAW): 0x${newPublicKey.toStringRaw()} \n`);
	console.log(`- New public key (EVM): 0x${newPublicKey.toEthereumAddress()} \n\n`);

	// Transfer HBAR to newAliasAccountId to auto-create the new account
	// Get account information from a transaction record query
	const [txReceipt, txRecQuery] = await autoCreateAccountFcn(operatorId, newAliasAccountId, 100);
	console.log(`- HBAR Transfer to new account: ${txReceipt.status} \n\n`);
	console.log(`- Parent transaction ID: ${txRecQuery.transactionId} \n`);
	console.log(`- Child transaction ID: ${txRecQuery.children[0].transactionId.toString()} \n`);
	console.log(
		`- New account ID (from RECORD query): ${txRecQuery.children[0].receipt.accountId.toString()} \n`
	);

	// Get account information from a mirror node query
	const mirrorQueryResult = await mirrorQueryFcn(newPublicKey);
	console.log(
		`- New account ID (from MIRROR query): ${mirrorQueryResult.data?.accounts[0].account} \n`
	);
}

async function autoCreateAccountFcn(senderAccountId, receiverAccountId, hbarAmount) {
	//Transfer hbar to the account alias to auto-create account
	const transferToAliasTx = new TransferTransaction()
		.addHbarTransfer(senderAccountId, new Hbar(-hbarAmount))
		.addHbarTransfer(receiverAccountId, new Hbar(hbarAmount))
		.freezeWith(client);
	const transferToAliasSign = await transferToAliasTx.sign(operatorKey);
	const transferToAliasSubmit = await transferToAliasSign.execute(client);
	const transferToAliasRx = await transferToAliasSubmit.getReceipt(client);

	// Get a transaction record and query the record to get information about the account creation
	const transferToAliasRec = await transferToAliasSubmit.getRecord(client);
	const txRecordQuery = await new TransactionRecordQuery()
		.setTransactionId(transferToAliasRec.transactionId)
		.setIncludeChildren(true)
		.execute(client);
	return [transferToAliasRx, txRecordQuery];
}

async function mirrorQueryFcn(publicKey) {
	// Query a mirror node for information about the account creation
	await delay(10000); // Wait for 10 seconds before querying account id
	const mirrorNodeUrl = "https://testnet.mirrornode.hedera.com/api/v1/";
	const mQuery = await axios.get(
		mirrorNodeUrl + "accounts?account.publickey=" + publicKey.toStringRaw()
	);
	return mQuery;
}

main();

// - Generating a new key pair... 

// - New account alias ID: 0.0.302d300706052b8104000a03220002dc2c0c751c22ea093e01452c56928008229b36c838565a4eb307e20616fd647c 

// - New private key (Hedera): 3030020100300706052b8104000a0422042066a1ad8f9ed6192146445c41f7fa635eb34447f260e3ccc943e17e587c0c3ea8 

// - New public key (Hedera): 302d300706052b8104000a03220002dc2c0c751c22ea093e01452c56928008229b36c838565a4eb307e20616fd647c

// - New private key (RAW EVM): 0x66a1ad8f9ed6192146445c41f7fa635eb34447f260e3ccc943e17e587c0c3ea8 

// - New public key (RAW): 0x02dc2c0c751c22ea093e01452c56928008229b36c838565a4eb307e20616fd647c

// - New public key (EVM): 0x0a75aa37a77a6e6fd5ac14cf274ae80be2f4dcf4 


// - HBAR Transfer to new account: SUCCESS 


// - Parent transaction ID: 0.0.99094@1691477531.265354565

// - Child transaction ID: 0.0.99094@1691477531.265354565/1

// - New account ID (from RECORD query): 0.0.459995

// - New account ID (from MIRROR query): 0.0.459995 



