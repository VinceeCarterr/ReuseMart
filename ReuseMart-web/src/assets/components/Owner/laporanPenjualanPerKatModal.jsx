import React, { useState, useRef, useEffect } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import api from "../../../api/api.js";

const LaporanPenjualanPerKatModal = ({ show, handleClose }) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const reportRef = useRef();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const currentYear = today.getFullYear();

  const fetchReport = async () => {
    try {
      const response = await api.get(
        `/laporan/penjualan-per-kategori?tahun=${currentYear}`
      );
      setReportData(response.data);
    } catch (error) {
      console.error("Error fetching laporan penjualan per kategori:", error);
    }
  };

  useEffect(() => {
    if (show) {
      fetchReport();
    }
  }, [show]);

  const totalTerjual = reportData.reduce(
    (sum, row) => sum + Number(row.terjual || 0),
    0
  );

  const totalGagal = reportData.reduce(
    (sum, row) => sum + Number(row.gagal || 0),
    0
  );

  const handleDownloadPDF = async () => {
    setLoading(true);
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    let cursorY = 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LAPORAN PENJUALAN PER KATEGORI BARANG", pageWidth / 2, cursorY, {
      align: "center",
    });
    cursorY += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "ReUse Mart, Jl. Green Eco Park No. 456 Yogyakarta",
      pageWidth / 2,
      cursorY,
      { align: "center" }
    );
    cursorY += 5;
    doc.text(`Tahun : ${currentYear}`, pageWidth / 2, cursorY, {
      align: "center",
    });
    cursorY += 5;
    doc.text(`Tanggal Cetak : ${formattedDate}`, pageWidth / 2, cursorY, {
      align: "center",
    });
    cursorY += 10;

    const element = reportRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight,
    });
    const imgData = canvas.toDataURL("image/png", 1.0);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const pdfWidth = pageWidth - 2 * margin;
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

    let heightLeft = pdfHeight;
    let position = cursorY;

    doc.addImage(imgData, "PNG", margin, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight - position - margin;

    while (heightLeft > 0) {
      doc.addPage();
      position = margin;
      doc.addImage(
        imgData,
        "PNG",
        margin,
        position - heightLeft,
        pdfWidth,
        pdfHeight
      );
      heightLeft -= pageHeight - margin * 2;
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" }
      );
    }

    doc.save(`laporan_penjualan_kategori_${currentYear}.pdf`);
    setLoading(false);
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="xl"
      centered
      dialogClassName="custom-modal-width"
    >
      <Modal.Header closeButton>
        <Modal.Title>Laporan Penjualan Per Kategori</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div ref={reportRef} className="report-content">
          <p>
            <strong>ReUse Mart, Jl. Green Eco Park No. 456 Yogyakarta</strong>
          </p>
          <p>
            <strong>LAPORAN PENJUALAN PER KATEGORI BARANG</strong>
          </p>
          <p>Tahun : {currentYear}</p>
          <p>Tanggal Cetak : {formattedDate}</p>

          <Table striped bordered hover responsive className="report-table">
            <thead>
              <tr>
                <th style={{ width: "50%" }}>Kategori</th>
                <th style={{ width: "25%" }}>Jumlah item terjual</th>
                <th style={{ width: "25%" }}>Jumlah item gagal terjual</th>
              </tr>
            </thead>

            <tbody>
              {reportData.length > 0 ? (
                reportData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.kategori || "-"}</td>
                    <td>{row.terjual != null ? row.terjual : "-"}</td>
                    <td>{row.gagal != null ? row.gagal : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    {reportData.length === 0
                      ? "Data laporan kosong."
                      : "Memuat data..."}
                  </td>
                </tr>
              )}
            </tbody>

            {reportData.length > 0 && (
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th>{totalTerjual}</th>
                  <th>{totalGagal}</th>
                </tr>
              </tfoot>
            )}
          </Table>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Tutup
        </Button>
        <Button
          variant="primary"
          onClick={handleDownloadPDF}
          disabled={loading}
        >
          {loading ? "Memproses..." : "Download PDF"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LaporanPenjualanPerKatModal;
