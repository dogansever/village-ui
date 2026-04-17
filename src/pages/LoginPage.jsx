import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css"; // CSS modülü import

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const BASE_URL = process.env.REACT_APP_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", username);
        navigate("/lobby");
      } else {
        const err = await response.json();
        setError(err.message || "Giriş başarısız.");
      }
    } catch (err) {
      setError("Sunucuya bağlanılamadı.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-card">
          <div className="login-header">
            <h1>🧛‍♂️ Vampire Village</h1>
            <h2>Karanlık Dünyaya Giriş</h2>
            <p>Hesabınızla giriş yapın ve maceraya katılın!</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
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

            {error && <div className="error-message">❌ {error}</div>}

            <button type="submit" className="login-btn">
              🎮 Giriş Yap
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
