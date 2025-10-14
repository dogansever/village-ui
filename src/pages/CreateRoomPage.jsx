import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateRoomPage.css";

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const token = localStorage.getItem("token");
  const [joinKey, setJoinKey] = useState("");
  const BASE_URL = process.env.REACT_APP_API_URL;

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!roomName.trim()) {
      setError("Oda adı boş olamaz.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: roomName.trim(),
          maxPlayers,
          joinKey: joinKey.trim() || null,
        }),
      });

      if (res.ok) {
        const room = await res.json();
        setSuccess(
          `Oda başarıyla oluşturuldu! ${
            room.joinKey ? `Oda Anahtarı: ${room.joinKey}` : ""
          }`
        );
        setTimeout(() => navigate(`/game/${room.id}`), 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Oda oluşturulamadı.");
      }
    } catch (err) {
      setError("Sunucuya bağlanılamadı.");
    }
  };

  return (
    <div className="create-room-container">
      <div className="create-room-background">
        <div className="create-room-card">
          <div className="create-room-header">
            <h1>🧛‍♂️ Vampire Village</h1>
            <h2>🏰 Yeni Oda Oluştur</h2>
            <p>Kendi odanızı oluşturun ve arkadaşlarınızı davet edin!</p>
          </div>

          <form onSubmit={handleCreate} className="create-room-form">
            <div className="input-group">
              <label>🏠 Oda Adı</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Oda adını girin (örn: Karanlık Köy)"
                required
              />
            </div>

            <div className="input-group">
              <label>🔑 Oda Anahtarı (isteğe bağlı)</label>
              <input
                type="text"
                value={joinKey}
                onChange={(e) => setJoinKey(e.target.value)}
                placeholder="Güvenlik için anahtar belirleyin (boş bırakabilirsiniz)"
              />
            </div>

            <div className="input-group">
              <label>👥 Maksimum Oyuncu Sayısı</label>
              <input
                type="number"
                value={maxPlayers}
                min={5}
                max={20}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                placeholder="5-20 arası oyuncu sayısı"
              />
            </div>

            {error && <div className="error-message">❌ {error}</div>}
            {success && <div className="success-message">✅ {success}</div>}

            <button type="submit" className="create-btn">
              🎮 Oda Oluştur
            </button>
          </form>

          <div className="create-room-footer">
            <button onClick={() => navigate("/lobby")} className="back-btn">
              ← Lobby'ye Dön
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
