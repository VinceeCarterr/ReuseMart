import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  Spinner,
  Form,
  Button,
  Modal,
  Row,
  Col,
  Carousel,
  Image,
} from "react-bootstrap";
import { Truck } from "react-bootstrap-icons";
import NavbarGudang from "../../components/Navbar/navbarGudang.jsx";
import api from "../../../api/api.js";
import "../penitip/historyPenitip.css";

const methodOptions = [
  { label: "Pengiriman", value: "Delivery" },
  { label: "Pengambilan", value: "Pick Up" },
];

const Penjadwalan = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Delivery");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSSInline, setShowSSInline] = useState(false);
  const [pegawai, setPegawai] = useState([]);
  const [dateError, setDateError] = useState("");
  const formatDate = (d) => d.toISOString().slice(0, 10);
  const todayString = formatDate(new Date());

  // jadwal modal
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaksi, setSelectedTransaksi] = useState(null);
  const [kurirId, setKurirId] = useState("");
  const [tanggalJadwal, setTanggalJadwal] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const openConfirm = () => setShowConfirm(true);
  const closeConfirm = () => setShowConfirm(false);

  // detail modal
  const [showDetail, setShowDetail] = useState(false);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addKomisi = async (t) => {
    const dtItem = t.detil_transaksi[0];

    try {
      const { data: existing } = await api.get("/komisi", {
        params: { id_dt: dtItem.id_dt },
      });
      if (existing.length > 0) {
        console.log(
          `komisi for id_dt=${dtItem.id_dt} already exists, skipping`
        );
        return;
      }
    } catch (err) {
      console.error("Error checking existing komisi:", err);
    }

    const { tanggal_titip, status_periode, byHunter } = dtItem.barang;
    const total = t.total || 0;
    const soldDays = Math.floor(
      (new Date(t.tanggal_transaksi) - new Date(tanggal_titip)) /
        (1000 * 60 * 60 * 24)
    );

    let pctCompany = status_periode === "Periode 1" ? 0.2 : 0.3;
    if (status_periode === "Periode 1" && soldDays < 7) {
      pctCompany = 0.2;
    }

    let pctHunter = 0;
    if (byHunter) {
      pctHunter = 0.05;
      pctCompany = pctCompany - 0.05;
    }

    const komisiPerusahaan = Math.round(pctCompany * total);
    const komisiHunter = Math.round(pctHunter * total);

    console.log("⏩ posting komisi", {
      id_dt: dtItem.id_dt,
      presentase_perusahaan: pctCompany,
      presentase_hunter: pctHunter,
      komisi_perusahaan: komisiPerusahaan,
      komisi_hunter: komisiHunter,
    });

    await api.post("/komisi", {
      id_dt: dtItem.id_dt,
      presentase_perusahaan: pctCompany,
      presentase_hunter: pctHunter,
      komisi_perusahaan: komisiPerusahaan,
      komisi_hunter: komisiHunter,
    });

    setSchedules((prev) =>
      prev.map((row) =>
        row.id_transaksi === t.id_transaksi
          ? {
              ...row,
              komisi_perusahaan: komisiPerusahaan,
              komisi_hunter: komisiHunter,
            }
          : row
      )
    );
    if (
      selectedTransaksi &&
      selectedTransaksi.id_transaksi === t.id_transaksi
    ) {
      const updatedDt = {
        ...selectedTransaksi.detil_transaksi[0],
        komisi: {
          id_dt: dtItem.id_dt,
          presentase_perusahaan: pctCompany,
          presentase_hunter: pctHunter,
          komisi_perusahaan: komisiPerusahaan,
          komisi_hunter: komisiHunter,
        },
      };
      setSelectedTransaksi({
        ...selectedTransaksi,
        detil_transaksi: [updatedDt],
      });
    }
  };

  useEffect(() => {
    const loadSchedules = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filter) params.metode_pengiriman = filter;
        if (search) params.search = search;
        const { data } = await api.get("/transaksi/penjadwalan", { params });

        console.log("penjadwalan response:", JSON.stringify(data, null, 2));
        // scoring & sorting...
        const scored = data.map((item) => {
          let score = 0;
          if (item.metode_pengiriman === "Delivery") {
            if (item.pengiriman?.status_pengiriman === "-") score = -1;
            else if (item.pengiriman?.status_pengiriman === "Preparing")
              score = 1;
            else if (item.pengiriman?.status_pengiriman === "On Delivery")
              score = 2;
            else if (item.pengiriman?.status_pengiriman === "Arrived")
              score = 3;
          } else {
            if (item.pengambilan?.status_pengambilan === "-") score = -1;
            else if (item.pengambilan?.status_pengambilan === "Belum diambil")
              score = 0;
            else if (item.pengambilan?.status_pengambilan === "Sudah diambil")
              score = 1;
            else if (item.pengambilan?.status_pengambilan === "Tidak diambil")
              score = 2;
          }
          return { score, ...item };
        });
        scored.sort((a, b) => a.score - b.score);
        setSchedules(scored.map(({ score, ...rest }) => rest));
      } catch (err) {
        console.error("Error fetching schedules:", err);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };
    loadSchedules();
  }, [filter, search]);

  useEffect(() => {
    const loadPegawai = async () => {
      try {
        const { data } = await api.get("/pegawai", {
          params: { jabatan: 4 },
        });
        setPegawai(data);
      } catch (err) {
        console.error("Error fetching pegawai:", err);
      }
    };
    loadPegawai();
  }, []);

  const isSameDayValid = () => {
    const raw = selectedTransaksi?.tanggal_transaksi;
    if (!raw) return false;
    return new Date(raw).getHours() < 16;
  };

  const openJadwalkan = (t) => {
    setSelectedTransaksi(t);
    setKurirId("");
    setDateError("");
    const today = new Date();
    const defaultDate = isSameDayValid()
      ? today
      : new Date(today.setDate(today.getDate() + 1));
    setTanggalJadwal(defaultDate.toISOString().slice(0, 10));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedTransaksi) return;
    try {
      if (filter === "Delivery") {
        await api.post("/pengiriman", {
          id_transaksi: selectedTransaksi.id_transaksi,
          id_pegawai: kurirId,
          tanggal_pengiriman: tanggalJadwal,
          status_pengiriman: "Preparing",
        });
      } else {
        await api.post("/pengambilan", {
          id_transaksi: selectedTransaksi.id_transaksi,
          tanggal_pengambilan: tanggalJadwal,
          status_pengambilan: "Belum diambil",
        });
      }
      setShowModal(false);
      const params = { metode_pengiriman: filter, search };
      const { data } = await api.get("/transaksi/penjadwalan", { params });
      setSchedules(data);
    } catch (err) {
      console.error("Error saving jadwal:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
    }
  };

  const openDetail = (t) => {
    console.log("openDetail called:", {
      id_transaksi: t.id_transaksi,
      filter,
      status_pengiriman: t.pengiriman?.status_pengiriman,
      status_pengambilan: t.pengambilan?.status_pengambilan,
    });

    setSelectedTransaksi(t);
    setShowDetail(true);

    const isArrivedDelivery =
      filter === "Delivery" && t.pengiriman?.status_pengiriman === "Arrived";
    const isPickedUp =
      filter === "Pick Up" &&
      (t.pengambilan?.status_pengambilan === "Sudah diambil" ||
        t.pengambilan?.status_pengambilan === "Tidak diambil");

    if (isArrivedDelivery || isPickedUp) {
      console.log("→ calling addKomisi()", { isArrivedDelivery, isPickedUp });
      addKomisi(t);
    }
  };

  const closeDetail = () => setShowDetail(false);

  const handleKonfirmasiAmbil = async () => {
    try {
      // assuming your API accepts a PATCH to /pengambilan/:id_pengambilan
      await api.patch(
        `/pengambilan/${selectedTransaksi.pengambilan.id_pengambilan}`,
        { status_pengambilan: "Sudah diambil" }
      );
      // refresh the list to reflect the new status
      const params = { metode_pengiriman: filter, search };
      const { data } = await api.get("/transaksi/penjadwalan", { params });
      setSchedules(data);
      // close both confirm & detail
      setShowConfirm(false);
      setShowDetail(false);
    } catch (err) {
      console.error("Error konfirmasi ambil:", err);
      alert("Gagal mengonfirmasi pengambilan. Silakan coba lagi.");
    }
  };

  return (
    <>
      <NavbarGudang />

      <Container className="mt-5">
        {/* FILTER BAR */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-success fw-bold">Penjadwalan</h2>
          <div className="d-flex align-items-center">
            <div>
              {methodOptions.map((opt) => (
                <span
                  key={opt.value}
                  className={`filter-option ${
                    filter === opt.value ? "active" : ""
                  }`}
                  onClick={() => setFilter(opt.value)}
                >
                  {opt.label}
                </span>
              ))}
            </div>
            <Form.Control
              type="search"
              placeholder="Cari nama penitip atau ID transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ms-4"
              style={{ width: 300 }}
            />
          </div>
        </div>
        <hr />

        {/* SCHEDULE LIST */}
        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Memuat...</span>
            </Spinner>
          </div>
        ) : schedules.length === 0 ? (
          <p className="text-center text-muted">Tidak ada jadwal.</p>
        ) : (
          <Table bordered hover responsive className="text-center">
            <thead>
              <tr>
                <th>#</th>
                <th>ID</th>
                <th>Nama Pembeli</th>
                <th>Tanggal Transaksi</th>
                {filter === "Delivery" && <th>Kurir</th>}
                <th>
                  {filter === "Delivery"
                    ? "Tanggal Pengiriman"
                    : "Tanggal Pengambilan"}
                </th>
                <th>Status</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((t, idx) => {
                const dt = new Date(t.tanggal_transaksi);
                const tanggalTransaksi = dt.toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const kurir =
                  filter === "Delivery" && t.pengiriman?.pegawai
                    ? `${t.pengiriman.pegawai.first_name} ${t.pengiriman.pegawai.last_name}`
                    : "-";
                const tanggalJ =
                  filter === "Delivery"
                    ? t.pengiriman?.tanggal_pengiriman
                      ? new Date(
                          t.pengiriman.tanggal_pengiriman
                        ).toLocaleDateString("id-ID")
                      : "-"
                    : t.pengambilan?.tanggal_pengambilan
                    ? new Date(
                        t.pengambilan.tanggal_pengambilan
                      ).toLocaleDateString("id-ID")
                    : "-";
                const statusRaw =
                  filter === "Delivery"
                    ? t.pengiriman?.status_pengiriman ?? "-"
                    : t.pengambilan?.status_pengambilan ?? "-";

                return (
                  <tr key={t.id_transaksi}>
                    <td>{idx + 1}</td>
                    <td>{t.id_transaksi}</td>
                    <td>
                      {t.user?.first_name && t.user?.last_name
                        ? `${t.user.first_name} ${t.user.last_name}`
                        : "-"}
                    </td>
                    <td>{tanggalTransaksi}</td>
                    {filter === "Delivery" && <td>{kurir}</td>}
                    <td>{tanggalJ}</td>
                    <td>
                      {statusRaw === "-" ? (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => openJadwalkan(t)}
                        >
                          Jadwalkan
                        </Button>
                      ) : (
                        statusRaw
                      )}
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => openDetail(t)}
                      >
                        Lihat Detail
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Container>

      {/* JADWAL MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Jadwalkan {filter === "Delivery" ? "Pengiriman" : "Pengambilan"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* ID Transaksi */}
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={4}>
                ID Transaksi
              </Form.Label>
              <Col sm={8}>
                <Form.Control
                  readOnly
                  value={selectedTransaksi?.id_transaksi || ""}
                />
              </Col>
            </Form.Group>

            {/* Kurir */}
            {filter === "Delivery" && (
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={4}>
                  Kurir
                </Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={kurirId}
                    onChange={(e) => setKurirId(e.target.value)}
                  >
                    <option value="">Pilih pegawai</option>
                    {pegawai
                      .filter((p) => p.id_jabatan === 4)
                      .map((p) => (
                        <option key={p.id_pegawai} value={p.id_pegawai}>
                          {p.first_name} {p.last_name}
                        </option>
                      ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            )}

            {/* Tanggal */}
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={4}>
                {filter === "Delivery"
                  ? "Tanggal Pengiriman"
                  : "Tanggal Pengambilan"}
              </Form.Label>
              <Col sm={8}>
                <Form.Control
                  type="date"
                  value={tanggalJadwal}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTanggalJadwal(val);

                    if (val === todayString && !isSameDayValid()) {
                      setDateError(
                        "Transaksi lewat jam 16:00, tidak bisa pilih hari ini."
                      );
                    } else {
                      // covers both “new valid today” and “any other day”
                      setDateError("");
                    }
                  }}
                  isInvalid={!!dateError}
                />
                <Form.Control.Feedback type="invalid">
                  {dateError}
                </Form.Control.Feedback>
              </Col>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Batal
          </Button>
          <Button
            variant="success"
            onClick={handleSave}
            disabled={
              !selectedTransaksi ||
              (filter === "Delivery" && !kurirId) ||
              !!dateError
            }
          >
            Simpan
          </Button>
        </Modal.Footer>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal show={showDetail} onHide={closeDetail} size="lg" centered>
        <Modal.Body>
          {selectedTransaksi && (
            <>
              {/* Header info */}
              <Table borderless className="mb-4">
                <tbody>
                  {filter === "Pick Up" &&
                    selectedTransaksi.pengambilan?.status_pengambilan ===
                      "Belum diambil" && (
                      <tr>
                        <td>
                          <strong>Batas Waktu Pengambilan</strong>
                        </td>
                        <td>
                          {(() => {
                            const pickTs = new Date(
                              selectedTransaksi.pengambilan.tanggal_pengambilan
                            ).getTime();
                            const deadline = pickTs + 44 * 3600 * 1000;
                            const diff = deadline - now;

                            if (diff <= 0) {
                              api
                                .patch(
                                  `/pengambilan/${selectedTransaksi.pengambilan.id_pengambilan}`,
                                  { status_pengambilan: "Tidak diambil" }
                                )
                                .then(() =>
                                  api.patch(
                                    `/barang/${selectedTransaksi.detil_transaksi[0].barang.id_barang}`,
                                    { status: "Untuk Donasi" }
                                  )
                                )
                                .then(() => addKomisi(selectedTransaksi))
                                .then(() => {
                                  openDetail(selectedTransaksi);
                                })
                                .catch(console.error);
                              return "Waktu pengambilan habis";
                            }

                            const totalSec = Math.floor(diff / 1000);
                            const h = Math.floor(totalSec / 3600);
                            const m = Math.floor((totalSec % 3600) / 60);
                            const s = totalSec % 60;

                            if (h < 24) {
                              return (
                                <>
                                  <strong>{h}</strong>j <strong>{m}</strong>m{" "}
                                  <strong>{s}</strong>s
                                </>
                              );
                            } else {
                              const days = Math.ceil(h / 24);
                              return (
                                <>
                                  <strong>{days}</strong> hari tersisa
                                </>
                              );
                            }
                          })()}
                        </td>
                      </tr>
                    )}

                  <tr>
                    <td>
                      <strong>Nama Penitip</strong>
                    </td>
                    <td>
                      {selectedTransaksi.detil_transaksi?.[0]?.barang?.penitipan
                        ?.user
                        ? `${selectedTransaksi.detil_transaksi[0].barang.penitipan.user.first_name} ${selectedTransaksi.detil_transaksi[0].barang.penitipan.user.last_name}`
                        : "–"}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Nama Pembeli</strong>
                    </td>
                    <td>
                      {selectedTransaksi.user
                        ? `${selectedTransaksi.user.first_name} ${selectedTransaksi.user.last_name}`
                        : "–"}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Alamat</strong>
                    </td>
                    <td>{selectedTransaksi.alamat || "–"}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Tanggal Transaksi</strong>
                    </td>
                    <td>
                      {new Date(
                        selectedTransaksi.tanggal_transaksi
                      ).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        {selectedTransaksi.metode_pengiriman === "Delivery"
                          ? "Tanggal Pengiriman"
                          : "Tanggal Pengambilan"}
                      </strong>
                    </td>
                    <td>
                      {selectedTransaksi.pengiriman?.tanggal_pengiriman
                        ? new Date(
                            selectedTransaksi.pengiriman.tanggal_pengiriman
                          ).toLocaleDateString("id-ID")
                        : selectedTransaksi.pengambilan?.tanggal_pengambilan
                        ? new Date(
                            selectedTransaksi.pengambilan.tanggal_pengambilan
                          ).toLocaleDateString("id-ID")
                        : "–"}
                    </td>
                  </tr>
                  {selectedTransaksi.pengiriman && (
                    <tr>
                      <td>
                        <strong>Nama Kurir</strong>
                      </td>
                      <td>
                        {selectedTransaksi.pengiriman.pegawai
                          ? `${selectedTransaksi.pengiriman.pegawai.first_name} ${selectedTransaksi.pengiriman.pegawai.last_name}`
                          : "–"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* List of Produk */}
              <Table borderless responsive className="mb-4">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nama Produk</th>
                    <th className="text-end">Harga</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTransaksi.detil_transaksi?.map((dt) => {
                    const fotos = dt.barang.foto ?? [];
                    return (
                      <tr key={dt.id_dt}>
                        <td style={{ width: 150 }}>
                          {fotos.length > 1 ? (
                            <Carousel variant="dark" interval={null}>
                              {fotos.map((f, i) => (
                                <Carousel.Item key={i}>
                                  <img
                                    className="d-block w-100"
                                    src={`http://127.0.0.1:8000/storage/${f.path}`}
                                    alt={`Slide ${i + 1}`}
                                    style={{
                                      maxHeight: 150,
                                      objectFit: "contain",
                                    }}
                                  />
                                </Carousel.Item>
                              ))}
                            </Carousel>
                          ) : (
                            <Image
                              src={
                                fotos.length === 1
                                  ? `http://127.0.0.1:8000/storage/${fotos[0].path}`
                                  : "/placeholder.jpg"
                              }
                              thumbnail
                              style={{ width: 150 }}
                            />
                          )}
                        </td>
                        <td>{dt.barang.nama_barang}</td>
                        <td className="text-end">
                          Rp{(dt.barang.harga || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              {/* Summary table */}
              <Table borderless className="summary-table">
                <tbody>
                  <tr>
                    <td>Subtotal Produk</td>
                    <td className="text-end">
                      Rp
                      {(selectedTransaksi.subtotal || 0).toLocaleString(
                        "id-ID"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Biaya Pengiriman</td>
                    <td className="text-end">
                      Rp
                      {(selectedTransaksi.biaya_pengiriman || 0).toLocaleString(
                        "id-ID"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Diskon</td>
                    <td className="text-end">
                      –Rp
                      {(selectedTransaksi.diskon || 0).toLocaleString("id-ID")}
                    </td>
                  </tr>
                  <tr className="total-row">
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td className="text-end">
                      <strong>
                        Rp
                        {(selectedTransaksi.total || 0).toLocaleString("id-ID")}
                      </strong>
                    </td>
                  </tr>
                  {selectedTransaksi.detil_transaksi?.[0]?.komisi && (
                    <>
                      {(() => {
                        const det = selectedTransaksi.detil_transaksi[0];
                        const kom = det.komisi || {};
                        const total = selectedTransaksi.total || 0;
                        const komHun = kom.komisi_hunter || 0;
                        const komPer = kom.komisi_perusahaan || 0;

                        // compute soldDays & bonus
                        const { tanggal_titip, status_periode } = det.barang;
                        const soldDays = Math.floor(
                          (new Date(selectedTransaksi.tanggal_transaksi) -
                            new Date(tanggal_titip)) /
                            (1000 * 60 * 60 * 24)
                        );
                        const bonus =
                          status_periode === "Periode 1" && soldDays < 7
                            ? Math.round(0.1 * komPer)
                            : 0;

                        const penghasilan = total - komHun - komPer + bonus;

                        return (
                          <>
                            {/* Komisi Hunter */}
                            <tr
                              style={{
                                borderTop: "1px solid #ccc",
                                paddingTop: 10,
                              }}
                            >
                              <td style={{ paddingTop: 20 }}>
                                <strong>Komisi Hunter</strong>
                              </td>
                              <td
                                className="text-end"
                                style={{ paddingTop: 20 }}
                              >
                                Rp{komHun.toLocaleString("id-ID")}
                              </td>
                            </tr>
                            {/* Komisi Reuse Mart */}
                            <tr>
                              <td>
                                <strong>Komisi Reuse Mart</strong>
                              </td>
                              <td className="text-end">
                                Rp{komPer.toLocaleString("id-ID")}
                              </td>
                            </tr>
                            {/* BONUS (only if >0) */}
                            {bonus > 0 && (
                              <tr>
                                <td>
                                  <strong>Bonus Penitip (10%)</strong>
                                </td>
                                <td className="text-end">
                                  Rp{bonus.toLocaleString("id-ID")}
                                </td>
                              </tr>
                            )}
                            {/* Penghasilan Penitip */}
                            <tr>
                              <td>
                                <strong>Penghasilan Penitip</strong>
                              </td>
                              <td className="text-end">
                                Rp{penghasilan.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </>
                  )}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {filter === "Pick Up" &&
            selectedTransaksi?.pengambilan?.status_pengambilan ===
              "Belum diambil" && (
              <Button variant="warning" onClick={openConfirm}>
                Konfirmasi Ambil
              </Button>
            )}
        </Modal.Footer>
      </Modal>

      <Modal show={showConfirm} onHide={closeConfirm} centered>
        <Modal.Header closeButton>
          <Modal.Title>Konfirmasi Pengambilan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Apakah Anda yakin ingin menandai pesanan ini sebagai{" "}
          <strong>Sudah diambil</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeConfirm}>
            Batal
          </Button>
          <Button variant="success" onClick={handleKonfirmasiAmbil}>
            Ya, Konfirmasi
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Penjadwalan;
