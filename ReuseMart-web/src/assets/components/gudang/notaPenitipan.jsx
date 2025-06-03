import { useEffect, useState } from 'react';
import api from "../../../api/api.js";
import { Modal, Button, Row, Col, Toast, ToastContainer } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const cekGaransi = (garansi, today) => {
    if (!garansi) return '';
    const garansiDate = new Date(garansi);
    if (isNaN(garansiDate)) return '';
    return garansiDate >= new Date(today) ? `Garansi ON ${garansi}` : '';
};

const NotaPenitipan = ({ show, onHide, penitipanId }) => {
    const [barangList, setBarangList] = useState([]);
    const [userList, setUserList] = useState([]);
    const [penitipan, setPenitipan] = useState(null);
    const [pegawaiList, setPegawaiList] = useState([]);
    const [alamatList, setAlamatList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    const fetchData = async () => {
        if (!penitipanId) return;
        setLoading(true);
        try {
            const [tempPenitipan, tempBarang, tempUser, tempAlamat, tempPegawai] = await Promise.all([
                api.get(`/penitipan/getOne/${penitipanId}`),
                api.get('/barangGudang'),
                api.get('/user/gudang'),
                api.get('/alamat/gudang'),
                api.get('/pegawaiGudang'),
            ]);
            setPenitipan(tempPenitipan.data || null);
            setBarangList(tempBarang.data || []);
            setUserList(tempUser.data || []);
            setAlamatList(tempAlamat.data || []);
            setPegawaiList(tempPegawai.data || []);
        } catch (error) {
            setToastMessage('Gagal memuat data: ' + (error.message || 'Unknown error'));
            setToastVariant('danger');
            setToastShow(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show && penitipanId) fetchData();
    }, [show, penitipanId]);

    const showToast = (message, variant = "success") => {
        setToastMessage(message);
        setToastVariant(variant);
        setToastShow(true);
    };

    const getPegawaiByBarang = (barang) => {
        if (!barang || !barang.id_pegawai) return null;
        return pegawaiList.find(p => p.id_pegawai === barang.id_pegawai) || null;
    };

    const getUserByPenitipan = (penitipan) => {
        if (!penitipan || !penitipan.id_user) return null;
        return userList.find(u => u.id_user === penitipan.id_user) || null;
    };

    const getAlamatByUser = (user) => {
        if (!user || !user.id_user) return null;
        const defaultAlamat = alamatList.find(a => a.id_user === user.id_user && a.isDefault === 1);
        return defaultAlamat || alamatList.find(a => a.id_user === user.id_user) || { alamat: 'Alamat tidak ditemukan' };
    };

    const getBarangByPenitipan = (penitipanId) => {
        return barangList.filter(b => b.id_penitipan === penitipanId) || [];
    };

    const handleDownloadPDF = async () => {
        const element = document.querySelector('.nota-printable');
        if (!element) {
            showToast('Konten nota tidak ditemukan.', 'danger');
            return;
        }

        try {
            // Capture the nota content with html2canvas
            const canvas = await html2canvas(element, { 
                scale: 2, // Higher scale for better quality
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');

            // Initialize jsPDF with A4 size
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            // A4 dimensions: 210mm x 297mm
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 10;
            const maxImgWidth = pageWidth - 2 * margin; // 190mm
            const maxImgHeight = pageHeight - 2 * margin; // 277mm

            // Calculate dimensions to fit content within A4 page while maintaining aspect ratio
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const aspectRatio = imgWidth / imgHeight;

            let finalWidth = maxImgWidth;
            let finalHeight = finalWidth / aspectRatio;

            // If the height exceeds the max height, scale down based on height
            if (finalHeight > maxImgHeight) {
                finalHeight = maxImgHeight;
                finalWidth = finalHeight * aspectRatio;
            }

            // Add image to PDF centered
            const xPosition = margin + (maxImgWidth - finalWidth) / 2; // Center horizontally
            const yPosition = margin + (maxImgHeight - finalHeight) / 2; // Center vertically
            pdf.addImage(imgData, 'PNG', xPosition, yPosition, finalWidth, finalHeight);

            // Download the PDF
            pdf.save(`nota_penitipanbarang_${penitipan?.no_nota || 'penitipan'}.pdf`);
        } catch (error) {
            showToast('Gagal menghasilkan PDF: ' + error.message, 'danger');
        }
    };

    const currentUser = penitipan ? getUserByPenitipan(penitipan) : null;
    const currentAlamat = currentUser ? getAlamatByUser(currentUser) : null;
    const currentBarangList = getBarangByPenitipan(penitipanId);
    const currentPegawai = currentBarangList.length > 0 ? getPegawaiByBarang(currentBarangList[0]) : null;

    const today = new Date().toISOString().split('T')[0];
    const tanggalTitip = currentBarangList.length > 0 ? currentBarangList[0].tanggal_titip : today;
    const masaSampai = tanggalTitip
        ? new Date(new Date(tanggalTitip).setDate(new Date(tanggalTitip).getDate() + 30)).toISOString().split('T')[0]
        : new Date(new Date(today).setDate(new Date(today).getDate() + 30)).toISOString().split('T')[0];

    return (
        <div>
            <Modal show={show} onHide={onHide} centered backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Rincian Nota</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loading ? (
                        <p>Loading...</p>
                    ) : !penitipan ? (
                        <p>Data penitipan tidak ditemukan.</p>
                    ) : (
                        <div className="nota-printable" style={{ padding: '10px', border: '1px solid #000', borderRadius: '5px', backgroundColor: '#fff' }}>
                            <Row>
                                <strong>ReUse Mart</strong><br />
                                <small>Jl. Green Eco Park No. 456 Yogyakarta</small>
                            </Row>
                            <hr />
                            <Row>
                                <p>No Nota: {penitipan.no_nota || 'N/A'}</p>
                                <p>Tanggal Penitipan: {tanggalTitip}</p>
                                <p>Masa Sampai: {masaSampai}</p>
                            </Row>
                            <hr />
                            <Row>
                                <p>
                                    <strong>Penitip:</strong> {currentUser ? `T${currentUser.id_user} - ${currentUser.first_name} ${currentUser.last_name}` : 'Unknown'}<br />
                                    {currentAlamat ? currentAlamat.alamat : 'Tidak ada'}<br />
                                    {(currentAlamat && currentAlamat.kecamatan && currentAlamat.kota)
                                        ? `${currentAlamat.kecamatan}, ${currentAlamat.kota}`
                                        : ''}
                                </p>
                            </Row>
                            <hr />
                            {currentBarangList.length === 0 ? (
                                <p>Tidak ada barang untuk penitipan ini.</p>
                            ) : (
                                currentBarangList.map((barang, index) => (
                                    <Row key={index} className="mb-2">
                                        <Col xs={8}>
                                            <p>
                                                {barang.nama_barang}<br />
                                                {cekGaransi(barang.garansi, today)}<br />
                                                Berat Barang: {barang.berat} kg
                                            </p>
                                        </Col>
                                        <Col xs={4} className="text-end">
                                            <p>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(barang.harga || 0)}</p>
                                        </Col>
                                    </Row>
                                ))
                            )}
                            <hr />
                            <Row>
                                <p>
                                    <strong>Diterima dan QC Oleh:</strong> {currentPegawai ? `P${currentPegawai.id_pegawai} - ${currentPegawai.first_name} ${currentPegawai.last_name}` : 'Unknown'}
                                </p>
                            </Row>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={handleDownloadPDF}>
                        Cetak PDF
                    </Button>
                    <Button variant="secondary" onClick={onHide}>
                        Tutup
                    </Button>
                </Modal.Footer>
            </Modal>
            <ToastContainer className="position-fixed top-50 start-50 translate-middle z-3" style={{ minWidth: '200px' }}>
                <Toast show={toastShow} onClose={() => setToastShow(false)} delay={3000} autohide bg={toastVariant}>
                    <Toast.Header>
                        <strong className="me-auto">{toastVariant === 'success' ? 'Sukses' : 'Error'}</strong>
                    </Toast.Header>
                    <Toast.Body className={toastVariant === 'success' ? 'text-white' : ''}>{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default NotaPenitipan;