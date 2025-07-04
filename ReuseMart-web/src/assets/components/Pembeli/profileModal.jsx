import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal, Spinner, Row, Col, Form } from "react-bootstrap";
import { FiEdit2 } from "react-icons/fi";
import api from "../../../api/api.js";
import "./profileModal.css";

export default function ProfileModal({ show, onHide }) {
  const [profile, setProfile] = useState(null);
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const baseURL = api.defaults.baseURL.replace(/\/api\/?$/, "");

  const fetchProfile = useCallback(async () => {
    setProfile(null);
    try {
      const { data } = await api.get("user");
      setProfile(data);
    } catch {
      setProfile({});
    }
  }, []);

  useEffect(() => {
    if (show) {
      fetchProfile();
    }
  }, [show, fetchProfile]);

  const fullName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
    : "";

  const pickFile = () => fileInputRef.current?.click();

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profile_picture", file);
    setUploading(true);
    try {
      await api.post("user/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // append a timestamp so the browser always pulls the new image
  const avatarSrc = profile?.profile_picture
    ? `${baseURL}/storage/${profile.profile_picture}?t=${Date.now()}`
    : null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Body>
        {profile === null ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Row className="align-items-center" style={{ width: "100%" }}>
            <Col
              md={4}
              className="d-flex flex-column align-items-center"
              style={{ fontSize: "0.85rem", marginLeft: "5rem" }}
            >
              <div
                className="mt-3"
                style={{ position: "relative", width: 200, height: 200 }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={fullName}
                    className="img-fluid rounded-circle profile-avatar"
                  />
                ) : (
                  <div className="bg-secondary rounded-circle profile-avatar" />
                )}

                <FiEdit2 onClick={pickFile} className="edit-icon" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={uploadFile}
                  style={{ display: "none" }}
                />

                {uploading && (
                  <Spinner
                    animation="border"
                    size="sm"
                    style={{
                      position: "absolute",
                      bottom: 16,
                      right: 16,
                    }}
                  />
                )}
              </div>

              <h5 className="fw-bold mt-3 text-center">{fullName}</h5>

              <Form className="mt-4">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={profile.email || ""}
                    disabled
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">No. Telepon</Form.Label>
                  <Form.Control
                    type="text"
                    value={profile.no_telp || ""}
                    disabled
                  />
                </Form.Group>
              </Form>
            </Col>

            <Col
              md={6}
              className="d-flex flex-column align-items-center justify-content-center"
            >
              <h3 className="text-muted mb-3 fw-bold">Poin Loyalitas</h3>
              <div
                className="fw-bold text-success"
                style={{ fontSize: "8rem", lineHeight: 1 }}
              >
                {profile.poin_loyalitas ?? 0}
              </div>
            </Col>
          </Row>
        )}
      </Modal.Body>
    </Modal>
  );
}
