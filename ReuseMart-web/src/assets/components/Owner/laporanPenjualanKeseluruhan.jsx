import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../../../api/api.js';
import './laporanPenjualanKeseluruhan.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const LaporanPenjualanKeseluruhan = ({ show, handleClose }) => {
    const [loading, setLoading] = useState(true);
    const [transaksiList, setTransaksiList] = useState([]);
    const reportRef = useRef();

    const fetchData = async () => {
        try {
            const response = await api.get('/transaksiOwner');
            setTransaksiList(response.data || []);
        } catch (error) {
            console.error('Fetch data gagal', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const aggregateMonthlyData = () => {
        const monthlyData = {};
        const currentYear = new Date().getFullYear();

        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        months.forEach(month => {
            const key = `${month} ${currentYear}`;
            monthlyData[key] = { barangTerjual: 0, penjualanKotor: 0 };
        });

        transaksiList.forEach((transaksi) => {
            const date = new Date(transaksi.tanggal_transaksi);
            const month = date.toLocaleString('id-ID', { month: 'long' });
            const year = date.getFullYear();
            const key = `${month} ${year}`;

            if (year === currentYear && monthlyData[key]) {
                monthlyData[key].barangTerjual += transaksi.jumlah_item || 0;
                monthlyData[key].penjualanKotor += transaksi.total || 0;
            }
        });

        return monthlyData;
    };

    const monthlyData = aggregateMonthlyData();
    const months = Object.keys(monthlyData);
    const totalBarangTerjual = months.reduce((sum, month) => sum + monthlyData[month].barangTerjual, 0);
    const totalPenjualanKotor = months.reduce((sum, month) => sum + monthlyData[month].penjualanKotor, 0);

    const today = new Date();
    const formattedDate = today.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const handleDownloadPDF = async () => {
    setLoading(true);
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    let positionY = 10;

    // Add header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LAPORAN PENJUALAN BULANAN', pageWidth / 2, positionY, { align: 'center' });
    positionY += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Reuse Mart, Jl. Green Eco Park No. 456 Yogyakarta', pageWidth / 2, positionY, { align: 'center' });
    positionY += 5;
    doc.text(`Tanggal Cetak: ${formattedDate}`, pageWidth / 2, positionY, { align: 'center' });
    positionY += 10;

    // Capture the report content using html2canvas
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

    // Calculate the height of one PDF page in canvas pixel terms
    const pageHeightInCanvas = (pageHeight - 2 * margin) * (imgWidth / pdfWidth);

    let heightLeft = imgHeight;
    let canvasY = 0;
    let pageIndex = 0;

    while (heightLeft > 0) {
        if (pageIndex > 0) {
            doc.addPage();
        }

        // Create a temporary canvas to crop the image for the current page
        const tempCanvas = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');
        tempCanvas.width = imgWidth;
        tempCanvas.height = Math.min(pageHeightInCanvas, heightLeft);

        // Draw only the relevant portion of the original canvas
        tempContext.drawImage(
            canvas,
            0, canvasY, imgWidth, tempCanvas.height,
            0, 0, imgWidth, tempCanvas.height
        );

        const pageImgData = tempCanvas.toDataURL('image/png', 1.0);
        doc.addImage(pageImgData, 'PNG', margin, positionY, pdfWidth, (tempCanvas.height * pdfWidth) / imgWidth);

        heightLeft -= pageHeightInCanvas;
        canvasY += pageHeightInCanvas;
        pageIndex++;
    }

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    doc.save('laporan_penjualan_bulanan.pdf');
    setLoading(false);
};

    const chartData = {
        labels: months.map(month => month.split(' ')[0].slice(0, 3)),
        datasets: [{
            label: 'Total Penjualan Kotor',
            data: months.map(month => monthlyData[month].penjualanKotor),
            backgroundColor: '#4682B4',
            borderColor: '#4169E1',
            borderWidth: 1,
        }],
    };

    const chartOptions = {
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Penjualan Kotor (Rp)',
                },
            },
            x: {
                title: {
                    display: true,
                    text: 'Bulan',
                },
            },
        },
        plugins: {
            legend: {
                labels: {
                    color: '#000000',
                },
            },
        },
    };

    return (
        <Modal
            show={show}
            onHide={handleClose}
            size="xl"
            centered
            dialogClassName="custom-modal-width"
            className="modal-with-border"
        >
            <Modal.Header closeButton>
                <Modal.Title>Laporan Penjualan Bulanan</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div ref={reportRef} className="report-content">
                        <p><strong>Reuse Mart, Jl. Green Eco Park No. 456 Yogyakarta</strong></p>
                        <p>Tanggal Cetak: {formattedDate}</p>
                        <Table striped bordered hover responsive className="report-table">
                            <thead>
                                <tr>
                                    <th>Bulan Tahun</th>
                                    <th>Jumlah Barang Terjual</th>
                                    <th>Jumlah Penjualan Kotor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {months.map((monthYear) => (
                                    <tr key={monthYear}>
                                        <td>{monthYear}</td>
                                        <td>{monthlyData[monthYear].barangTerjual > 0 ? monthlyData[monthYear].barangTerjual : 'Tidak terdapat transaksi'}</td>
                                        <td>{monthlyData[monthYear].penjualanKotor > 0 ? `Rp ${monthlyData[monthYear].penjualanKotor.toLocaleString('id-ID')}` : 'Tidak terdapat transaksi'}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td><strong>Total</strong></td>
                                    <td><strong>{totalBarangTerjual}</strong></td>
                                    <td><strong>Rp {totalPenjualanKotor.toLocaleString('id-ID')}</strong></td>
                                </tr>
                            </tbody>
                        </Table>
                        <div style={{ width: '100%', height: '400px' }}>
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                    </div>
                )}
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

export default LaporanPenjualanKeseluruhan;