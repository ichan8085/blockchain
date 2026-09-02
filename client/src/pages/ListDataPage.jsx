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
      toast.error("Gagal mengunduh ijazah/sertifikat.");
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
          title="DATA IJAZAH/SERTIFIKAT"
          subtitle="Data ijazah/sertifikat yang terdaftar"
        >
          {/* Search */}
          <div className="listSearchWrapper">
            <input
              type="text"
              className="listSearchInput"
              placeholder="Cari Nomor Ijazah/Sertifikat, Nama, NIM, Program Studi..."
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
                      <th>Nomor Ijazah/Sertifikat</th>
                      <th>Nama</th>
                      <th>NIM</th>
                      <th>Program Studi</th>
                      <th>Perguruan Tinggi</th>
                      <th>Tanggal Generate</th>
                      <th>Operator PT</th>
                      <th>Ijazah/Sertifikat</th>
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
                            Lihat Ijazah/Sertifikat
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
                      <div className="qrSection">
                          <p>QR Code: {selectedCertificate.namaMahasiswa}</p>
                          <div className="qrContainer">
                              <QRCode
                                  value={selectedCertificate.nomorIjazah}
                                  size={110}
                              />
                          </div>

                          <div className="qrText">
                            <p>
                              <strong>Nomor Ijazah/Sertifikat Nasional: {selectedCertificate.nomorIjazah}</strong>
                            </p>
                          </div>
                      </div>
                    </div>
                    {/* === */}

                    <div style={{marginBottom: "20px"}}>
                      <Button
                        variant="primary"
                        onClick={downloadCertificate}
                      >
                        Download Ijazah/Sertifikat
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