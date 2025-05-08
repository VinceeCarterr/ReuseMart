import { useState } from 'react';
import api from "../../../api/api.js";
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const PegawaiModal = ({ show, onHide, fetchPegawai}) => {
    const [selectedJabatan, setSelectedJabatan] = useState("Pilih Jabatan");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [noTelp, setNoTelp] = useState("");
    const [password, setPassword] = useState("");
    const [tglLahir, setTglLahir] = useState("");
    const [error, setError] = useState("");

    const handleSelect = (eventKey) => {
        setSelectedJabatan(eventKey);
    };

    const handleTambah = async () => {
        setError('');

        let id_jabatan = null;

        if (selectedJabatan === 'Admin') {
            id_jabatan = 6;
        } else if (selectedJabatan === 'Customer Service') {
            id_jabatan = 2;
        } else if (selectedJabatan === 'Pegawai Gudang') {
            id_jabatan = 3;
        } else if (selectedJabatan==='Kurir'){
            id_jabatan = 4;
        } else if (selectedJabatan==='Hunter'){
            id_jabatan = 5;
        }else {
            setError('Invalid job selection');
            return;
        }
        let komisi = 0;

        try {
            const response = await api.post('/pegawai/register', {
                id_jabatan,
                first_name: firstName,
                last_name: lastName,
                email,
                password,
                no_telp: noTelp,
                tanggal_lahir: tglLahir,
                komisi,
            });

            setFirstName('');
            setLastName('');
            setEmail('');
            setNoTelp('');
            setPassword('');
            setTglLahir('');
            setSelectedJabatan('Pilih Jabatan');
            
            console.log('Register success:', response.data);
            onHide();
            fetchPegawai();
        } catch (err) {
            const message = err.response?.data?.error || 'Register failed';
            setError(message);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered backdrop={true} className="pegawai-modal">
            <Modal.Header closeButton>
                <Modal.Title>Tambah Pegawai</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    
                    <Row className="mt-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>First Name</Form.Label>
                                <Form.Control value ={firstName} onChange ={e => setFirstName(e.target.value)} type="text" placeholder="Masukkan nama depan" />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control value={lastName} onChange={e=> setLastName(e.target.value)} type="text" placeholder="Masukkan nama belakang" />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Email</Form.Label>
                                <Form.Control value={email} onChange={e=> setEmail(e.target.value)} type="email" placeholder="Masukkan Email" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Nomor Telepon</Form.Label>
                                <Form.Control value={noTelp} onChange={e=> setNoTelp(e.target.value)} type="text" placeholder="Masukkan Nomor Telepon"/>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>Password</Form.Label>
                                <Form.Control value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Masukkan Password"/>
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Jabatan</Form.Label>
                                <Form.Select
                                    value={selectedJabatan}
                                    onChange={(e) => setSelectedJabatan(e.target.value)}
                                >
                                    <option value="">Pilih Jabatan</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Customer Service">Customer Service</option>
                                    <option value="Pegawai Gudang">Pegawai Gudang</option>
                                    <option value="Kurir">Kurir</option>
                                    <option value="Hunter">Hunter</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Col md={6}>
                        <Form.Group  className="mt-3">
                            <Form.Label>Tanggal Lahir </Form.Label>
                            <Form.Control type='date' value={tglLahir} onChange={e=>setTglLahir(e.target.value)}  ></Form.Control>
                        </Form.Group>
                    </Col>
                    <br />  
                    <Button variant="success" onClick={handleTambah}>
                        Daftar
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default PegawaiModal;
