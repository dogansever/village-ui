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

  const phaseTranslations = {
    WAITING: "Oyuncular bekleniyor",
    NIGHT: "Şu an Gece oynanıyor",
    DAY: "Şu an Gündüz oynanıyor",
    ENDED: "Yeni bir oyun başlamak üzere",
  };

  const getPhaseName = (phase) => {
    return phaseTranslations[phase] || phase || "Bilinmiyor";
  };

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
        const error = await res.json();
        setError(error.message || "Oda silinemedi.");
      }
    } catch (err) {
      setError("Oda silinirken hata oluştu.");
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
        const error = await res.json();
        setError(error.message || "Odaya katılım başarısız oldu.");
      }
    } catch (err) {
      setError("Sunucuya bağlanılamadı.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading)
    return (
      <div className="lobby-container">
        <div className="loading-card">
          <h2>🧛‍♂️ Yükleniyor...</h2>
        </div>
      </div>
    );

  return (
    <div className="lobby-container">
      <div className="lobby-background">
        <div className="lobby-card">
          <div className="lobby-header">
            <div className="header-title">
              <h1>🧛‍♂️ Vampire Village</h1>
              <h2>🏰 Oda Listesi</h2>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              👤 {localStorage.getItem("username")} - Çıkış Yap
            </button>
          </div>

          {error && <div className="error-message">❌ {error}</div>}

          <div className="rooms-section">
            {rooms.length === 0 ? (
              <div className="no-rooms">
                <h3>🏚️ Henüz oda yok</h3>
                <p>İlk odayı siz oluşturun!</p>
              </div>
            ) : (
              <div className="rooms-list">
                {rooms.map((room) => (
                  <div key={room.id} className="room-card">
                    <div className="room-info">
                      <h3 className="room-name">🏠 {room.name}</h3>
                      <div className="room-details">
                        <span className="room-players">
                          👥 {room.players?.length || 0} /{" "}
                          {room.maxPlayers || 10} oyuncu
                        </span>
                        <span className="room-owner">
                          👑 {room.owner?.username || "Bilinmiyor"}
                        </span>
                        <span className="room-phase">
                          ⏰ {getPhaseName(room.currentPhase)}
                        </span>
                      </div>
                    </div>

                    <div className="room-actions">
                      {room.joinKey && (
                        <input
                          placeholder="🔑 Oda anahtarını girin"
                          value={joinKeys[room.id] || ""}
                          onChange={(e) =>
                            setJoinKeys({
                              ...joinKeys,
                              [room.id]: e.target.value,
                            })
                          }
                          className="join-key-input"
                        />
                      )}
                      <div className="room-buttons">
                        <button
                          onClick={() => handleJoin(room.id)}
                          className="join-btn"
                        >
                          🚪 Katıl
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="delete-btn"
                        >
                          🗑️ Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="create-room-section">
            <button
              onClick={() => navigate("/create-room")}
              className="create-room-btn"
            >
              ➕ Yeni Oda Oluştur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
