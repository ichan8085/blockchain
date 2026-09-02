#!/bin/bash
set -e

export PATH=$PATH:/mnt/d/aplikasi-sertifikat/fabric-samples/bin
export FABRIC_CFG_PATH=/mnt/d/aplikasi-sertifikat/fabric-samples/config

FABRIC_DIR="/mnt/d/aplikasi-sertifikat/fabric-samples/test-network"
BLOCKCHAIN_DIR="/mnt/d/aplikasi-sertifikat/app/blockchain"
SERVER_DIR="/mnt/d/aplikasi-sertifikat/app/server"
USER=$(whoami)

echo "========================================"
echo " SETUP FABRIC NETWORK FROM SCRATCH"
echo "========================================"

# Step 1: Hapus network lama jika ada
echo "[1/7] Membersihkan network lama..."
cd "$FABRIC_DIR"
./network.sh down 2>/dev/null || true

# Step 2: Buat network + channel + CA
echo "[2/7] Membuat network dan channel..."
./network.sh up createChannel -ca -c mychannel

# Step 3: Ambil TLS cert
echo "[3/7] Mengambil TLS certificates..."
sleep 3
docker exec peer0.org1.example.com cat /etc/hyperledger/fabric/tls/ca.crt > /tmp/peer-tls-ca-from-container.pem
docker exec peer0.org2.example.com cat /etc/hyperledger/fabric/tls/ca.crt > /tmp/peer2-tls-ca.pem
docker exec orderer.example.com cat /var/hyperledger/orderer/tls/ca.crt > /tmp/orderer-tls-ca.pem

# Step 4: Enroll admin MSP
echo "[4/7] Enrolling admin MSP..."
rm -rf /tmp/org1-admin-msp /tmp/org2-admin-msp

fabric-ca-client enroll -u https://org1admin:org1adminpw@localhost:7054 --caname ca-org1 --tls.certfiles /tmp/peer-tls-ca-from-container.pem --mspdir /tmp/org1-admin-msp

cat > /tmp/org1-admin-msp/config.yaml << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: orderer
EOF

fabric-ca-client enroll -u https://org2admin:org2adminpw@localhost:8054 --caname ca-org2 --tls.certfiles /tmp/peer2-tls-ca.pem --mspdir /tmp/org2-admin-msp

cat > /tmp/org2-admin-msp/config.yaml << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-org2.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-org2.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-org2.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-org2.pem
    OrganizationalUnitIdentifier: orderer
EOF

# Step 5: Package dan install chaincode
echo "[5/7] Deploy chaincode..."
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=/tmp/peer-tls-ca-from-container.pem
export CORE_PEER_MSPCONFIGPATH=/tmp/org1-admin-msp
export CORE_PEER_ADDRESS=localhost:7051

cd "$FABRIC_DIR"
peer lifecycle chaincode package certificate.tar.gz --path "$BLOCKCHAIN_DIR" --lang node --label certificate_1.0
peer lifecycle chaincode install certificate.tar.gz

PKG_ID=$(peer lifecycle chaincode queryinstalled | grep certificate_1.0 | awk -F", " "{print \$1}" | awk -F"ID: " "{print \$2}")
echo "Package ID: $PKG_ID"

peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile /tmp/orderer-tls-ca.pem --channelID mychannel --name certificate --version 1.0 --package-id $PKG_ID --sequence 1

export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_TLS_ROOTCERT_FILE=/tmp/peer2-tls-ca.pem
export CORE_PEER_MSPCONFIGPATH=/tmp/org2-admin-msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode install certificate.tar.gz
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile /tmp/orderer-tls-ca.pem --channelID mychannel --name certificate --version 1.0 --package-id $PKG_ID --sequence 1

peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile /tmp/orderer-tls-ca.pem --channelID mychannel --name certificate --version 1.0 --sequence 1 --peerAddresses localhost:7051 --tlsRootCertFiles /tmp/peer-tls-ca-from-container.pem --peerAddresses localhost:9051 --tlsRootCertFiles /tmp/peer2-tls-ca.pem

# Step 6: Update connection-org1.json TLS cert
echo "[6/7] Update connection profile..."
NEW_CERT=$(awk "NF {printf "%s\\n", \$0} END {print ""}" /tmp/peer-tls-ca-from-container.pem)
node -e "
const fs = require('fs');
const path = '$SERVER_DIR/config/connection-org1.json';
const ccp = JSON.parse(fs.readFileSync(path, 'utf8'));
ccp.peers['peer0.org1.example.com'].tlsCACerts.pem = process.env.NEW_CERT;
ccp.peers['peer0.org1.example.com'].url = 'grpcs://localhost:7051';
ccp.certificateAuthorities['ca.org1.example.com'].url = 'https://localhost:7054';
fs.writeFileSync(path, JSON.stringify(ccp, null, 4));
console.log('connection-org1.json updated');
" NEW_CERT="$NEW_CERT"

# Step 7: Enroll appUser
echo "[7/7] Enrolling appUser..."
cd "$SERVER_DIR"
rm -f wallet/admin.id wallet/appUser*.id
node -e "
const {Wallets} = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

async function main() {
    const ccp = JSON.parse(fs.readFileSync(path.resolve(__dirname,'config','connection-org1.json'),'utf8'));
    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const ca = new FabricCAServices(caInfo.url, {trustedRoots: caInfo.tlsCACerts.pem, verify: false}, caInfo.caName);
    const wallet = await Wallets.newFileSystemWallet(path.join(__dirname,'wallet'));

    const adminEnroll = await ca.enroll({enrollmentID:'admin', enrollmentSecret:'adminpw'});
    await wallet.put('admin', {
        credentials: { certificate: adminEnroll.certificate, privateKey: adminEnroll.key.toBytes() },
        mspId: 'Org1MSP', type: 'X.509'
    });
    console.log('admin enrolled');

    const adminProvider = wallet.getProviderRegistry().getProvider('X.509');
    const adminUser = await adminProvider.getUserContext({
        credentials: { certificate: adminEnroll.certificate, privateKey: adminEnroll.key.toBytes() },
        mspId: 'Org1MSP', type: 'X.509'
    }, 'admin');

    const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: 'appUser', role: 'client' }, adminUser);
    const userEnroll = await ca.enroll({enrollmentID:'appUser', enrollmentSecret: secret});
    await wallet.put('appUser', {
        credentials: { certificate: userEnroll.certificate, privateKey: userEnroll.key.toBytes() },
        mspId: 'Org1MSP', type: 'X.509'
    });
    console.log('appUser enrolled');
}
main().catch(e => { console.error(e.message); process.exit(1); });
"

echo ""
echo "========================================"
echo " SETUP SELESAI"
echo " Jalankan server: node app.js"
echo "========================================"
