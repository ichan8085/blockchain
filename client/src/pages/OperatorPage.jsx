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
      toast.error("Gagal mengunduh sertifikat");
    }
  };

  return (
    <>
    <Navbar label="OPERATOR" />
    <div className="containerStyle">
      <Card title="FORM INPUT SERTIFIKAT" subtitle="Masukkan data sertifikat yang akan disimpan ke Blockchain">
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
              label="Nomor Sertifikat"
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
              label="Upload Dokumen Sertifikat"
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
            Simpan Sertifikat
          </Button>
        </form>
       </Card>

        {qrValue && (
          <>
            {/* Preview Sertifikat */}
            <div ref={certificateRef} className="certificatePreview">
              <div className="certificateHeader">
                <h1>SERTIFIKAT KELULUSAN</h1>
                  <p>
                    <strong>Nomor Batch</strong>: {formData.nomorBatch}
                  </p>
              </div>

              <div className="certificateBody">

                <p>
                  <strong>Nomor Sertifikat: {formData.nomorIjazah}</strong>
                </p>

                <p>
                  Berdasarkan Keputusan Menteri Agama Republik Indoneisia Nomor 53 Tahun 2021 tanggal 6 januari 2021 tentang
                  <br />
                  Izin Penyelenggaraan Program Studi Pendidikan Profesi Guru, 
                  <br />
                  Rektor Universitas Islam Negeri Sunan Gunung Djati menyatakan bahwa:
                </p>

                <h2>{formData.namaMahasiswa}</h2>

                <p>
                  Nomor Induk Mahasisiwa:{formData.nim}
                  <br/>
                  Perguruan Tinggi: {formData.perguruanTinggi}
                  <br />
                  {formData.keterangan && (
                    <p>
                      Keterangan: {formData.keterangan}
                    </p>
                  )}
                </p>

                <p>
                  telah memenuhi syarat penyelesaian Pnedidikan Profesi Guru dan Lulus Uji Kompetensi Mahasiswa Pendidikan Profesi Guru.
                  <br/>
                  Kepadanya diberikan gelar Guru Pofesional (Gr.) dalam bidang keahlian {formData.programStudi}
                  <br />
                  sesuai hak dan kewajiban yang melekat pada gelar tersebut.
                </p>


                  <div className="certificateInfo">

                    {/* KIRI */}
                    <div className="leftSign">
                      <p>Rektor,</p>

                      <strong>
                        Prof. Dr. H. Rosihon Anwar, M.Ag.
                      </strong>

                      <span>NIP 196909151995031001</span>
                    </div>

                    {/* TENGAH */}
                    <div className="centerSign">

                        <div className="centerContent">

                            {ipfsHash && (
                                <img
                                    src={`${import.meta.env.VITE_IPFS}${ipfsHash}`}
                                    alt="Foto Peserta"
                                />
                            )}

                            <div className="qrSection">

                                <div className="qrContainer">
                                    <QRCode
                                        value={qrValue}
                                        size={110}
                                    />
                                </div>

                              <div className="qrText">
                                <p>Scan QR Code untuk validasi sertifikat</p>
                                <p>
                                  Generate : {formData.tanggalGenerate}
                                </p>

                                <p>
                                  Export : {formData.tanggalExport}
                                </p>

                                <p>
                                  Operator : {formData.operatorPT}
                                </p>
                              </div>

                            </div>
                        </div>

                    </div>

                    {/* KANAN */}
                    <div className="rightSign">

                      <p>
                        Bandung,
                        {" "}
                        {formData.tanggalExport}
                        <br/>
                        Dekan,
                      </p>

                      <strong>
                        H. Fakry Hamdani, M.Hum., M.Res., Ph.D.
                      </strong>

                      <span>NIP 198008242009121004</span>

                    </div>

                  </div>

              </div>
            </div>

            <div style={{marginTop: "20px"}}>
              <Button
                variant="primary"
                onClick={downloadCertificate}
              >
                Download Sertifikat
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