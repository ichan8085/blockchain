#!/bin/bash
export PATH=$PATH:/home/deanwsl/fabric-samples-main/bin

docker exec peer0.org1.example.com cat /etc/hyperledger/fabric/tls/ca.crt > /tmp/peer-tls-ca-from-container.pem
docker exec peer0.org2.example.com cat /etc/hyperledger/fabric/tls/ca.crt > /tmp/peer2-tls-ca.pem
docker exec orderer.example.com cat /var/hyperledger/orderer/tls/ca.crt > /tmp/orderer-tls-ca.pem

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

