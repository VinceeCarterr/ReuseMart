import NavbarOwner from '../../components/Navbar/navbarOwner.jsx';
import React, { useState } from 'react';
import { Container, Row, Col, Button, Table, Card } from 'react-bootstrap';
import LaporanStokGudang from '../../components/Owner/laporanStokGudang.jsx';
import LaporanPenjualanPerKatModal from '../../components/Owner/laporanPenjualanPerKatModal.jsx';
import LaporanBarangExpiredModal from '../../components/Owner/laporanBarangExpiredModal.jsx';
import LaporanDonasiBarangModal from '../../components/Owner/laporanDonasiBarangModal.jsx';
import LaporanRequestDonasiModal from '../../components/Owner/laporanRequestDonasiModal.jsx';
import LaporanTransaksiPenitipModal from '../../components/Owner/laporanTransaksiPenitipModal.jsx';
import LaporanKomisiBulananPerProduk from '../../components/Owner/laporanKomisiBUlananPerProduk.jsx';
import LaporanPenjualanKeseluruhan from '../../components/Owner/laporanPenjualanKeseluruhan.jsx'; // Import the new component
import './pelaporanPage.css';

const PelaporanPage = () => {
    const [showStockReportModal, setShowStockReportModal] = useState(false);
    const [showPenjualanPerKatModal, setShowPenjualanPerKatModal] = useState(false);
    const [showExpiredModal, setShowExpiredModal] = useState(false);
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [showRequestDonationModal, setShowRequestDonationModal] = useState(false);
    const [showTransaksiPenitipModal, setShowTransaksiPenitipModal] = useState(false);
    const [showKomisiBulananModal, setShowKomisiBulananModal] = useState(false);
    const [showPenjualanKeseluruhanModal, setShowPenjualanKeseluruhanModal] = useState(false); // New state for the modal

    const reports = [
        { name: 'Penjualan Bulanan Keseluruhan', action: () => setShowPenjualanKeseluruhanModal(true) }, // Updated action
        { name: 'Laporan Komisi Bulanan per Produk', action: () => setShowKomisiBulananModal(true) },
        { name: 'Laporan Stok Gudang', action: () => setShowStockReportModal(true) },
        { name: 'Laporan Penjualan per Kategori Barang', action: () => setShowPenjualanPerKatModal(true) },
        { name: 'Laporan Barang yang Masa Penitipannya Sudah Habis', action: () => setShowExpiredModal(true) },
        { name: 'Laporan Donasi Barang', action: () => setShowDonationModal(true) },
        { name: 'Laporan Request Donasi', action: () => setShowRequestDonationModal(true) },
        { name: 'Laporan Transaksi Penitip', action: () => setShowTransaksiPenitipModal(true) },
    ];

    const handleReportClick = (reportType) => {
        console.log(`Mengklik laporan: ${reportType}`);
    };

    return (
        <>
            <NavbarOwner />
            <Container className="mt-5 mb-5">
                <Row className="mb-4">
                    <Col md={12}>
                        <h2 className="text-success fw-bold welcome-heading">Daftar Pelaporan</h2>
                    </Col>
                </Row>
                <hr />
                <Card className="shadow-sm border-0">
                    <Card.Body>
                        <Table striped hover responsive className="report-table">
                            <thead>
                                <tr>
                                    <th className="text-center">No</th>
                                    <th>Nama Laporan</th>
                                    <th className="text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report, index) => (
                                    <tr key={index}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{report.name}</td>
                                        <td className="text-center">
                                            <Button
                                                variant="outline-success"
                                                size="sm"
                                                className="action-button"
                                                onClick={report.action}
                                            >
                                                Lihat Detail
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </Container>
            <LaporanStokGudang
                show={showStockReportModal}
                handleClose={() => setShowStockReportModal(false)}
            />
            <LaporanPenjualanPerKatModal
                show={showPenjualanPerKatModal}
                handleClose={() => setShowPenjualanPerKatModal(false)}
            />
            <LaporanBarangExpiredModal
                show={showExpiredModal}
                handleClose={() => setShowExpiredModal(false)}
            />
            <LaporanDonasiBarangModal
                show={showDonationModal}
                handleClose={() => setShowDonationModal(false)}
            />
            <LaporanRequestDonasiModal
                show={showRequestDonationModal}
                handleClose={() => setShowRequestDonationModal(false)}
            />
            <LaporanTransaksiPenitipModal
                show={showTransaksiPenitipModal}
                handleClose={() => setShowTransaksiPenitipModal(false)}
            />
            <LaporanKomisiBulananPerProduk
                show={showKomisiBulananModal}
                handleClose={() => setShowKomisiBulananModal(false)}
            />
            <LaporanPenjualanKeseluruhan
                show={showPenjualanKeseluruhanModal}
                handleClose={() => setShowPenjualanKeseluruhanModal(false)}
            /> {/* Added the new modal component */}
        </>
    );
};

export default PelaporanPage;