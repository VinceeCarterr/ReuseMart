import NavbarPembeli from "../../components/Navbar/navbarPembeli";


const AlamatCard = ({ pegawai, onDeleteClick }) => (
    <Col md={10} className="justify-content-center mx-auto">
        <Card>
            <Card.Body>
                <Row className="align-items-center">
                    <Col md={2}><strong>{pegawai.name}</strong></Col>
                    <Col md={3}>{pegawai.email}</Col>
                    <Col md={2}>{pegawai.phone}</Col>
                    <Col md={5} className="d-flex justify-content-end">
                        <Button variant="outline-primary" size="sm"><Pencil /></Button>
                        <Button
                            variant="outline-danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => onDeleteClick(pegawai)}
                        >
                            <Trash />
                        </Button>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    </Col>
);


const AlamatPage = () => {

    return (
        <div>
            <NavbarPembeli />
        </div>
    );
}

export default AlamatPage;