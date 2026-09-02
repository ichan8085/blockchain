const grpc = require('@grpc/grpc-js');
const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
const pem = ccp.peers['peer0.org1.example.com'].tlsCACerts.pem;

const credentials = grpc.credentials.createSsl(Buffer.from(pem));

console.log('Connecting to localhost:7051...');
const client = new grpc.Client('localhost:7051', credentials, {
    'grpc.ssl_target_name_override': 'peer0.org1.example.com',
    'grpc.default_authority': 'peer0.org1.example.com'
});

const deadline = new Date();
deadline.setSeconds(deadline.getSeconds() + 10); // 10 seconds timeout

client.waitForReady(deadline, (error) => {
    if (error) {
        console.error('Failed to connect:', error);
    } else {
        console.log('Successfully connected to gRPC server!');
    }
    client.close();
});
