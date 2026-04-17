import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const BASE_URL = process.env.REACT_APP_API_URL;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        setSuccess("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        const error = await res.json();
        setError(error.message || "Kayıt başarısız.");
      }
    } catch (err) {
      setError("Sunucuya bağlanılamadı.");
    }
  };

  return (
    <div className="register-container">
      <div className="register-background">
        <div className="register-card">
          <div className="register-header">
            <h1>🧛‍♂️ Vampire Village</h1>
            <h2>Yeni Hesap Oluştur</h2>
            <p>Karanlık dünyamıza katılın ve maceraya başlayın!</p>
          </div>

          <form onSubmit={handleRegister} className="register-form">
            <div className="input-group">
              <label>👤 Kullanıcı Adı</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınızı girin (örn: MustafaBurak)"
                required
              />
            </div>

            <div className="input-group">
              <label>🔒 Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="🔒 Şifre girin"
                required
              />
            </div>

            {error && <div className="error-message">❌ {error}</div>}
            {success && <div className="success-message">✅ {success}</div>}

            <button type="submit" className="register-btn">
              🎮 Hesap Oluştur
            </button>
          </form>

          <div className="register-footer">
            <p>
              Zaten hesabınız var mı?
              <Link to="/login" className="login-link">
                Giriş Yapın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
