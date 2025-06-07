import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../../api/api.js';

const LaporanDonasiBarangModal = ({ show, handleClose }) => {
    const [donationData, setDonationData] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isLoading, setIsLoading] = useState(false);
    const tableRef = useRef(null);
    const currentDate = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    useEffect(() => {
        if (show) {
            fetchDonationData();
        }
    }, [show]);

    const fetchDonationData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/laporan/donasi-barang');
            console.log('API response:', response.data);
            setDonationData(response.data);
        } catch (error) {
            console.error('Error fetching donation data:', error);
            alert('Gagal memuat data donasi: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const generatePDF = async () => {
        try {
            console.log('Generating PDF with donationData:', donationData);
            const doc = new jsPDF();
            doc.setFontSize(14);
            doc.text('ReUse Mart', 14, 20);
            doc.setFontSize(10);
            doc.text('Jl. Green Eco Park No. 456 Yogyakarta', 14, 28);
            doc.setFontSize(12);
            doc.text('LAPORAN DONASI BARANG', 14, 38);
            doc.text(`Tanggal Cetak: ${currentDate}`, 14, 46);

            if (tableRef.current) {
                const canvas = await html2canvas(tableRef.current, {
                    scale: 2,
                    useCORS: true
                });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 180;
                const pageHeight = doc.internal.pageSize.height;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let positionY = 52;

                doc.addImage(imgData, 'PNG', 14, positionY, imgWidth, imgHeight);

                while (positionY + imgHeight > pageHeight - 20) {
                    doc.addPage();
                    positionY = 20;
                    doc.addImage(imgData, 'PNG', 14, positionY, imgWidth, imgHeight);
                }
            } else {
                console.warn('Table element not found');
            }

            doc.save('Laporan_Donasi_Barang.pdf');
            console.log('PDF generated and saved');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Gagal menghasilkan PDF: ' + error.message);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>Laporan Donasi Barang</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <h5>ReUse Mart</h5>
                    <p>Jl. Green Eco Park No. 456 Yogyakarta</p>
                    <p><strong>Tahun:</strong> {year}</p>
                    <p><strong>Tanggal Cetak:</strong> {currentDate}</p>
                </div>
                <div className="d-flex justify-content-end mb-3">

                </div>
                {isLoading ? (
                    <p>Memuat data...</p>
                ) : donationData.length === 0 ? (
                    <p>Tidak ada data donasi.</p>
                ) : (
                    <Table striped hover responsive ref={tableRef}>
                        <thead>
                            <tr>
                                <th>Kode Produk</th>
                                <th>Nama Produk</th>
                                <th>Id Penitip</th>
                                <th>Nama Penitip</th>
                                <th>Tanggal Donasi</th>
                                <th>Organisasi</th>
                                <th>Nama Penerima</th>
                            </tr>
                        </thead>
                        <tbody>
                            {donationData.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.barang?.kode_barang || '-'}</td>
                                    <td>{item.barang?.nama_barang || 'Unknown'}</td>
                                    <td>{item.penitipan?.id_penitip || '-'}</td>
                                    <td>{`${item.penitipan?.user?.first_name || ''} ${item.penitipan?.user?.last_name || ''}`.trim() || '-'}</td>
                                    <td>{item.tanggal_donasi ? new Date(item.tanggal_donasi).toLocaleDateString('id-ID') : '-'}</td>
                                    <td>{item.req_donasi?.user?.first_name || '-'}</td>
                                    <td>{item.nama_penerima || '-'}</td>
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
                    disabled={isLoading || donationData.length === 0}
                >
                    Unduh PDF
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default LaporanDonasiBarangModal;