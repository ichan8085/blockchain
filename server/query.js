const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function main() {
    try {
        const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser2',
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('certificate');

        // Fetch all data from mychannel (if possible) or just test the evaluation
        // Wait, CertificateContract doesn't have a GetAllAssets function unless we wrote one.
        // Let's just create a test one and query it.
        console.log("Submitting test tx...");
        await contract.submitTransaction('createCertificate', 'TEST/123', 'Test Title', 'Recipient', 'Issuer', '2026-01-01', 'Operator', 'IPFSHASH123');
        console.log("Test tx saved. Querying...");
        const result = await contract.evaluateTransaction('queryCertificate', 'TEST/123');
        console.log("Query result: ", result.toString());
        await gateway.disconnect();
    } catch (error) {
        console.error("Failed to submit transaction:", error);
        process.exit(1);
    }
}
main();
