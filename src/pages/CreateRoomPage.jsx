import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateRoomPage.css";

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const [joinKey, setJoinKey] = useState("");
  const BASE_URL = process.env.REACT_APP_API_URL;

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!roomName) {
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
          name: roomName,
          maxPlayers,
          joinKey: joinKey || null,
        }),
      });

      if (res.ok) {
        const room = await res.json();
        alert(`Oda oluşturuldu! Oda Anahtarı: ${room.joinKey || "Yok"}`);
        navigate(`/game/${room.id}`);
      } else {
        const text = await res.text();
        setError(text || "Oda oluşturulamadı.");
      }
    } catch (err) {
      setError("Sunucuya bağlanılamadı.");
    }
  };

  return (
    <div className="create-room-container">
      <div className="create-room-card">
        <h2>Yeni Oda Oluştur</h2>

        <form onSubmit={handleCreate}>
          <label>Oda Adı</label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
          />

          <input
            placeholder="Oda Anahtarı (isteğe bağlı)"
            value={joinKey}
            onChange={(e) => setJoinKey(e.target.value)}
            style={{ display: "block", margin: "10px 0", width: "100%" }}
          />

          <label>Maksimum Oyuncu Sayısı</label>
          <input
            type="number"
            value={maxPlayers}
            min={2}
            max={20}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
          />

          {error && <div className="error">{error}</div>}

          <button type="submit">Oda Oluştur</button>
        </form>

        <button className="back-button" onClick={() => navigate("/lobby")}>
          Geri
        </button>
      </div>
    </div>
  );
}
