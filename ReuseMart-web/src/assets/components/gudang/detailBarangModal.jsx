import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Col, Row, Container } from 'react-bootstrap';
import api from "../../../api/api.js";

const DetailBarangModal = ({ show, onHide, barang, penitipanUser, barangPegawai, tanggalSelesai, listFotoBarang }) => {
    // Memoize photos to stabilize the array reference
    const photos = useMemo(() => {
        return barang?.id_barang 
            ? listFotoBarang.filter(foto => foto.id_barang === barang.id_barang) 
            : [];
    }, [barang?.id_barang, listFotoBarang]);

    // State to track the currently selected photo
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Set the first photo when modal opens or barang changes
    useEffect(() => {
        if (show && photos.length > 0 && selectedPhoto === null) {
            setSelectedPhoto(photos[0].path);
        } else if (!photos.length) {
            setSelectedPhoto(null);
        }
    }, [show, photos, selectedPhoto]);

    // Handle thumbnail click
    const handleThumbnailClick = (path) => {
        setSelectedPhoto(path);
    };

    // State for categories
    const [kategori, setKategori] = useState([]);

    // Fetch categories from API
    const fetchKategori = async () => {
        try {
            const response = await api.get("/kategoriGudang");
            if (response.status === 200) {
                setKategori(response.data);
            } else {
                console.error("Failed to fetch categories: Status", response.status);
            }
        } catch (error) {
            console.error("Error fetching categories:", error.message);
        }
    };

    // Fetch categories on mount
    useEffect(() => {
        fetchKategori();
    }, []);

    // Get category or sub-category name
    const getKategoriName = (id) => {

        const allSubKategori = kategori.flatMap(item => 
            item.sub_kategori.map(sub => ({ ...sub, nama_kategori: item.nama_kategori }))
        );
        const subKategoriItem = allSubKategori.find(sub => sub.id === id);
        if (!subKategoriItem) return 'N/A';
        return subKategoriItem.nama || 'N/A'; // Use 'nama' as the sub-category name
    };

    // Debug barang prop
    useEffect(() => {
    }, [barang]);

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Detail Barang</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Row>
                        {/* Left Column: Main Image and Thumbnails */}
                        <Col xs={12} md={6}>
                            <div className="main-image-container mb-3" style={{ width: '100%', maxHeight: '400px', overflow: 'hidden' }}>
                                <img 
                                    src={selectedPhoto ? `http://127.0.0.1:8000/storage/${selectedPhoto}` : "http://127.0.0.1:8000/storage/defaults/no-image.png"}
                                    alt={barang?.nama_barang || "No image available"}
                                    className="main-image"
                                    style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '5px' }}
                                />
                            </div>
                            {photos.length > 0 ? (
                                <div className="thumbnail-scroll-container" style={{ width: '100%', overflowX: 'auto' }}>
                                    <div className="thumbnail-list d-flex gap-2" style={{ flexWrap: 'nowrap' }}>
                                        {photos.map((foto, index) => (
                                            <div 
                                                key={foto.id_foto || `photo-${index}-${barang?.id_barang}`} 
                                                className={`thumbnail-item ${selectedPhoto === foto.path ? 'selected' : ''}`}
                                                onClick={() => handleThumbnailClick(foto.path)}
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    cursor: 'pointer',
                                                    border: selectedPhoto === foto.path ? '2px solid #007bff' : '1px solid #ddd',
                                                    borderRadius: '5px',
                                                    overflow: 'hidden',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <img 
                                                    src={`http://127.0.0.1:8000/storage/${foto.path}`}
                                                    alt={`Foto ${index + 1}`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted text-center">No photos available</p>
                            )}
                        </Col>
                        {/* Right Column: Item Details */}
                        <Col xs={12} md={6}>
                            <h5 className="mb-4 fw-bold text-success">{barang?.nama_barang || 'Unknown Item'}</h5>
                            <div className="mb-2">
                                <strong>ID Barang:</strong> {barang?.id_barang || 'N/A'} | <strong>ID Penitipan : </strong> {barang?.id_penitipan || 'N/A'}
                                
                            </div>
                            <div className="mb-2">
                                <strong>Nama Penitip:</strong> {penitipanUser
                                    ? `${penitipanUser.first_name} ${penitipanUser.last_name}`.trim()
                                    : 'Unknown User'}
                            </div>
                            <div className="mb-2">
                                <strong>Nama Pegawai:</strong> {barangPegawai
                                    ? `${barangPegawai.first_name} ${barangPegawai.last_name}`.trim()
                                    : 'Unknown User'}
                            </div>
                            <div className="mb-2">
                                <strong>Harga:</strong> Rp {barang?.harga?.toLocaleString() || 'N/A'}
                            </div>
                            <div className="mb-2">
                                <strong>Status:</strong> {barang?.status || 'N/A'}
                            </div>
                            <div className="mb-2">
                                <strong>Status Periode:</strong> {barang?.status_periode || 'N/A'}
                            </div>
                            <div className="mb-2">
                                <strong>Nama Kategori:</strong> {barang?.kategori || 'N/A'}
                            </div>
                            <div className="mb-2">
                                <strong>Sub Kategori:</strong> {getKategoriName(barang?.id_kategori) || 'N/A'}
                            </div>
                            <div className="mb-2">
                                <strong>Tanggal Titip:</strong> {barang?.tanggal_titip
                                    ? new Date(barang.tanggal_titip).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })
                                    : 'Unknown Date'}
                            </div>
                            <div className="mb-2">
                                <strong>Tanggal Selesai:</strong> {tanggalSelesai || 'Unknown Date'}
                            </div>
                            <div className="mb-2">
                                <strong>byHunter : </strong> {barang?.byHunter || 'Tanpa Hunter'}
                            </div>
                            <div className="mb-2">
                                <strong>Deskripsi:</strong> {barang?.deskripsi || 'N/A'}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Tutup</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DetailBarangModal;