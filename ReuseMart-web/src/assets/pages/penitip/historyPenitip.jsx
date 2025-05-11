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
    Pagination,
} from "react-bootstrap";
import { Truck, Calendar, Search } from "react-bootstrap-icons";
import "./historyPenitip.css";

const HistoryPenitip = () => {
    const [items, setItems] = useState([]);
    const [filterStatus, setFilterStatus] = useState("All");
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showDetail, setShowDetail] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [currentPage, filterStatus, search, startDate, endDate]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                per_page: perPage,
                status: filterStatus === "All" ? "" : filterStatus,
                search: search || "",
                start_date: startDate || "",
                end_date: endDate || "",
            };
            const { data } = await api.get("transaksi/historyPenitip", { params });
            setItems(data.data);
            setCurrentPage(data.current_page);
            setLastPage(data.last_page);
            setPerPage(data.per_page);
            setTotal(data.total);
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

    const handlePageChange = (page) => {
        if (page >= 1 && page <= lastPage) {
            setCurrentPage(page);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1); // Reset ke halaman 1 saat pencarian baru
        fetchHistory();
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
                        <div>
                            {["All", "Available", "Sold", "Donated", "On Hold"].map((status) => (
                                <span
                                    key={status}
                                    className={`filter-option ${filterStatus === status ? "active" : ""}`}
                                    onClick={() => {
                                        setFilterStatus(status);
                                        setCurrentPage(1);
                                    }}
                                >
                                    {status}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <Row className="mb-4">
                    <Col md={6}>
                        <Form.Group className="d-flex align-items-center">
                            <Calendar className="me-2" />
                            <Form.Control
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="me-2"
                            />
                            <Form.Control
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {loading && <p className="text-center">Memuat...</p>}
                {!loading && items.length === 0 && (
                    <p className="text-center text-muted">
                        Tidak ada riwayat untuk status "{filterStatus}".
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
                                                src={item.foto.foto1 ? `http://127.0.0.1:8000/storage/${item.foto.foto1}` : "/placeholder.jpg"}
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
                                                {item.kategori?.nama_kategori} {item.kategori?.sub_kategori && ` - ${item.kategori.sub_kategori}`}
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>

                                <Card.Footer className="d-flex justify-content-between align-items-center py-3 px-4">
                                    <small className="tanggal-text">
                                        Dititipkan: {new Date(item.tanggal_titip).toLocaleDateString("id-ID")}
                                    </small>
                                    <div className="d-flex align-items-center">
                                        <Button
                                            size="sm"
                                            variant="outline-success"
                                            onClick={() => openDetail(item)}
                                        >
                                            Lihat Detail
                                        </Button>
                                        {item.status === "Available" && new Date(item.akhir_penitipan) > new Date() && (
                                            <Button size="sm" variant="success" className="ms-2">
                                                Perpanjang
                                            </Button>
                                        )}
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {total > 0 && (
                    <Pagination className="justify-content-center">
                        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                        {[...Array(lastPage).keys()].map((page) => (
                            <Pagination.Item
                                key={page + 1}
                                active={page + 1 === currentPage}
                                onClick={() => handlePageChange(page + 1)}
                            >
                                {page + 1}
                            </Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === lastPage} />
                        <Pagination.Last onClick={() => handlePageChange(lastPage)} disabled={currentPage === lastPage} />
                    </Pagination>
                )}
            </Container>

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
                                        src={selectedItem.foto.foto1 ? `http://127.0.0.1:8000/storage/${selectedItem.foto.foto1}` : "/placeholder.jpg"}
                                        thumbnail
                                        style={{ width: "100%" }}
                                    />
                                </Col>
                                <Col md={8}>
                                    <Table borderless>
                                        <tbody>
                                            <tr>
                                                <td><strong>Kode Barang</strong></td>
                                                <td>{selectedItem.kode_barang}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Kategori</strong></td>
                                                <td>
                                                    {selectedItem.kategori?.nama_kategori} {selectedItem.kategori?.sub_kategori && ` - ${selectedItem.kategori.sub_kategori}`}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><strong>Deskripsi</strong></td>
                                                <td>{selectedItem.deskripsi || "–"}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Harga</strong></td>
                                                <td>Rp{(selectedItem.harga || 0).toLocaleString("id-ID")}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Garansi</strong></td>
                                                <td>{selectedItem.garansi || "Tidak ada"}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Tanggal Penitipan</strong></td>
                                                <td>{new Date(selectedItem.tanggal_titip).toLocaleDateString("id-ID")}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Akhir Penitipan</strong></td>
                                                <td>{new Date(selectedItem.akhir_penitipan).toLocaleDateString("id-ID")}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Status Periode</strong></td>
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
                                                <td>ID Transaksi</td>
                                                <td>{selectedItem.transaksi.id_transaksi}</td>
                                            </tr>
                                            <tr>
                                                <td>Tanggal Transaksi</td>
                                                <td>{new Date(selectedItem.transaksi.tanggal_transaksi).toLocaleDateString("id-ID")}</td>
                                            </tr>
                                            <tr>
                                                <td>Subtotal</td>
                                                <td>Rp{(selectedItem.transaksi.subtotal || 0).toLocaleString("id-ID")}</td>
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
                                                <td>Rp{(selectedItem.transaksi.komisi_perusahaan || 0).toLocaleString("id-ID")}</td>
                                            </tr>
                                            <tr>
                                                <td>Komisi Hunter</td>
                                                <td>Rp{(selectedItem.transaksi.komisi_hunter || 0).toLocaleString("id-ID")}</td>
                                            </tr>
                                            <tr>
                                                <td>Saldo Diterima</td>
                                                <td>Rp{(selectedItem.transaksi.saldo_penitip || 0).toLocaleString("id-ID")}</td>
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
                                                <td><strong>Organisasi Penerima</strong></td>
                                                <td>{selectedItem.donasi.organisasi}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Tanggal Donasi</strong></td>
                                                <td>{new Date(selectedItem.donasi.tanggal_donasi).toLocaleDateString("id-ID")}</td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </>
                            )}
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
};

export default HistoryPenitip;