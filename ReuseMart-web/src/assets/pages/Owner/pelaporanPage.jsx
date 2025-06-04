import NavbarOwner from '../../components/Navbar/navbarOwner.jsx';
import React, { useState } from 'react';
import { Container, Row, Col, Button, Table, Card } from 'react-bootstrap';
import LaporanStokGudang from '../../components/Owner/laporanStokGudang.jsx';
import './pelaporanPage.css';

const PelaporanPage = () => {
    const [showStockReportModal, setShowStockReportModal] = useState(false);

    const reports = [
        { name: 'Penjualan Bulanan Keseluruhan', action: () => handleReportClick('monthly-sales') },
        { name: 'Laporan Komisi Bulanan per Produk', action: () => handleReportClick('monthly-commission') },
        { name: 'Laporan Stok Gudang', action: () => setShowStockReportModal(true) },
        { name: 'Laporan Penjualan per Kategori Barang', action: () => handleReportClick('category-sales') },
        { name: 'Laporan Barang yang Masa Penitipannya Sudah Habis', action: () => handleReportClick('expired-consignment') },
        { name: 'Laporan Donasi Barang', action: () => handleReportClick('donation') },
        { name: 'Laporan Request Donasi', action: () => handleReportClick('donation-request') },
        { name: 'Laporan Transaksi Penitip', action: () => handleReportClick('consignor-transaction') },
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
        </>
    );
};

export default PelaporanPage;