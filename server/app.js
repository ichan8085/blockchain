const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Gateway, Wallets, DefaultQueryHandlerStrategies, DefaultEventHandlerStrategies } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data'); // Library untuk handle upload file
const net = require('net');
const { performance } = require('perf_hooks');
const crypto = require('crypto');
const pool = require('./config/db');
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Setup Upload File (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

// --- KONEKSI KE BLOCKCHAIN ---
async function connectToNetwork() {
    const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'appUser6',
        discovery: { enabled: true, asLocalhost: true },

        // Query: coba semua peer, fallback otomatis jika satu mati
        queryHandlerOptions: {
            timeout: 30,
            strategy: DefaultQueryHandlerStrategies.MSPID_SCOPE_ROUND_ROBIN
        },

        // Event: toleransi jika satu peer mati
        eventHandlerOptions: {
            commitTimeout: 300,
            endorseTimeout: 300,
            strategy: DefaultEventHandlerStrategies.MSPID_SCOPE_ALLFORTX
        }
    });

    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('certificate');
    return { contract, gateway };
}

// --- ENDPOINT ISSUE (UPLOAD & SIMPAN) ---
app.post('/issue', upload.single('file'), async (req, res) => {

    const start = performance.now();

    try {
        const {
            nomorBatch,
            perguruanTinggi,
            programStudi,
            tanggalGenerate,
            operatorPT,
            tanggalExport,
            nim,
            namaMahasiswa,
            nomorIjazah,
            keterangan
        } = req.body;

        if (!req.file) {
            return res.status(400).json({
                error: "File wajib diupload"
            });
        }

        // Generate SHA-256 file
        const fileHash = crypto
            .createHash("sha256")
            .update(req.file.buffer)
            .digest("hex");

        console.log("SHA-256:", fileHash);

        // Validasi field
        if (
            !nomorBatch ||
            !perguruanTinggi ||
            !programStudi ||
            !tanggalGenerate ||
            !operatorPT ||
            !tanggalExport ||
            !nim ||
            !namaMahasiswa ||
            !nomorIjazah
        ) {
            return res.status(400).json({
                error: "Semua field wajib diisi"
            });
        }

        console.log("0. Mengecek data di Blockchain...");

        const { contract, gateway } = await connectToNetwork();

        try {

            await contract.evaluateTransaction(
                "checkDuplicateData",
                nomorIjazah,
                nim,
                fileHash
            );

            console.log("   -> Data valid");

            console.log("1. Memulai Upload ke IPFS...");

            const formData = new FormData();
            formData.append(
                "file",
                req.file.buffer,
                req.file.originalname
            );

            const ipfsResponse = await axios.post(`${process.env.IPFS_HOST}`,
            formData,
            {
                headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${process.env.PINATA_JWT}`,
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
            );

            const ipfsHash = ipfsResponse.data.IpfsHash;

            console.log("   -> Upload IPFS berhasil:", ipfsHash);

            console.log("2. Menyimpan ke Blockchain...");

            await contract.submitTransaction(
                "createCertificate",
                nomorBatch,
                perguruanTinggi,
                programStudi,
                tanggalGenerate,
                operatorPT,
                tanggalExport,
                nim,
                namaMahasiswa,
                nomorIjazah,
                keterangan,
                fileHash,
                ipfsHash
            );

            const latency = performance.now() - start;
            console.log(`[POST /issue] Latency: ${latency.toFixed(2)} ms`);

            return res.json({
                success: true,
                nomorIjazah,
                ipfsHash
            });

        } catch (err) {

            console.error(err);

            if (
                err.message.includes("Nomor Ijazah") ||
                err.message.includes("NIM") ||
                err.message.includes("Dokumen") ||
                err.message.includes("SHA") ||
                err.message.includes("Hash")
            ) {
                return res.status(409).json({
                    error: err.message
                });
            }

            return res.status(500).json({
                error: err.message
            });

        } finally {

            await gateway.disconnect();

        }

    } catch (error) {

        console.error("ERROR:", error);

        return res.status(500).json({
            error: error.message || "Internal Server Error"
        });

    }
});

// Endpoint ambil query data sertifikat
app.get("/certificates", async (req, res) => {

    const start = performance.now();

  try {
    const { contract, gateway } = await connectToNetwork();

    try {
      const result = await contract.evaluateTransaction(
        "queryAllCertificates"
      );

      let certificates = JSON.parse(result.toString());

      const latency = performance.now() - start;

    console.log(`[GET /certificates] Latency: ${latency.toFixed(2)} ms`);

      res.json(certificates);
    } finally {
      await gateway.disconnect();
    }
  } catch (error) {
    console.error("GET /certificates error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// --- ENDPOINT LOOKUP BY NIM (untuk auto-fill form) ---
app.get('/lookup/:nim', async (req, res) => {
  const { nim } = req.params;

  if (!nim || nim.trim() === '') {
    return res.status(400).json({ error: 'NIM wajib diisi' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM view_lookup_ijazah WHERE nim = $1',
      [nim.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'NIM tidak ditemukan' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Lookup error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// --- ENDPOINT VALIDASI ---
// Using a generic middleware approach to completely bypass Express path-to-regexp bugs with slashes
app.use(async (req, res, next) => {
    if (req.method !== 'GET' || !req.path.startsWith('/validate/')) {
        return next();
    }

    try {
        console.log("Menerima request validasi:", req.originalUrl, " -> ", req.path);
        const rawId = req.path.replace('/validate/', '');
        if (!rawId) {
            return res.status(400).json({ error: "ID Sertifikat tidak boleh kosong" });
        }
        // Sanitize string dengan trim untuk mencegah newline (\n) atau spasi ekstra dari QR Scanner
        const certId = decodeURIComponent(rawId).trim();

        console.log("Mencari Sertifikat di Ledger:", certId);

        const { contract, gateway } = await connectToNetwork();
        try {
            const result = await contract.evaluateTransaction('queryCertificate', certId);
            await gateway.disconnect();
            res.json(JSON.parse(result.toString()));
        } catch (txErr) {
            console.error('Evaluate transaction failed:', txErr);
            try {
                const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
                const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
                const diag = await checkPeerReachability(ccp);
                console.error('Peer reachability:', diag);
                await gateway.disconnect();
                return res.status(502).json({ error: 'Failed to evaluate transaction', details: { message: txErr.message, peers: diag } });
            } catch (diagErr) {
                console.error('Diagnostic check failed:', diagErr);
                await gateway.disconnect();
                return res.status(500).json({ error: txErr.message });
            }
        }
    } catch (error) {
        console.error("API Validation Override Error:", error);
        res.status(404).json({ error: "Data tidak ditemukan" });
    }
});

// Helper: Check TCP reachability to peers listed in connection profile
async function checkPeerReachability(ccp) {
    const peers = [];
    if (ccp.peers) {
        for (const [name, p] of Object.entries(ccp.peers)) {
            const url = p.url || '';
            const m = url.match(/^(?:grpcs?:\/\/)?([^:\/]+):(\d+)/);
            if (m) peers.push({ name, url, host: m[1], port: parseInt(m[2], 10) });
        }
    }

    const results = [];
    for (const peer of peers) {
        const reachable = await new Promise((resolve) => {
            const socket = new net.Socket();
            let finished = false;
            socket.setTimeout(3000);
            socket.once('connect', () => { finished = true; socket.destroy(); resolve(true); });
            socket.once('timeout', () => { if (!finished) { finished = true; socket.destroy(); resolve(false); } });
            socket.once('error', () => { if (!finished) { finished = true; socket.destroy(); resolve(false); } });
            socket.connect(peer.port, peer.host);
        });
        results.push({ ...peer, reachable });
    }
    return results;
}

app.listen(3001, () => console.log('Server running on port 3001'));