import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const BASE_URL = process.env.REACT_APP_API_URL;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (res.ok) {
        setSuccess("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        const text = await res.text();
        setError(text || "Kayıt başarısız.");
      }
    } catch (err) {
      setError("Sunucuya bağlanılamadı.");
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Yeni Hesap Oluştur</h2>

        <form onSubmit={handleRegister}>
          <label>Kullanıcı Adı</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Kullanıcı adınızı girin örn: MustafaBurak"
            required
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email adresinizi girin örn: mustafa@example.com"
            required
          />

          <label>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifrenizi girin örn: 112233"
            required
          />

          <label>Şifre (Tekrar)</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Şifrenizi tekrar girin örn: 112233"
            required
          />

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button type="submit">Kayıt Ol</button>
        </form>

        <p>
          Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}
