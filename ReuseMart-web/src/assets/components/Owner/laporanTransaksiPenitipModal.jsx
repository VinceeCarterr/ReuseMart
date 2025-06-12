import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Table, Form, Row, Col } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../../api/api.js';

const LaporanTransaksiPenitipModal = ({ show, handleClose }) => {
    const [penitipList, setPenitipList] = useState([]);
    const [selectedPenitip, setSelectedPenitip] = useState('');
    const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1);
    const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState({ penitip: {}, transaksi: [] });
    const [isLoading, setIsLoading] = useState(false);
    const tableRef = useRef(null);

    const currentDate = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const bulanOptions = [
        { value: 1, label: 'Januari' },
        { value: 2, label: 'Februari' },
        { value: 3, label: 'Maret' },
        { value: 4, label: 'April' },
        { value: 5, label: 'Mei' },
        { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' },
        { value: 8, label: 'Agustus' },
        { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' },
        { value: 12, label: 'Desember' },
    ];

    useEffect(() => {
        fetchPenitipList();
    }, []);

    const fetchPenitipList = async () => {
        try {
            const response = await api.get('/penitip');
            setPenitipList(response.data);
        } catch (error) {
            console.error('Error fetching penitip list:', error);
            alert('Gagal memuat daftar penitip');
        }
    };

    const fetchReportData = async () => {
        if (!selectedPenitip) {
            alert('Pilih penitip terlebih dahulu');
            return;
        }
        setIsLoading(true);
        try {
            const response = await api.get('/laporan/transaksi-penitip', {
                params: {
                    id_user: selectedPenitip,
                    bulan: selectedBulan,
                    tahun: selectedTahun
                }
            });
            setReportData(response.data);
        } catch (error) {
            console.error('Error fetching report data:', error);
            alert('Gagal memuat laporan transaksi penitip: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const generatePDF = async () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text('ReUse Mart', 14, 20);
            doc.setFontSize(12);
            doc.text('Jl. Green Eco Park No. 456 Yogyakarta', 14, 28);
            doc.setFontSize(14);
            doc.text('LAPORAN TRANSAKSI PENITIP', 14, 38);
            doc.setFontSize(12);
            doc.text(`ID Penitip: T${reportData.penitip.id_user}`, 14, 46);
            doc.text(`Nama Penitip: ${reportData.penitip.nama}`, 14, 54);
            doc.text(`Bulan: ${bulanOptions.find(b => b.value === selectedBulan)?.label}`, 14, 62);
            doc.text(`Tahun: ${selectedTahun}`, 14, 70);
            doc.text(`Tanggal Cetak: ${currentDate}`, 14, 78);

            if (tableRef.current) {
                const canvas = await html2canvas(tableRef.current, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 180;
                const pageHeight = doc.internal.pageSize.height;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let positionY = 86;

                doc.addImage(imgData, 'PNG', 14, positionY, imgWidth, imgHeight);
                if (positionY + imgHeight > pageHeight - 20) {
                    doc.addPage();
                    doc.addImage(imgData, 'PNG', 14, 20, imgWidth, imgHeight);
                }
            }

            doc.save(`Laporan_Transaksi_Penitip_T${reportData.penitip.id_user}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Gagal menghasilkan PDF');
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>Laporan Transaksi Penitip</Modal.Title>
            </Modal.Header>
            <Modal.Body>

                <div className="mb-3">
                    <h5>ReUse Mart</h5>
                    <p>Jl. Green Eco Park No. 456 Yogyakarta</p>
                    <Form className="mb-4">
                        <Row>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Pilih Penitip</Form.Label>
                                    <Form.Select
                                        value={selectedPenitip}
                                        onChange={(e) => setSelectedPenitip(e.target.value)}
                                    >
                                        <option value="">Pilih Penitip</option>
                                        {penitipList.map((penitip) => (
                                            <option key={penitip.id_user} value={penitip.id_user}>
                                                T{penitip.id_user} - {penitip.first_name} {penitip.last_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Bulan</Form.Label>
                                    <Form.Select
                                        value={selectedBulan}
                                        onChange={(e) => setSelectedBulan(Number(e.target.value))}
                                    >
                                        {bulanOptions.map((bulan) => (
                                            <option key={bulan.value} value={bulan.value}>
                                                {bulan.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Tahun</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={selectedTahun}
                                        onChange={(e) => setSelectedTahun(Number(e.target.value))}
                                        min="2000"
                                        max="2100"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2} className="d-flex align-items-end">
                                <Button variant="primary" onClick={fetchReportData} disabled={isLoading}>
                                    Tampilkan
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                    {reportData.penitip.id_user && (
                        <>
                            <p><strong>ID Penitip:</strong> T{reportData.penitip.id_user}</p>
                            <p><strong>Nama Penitip:</strong> {reportData.penitip.nama}</p>
                            <p><strong>Bulan:</strong> {bulanOptions.find(b => b.value === selectedBulan)?.label}</p>
                            <p><strong>Tahun:</strong> {selectedTahun}</p>
                            <p><strong>Tanggal Cetak:</strong> {currentDate}</p>
                        </>
                    )}
                </div>
                <div className="d-flex justify-content-end mb-3">
                </div>

                {isLoading ? (
                    <p>Memuat data...</p>
                ) : reportData.transaksi.length === 0 ? (
                    <p>Tidak ada transaksi untuk penitip ini pada periode tersebut.</p>
                ) : (
                    <Table striped hover responsive ref={tableRef}>
                        <thead>
                            <tr>
                                <th>Kode Produk</th>
                                <th>Nama Produk</th>
                                <th>Tanggal Masuk</th>
                                <th>Tanggal Laku</th>
                                <th>Harga Jual Bersih</th>
                                <th>Bonus Terjual Cepat</th>
                                <th>Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.transaksi.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.kode_barang}</td>
                                    <td>{item.nama_barang}</td>
                                    <td>{new Date(item.tanggal_masuk).toLocaleDateString('id-ID')}</td>
                                    <td>{new Date(item.tanggal_laku).toLocaleDateString('id-ID')}</td>
                                    <td>Rp {item.harga_jual_bersih.toLocaleString('id-ID')}</td>
                                    <td>Rp {item.bonus_cepat.toLocaleString('id-ID')}</td>
                                    <td>Rp {item.pendapatan.toLocaleString('id-ID')}</td>
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
                    variant="success"
                    onClick={generatePDF}
                    disabled={isLoading || reportData.transaksi.length === 0}
                >
                    Unduh PDF
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default LaporanTransaksiPenitipModal;