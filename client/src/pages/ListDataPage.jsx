import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "../components/navbar";
import Card from "../components/card";
import Button from "../components/button";
import QRCode from "react-qr-code";
import { toPng } from "html-to-image";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../App.css";

function ListDataPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const certificateRef = useRef(null);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_ENDPOINT}/certificates`)
      .then((res) => setItems(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Filter data
  const filteredItems = items.filter((item) => {
    const q = searchTerm.toLowerCase();

    return (
      item.nomorIjazah?.toLowerCase().includes(q) ||
      item.namaMahasiswa?.toLowerCase().includes(q) ||
      item.nim?.toLowerCase().includes(q) ||
      item.programStudi?.toLowerCase().includes(q) ||
      item.perguruanTinggi?.toLowerCase().includes(q)
    );
  });

  // unduh sertifikat
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

      link.download = `${selectedCertificate.nomorBatch}.png`;
      link.href = dataUrl;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunduh sertifikat");
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (loading) return <div className="listPageMessage">Memuat...</div>;

  return (
    <>
      <Navbar label="DATA PESERTA" />
      <ToastContainer />

      <div className="listPageContainer">
        <Card
          title="DATA SERTIFIKAT"
          subtitle="Data sertifikat PPG yang terdaftar"
        >
          {/* Search */}
          <div className="listSearchWrapper">
            <input
              type="text"
              className="listSearchInput"
              placeholder="Cari Nomor Sertifikat, Nama, NIM, Program Studi..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {filteredItems.length === 0 ? (
            <div className="listPageMessage">
              {items.length === 0
                ? "Tidak ada data."
                : "Tidak ada data yang cocok dengan pencarian."}
            </div>
          ) : (
            <>
              <div className="listTableWrapper">
                <table className="listTable">
                  <thead>
                    <tr>
                      <th>Nomor Sertifikat</th>
                      <th>Nama</th>
                      <th>NIM</th>
                      <th>Program Studi</th>
                      <th>Perguruan Tinggi</th>
                      <th>Tanggal Generate</th>
                      <th>Operator PT</th>
                      <th>Sertifikat</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.map((item) => (
                      <tr key={item.nomorIjazah}>
                        <td>{item.nomorIjazah}</td>
                        <td>{item.namaMahasiswa}</td>
                        <td>{item.nim}</td>
                        <td>{item.programStudi}</td>
                        <td>{item.perguruanTinggi}</td>
                        <td>{item.tanggalGenerate}</td>
                        <td>{item.operatorPT}</td>
                        <td>
                        <button
                            className="previewButton"
                            onClick={() => setSelectedCertificate(item)}
                        >
                            Lihat Sertifikat
                        </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* modal perview sertifikat */}
              {selectedCertificate && (

              <div className="previewOverlay">
                  <div className="previewModal">

                    <div ref={certificateRef} className="certificatePreview">
                      <div className="certificateHeader">
                        <h1>SERTIFIKAT KELULUSAN</h1>
                          <p>
                            <strong>Nomor Batch</strong>: {selectedCertificate.nomorBatch}
                          </p>
                      </div>

                      <div className="certificateBody">

                        <p>
                          <strong>Nomor Sertifikat: {selectedCertificate.nomorIjazah}</strong>
                        </p>

                        <p>
                          Berdasarkan Keputusan Menteri Agama Republik Indoneisia Nomor 53 Tahun 2021 tanggal 6 januari 2021 tentang
                          <br />
                          Izin Penyelenggaraan Program Studi Pendidikan Profesi Guru, 
                          <br />
                          Rektor Universitas Islam Negeri Sunan Gunung Djati menyatakan bahwa:
                        </p>

                        <h2>{selectedCertificate.namaMahasiswa}</h2>

                        <p>
                          Nomor Induk Mahasisiwa:{selectedCertificate.nim}
                          <br/>
                          Perguruan Tinggi: {selectedCertificate.perguruanTinggi}
                          <br />
                          {selectedCertificate.keterangan && (
                            <span>
                              Keterangan: {selectedCertificate.keterangan}
                            </span>
                          )}
                        </p>

                        <p>
                          telah memenuhi syarat penyelesaian Pnedidikan Profesi Guru dan Lulus Uji Kompetensi Mahasiswa Pendidikan Profesi Guru.
                          <br/>
                          Kepadanya diberikan gelar Guru Pofesional (Gr.) dalam bidang keahlian {selectedCertificate.programStudi}
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

                                  <img
                                      src={`${import.meta.env.VITE_IPFS}${selectedCertificate.ipfsHash}`}
                                      alt="Foto Peserta"
                                  />

                                    <div className="qrSection">

                                        <div className="qrContainer">
                                            <QRCode
                                                value={selectedCertificate.nomorIjazah}
                                                size={110}
                                            />
                                        </div>

                                      <div className="qrText">
                                        <p>Scan QR Code untuk validasi sertifikat</p>
                                        <p>
                                          Generate : {selectedCertificate.tanggalGenerate}
                                        </p>

                                        <p>
                                          Export : {selectedCertificate.tanggalExport}
                                        </p>

                                        <p>
                                          Operator : {selectedCertificate.operatorPT}
                                        </p>
                                      </div>

                                    </div>
                                </div>

                            </div>

                            {/* KANAN */}
                            <div className="rightSign">

                              <p>Bandung,</p>
                              <br/>
                              <p>Dekan,</p>

                              <strong>
                                H. Fakry Hamdani, M.Hum., M.Res., Ph.D.
                              </strong>

                              <span>NIP 198008242009121004</span>

                            </div>
                          </div>

                      </div>
                    </div>

                    <div style={{marginBottom: "20px"}}>
                      <Button
                        variant="primary"
                        onClick={downloadCertificate}
                      >
                        Download Sertifikat
                      </Button>
                    </div>

                    <Button
                        variant="danger"
                        onClick={() => setSelectedCertificate(null)}
                    >
                        Tutup
                    </Button>
                  </div>
              </div>
              
              )}

              {/* Pagination */}
              <div className="pagination">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                {/* Nomor halaman */}
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={
                        currentPage === page ? "activePage" : ""
                      }
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, totalPages)
                    )
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}

export default ListDataPage;