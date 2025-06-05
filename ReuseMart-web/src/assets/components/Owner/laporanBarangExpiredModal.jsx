import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../../api/api.js';

const LaporanBarangExpiredModal = ({ show, handleClose }) => {
  const [loading, setLoading] = useState(false);
  const [dataExpired, setDataExpired] = useState([]);
  const reportRef = useRef(null);

  const today = new Date();
  const formattedCetak = today.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formatTanggal = (isoDateString) => {
    if (!isoDateString) return '-';
    const dt = new Date(isoDateString);
    return dt.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const fetchExpired = async () => {
    try {
      const response = await api.get('/laporan/barang-expired');
      setDataExpired(response.data);
    } catch (err) {
      console.error('Error fetching laporan barang expired:', err);
    }
  };

  useEffect(() => {
    if (show) {
      fetchExpired();
    } else {
      setDataExpired([]);
    }
  }, [show]);

  const handleDownloadPDF = async () => {
    setLoading(true);
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    let cursorY = 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LAPORAN Barang yang Masa Penitipannya Sudah Habis', pageWidth / 2, cursorY, {
      align: 'center',
    });
    cursorY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('ReUse Mart, Jl. Green Eco Park No. 456 Yogyakarta', pageWidth / 2, cursorY, {
      align: 'center',
    });
    cursorY += 5;
    doc.text(`Tanggal Cetak: ${formattedCetak}`, pageWidth / 2, cursorY, {
      align: 'center',
    });
    cursorY += 10;

    const element = reportRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const pdfWidth = pageWidth - 2 * margin;
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

    let heightLeft = pdfHeight;
    let position = cursorY;

    doc.addImage(imgData, 'PNG', margin, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight - position - margin;

    while (heightLeft > 0) {
      doc.addPage();
      position = margin;
      doc.addImage(imgData, 'PNG', margin, position - heightLeft, pdfWidth, pdfHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, {
        align: 'right',
      });
    }

    doc.save('laporan_barang_expired.pdf');
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
        <Modal.Title>Laporan Barang Expired</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div ref={reportRef} className="report-expired-content">
          <h5 className="text-center mb-3">
            <strong>ReUse Mart, Jl. Green Eco Park No. 456 Yogyakarta</strong>
          </h5>
          <h6 className="text-center mb-1">
            <strong>LAPORAN Barang yang Masa Penitipannya Sudah Habis</strong>
          </h6>
          <p className="text-center mb-4">Tanggal Cetak: {formattedCetak}</p>

          <Table striped bordered hover responsive className="report-expired-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>Kode Produk</th>
                <th style={{ width: '20%' }}>Nama Produk</th>
                <th style={{ width: '10%' }}>ID Penitip</th>
                <th style={{ width: '20%' }}>Nama Penitip</th>
                <th style={{ width: '13%' }}>Tanggal Masuk</th>
                <th style={{ width: '13%' }}>Tanggal Akhir</th>
                <th style={{ width: '14%' }}>Batas Ambil</th>
              </tr>
            </thead>

            <tbody>
              {dataExpired.length > 0 ? (
                dataExpired.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.kode_barang || '-'}</td>
                    <td>{row.nama_barang || '-'}</td>
                    <td>{row.id_penitip || '-'}</td>
                    <td>{row.nama_penitip || '-'}</td>
                    <td>{formatTanggal(row.tanggal_masuk)}</td>
                    <td>{formatTanggal(row.tanggal_akhir)}</td>
                    <td>{formatTanggal(row.batas_ambil)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">
                    {dataExpired.length === 0 && show
                      ? 'Memuat data...'
                      : 'Tidak ada barang yang masa penitipannya sudah habis.'}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Tutup
        </Button>
        <Button variant="primary" onClick={handleDownloadPDF} disabled={loading}>
          {loading ? 'Memproses...' : 'Download PDF'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LaporanBarangExpiredModal;
