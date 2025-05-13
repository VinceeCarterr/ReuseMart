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

    // Validasi sebelum mengirim
    const validateForm = () => {
        if (!email || !token) {
            setToastMsg("Email atau token tidak valid. Silakan coba lagi dari email reset password.");
            setToastVariant("danger");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return false;
        }
        if (password.length < 6) {
            setToastMsg("Password harus minimal 6 karakter.");
            setToastVariant("danger");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return false;
        }
        if (password !== passwordConfirmation) {
            setToastMsg("Password dan konfirmasi tidak cocok.");
            setToastVariant("danger");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return false;
        }
        return true;
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const data = {
            email: email.toLowerCase(),
            token,
            password,
            password_confirmation: passwordConfirmation,
        };

        console.log("Data dikirim ke backend:", data); // Logging untuk debugging

        try {
            const response = await api.post("/reset-password", data, {
                headers: { "Content-Type": "application/json" },
            });
            setToastVariant("success");
            setToastMsg(response.data.message || "Password berhasil direset!");
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                navigate("/");
            }, 3000);
        } catch (err) {
            console.error("Error dari backend:", err.response?.data); // Logging error
            let message = "Gagal mereset password.";
            if (err.response?.data?.error) {
                message = err.response.data.error;
                if (err.response.data.details) {
                    message += ": " + Object.values(err.response.data.details).flat().join(", ");
                }
            }
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
                            value={email || ""}
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
                            placeholder="Minimal 6 karakter"
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
                            placeholder="Ulangi password"
                            required
                            className="border-success"
                        />
                    </Form.Group>
                    <Button
                        type="submit"
                        variant="success"
                        className="w-100 fw-bold"
                        disabled={!email || !token}
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