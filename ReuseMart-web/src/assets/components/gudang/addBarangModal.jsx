import { useState, useEffect } from 'react';
import api from "../../../api/api.js";
import { Modal, Button, Form, Row, Col, Toast, ToastContainer } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';

const AddBarangModal = ({ show, onHide }) => {
    const [userList, setUserList] = useState([]);
    const [kategoriList, setKategoriList] = useState([]);
    const [pegawaiList, setPegawaiList] = useState([]);
    const [namaBarang, setNamaBarang] = useState('');
    const [selectedKategori, setSelectedKategori] = useState('');  
    const [selectedPegawai, setSelectedPegawai] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedSubKategori, setSelectedSubKategori] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [harga, setHarga] = useState('');
    const [garansi, setGaransi] = useState('');
    const [tanggalTitip, setTanggalTitip] = useState('');
    const [byHunter, setByHunter] = useState('');



    const today = new Date().toISOString().split('T')[0];

    const fetchData = async () => {
        try{
            const tempUser = await api.get('/user/gudang');
            const tempKategori = await api.get('/kategori');
            const tempPegawai = await api.get('/pegawai');

            setUserList(tempUser.data);
            setKategoriList(tempKategori.data);
            setPegawaiList(tempPegawai.data);
        }catch{
            console.error('Error fetching data: ', error);
        }
    }

    useEffect(() => {
        if (show) fetchData();
    }, [show]);

    

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Tambah Barang</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Row className="mt-3"> 
                        <Col>
                            <Form.Group controlId="formNamaBarang">
                                <Form.Label>Nama Barang</Form.Label>
                                <Form.Control type="text" placeholder="Masukkan nama barang" value={namaBarang} onChange={e=>setNamaBarang(e.target.value)} />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Harga Barang</Form.Label>
                                <Form.Control type="double" placeholder ="Masukkan Harga Barang" value={harga} onChange={e=>setHarga(e.target.value)}></Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>Pilih Nama Penitip</Form.Label>
                                <Form.Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                                    <option value="">Pilih</option>
                                    {userList.filter((user) => user.id_role ===2)
                                    .map((index)=> (
                                        <option key={index.id_user} value={index.id_user}>
                                            {index.first_name} {index.last_name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Pilih Pegawai</Form.Label>
                                <Form.Select value={selectedPegawai} onChange={(e) => setSelectedPegawai(e.target.value)}>
                                    <option value="">Pilih</option>
                                    {pegawaiList.filter((pegawai) => pegawai.id_jabatan ===3)
                                    .map((index)=> (
                                        <option key={index.id_pegawai} value={index.id_pegawai}>
                                            {index.first_name} {index.last_name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>Pilih Kategori</Form.Label>
                                <Form.Select value={selectedKategori} onChange={(e) => setSelectedKategori(e.target.value)}>
                                    <option value="">Pilih</option>
                                    {kategoriList.map((index)=> (
                                        <option key={index.id_kategori} value={index.id_kategori}>
                                            {index.nama_kategori} 
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Pilih Sub Kategori</Form.Label>
                                <Form.Select value={selectedSubKategori} onChange={(e) => setSelectedSubKategori(e.target.value)}>
                                    <option value="">Pilih</option>
                                    {kategoriList.filter((kategori) => kategori.id_kategori === selectedKategori)
                                    .map((index)=> (
                                        <option key={index.id_kategori} value={index.id_kategori}>
                                            {index.sub_kategori} 
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className='mt-3'>
                        <Col>
                            <Form.Group>
                                <Form.Label>Garansi</Form.Label>
                                <Form.Control type="date" value={garansi} onChange={e=>setGaransi(e.target.value)} placeholder ="Masukkan Harga Barang" ></Form.Control>
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Tanggal Titip</Form.Label>
                                <Form.Control type="date" placeholder ="Masukkan Tanggal Barang dititipkan" value={tanggalTitip} onChange={e=>setTanggalTitip(e.target.value)} max={today}></Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Batal
                </Button>
                <Button variant="primary">
                    Simpan
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddBarangModal;
