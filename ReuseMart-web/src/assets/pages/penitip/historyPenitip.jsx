import { useEffect, useState } from "react";
import api from "../../../api/api.js";
import NavbarPenitip from "../../components/Navbar/navbarPenitip.jsx";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Image,
    Modal,
    Table,
    Form,
} from "react-bootstrap";
import { Truck, Search } from "react-bootstrap-icons";
import { FiCalendar } from "react-icons/fi";
import "./historyPenitip.css";

const HistoryPenitip = () => {
    const [items, setItems] = useState([]);
    const [filterStatus, setFilterStatus] = useState("All");
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showDateModal, setShowDateModal] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [filterStatus, search, startDate, endDate]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params = {
                status: filterStatus === "All" ? "" : filterStatus,
                search: search || "",
                start_date: startDate || "",
                end_date: endDate || "",
            };
            const { data } = await api.get("transaksi/historyPenitip", { params });
            setItems(data.data);
            setTotal(data.total);
            console.log("historyPenitip JSON:", data); 
        } catch (err) {
            console.error("Error loading penitip history:", err);
        } finally {
            setLoading(false);
        }
    };

    const openDetail = (item) => {
        setSelectedItem(item);
        setShowDetail(true);
    };

    const closeDetail = () => {
        setShowDetail(false);
        setSelectedItem(null);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchHistory();
    };

    const handleResetDates = () => {
        setStartDate("");
        setEndDate("");
        setShowDateModal(false);
    };

    return (
        <>
            <NavbarPenitip />

            <Container className="mt-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold">Riwayat Penitipan</h2>
                    <div className="d-flex align-items-center">
                        <Form className="me-3" onSubmit={handleSearch}>
                            <Form.Group className="d-flex align-items-center">
                                <Search className="me-2" />
                                <Form.Control
                                    type="text"
                                    placeholder="Cari nama/kode barang..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ width: "200px" }}
                                />
                            </Form.Group>
                        </Form>
                        <FiCalendar
                            className="me-3 fs-4 text-secondary"
                            style={{ cursor: "pointer" }}
                            onClick={() => setShowDateModal(true)}
                        />
                        <div>
                            {["All", "Available", "Sold", "Donated", "On Hold"].map((status) => (
                                <span
                                    key={status}
                                    className={`filter-option ${filterStatus === status ? "active" : ""}`}
                                    onClick={() => {
                                        setFilterStatus(status);
                                    }}
                                >
                                    {status}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {loading && <p className="text-center">Memuat...</p>}
                {!loading && items.length === 0 && (
                    <p className="text-center text-muted">
                        Tidak ada riwayat untuk status "{filterStatus}"
                        {startDate && endDate
                            ? ` dari ${startDate} sampai ${endDate}`
                            : ""}.
                    </p>
                )}

                <Row>
                    {items.map((item) => (
                        <Col md={6} key={item.id_barang} className="mb-4">
                            <Card className="history-card h-100">
                                <Card.Header className="d-flex justify-content-between align-items-center py-3 px-4">
                                    <div className="store-name">{item.nama_barang}</div>
                                    <div className="status-area text-success">
                                        <Truck className="me-1" />
                                        <span className="status-text">{item.status}</span>
                                    </div>
                                </Card.Header>

                                <Card.Body className="py-4 px-4">
                                    <Row className="product-row align-items-center">
                                        <Col xs={4}>
                                            <Image
                                                src={
                                                    item.foto?.length > 0
                                                    ? `http://127.0.0.1:8000/storage/${item.foto[0]}`
                                                    : "/placeholder.jpg"
                                                    }
                                                thumbnail
                                                rounded
                                            />
                                        </Col>
                                        <Col xs={8}>
                                            <div className="product-name">{item.nama_barang}</div>
                                            <div className="product-price">
                                                Rp{(item.harga || 0).toLocaleString("id-ID")}
                                            </div>
                                            <div className="product-category">
                                                {item.kategori?.nama_kategori}{" "}
                                                {item.kategori?.sub_kategori &&
                                                    `- ${item.kategori.sub_kategori}`}
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>

                                <Card.Footer className="d-flex justify-content-between align-items-center py-3 px-4">
                                    <small className="tanggal-text">
                                        Dititipkan:{" "}
                                        {new Date(item.tanggal_titip).toLocaleDateString("id-ID")}
                                    </small>
                                    <div className="d-flex align-items-center">
                                        <Button
                                            size="sm"
                                            variant="outline-success"
                                            onClick={() => openDetail(item)}
                                        >
                                            Lihat Detail
                                        </Button>
                                        {item.status === "Available" &&
                                            new Date(item.akhir_penitipan) > new Date() && (
                                                <Button
                                                    size="sm"
                                                    variant="success"
                                                    className="ms-2"
                                                >
                                                    Perpanjang
                                                </Button>
                                            )}
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Date Range Modal */}
                <Modal show={showDateModal} onHide={() => setShowDateModal(false)} centered>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Dari</Form.Label>
                            <Form.Control
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className="fw-bold">Sampai</Form.Label>
                            <Form.Control
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={handleResetDates}>
                            Reset
                        </Button>
                        <Button variant="danger" onClick={() => setShowDateModal(false)}>
                            Batal
                        </Button>
                        <Button variant="success" onClick={() => setShowDateModal(false)}>
                            Terapkan
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Detail Modal */}
                <Modal show={showDetail} onHide={closeDetail} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Detail Penitipan</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedItem && (
                            <>
                                <div className="d-flex justify-content-between mb-4">
                                    <h5>{selectedItem.nama_barang}</h5>
                                    <div className="status-area text-success">
                                        <Truck className="me-1" />
                                        {selectedItem.status}
                                    </div>
                                </div>

                                <Row className="mb-4">
                                    <Col md={4}>
                                        <Image
                                            src={
                                                selectedItem.foto && selectedItem.foto.length > 0
                                                    ? `http://127.0.0.1:8000/storage/${selectedItem.foto[0]}`
                                                    : "/placeholder.jpg"
                                            }
                                            thumbnail
                                            style={{ width: "100%" }}
                                        />
                                    </Col>
                                    <Col md={8}>
                                        <Table borderless>
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <strong>Kode Barang</strong>
                                                    </td>
                                                    <td>{selectedItem.kode_barang}</td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <strong>Kategori</strong>
                                                    </td>
                                                    <td>
                                                        {selectedItem.kategori?.nama_kategori}{" "}
                                                        {selectedItem.kategori?.sub_kategori &&
                                                            `- ${selectedItem.kategori.sub_kategori}`}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <strong>Deskripsi</strong>
                                                    </td>
                                                    <td>{selectedItem.deskripsi || "–"}</td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <strong>Harga</strong>
                                                    </td>
                                                    <td>
                                                        Rp{(selectedItem.harga || 0).toLocaleString("id-ID")}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <strong>Garansi</strong>
                                                    </td>
                                                    <td>{selectedItem.garansi || "Tidak ada"}</td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <strong>Tanggal Penitipan</strong>
                                                    </td>
                                                    <td>
                                                        {new Date(selectedItem.tanggal_titip).toLocaleDateString("id-ID")}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <strong>Akhir Penitipan</strong>
                                                    </td>
                                                    <td>
                                                        {new Date(selectedItem.akhir_penitipan).toLocaleDateString("id-ID")}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <strong>Status Periode</strong>
                                                    </td>
                                                    <td>{selectedItem.status_periode || "–"}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Col>
                                </Row>

                                {selectedItem.transaksi && (
                                    <>
                                        <h5 className="mt-4">Detail Transaksi</h5>
                                        <Table borderless responsive className="mb-4">
                                            <thead>
                                                <tr>
                                                    <th>Detail</th>
                                                    <th>Informasi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Tanggal Transaksi</td>
                                                    <td>
                                                        {new Date(selectedItem.transaksi.tanggal_transaksi).toLocaleDateString(
                                                            "id-ID"
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Subtotal</td>
                                                    <td>
                                                        Rp{(selectedItem.transaksi.subtotal || 0).toLocaleString("id-ID")}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Metode Pengiriman</td>
                                                    <td>{selectedItem.transaksi.metode_pengiriman}</td>
                                                </tr>
                                                <tr>
                                                    <td>Alamat Pengiriman</td>
                                                    <td>{selectedItem.transaksi.alamat || "–"}</td>
                                                </tr>
                                                <tr>
                                                    <td>Status Pembayaran</td>
                                                    <td>{selectedItem.transaksi.status_pembayaran || "–"}</td>
                                                </tr>
                                                {selectedItem.transaksi.pengiriman && (
                                                    <tr>
                                                        <td>Status Pengiriman</td>
                                                        <td>{selectedItem.transaksi.pengiriman.status_pengiriman}</td>
                                                    </tr>
                                                )}
                                                {selectedItem.transaksi.pengambilan && (
                                                    <tr>
                                                        <td>Status Pengambilan</td>
                                                        <td>{selectedItem.transaksi.pengambilan.status_pengambilan}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td>Komisi Perusahaan</td>
                                                    <td>
                                                        Rp{(selectedItem.transaksi.komisi_perusahaan || 0).toLocaleString(
                                                            "id-ID"
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Komisi Hunter</td>
                                                    <td>
                                                        Rp{(selectedItem.transaksi.komisi_hunter || 0).toLocaleString("id-ID")}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Saldo Diterima</td>
                                                    <td>
                                                        Rp{(selectedItem.transaksi.saldo_penitip || 0).toLocaleString("id-ID")}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </>
                                )}

                                {selectedItem.donasi && (
                                    <>
                                        <h5 className="mt-4">Detail Donasi</h5>
                                        <Table borderless>
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <strong>Organisasi Penerima</strong>
                                                    </td>
                                                    <td>{selectedItem.donasi.organisasi}</td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <strong>Tanggal Donasi</strong>
                                                    </td>
                                                    <td>
                                                        {new Date(selectedItem.donasi.tanggal_donasi).toLocaleDateString(
                                                            "id-ID"
                                                        )}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </>
                                )}
                            </>
                        )}
                    </Modal.Body>
                </Modal>
            </Container>
        </>
    );
};

export default HistoryPenitip;