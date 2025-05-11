import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Form, Button, Toast } from "react-bootstrap";
import api from "../../api/api.js";

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [toastMsg, setToastMsg] = useState("");
    const [toastVariant, setToastVariant] = useState("success");
    const [showToast, setShowToast] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const query = new URLSearchParams(location.search);
    const token = query.get("token");
    const email = query.get("email");

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (password !== passwordConfirmation) {
            setToastVariant("danger");
            setToastMsg("Password dan konfirmasi tidak cocok");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        try {
            const { data } = await api.post("/reset-password", {
                email,
                token,
                password,
                password_confirmation: passwordConfirmation,
            });
            setToastVariant("success");
            setToastMsg(data.message || "Password berhasil direset!");
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                navigate("/");
            }, 3000);
        } catch (err) {
            const message = err.response?.data?.error || "Gagal mereset password";
            setToastVariant("danger");
            setToastMsg(message);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    return (
        <div
            className="d-flex justify-content-center align-items-center min-vh-100"
            style={{ backgroundColor: "#f8f9fa" }}
        >
            <div
                className="bg-white p-4 rounded shadow"
                style={{
                    maxWidth: "400px",
                    width: "100%",
                    border: "2px solid #28a745",
                }}
            >
                <h2 className="text-center fw-bold text-success mb-4">Reset Password</h2>
                <Form onSubmit={handleResetPassword}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={email}
                            disabled
                            className="border-success"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Password Baru</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="border-success"
                        />
                    </Form.Group>
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Konfirmasi Password</Form.Label>
                        <Form.Control
                            type="password"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                            className="border-success"
                        />
                    </Form.Group>
                    <Button
                        type="submit"
                        variant="success"
                        className="w-100 fw-bold"
                    >
                        Reset Password
                    </Button>
                </Form>

                <div className="auth-toast-container mt-3">
                    <Toast
                        className={`auth-toast slide-down-toast ${toastVariant}`}
                        show={showToast}
                        onClose={() => setShowToast(false)}
                        autohide
                        delay={3000}
                    >
                        <Toast.Body className="fw-bold">{toastMsg}</Toast.Body>
                    </Toast>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;