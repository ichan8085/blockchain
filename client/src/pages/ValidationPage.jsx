import React, { useState, useEffect } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";
import Button from "../components/button";
import Navbar from "../components/navbar";
import Card from "../components/card";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../App.css";


function ValidationPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    if (!showScanner) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
      },
      false
    );

    const onScanSuccess = async (decodedText) => {
      try {
        await scanner.clear();

        const res = await axios.get(
          `${import.meta.env.VITE_ENDPOINT}/validate/${encodeURIComponent(
            decodedText
          )}`
        );

        setScanResult(res.data);
        setShowScanner(false);
      } catch (err) {
        toast.error("Sertifikat tidak ditemukan!");
      }
    };

    const onScanFailure = () => {
      // kosongkan
    };

    scanner.render(
      onScanSuccess,
      onScanFailure
    );

    return () => {
      scanner
        .clear()
        .catch(() => {});
    };
  }, [showScanner]);

  return (
  <>
    <Navbar label="USER MENU" />
    <div className="containerStyle">
      <Card title="VERIFIKASI SERTIFIKAT" subtitle="Pindai QR Code">

        {!showScanner && (
          <Button
            variant="primary"
            onClick={() =>
              setShowScanner(true)
            }
          >
            Buka Scanner
          </Button>
        )}

        {showScanner && (
          <div
            style={{
              marginTop: "20px",
            }}
          >
            <div
              id="reader"
              style={{
                width: "100%",
              }}
            />

            <Button
              variant="danger"
              onClick={() =>
                setShowScanner(false)
              }
            >
              Tutup Kamera
            </Button>
          </div>
        )}

        {scanResult && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            borderRadius: "10px",
            backgroundColor: "#eef",
            border: "1px solid #cbd5e1",
          }}
        >
          <h3 style={{ color: "green", marginBottom: "20px" }}>
          Sertifikat Terdaftar
          </h3>

          <p>
            <strong>Nomor Batch:</strong>{" "}
            {scanResult.nomorBatch}
          </p>

          <p>
            <strong>Nomor Sertifikat:</strong>{" "}
            {scanResult.nomorIjazah}
          </p>

          <p>
            <strong>Nama Mahasiswa:</strong>{" "}
            {scanResult.namaMahasiswa}
          </p>

          <p>
            <strong>NIM:</strong>{" "}
            {scanResult.nim}
          </p>

          <p>
            <strong>Program Studi:</strong>{" "}
            {scanResult.programStudi}
          </p>

          <p>
            <strong>Perguruan Tinggi:</strong>{" "}
            {scanResult.perguruanTinggi}
          </p>

          <p>
            <strong>Tanggal Generate:</strong>{" "}
            {scanResult.tanggalGenerate}
          </p>

          <p>
            <strong>Tanggal Export:</strong>{" "}
            {scanResult.tanggalExport}
          </p>

          <p>
            <strong>Operator PT:</strong>{" "}
            {scanResult.operatorPT}
          </p>

          {scanResult.keterangan && (
            <p>
              <strong>Keterangan:</strong>{" "}
              {scanResult.keterangan}
            </p>
          )}

          {scanResult.entryTime && (
            <p>
              <strong>Waktu Tersimpan:</strong>{" "}
              {new Date(scanResult.entryTime).toLocaleString()}
            </p>
          )}

          <p>
            <strong>Hash ID Sertifikat:</strong>
            {scanResult.fileHash}
          </p>

          {scanResult.ipfsHash && (
            <p style={{ marginTop: "20px" }}>
              <a
                href={`${import.meta.env.VITE_IPFS}${scanResult.ipfsHash}`}
                target="_blank"
                rel="noreferrer"
              >
              Lihat Foto
              </a>
            </p>
          )}
        </div>
      )}
    </Card>
    </div>
  </>
  );
}

export default ValidationPage;