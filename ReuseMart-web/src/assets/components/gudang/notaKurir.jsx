import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Row,
  Col,
  Toast,
  ToastContainer,
  Table,
} from "react-bootstrap";
import api from "../../../api/api.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const NotaKurir = ({ show, onHide, transaksiId }) => {
  const [transaksi, setTransaksi] = useState(null);
  const [detilList, setDetilList] = useState([]);
  const [pengiriman, setPengiriman] = useState(null);
  const [pembeliList, setPembeliList] = useState([]);
  const [kurirList, setKurirList] = useState([]);
  const [pegawaiList, setPegawaiList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");

  const showToast = (msg, variant = "success") => {
    setToastMessage(msg);
    setToastVariant(variant);
    setToastShow(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!transaksiId) return;
      setLoading(true);
      try {
        const [tRes, dRes, pRes, uRes, kRes, pegRes] = await Promise.all([
          api.get(`/transaksi/getOne/${transaksiId}`),
          api.get(`/detilTransaksi/getByTransaksi/${transaksiId}`),
          api.get(`/pengiriman/getByTransaksi/${transaksiId}`),
          api.get("/user/public"),
          api.get("/kurir/public"),
          api.get("/pegawaiGudang"),
        ]);
        setTransaksi(tRes.data);
        setDetilList(dRes.data || []);
        console.log("detilList:", dRes.data);
        setPengiriman(Array.isArray(pRes.data) ? pRes.data[0] : pRes.data);
        setPembeliList(uRes.data || []);
        setKurirList(kRes.data || []);
        setPegawaiList(pegRes.data || []);
      } catch (err) {
        showToast("Gagal memuat data: " + (err.message || ""), "danger");
      } finally {
        setLoading(false);
      }
    };
    if (show) fetchData();
  }, [show, transaksiId]);

  const currentPembeli = transaksi
    ? pembeliList.find((u) => u.id_user === transaksi.id_user)
    : null;
  const currentKurir = pengiriman
    ? kurirList.find((k) => k.id_kurir === pengiriman.id_kurir)
    : null;
  const currentQC = transaksi
    ? pegawaiList.find((p) => p.id_pegawai === transaksi.id_pegawai)
    : null;

  const subtotal = transaksi?.subtotal || 0;
  const ongkir = transaksi?.biaya_pengiriman || 0;
  const potongan = transaksi?.diskon || 0;
  const totalBeforeDiskon = subtotal + ongkir;
  const totalAfterDiskon = totalBeforeDiskon - potongan;
  const diskonPoin = potongan / 100;
  const barangTotal = detilList.reduce(
    (acc, d) => acc + (d.barang?.harga || 0),
    0
  );
  let correctPointsEarned = Math.floor(barangTotal / 10000);
  if (barangTotal > 500000) {
    correctPointsEarned += Math.floor(correctPointsEarned * 0.2);
  }
  let pointsEarned = Math.floor(totalAfterDiskon / 10000);
  if (totalAfterDiskon > 500000) {
    pointsEarned += Math.floor(pointsEarned * 0.2);
  }
  const loyaltyBefore = currentPembeli?.poin_loyalitas || 0;
  const loyaltyAfter = loyaltyBefore + pointsEarned;

  const handleDownloadPDF = async () => {
    const element = document.querySelector(".notaKurir-printable");
    if (!element) return showToast("Konten nota tidak ditemukan.", "danger");
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });
      const margin = 10;
      const pageWidth = 210 - margin * 2;
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", margin, margin, pageWidth, pageHeight);
      pdf.save(`nota_kurir_${transaksi?.no_nota || ""}.pdf`);
    } catch (err) {
      showToast("Gagal menghasilkan PDF: " + err.message, "danger");
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="md" centered backdrop="static">
        <Modal.Body>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div
              className="notaKurir-printable p-3"
              style={{ backgroundColor: "#fff" }}
            >
              <Row>
                <strong>ReUse Mart</strong>
                <br />
                <small>Jl. Green Eco Park No. 456 Yogyakarta</small>
              </Row>
              <hr />
              <Table
                borderless
                className="mb-2"
                style={{ width: "auto", lineHeight: "1.2", fontSize: "14px" }}
              >
                <tbody>
                  <tr>
                    <td style={{ padding: "2px 8px 2px 0" }}>No Nota</td>
                    <td style={{ padding: "2px 8px" }}>:</td>
                    <td style={{ padding: "2px 0" }}>
                      {transaksi?.no_nota || "-"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 8px 2px 0" }}>Tanggal pesan</td>
                    <td style={{ padding: "2px 8px" }}>:</td>
                    <td style={{ padding: "2px 0" }}>
                      {transaksi?.tanggal_transaksi
                        ? new Date(transaksi.tanggal_transaksi).toLocaleString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "-"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 8px 2px 0" }}>Lunas pada</td>
                    <td style={{ padding: "2px 8px" }}>:</td>
                    <td style={{ padding: "2px 0" }}>
                      {transaksi?.tanggal_transaksi
                        ? new Date(transaksi.tanggal_transaksi).toLocaleString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "-"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 8px 2px 0" }}>Tanggal kirim</td>
                    <td style={{ padding: "2px 8px" }}>:</td>
                    <td style={{ padding: "2px 0" }}>
                      {pengiriman?.tanggal_pengiriman
                        ? new Date(
                            pengiriman.tanggal_pengiriman
                          ).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </Table>
              <hr />
              <div style={{ lineHeight: "1.5", fontSize: "14px" }}>
                <strong>Pembeli:</strong> : {currentPembeli?.email || "-"} /{" "}
                {currentPembeli?.first_name} {currentPembeli?.last_name}
                <br />
                {transaksi?.alamat || "-"}
                <br />
                {transaksi?.metode_pengiriman === "Delivery" ? (
                  <>
                    Delivery: Kurir ReUseMart (
                    {currentKurir
                      ? `${currentKurir.first_name} ${currentKurir.last_name}`
                      : "-"}
                    )
                  </>
                ) : transaksi?.metode_pengiriman === "Pick Up" ? (
                  <>Delivery: - (diambil sendiri)</>
                ) : (
                  <>Delivery: -</>
                )}
              </div>
              <hr />

              <Table borderless size="sm" className="mb-3">
                <tbody>
                  {detilList.map((d, i) => (
                    <tr key={i}>
                      <td>{d.barang?.nama_barang || "-"}</td>
                      <td className="text-end">
                        {d.barang?.harga?.toLocaleString("id-ID") || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Row>
                <Col>Total:</Col>
                <Col className="text-end">
                  {subtotal.toLocaleString("id-ID")}
                </Col>
              </Row>
              <Row>
                <Col>Ongkos Kirim:</Col>
                <Col className="text-end">{ongkir.toLocaleString("id-ID")}</Col>
              </Row>
              <Row>
                <Col>
                  <strong>Total:</strong>
                </Col>
                <Col className="text-end">
                  <strong>{totalBeforeDiskon.toLocaleString("id-ID")}</strong>
                </Col>
              </Row>
              <Row>
                <Col>Potongan {diskonPoin} poin</Col>
                <Col className="text-end">
                  - {potongan.toLocaleString("id-ID")}
                </Col>
              </Row>
              <Row>
                <Col>
                  <strong>Total:</strong>
                </Col>
                <Col className="text-end">
                  <strong>{totalAfterDiskon.toLocaleString("id-ID")}</strong>
                </Col>
              </Row>
              <hr />
              <div
                style={{
                  lineHeight: "1.4",
                  fontSize: "14px",
                  marginTop: "10px",
                }}
              >
                Poin dari pesanan ini : {correctPointsEarned}
                <br />
                Total poin customer: {loyaltyBefore + correctPointsEarned}
              </div>
              <hr />
              <Row>
                <Col>
                  QC oleh:{" "}
                  {detilList?.[0]?.barang?.pegawai
                    ? `${detilList[0].barang.pegawai.first_name} (P${detilList[0].barang.pegawai.id_pegawai})`
                    : "-"}
                </Col>
              </Row>
              <Row className="mt-4">
                <Col>
                  Diambil oleh:
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  (..........................................)
                  <br />
                  <br />
                  Tanggal: .........................
                </Col>
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

      <ToastContainer position="top-center" className="p-3">
        <Toast
          show={toastShow}
          bg={toastVariant}
          onClose={() => setToastShow(false)}
          delay={3000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">
              {toastVariant === "success" ? "Sukses" : "Error"}
            </strong>
          </Toast.Header>
          <Toast.Body
            className={toastVariant === "success" ? "text-white" : ""}
          >
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default NotaKurir;
