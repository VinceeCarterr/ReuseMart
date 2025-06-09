import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../../api/api.js';

const LaporanRequestDonasiModal = ({ show, handleClose }) => {
    const [requestData, setRequestData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const tableRef = useRef(null);
    const currentDate = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    useEffect(() => {
        if (show) {
            fetchRequestData();
        }
    }, [show]);

    const fetchRequestData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/laporan/request-donasi');
            setRequestData(response.data);
            console.log('API response:', response.data);
        } catch (error) {
            console.error('Error fetching request data:', error);
            alert('Gagal memuat data request donasi: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const generatePDF = async () => {
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(16);
            doc.text('ReUse Mart', 14, 20);
            doc.setFontSize(12);
            doc.text('Jl. Green Eco Park No. 456 Yogyakarta', 14, 28);
            doc.setFontSize(14);
            doc.text('LAPORAN REQUEST DONASI', 14, 38);
            doc.setFontSize(12);
            doc.text(`Tanggal Cetak: ${currentDate}`, 14, 46);

            // Capture table
            if (tableRef.current) {
                const canvas = await html2canvas(tableRef.current, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 180; // A4 width (210mm) - margins
                const pageHeight = doc.internal.pageSize.height;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let positionY = 52;

                doc.addImage(imgData, 'PNG', 14, positionY, imgWidth, imgHeight);

                // Handle multi-page
                while (positionY + imgHeight > pageHeight - 20) {
                    doc.addPage();
                    positionY = 20;
                    doc.addImage(imgData, 'PNG', 14, positionY, imgWidth, imgHeight);
                }
            }

            doc.save('Laporan_Request_Donasi.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Gagal menghasilkan PDF: ' + error.message);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>Laporan Request Donasi</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <h5>ReUse Mart</h5>
                    <p>Jl. Green Eco Park No. 456 Yogyakarta</p>
                    <p><strong>Tanggal Cetak:</strong> {currentDate}</p>
                </div>
                <div className="d-flex justify-content-end mb-3">
                </div>
                {isLoading ? (
                    <p>Memuat data...</p>
                ) : requestData.length === 0 ? (
                    <p>Tidak ada data request donasi yang belum terpenuhi.</p>
                ) : (
                    <Table striped hover responsive ref={tableRef}>
                        <thead>
                            <tr>
                                <th>ID Organisasi</th>
                                <th>Nama</th>
                                <th>Alamat</th>
                                <th>Request</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requestData.map((item, index) => (
                                <tr key={index}>
                                    <td>ORG{item.id_user}</td>
                                    <td>{item.nama_organisasi || '-'}</td>
                                    <td>{item.alamat_organisasi || '-'}</td>
                                    <td>
                                        {item.nama_barangreq}
                                        {item.deskripsi ? ` (${item.deskripsi})` : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Tutup
                </Button>
                <Button
                    variant="primary"
                    onClick={generatePDF}
                    disabled={isLoading || requestData.length === 0}
                >
                    Unduh PDF
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default LaporanRequestDonasiModal;