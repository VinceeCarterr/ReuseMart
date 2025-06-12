import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../../api/api.js';// Import a CSS file for styling

const LaporanKomisiBulananPerProduk = ({ show, handleClose }) => {
    const [loading, setLoading] = useState(false);
    const [barangList, setBarangList] = useState([]);
    const [dtList, setDtList] = useState([]);
    const [transaksiList, setTransaksiList] = useState([]);
    const reportRef = useRef();

    const fetchData = async () => {
        try {
            const [barangResponse, dtResponse, transaksiResponse] = await Promise.all([
                api.get('/barangOwner'),
                api.get('/dtOwner'),
                api.get('/transaksiOwner'),
            ]);
            setBarangList(barangResponse.data || []);
            setDtList(dtResponse.data || []);
            setTransaksiList(transaksiResponse.data || []);
        } catch (error) {
            console.error('Fetch data gagal', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getDTbyBarang = (barangId) => {
        return dtList.filter((dt) => dt.id_barang === barangId);
    };

    const getTransaksibyDT = (dt) => {
        return transaksiList.find((transaksi) => transaksi.id_transaksi === dt.id_transaksi) || null;
    };

    const calculateCommissions = (barang) => {
        const dt = getDTbyBarang(barang.id_barang)[0];
        const transaksi = dt ? getTransaksibyDT(dt) : null;
        if (!transaksi || !barang || barang.status !== 'Sold') return { hunter: 0, reuseMart: 0, bonus: 0 };

        const hargaJual = barang.harga || 0;
        const tanggalMasuk = new Date(barang.tanggal_titip);
        const tanggalLaku = new Date(transaksi.tanggal_transaksi);
        const diffDays = (tanggalLaku - tanggalMasuk) / (1000 * 60 * 60 * 24);

        let hunterCommission = 0;
        let reuseMartCommission = 0;
        let bonusPenitip = 0;

        if (diffDays > 30) {
            reuseMartCommission = hargaJual * 0.3;
        } else {
            hunterCommission = hargaJual * 0.05;
            reuseMartCommission = hargaJual * 0.2;
            if (diffDays <= 7) {
                if (barang.byHunter === 0) {
                    bonusPenitip = reuseMartCommission * 0.1;
                    reuseMartCommission -= bonusPenitip;
                    hunterCommission = 0;
                } else {
                    bonusPenitip = reuseMartCommission * 0.1;
                    reuseMartCommission -= bonusPenitip;
                    reuseMartCommission -= hunterCommission;
                }
            }
        }

        return {
            hunter: Math.round(hunterCommission),
            reuseMart: Math.round(reuseMartCommission),
            bonus: Math.round(bonusPenitip),
        };
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

    const tableData = barangList
        .filter((barang) => {
            const dt = getDTbyBarang(barang.id_barang)[0];
            const transaksi = dt ? getTransaksibyDT(dt) : null;
            if (!transaksi || barang.status !== 'Sold') return false;
            const tanggalLaku = new Date(transaksi.tanggal_transaksi);
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            return tanggalLaku.getMonth() === currentMonth && tanggalLaku.getFullYear() === currentYear;
        })
        .map((barang) => {
            const commissions = calculateCommissions(barang);
            const dt = getDTbyBarang(barang.id_barang)[0];
            const transaksi = dt ? getTransaksibyDT(dt) : null;
            return {
                ...barang,
                tanggal_laku: transaksi ? formatDate(transaksi.tanggal_transaksi) : '-',
                ...commissions,
            };
        });

    const totalHunter = tableData.reduce((sum, item) => sum + item.hunter, 0);
    const totalReuseMart = tableData.reduce((sum, item) => sum + item.reuseMart, 0);
    const totalBonus = tableData.reduce((sum, item) => sum + item.bonus, 0);

    const today = new Date();
    const formattedDate = today.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const currentMonthName = today.toLocaleDateString('id-ID', { month: 'long' });
    const currentYear = today.getFullYear();

    const handleDownloadPDF = async () => {
        setLoading(true);
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;
        let positionY = 10;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('LAPORAN KOMISI BULANAN PER PRODUK', pageWidth / 2, positionY, { align: 'center' });
        positionY += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Reuse Mart, Jl. Green Eco Park No. 456 Yogyakarta', pageWidth / 2, positionY, { align: 'center' });
        positionY += 5;
        doc.text(`Bulan: ${currentMonthName}`, pageWidth / 2, positionY, { align: 'center' });
        positionY += 5;
        doc.text(`Tahun: ${currentYear}`, pageWidth / 2, positionY, { align: 'center' });
        positionY += 5;
        doc.text(`Tanggal Cetak: ${formattedDate}`, pageWidth / 2, positionY, { align: 'center' });
        positionY += 10;

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
        let position = positionY;

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
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }

        doc.save('laporan_komisi_bulanan_per_produk.pdf');
        setLoading(false);
    };

    return (
        <Modal
            show={show}
            onHide={handleClose}
            size="xl"
            centered
            dialogClassName="custom-modal-width"
            className="modal-with-border" // Add the CSS class here
        >
            <Modal.Header closeButton>
                <Modal.Title>Laporan Komisi Bulanan Per Produk</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div ref={reportRef} className="report-content">
                    <p><strong>Reuse Mart, Jl. Green Eco Park No. 456 Yogyakarta</strong></p>
                    <p>Bulan: {currentMonthName}</p>
                    <p>Tahun: {currentYear}</p>
                    <p>Tanggal Cetak: {formattedDate}</p>
                    <Table striped bordered hover responsive className="report-table">
                        <thead>
                            <tr>
                                <th style={{ width: '12%' }}>Kode Produk</th>
                                <th style={{ width: '20%' }}>Nama Produk</th>
                                <th style={{ width: '12%' }}>Harga Jual</th>
                                <th style={{ width: '14%' }}>Tanggal Masuk</th>
                                <th style={{ width: '14%' }}>Tanggal Laku</th>
                                <th style={{ width: '12%' }}>Komisi Hunter</th>
                                <th style={{ width: '12%' }}>Komisi ReUseMart</th>
                                <th style={{ width: '12%' }}>Bonus Penitip</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.kode_barang || 'N/A'}</td>
                                    <td>{item.nama_barang || 'N/A'}</td>
                                    <td>Rp {item.harga.toLocaleString('id-ID')}</td>
                                    <td>{formatDate(item.tanggal_titip)}</td>
                                    <td>{item.tanggal_laku}</td>
                                    <td>Rp {item.hunter.toLocaleString('id-ID')}</td>
                                    <td>Rp {item.reuseMart.toLocaleString('id-ID')}</td>
                                    <td>Rp {item.bonus.toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan="5"><strong>Total</strong></td>
                                <td><strong>Rp {totalHunter.toLocaleString('id-ID')}</strong></td>
                                <td><strong>Rp {totalReuseMart.toLocaleString('id-ID')}</strong></td>
                                <td><strong>Rp {totalBonus.toLocaleString('id-ID')}</strong></td>
                            </tr>
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

export default LaporanKomisiBulananPerProduk;