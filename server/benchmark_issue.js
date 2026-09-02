const axios = require("axios");
const FormData = require("form-data");
const { Readable } = require("stream");
const { performance } = require("perf_hooks");

const TOTAL = parseInt(process.argv[2]) || 10;

// ID unik untuk setiap sesi benchmark
const SESSION_ID = Date.now();

const URL = "http://localhost:3001/issue";

async function sendRequest(index) {

    const form = new FormData();

    // Data unik untuk setiap transaksi
    const nomorBatch = `BATCH-${SESSION_ID}-${index}`;
    const nim = `${SESSION_ID}${String(index).padStart(3, "0")}`;
    const nomorIjazah = `IJZ-${SESSION_ID}-${index}`;
    const namaMahasiswa = `Mahasiswa Benchmark ${index}`;

    form.append("nomorBatch", nomorBatch);
    form.append(
        "perguruanTinggi",
        "Universitas Islam Negeri Sunan Gunung Djati Bandung"
    );
    form.append(
        "programStudi",
        "Pendidikan Profesi Guru"
    );
    form.append("tanggalGenerate", "2026-07-24");
    form.append("operatorPT", "Administrator");
    form.append("tanggalExport", "2026-07-24");
    form.append("nim", nim);
    form.append("namaMahasiswa", namaMahasiswa);
    form.append("nomorIjazah", nomorIjazah);
    form.append("keterangan", "Lulus");

    // Isi file selalu berbeda agar SHA-256 berbeda
    const dummyContent = `
=====================================
Dummy Certificate Benchmark
=====================================

Session ID      : ${SESSION_ID}
Transaction     : ${index}
Nomor Batch     : ${nomorBatch}
NIM             : ${nim}
Nama            : ${namaMahasiswa}
Nomor Ijazah    : ${nomorIjazah}
Tanggal         : ${new Date().toISOString()}
Random          : ${Math.random()}
=====================================
`;

    const fileBuffer = Buffer.from(dummyContent);

    form.append(
        "file",
        Readable.from(fileBuffer),
        {
            filename: `certificate-${SESSION_ID}-${index}.txt`,
            contentType: "text/plain"
        }
    );

    const start = performance.now();

    try {

        await axios.post(URL, form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        const latency = performance.now() - start;

        console.log(
            `[${index}/${TOTAL}] ${latency.toFixed(2)} ms`
        );

        return latency;

    } catch (err) {

        console.log(`[${index}/${TOTAL}] FAILED`);

        if (err.response) {
            console.error(err.response.data);
        } else {
            console.error(err.message);
        }

        return null;
    }
}

(async () => {

    console.log(`\n===== Benchmark POST /issue (${TOTAL} transaksi) =====`);
    console.log(`Session ID : ${SESSION_ID}\n`);

    const result = [];

    for (let i = 1; i <= TOTAL; i++) {

        const latency = await sendRequest(i);

        if (latency !== null) {
            result.push(latency);
        }

    }

    console.log("\n========== HASIL ==========");

    console.log(`Session ID    : ${SESSION_ID}`);
    console.log(`Total Request : ${TOTAL}`);
    console.log(`Success       : ${result.length}`);
    console.log(`Failed        : ${TOTAL - result.length}`);

    if (result.length > 0) {

        const avg = result.reduce((a, b) => a + b, 0) / result.length;
        const min = Math.min(...result);
        const max = Math.max(...result);

        console.log(`Average       : ${avg.toFixed(2)} ms`);
        console.log(`Minimum       : ${min.toFixed(2)} ms`);
        console.log(`Maximum       : ${max.toFixed(2)} ms`);
    }

})();