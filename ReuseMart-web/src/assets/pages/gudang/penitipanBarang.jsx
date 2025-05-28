import NavbarGudang from '../../components/Navbar/navbarGudang.jsx';
import { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button    } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const PenitipanBarang = () => {

    return (
        <div>
            <NavbarGudang />
            <Container className="mt-5" style={{ background: 'none' }}>
                <Row>
                    <Col md={10} className="mx-auto">
                        <Row>
                            <Col md={4}>
                                <h2 className="text-success fw-bold welcome-heading">Daftar Barang</h2>
                            </Col>
                            <Col md={4}>
                                {/* <Form.Control
                                    type="search"
                                    placeholder="Nama Barang, Nama Pegawai, Nama Penitip, Kategori..."
                                    className="me-2"
                                    value={pencarian}
                                    onChange={(e) => setPencarian(e.target.value)}
                                /> */}
                            </Col>
                            <Col md={4} className="d-flex justify-content-end">
                                <NavLink to="/tambahBarang">
                                    <Button variant="success">Tambah Barang</Button>
                                </NavLink>
                            </Col>
                        </Row>
                        <hr />
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default PenitipanBarang;