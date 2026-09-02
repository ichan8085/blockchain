import React, { useState, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { getTodayDate } from "../utils/tanggal-export";
import axios from "axios";
import QRCode from "react-qr-code";
import { toPng } from "html-to-image";
import Button from "../components/button";
import Navbar from "../components/navbar";
import Input from "../components/input";
import Card from "../components/card";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../App.css";


function OperatorPage() {
  const [formData, setFormData] = useState({
    nomorBatch: "",
    perguruanTinggi: "",
    programStudi: "",
    tanggalGenerate: "",
    operatorPT: "",
    tanggalExport: getTodayDate(),
    nim: "",
    namaMahasiswa: "",
    nomorIjazah: "",
    keterangan: "",
  });

  const [file, setFile] = useState(null);
  const [qrValue, setQrValue] = useState(null);
  const [ipfsHash, setIpfsHash] = useState("");
  const certificateRef = useRef(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Fungsi untuk auto field
  const handleSearchNim = async () => {
    const nim = formData.nim.trim();

    if (!nim) {
      toast.warning("Kolom NIM Harus terisi");
      return;
    }

    setIsLookingUp(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_ENDPOINT}/lookup/${nim}`
      );
      const data = response.data;

    setFormData((prev) => ({
      ...prev,
      perguruanTinggi: data.kode_pt && data.nama_pt
        ? `${data.kode_pt}-${data.nama_pt}`
        : prev.perguruanTinggi,
      programStudi: data.kode_prodi && data.nama_prodi
        ? `${data.kode_prodi}-${data.nama_prodi}`
        : prev.programStudi,
      nomorBatch: data.nomor_batch || prev.nomorBatch,
      tanggalGenerate: data.tanggal_generate ? data.tanggal_generate.slice(0, 10) : prev.tanggalGenerate,
      operatorPT: data.operator_pt || prev.operatorPT,
      namaMahasiswa: data.nama_mahasiswa || prev.namaMahasiswa,
      nomorIjazah: data.nomor_ijazah || prev.nomorIjazah,
      keterangan: data.keterangan || prev.keterangan,
    }));

      toast.success("Data ditemukan");
    } catch (err) {
      if (err.response?.status === 404) {
        toast.info("NIM belum terdaftar, silakan isi manual");
      } else {
        toast.error("Gagal mengambil data: " + (err.response?.data?.error || err.message));
      }
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // fungsi simpan
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    data.append("file", file);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_ENDPOINT}/issue`,
        data
      );

      setIpfsHash(response.data.ipfsHash);
      setQrValue(formData.nomorIjazah);

      toast.success("Sukses disimpan ke Blockchain!");
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error("Gagal: " + errorMsg);
    }
  };

  // fungsi download
  const downloadCertificate = async () => {
    if (!certificateRef.current) return;

    try {
      const dataUrl = await toPng(
        certificateRef.current,
        {
          quality: 1,
          pixelRatio: 3,
        }
      );

      const link = document.createElement("a");

      link.download = `${formData.nomorBatch}.png`;
      link.href = dataUrl;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunduh ijazah/Sertifikat");
    }
  };

  return (
    <>
    <Navbar label="OPERATOR" />
    <div className="containerStyle">
      <Card title="FORM INPUT IJAZAH/SERTIFIKAT" subtitle="Masukkan data ijazah/sertifikat yang akan disimpan ke Blockchain">
        <form onSubmit={handleSubmit}>
          <div className="formGrid">

          <Input
              label="Nomor Batch"
              name="nomorBatch"
              value={formData.nomorBatch}
              onChange={handleChange}
              required
          />

          <Input
              label="Perguruan Tinggi"
              name="perguruanTinggi"
              value={formData.perguruanTinggi}
              onChange={handleChange}
              required
          />

          <Input
              label="Program Studi"
              name="programStudi"
              value={formData.programStudi}
              onChange={handleChange}
              required
          />

          <Input
              type="date"
              label="Tanggal Generate"
              name="tanggalGenerate"
              value={formData.tanggalGenerate}
              onChange={handleChange}
              required
          />

          <Input
              label="Operator PT"
              name="operatorPT"
              value={formData.operatorPT}
              onChange={handleChange}
              required
          />

          <Input
              type="date"
              label="Tanggal Export"
              name="tanggalExport"
              value={formData.tanggalExport}
              onChange={handleChange}
              readOnly
              required
          />

          <Input
            label="NIM"
            name="nim"
            value={formData.nim}
            onChange={handleChange}
            required
            rightIcon={
              isLookingUp
                ? <Loader2 size={18} className="input-field__icon-spin" />
                : <Search size={18} />
            }
            onIconClick={handleSearchNim}
            iconDisabled={isLookingUp}
            iconLabel="Cari data NIM"
          />

          <Input
              label="Nama Mahasiswa"
              name="namaMahasiswa"
              value={formData.namaMahasiswa}
              onChange={handleChange}
              required
          />

          <Input
              label="Nomor Ijazah/Sertifikat"
              name="nomorIjazah"
              value={formData.nomorIjazah}
              onChange={handleChange}
              required
          />

          <Input
            label="Keterangan"
            type="select"
            name="keterangan"
            value={formData.keterangan}
            onChange={handleChange}
            options={[
              { value: "Lulus", label: "Lulus" },
              { value: "-", label: "-" },
            ]}
          />

          <Input
              type="file"
              label="Upload Foto Ijazah/Sertifikat"
              name="dokumen"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e)=>setFile(e.target.files[0])}
              required
          />
          </div>
          <Button
            type="submit"
            variant="success"
          >
            Simpan Ijazah/Sertifikat
          </Button>
        </form>
       </Card>

        {qrValue && (
          <>
            {/* Preview Ijazah */}
            <div ref={certificateRef} className="certificatePreview">
              <div className="qrSection">
                <div className="qrText">
                  <p>Scan QR Code untuk validasi ijazah/sertifikat</p>
                  <p>
                    QR Code : {formData.namaMahasiswa}
                  </p>

                  <p>
                    Nomor Ijazah/Sertifikat Nasional : {formData.nomorIjazah}
                  </p>
                </div>
                  <div className="qrContainer">
                      <QRCode
                          value={qrValue}
                          size={110}
                      />
                </div>

              </div>
            </div>

            <div style={{marginTop: "20px"}}>
              <Button
                variant="primary"
                onClick={downloadCertificate}
              >
                Download Ijazah/Sertifikat
              </Button>
            </div>
          </>
        )}
    </div>

    <ToastContainer
      position="top-center"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />

    </>
  );
}

export default OperatorPage;