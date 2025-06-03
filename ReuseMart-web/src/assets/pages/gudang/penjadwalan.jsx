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
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { Truck } from "react-bootstrap-icons";
import NavbarGudang from "../../components/Navbar/navbarGudang.jsx";
import api from "../../../api/api.js";
import "../penitip/historyPenitip.css";
import NotaKurir from "../../components/gudang/notaKurir.jsx";

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
  const [showNotaKurir, setShowNotaKurir] = useState(false);

  const [toastShow, setToastShow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");

  // jadwal modal
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaksi, setSelectedTransaksi] = useState(null);
  const [kurirId, setKurirId] = useState("");
  const [tanggalJadwal, setTanggalJadwal] = useState("");

  // detail modal
  const [showDetail, setShowDetail] = useState(false);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [expiredHandled, setExpiredHandled] = useState(false);

  useEffect(() => {
    if (
      filter === "Pick Up" &&
      showDetail &&
      selectedTransaksi?.pengambilan &&
      !expiredHandled
    ) {
      const pickTs = new Date(
        selectedTransaksi.pengambilan.tanggal_pengambilan
      ).getTime();
      const deadline = pickTs + 44 * 3600 * 1000;
      if (now >= deadline) {
        setExpiredHandled(true);
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
          .then(() => setShowDetail(false))
          .catch(console.error);
      }
    }
  }, [now, filter, showDetail, selectedTransaksi, expiredHandled]);

  const handleArrived = async (t) => {
    try {
      await api.patch(`/pengiriman/${t.pengiriman.id_pengiriman}`, {
        status_pengiriman: "Arrived",
      });

      await addKomisi(t);

      const params = { metode_pengiriman: filter, search };
      const { data } = await api.get("/transaksi/penjadwalan", { params });
      setSchedules(data);
    } catch (err) {
      console.error("Error marking arrived:", err);
      alert("Gagal menandai pengiriman Arrived.");
    }
  };

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
      pctCompany -= 0.05;
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

    let bonusPenitip = 0;
    if (status_periode === "Periode 1" && soldDays < 7) {
      bonusPenitip = Math.round(0.1 * komisiPerusahaan);
    }
    const penghasilan = total - komisiHunter - komisiPerusahaan + bonusPenitip;

    const penitipUser = dtItem.barang.penitipan.user;
    const updatedSaldo = penitipUser.saldo + penghasilan;
    await api.patch(`/user/${penitipUser.id_user}`, {
      saldo: updatedSaldo,
    });

    const pembeliUser = t.user;
    const baseAmount = (t.subtotal || 0) - (t.diskon || 0);
    let poin = Math.floor(baseAmount / 10000);
    if (baseAmount > 500000) {
      poin = Math.round(poin * 1.2);
    }
    const updatedPoin = pembeliUser.poin_loyalitas + poin;
    await api.patch(`/user/${pembeliUser.id_user}`, {
      poin_loyalitas: updatedPoin,
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
        const scored = data.map((item) => {
          let score = 0;
          if (item.metode_pengiriman === "Delivery") {
            if (item.pengiriman?.status_pengiriman === "-") score = -1;
            else if (item.pengiriman?.status_pengiriman === "Scheduled")
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

  const isSameDayValid = (transaksiTs) => {
    if (!transaksiTs) return false;
    const tx = new Date(transaksiTs);
    const cut = new Date(tx);
    cut.setHours(16, 0, 0, 0);
    return tx.getTime() <= cut.getTime();
  };

  const openJadwalkan = (t) => {
    setSelectedTransaksi(t);
    setKurirId("");
    setDateError("");

    const tx = new Date(t.tanggal_transaksi);
    const nextDay = new Date(tx);
    nextDay.setDate(tx.getDate() + 1);

    const sameDayOK = isSameDayValid(t.tanggal_transaksi);
    const defaultDt = sameDayOK ? tx : nextDay;
    const minDt = sameDayOK ? tx : nextDay;

    setTanggalJadwal(defaultDt.toISOString().slice(0, 10));

    setMinDate(minDt.toISOString().slice(0, 10));

    setShowModal(true);
  };

  const [minDate, setMinDate] = useState("");
  const handleSave = async () => {
    if (!selectedTransaksi) return;
    try {
      if (filter === "Delivery") {
        await api.post("/pengiriman", {
          id_transaksi: selectedTransaksi.id_transaksi,
          id_pegawai: kurirId,
          tanggal_pengiriman: tanggalJadwal,
          status_pengiriman: "Scheduled",
        });
      } else {
        await api.post("/pengambilan", {
          id_transaksi: selectedTransaksi.id_transaksi,
          tanggal_pengambilan: tanggalJadwal,
          status_pengambilan: "Belum diambil",
        });
      }

      setToastVariant("success");
      setToastMessage("Jadwal berhasil disimpan!");
      setToastShow(true);
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
      setToastVariant("danger");
      setToastMessage("Gagal menyimpan jadwal.");
      setToastShow(true);
      return;
    }

    const nota = selectedTransaksi.no_nota ?? selectedTransaksi.id_transaksi;
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const timePart = `${hours}:${minutes}`;

    let title, body;
    if (filter === "Delivery") {
      title = "Pesanan Anda sudah dijadwalkan!";
      body = `Pesanan dengan no nota (${nota}) akan dikirimkan pada tanggal ${tanggalJadwal}`;
    } else {
      title = "Pesanan Anda sudah dijadwalkan";
      body = `Pesanan dengan no nota (${nota}) dapat diambil pada tanggal ${tanggalJadwal}`;
    }

    (async () => {
      const buyerId = selectedTransaksi.user?.id_user;
      const penitipUser =
        selectedTransaksi.detil_transaksi?.[0]?.barang?.penitipan?.user;
      const penitipId = penitipUser?.id_user;

      const recipients = [];
      if (buyerId) recipients.push(buyerId);
      if (penitipId && penitipId !== buyerId) recipients.push(penitipId);

      for (const user_id of recipients) {
        try {
          await api.post("/send-notification", { user_id, title, body });
          console.log(`✅ Push sent to user ${user_id}`);
        } catch (pushErr) {
          console.warn(
            `⚠️ Push to ${user_id} failed (ignored):`,
            pushErr.response?.data || pushErr.message
          );
        }
      }
      if (filter === "Delivery" && kurirId) {
        try {
          await api.post("/send-notification", {
            user_id: kurirId,
            title,
            body,
          });
          console.log(`✅ Push sent to kurir ${kurirId}`);
        } catch (pushErr) {
          console.warn(
            `⚠️ Push to kurir ${kurirId} failed (ignored):`,
            pushErr.response?.data || pushErr.message
          );
        }
      }
    })();
  };

  const openDetail = (t) => {
    setSelectedTransaksi(t);
    setShowDetail(true);
  };

  const closeDetail = () => setShowDetail(false);

  const handleKonfirmasiAmbil = async (t) => {
    try {
      await api.patch(
        `/updateStatusPengambilan/${t.pengambilan.id_pengambilan}`,
        {
          status_pengambilan: "Sudah diambil",
        }
      );
      await addKomisi(t);

      setToastVariant("success");
      setToastMessage("Pengambilan berhasil dikonfirmasi!");
      setToastShow(true);

      const params = { metode_pengiriman: filter, search };
      const { data } = await api.get("/transaksi/penjadwalan", { params });
      setSchedules(data);
    } catch (err) {
      console.error("Error confirming pickup:", err);
      alert("Gagal menandai pengambilan sebagai Sudah diambil.");
      setToastVariant("danger");
      setToastMessage("Gagal konfirmasi pengambilan.");
      setToastShow(true);
      return;
    }

    // 2️⃣ Build both notification bodies
    const productNames = t.detil_transaksi
      .map((dt) => dt.barang.nama_barang)
      .join(", ");

    const buyerTitle = "Terima Kasih Sudah Berbelanja di ReuseMart!";
    const buyerBody = `${productNames} sudah diterima oleh Anda!`;

    const penitipTitle = "Pesanan Anda telah diambil!";
    const penitipBody = `${productNames} sudah diterima oleh pembeli.Cek saldo Anda sekarang, CUAAAAANNN!`;

    // 3️⃣ Determine both recipients
    const buyerId = t.user.id_user;
    const penitipUser = t.detil_transaksi?.[0]?.barang?.penitipan?.user;
    const penitipId = penitipUser?.id_user;

    const recipients = [];
    if (buyerId)
      recipients.push({ id: buyerId, title: buyerTitle, body: buyerBody });
    if (penitipId && penitipId !== buyerId) {
      recipients.push({
        id: penitipId,
        title: penitipTitle,
        body: penitipBody,
      });
    }

    // 4️⃣ Send to each, silently catching errors
    for (const { id, title, body } of recipients) {
      try {
        await api.post("/send-notification", {
          user_id: id,
          title,
          body,
        });
        console.log(`✅ Notification sent to user ${id}`);
      } catch (pushErr) {
        console.warn(
          `⚠️ Notification to ${id} failed (ignored):`,
          pushErr.response?.data || pushErr.message
        );
      }
    }
  };

  let countdownDisplay = null;
  if (filter === "Pick Up" && selectedTransaksi?.pengambilan) {
    const pickTs = new Date(
      selectedTransaksi.pengambilan.tanggal_pengambilan
    ).getTime();
    const deadline = pickTs + 44 * 3600 * 1000;
    const diff = deadline - now;
    if (diff <= 0) {
      countdownDisplay = <strong>Waktu pengambilan habis</strong>;
    } else {
      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      countdownDisplay = (
        <>
          <strong>{h}</strong>j <strong>{m}</strong>m <strong>{s}</strong>s
        </>
      );
    }
  }

  const handleCetakNotaKurir = () => {
    setShowNotaKurir(true);
  };

  const closeNotaKurir = () => setShowNotaKurir(false);

  return (
    <>
      <ToastContainer position="top-end" className="p-3">
        <Toast
          bg={toastVariant}
          onClose={() => setToastShow(false)}
          show={toastShow}
          delay={3000}
          autohide
        >
          <Toast.Body className={toastVariant === "danger" ? "text-white" : ""}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
      <NavbarGudang />

      <Container className="mt-5" style={{ background: 'none' }}>
        {/* FILTER BAR */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-success fw-bold">Penjadwalan</h2>
          <div className="d-flex align-items-center">
            <div>
              {methodOptions.map((opt) => (
                <span
                  key={opt.value}
                  className={`filter-option ${filter === opt.value ? "active" : ""
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
                <th>Action</th>
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
                    {filter === "Delivery" && (
                      <td>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleArrived(t)}
                          disabled={
                            t.pengiriman?.status_pengiriman === "Arrived"
                          }
                        >
                          Mark Arrived
                        </Button>
                      </td>
                    )}

                    {filter === "Pick Up" && (
                      <td>
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => handleKonfirmasiAmbil(t)}
                          disabled={
                            t.pengambilan?.status_pengambilan !==
                            "Belum diambil"
                          }
                        >
                          Konfirmasi Ambil
                        </Button>
                      </td>
                    )}
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
                  min={minDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTanggalJadwal(val);

                    const txDateStr = formatDate(
                      new Date(selectedTransaksi.tanggal_transaksi)
                    );

                    if (
                      val === txDateStr &&
                      !isSameDayValid(selectedTransaksi.tanggal_transaksi)
                    ) {
                      setDateError(
                        "Transaksi lewat jam 16:00:00, tidak bisa pilih hari ini."
                      );
                    } else {
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
                  {filter === "Pick Up" && selectedTransaksi.pengambilan && (
                    <tr>
                      <td>
                        <strong>Batas Waktu Pengambilan</strong>
                      </td>
                      <td>{countdownDisplay}</td>
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
          {selectedTransaksi?.metode_pengiriman === "Delivery" && (
            <Button variant="success" onClick={handleCetakNotaKurir}>
              Cetak Nota Kurir
            </Button>
          )}

          {selectedTransaksi?.metode_pengiriman === "Pick Up" && (
            <Button variant="success" onClick={handleCetakNotaKurir}>
              Cetak Nota Pembeli
            </Button>
          )}
          <Button variant="secondary" onClick={closeDetail}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
      <NotaKurir
        show={showNotaKurir}
        onHide={closeNotaKurir}
        transaksiId={selectedTransaksi?.id_transaksi}
      />
    </>
  );
};

export default Penjadwalan;
