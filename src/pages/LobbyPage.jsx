import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./LobbyPage.css";

export default function LobbyPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const [joinKeys, setJoinKeys] = useState({}); // roomId -> key mapping
  const BASE_URL = process.env.REACT_APP_API_URL;

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Oda listesi alınamadı");
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, BASE_URL]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [token, navigate, fetchRooms]);

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Odayı silmek istediğine emin misin?")) return;

    try {
      const res = await fetch(`${BASE_URL}/api/rooms/${roomId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchRooms(); // odaları yeniden yükle
      else {
        const text = await res.text();
        alert(text || "Oda silinemedi.");
      }
    } catch (err) {
      alert("Oda silinirken hata:", err);
    }
  };

  const handleJoin = async (roomId) => {
    try {
      const key = joinKeys[roomId] || "";
      const url = `${BASE_URL}/api/rooms/${roomId}/join?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        navigate(`/game/${roomId}`);
      } else {
        const text = await res.text();
        alert(text || "Odaya katılım başarısız oldu.");
      }
    } catch (err) {
      alert("Sunucuya bağlanılamadı.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading)
    return (
      <div className="lobby-container">
        <p>Yükleniyor...</p>
      </div>
    );

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h2>Oda Listesi</h2>
        <button onClick={handleLogout}>
          {localStorage.getItem("username")} - Çıkış Yap
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="rooms-list">
        {rooms.length === 0 ? (
          <p>Henüz oda yok.</p>
        ) : (
          rooms.map((room) => (
            <div key={room.id} className="room-card">
              <div>
                <p className="room-name">{room.name}</p>
                <p className="room-info">
                  {room.players?.length || 0} / {room.maxPlayers || 10} oyuncu
                </p>
              </div>
              {room.joinKey && (
                <input
                  placeholder="Oda anahtarını girin"
                  value={joinKeys[room.id] || ""}
                  onChange={(e) =>
                    setJoinKeys({ ...joinKeys, [room.id]: e.target.value })
                  }
                  style={{ marginTop: "5px", marginRight: "5px" }}
                />
              )}
              <button onClick={() => handleJoin(room.id)}>Katıl</button>
              <button onClick={() => handleDeleteRoom(room.id)}>Sil</button>
            </div>
          ))
        )}
      </div>

      <div className="create-room">
        <button onClick={() => navigate("/create-room")}>
          Yeni Oda Oluştur
        </button>
      </div>
    </div>
  );
}
