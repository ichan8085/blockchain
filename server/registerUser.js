'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // 1. Load Connection Profile
        const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // 2. Setup CA & Wallet
        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
        const ca = new FabricCAServices(caURL);

        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // 3. Cek apakah user sudah ada
        const userIdentity = await wallet.get('appUser6');
        if (userIdentity) {
            console.log('An identity for the user "appUser6" already exists in the wallet');
            return;
        }

        // 4. Cek apakah admin ada (Kita butuh admin buat bikin user baru)
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // 5. Build Admin User Context
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // 6. Register & Enroll User Baru
        const secret = await ca.register({
            affiliation: 'org1.department1',
            enrollmentID: 'appUser6',
            role: 'client'
        }, adminUser);

        const enrollment = await ca.enroll({
            enrollmentID: 'appUser6',
            enrollmentSecret: secret
        });

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('appUser6', x509Identity);
        console.log('Successfully registered and enrolled admin user "appUser6" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user "appUser6": ${error}`);
        process.exit(1);
    }
}

main();