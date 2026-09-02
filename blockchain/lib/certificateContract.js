'use strict';

const { Contract } = require('fabric-contract-api');

class CertificateContract extends Contract {

    async initLedger(ctx) {
        console.info('Ledger Initialized');
    }

    // =====================================================
    // CEK DUPLIKASI
    // Dipanggil sebelum upload ke IPFS
    // =====================================================
    async checkDuplicateData(ctx, nomorIjazah, nim, fileHash) {

        // Cek Nomor Ijazah
        const certificate = await ctx.stub.getState(nomorIjazah);

        if (certificate && certificate.length > 0) {
            throw new Error(`Nomor Ijazah "${nomorIjazah}" sudah terdaftar.`);
        }

        // Cek NIM
        const nimKey = ctx.stub.createCompositeKey(
            "nim",
            [nim]
        );

        const existingNim = await ctx.stub.getState(nimKey);

        if (existingNim && existingNim.length > 0) {
            throw new Error(`NIM "${nim}" sudah terdaftar.`);
        }

        // Cek SHA-256 File
        const hashKey = ctx.stub.createCompositeKey(
            "sha256",
            [fileHash]
        );

        const existingHash = await ctx.stub.getState(hashKey);

        if (existingHash && existingHash.length > 0) {
            throw new Error("Dokumen yang sama sudah pernah diupload.");
        }

        return "VALID";
    }

    // =====================================================
    // SIMPAN DATA
    // Dipanggil setelah upload IPFS berhasil
    // =====================================================
    async createCertificate(
        ctx,
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
    ) {

        const txTimestamp = ctx.stub.getTxTimestamp();

        const entryTime = new Date(
            txTimestamp.seconds.low * 1000
        ).toISOString();

        const certificate = {
            docType: "certificate",
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
            ipfsHash,
            entryTime
        };

        // =====================================================
        // Primary Key = Nomor Ijazah
        // =====================================================
        await ctx.stub.putState(
            nomorIjazah,
            Buffer.from(JSON.stringify(certificate))
        );

        // =====================================================
        // Index NIM
        // =====================================================
        const nimKey = ctx.stub.createCompositeKey(
            "nim",
            [nim]
        );

        await ctx.stub.putState(
            nimKey,
            Buffer.from(nomorIjazah)
        );

        // =====================================================
        // Index SHA-256
        // =====================================================
        const hashKey = ctx.stub.createCompositeKey(
            "sha256",
            [fileHash]
        );

        await ctx.stub.putState(
            hashKey,
            Buffer.from(nomorIjazah)
        );

        return JSON.stringify(certificate);
    }

    // =====================================================
    // VALIDASI BERDASARKAN NOMOR IJAZAH
    // =====================================================
    async queryCertificate(ctx, nomorIjazah) {

        const certAsBytes = await ctx.stub.getState(
            nomorIjazah
        );

        if (!certAsBytes || certAsBytes.length === 0) {
            throw new Error(
                `Nomor Ijazah "${nomorIjazah}" tidak ditemukan.`
            );
        }

        return certAsBytes.toString();
    }

    async queryAllCertificates(ctx) {
    const iterator = await ctx.stub.getStateByRange('', '');
    const results = [];
    while (true) {
        const res = await iterator.next();
        if (res.value && res.value.value.toString()) {
        const record = JSON.parse(res.value.value.toString('utf8'));
        if (record.docType === 'certificate') {
            results.push(record);
        }
        }
        if (res.done) {
        await iterator.close();
        break;
        }
    }
    return JSON.stringify(results);
    }

}

module.exports = CertificateContract;