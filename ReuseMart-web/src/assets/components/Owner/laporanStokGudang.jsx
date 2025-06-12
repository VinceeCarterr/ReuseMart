import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../../api/api.js';
import './laporanStokGudang.css';

const LaporanStokGudang = ({ show, handleClose }) => {
    const [loading, setLoading] = useState(false);
    const [barangList, setBarangList] = useState([]);
    const [userList, setUserList] = useState([]);
    const [pegawaiList, setPegawaiList] = useState([]);
    const [penitipanList, setPenitipanList] = useState([]);
    const reportRef = useRef();

    const fetchData = async () => {
        try {
            const tempBarang = await api.get('/barangOwner');
            const tempPenitipan = await api.get('/penitipan/owner');
            const tempUser = await api.get('/userOwner');
            const tempPegawai = await api.get('/pegawaiOwner');

            setBarangList(tempBarang.data);
            setPenitipanList(tempPenitipan.data);
            setUserList(tempUser.data);
            setPegawaiList(tempPegawai.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Format date to show only day, month, and year (e.g., "4 Juni 2025")
    const today = new Date();
    const formattedDate = today.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const getUserByBarang = (barangId) => {
        const barang = barangList.find((b) => b.id_barang === barangId);
        if (!barang || !barang.id_penitipan) return null;
        const penitipan = penitipanList.find((p) => p.id_penitipan === barang.id_penitipan);
        return penitipan ? userList.find((u) => u.id_user === penitipan.id_user) : null;
    };

    const cekPerpanjangan = (statusPeriode) => {
        if (statusPeriode === 'Periode 2') return 'Ya';
        if (statusPeriode === 'Periode 1') return 'Tidak';
        return 'N/A';
    };

    const getHunterByBarang = (barang) => {
        if (!barang.byHunter) return { idHunter: '-', namaHunter: '-' };
        const hunter = pegawaiList.find((p) => p.id_pegawai === barang.byHunter && p.id_jabatan === 5);
        if (!hunter) return { idHunter: '-', namaHunter: '-' };
        return {
            idHunter: hunter.id_pegawai,
            namaHunter: `${hunter.first_name} ${hunter.last_name || ''}`.trim() || 'N/A',
        };
    };



    const handleDownloadPDF = async () => {
        setLoading(true);
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;
        let positionY = 10;

        // Add title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('LAPORAN STOK GUDANG', pageWidth / 2, positionY, { align: 'center' });
        positionY += 7;

        // Add address and date
        doc.setFontSize(9); // Reduced font size for address and date
        doc.setFont('helvetica', 'normal');
        doc.text('Reuse Mart, Jl. Green Eco Park No. 456 Yogyakarta', pageWidth / 2, positionY, { align: 'center' });
        positionY += 5;
        doc.text(`Tanggal Cetak: ${formattedDate}`, pageWidth / 2, positionY, { align: 'center' });
        positionY += 10;

        // Capture the table using html2canvas
        const element = reportRef.current;
        const canvas = await html2canvas(element, {
            scale: 2, // Reduced scale for better fit
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: element.offsetWidth,
            height: element.offsetHeight,
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // Calculate dimensions to fit A4
        const pdfWidth = pageWidth - 2 * margin;
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

        let heightLeft = pdfHeight;
        let position = positionY;

        // Add image to PDF, handling pagination
        doc.addImage(imgData, 'PNG', margin, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight - position - margin;

        while (heightLeft > 0) {
            doc.addPage();
            position = margin;
            doc.addImage(imgData, 'PNG', margin, position - heightLeft, pdfWidth, pdfHeight);
            heightLeft -= pageHeight - margin * 2;
        }

        // Add page numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }

        doc.save('laporan_stok_gudang.pdf');
        setLoading(false);
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === '-') return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
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
                <Modal.Title>Laporan Stok Gudang</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div ref={reportRef} className="report-content">
                    <p><strong>Reuse Mart, Jl. Green Eco Park No. 456 Yogyakarta</strong></p>
                    <p>Tanggal Cetak: {formattedDate}</p>
                    <Table striped bordered hover responsive className="report-table">
                        <thead>
                            <tr>
                                <th style={{ width: '10%' }}>Kode Produk</th>
                                <th style={{ width: '20%' }}>Nama Produk</th>
                                <th style={{ width: '8%' }}>ID Penitip</th>
                                <th style={{ width: '14%' }}>Nama Penitip</th>
                                <th style={{ width: '12%' }}>Tanggal Masuk</th>
                                <th style={{ width: '10%' }}>Perpanjangan</th>
                                <th style={{ width: '8%' }}>ID Hunter</th>
                                <th style={{ width: '14%' }}>Nama Hunter</th>
                                <th style={{ width: '14%' }}>Harga</th>
                            </tr>
                        </thead>
                        <tbody>
                            {barangList
                                .filter(
                                    (barang) =>
                                        barang.status === 'Available' &&
                                        (barang.status_periode === 'Periode 1' || barang.status_periode === 'Periode 2')
                                )
                                .map((barang, index) => {
                                    const penitip = getUserByBarang(barang.id_barang);
                                    const perpanjangan = cekPerpanjangan(barang.status_periode);
                                    const { idHunter, namaHunter } = getHunterByBarang(barang);

                                    return (
                                        <tr key={index}>
                                            <td>{barang.kode_barang || 'N/A'}</td>
                                            <td>{barang.nama_barang || 'N/A'}</td>
                                            <td>{penitip ? penitip.id_user : 'N/A'}</td>
                                            <td>
                                                {penitip
                                                    ? `${penitip.first_name} ${penitip.last_name || ''}`.trim() || 'N/A'
                                                    : 'N/A'}
                                            </td>
                                            <td>{formatDate(barang.tanggal_titip)|| 'N/A'}</td>
                                            <td>{perpanjangan}</td>
                                            <td>{idHunter}</td>
                                            <td>{namaHunter}</td>
                                            <td>Rp {barang.harga || '0'}</td>
                                        </tr>
                                    );
                                })}
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

export default LaporanStokGudang;