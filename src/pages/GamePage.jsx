import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./GamePage.css";

export default function GamePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState({});
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // admin kontrolü
  const token = localStorage.getItem("token");
  const [player, setPlayer] = useState({});
  const [selectedTarget, setSelectedTarget] = useState(null);
  const BASE_URL = process.env.REACT_APP_API_URL;

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Oda bilgisi alınamadı");
      const room = await res.json();
      setRoom(room);
      setPlayers(room.players || []);
      setIsAdmin(room.owner.username === localStorage.getItem("username")); // basit kontrol
      const currentPlayer = room.players.find(
        (p) => p.user.username === localStorage.getItem("username")
      );

      if (!currentPlayer) navigate("/lobby");

      setPlayer(currentPlayer || {});
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, roomId, BASE_URL, navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchRoom();
    const interval = setInterval(fetchRoom, 2000); // her 2 saniye güncelle
    return () => clearInterval(interval);
  }, [token, roomId, navigate, fetchRoom]);

  const handleAction = async (actionType) => {
    try {
      if (!selectedTarget) {
        alert("Önce hedef seçin");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/rooms/${roomId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: actionType,
          targetUsername: selectedTarget.user.username,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        alert(text || "Aksiyon başarısız oldu");
      } else {
        const room = await res.json();
        setRoom(room);
        setPlayers(room.players || []);
        const currentPlayer = room.players.find(
          (p) => p.user.username === localStorage.getItem("username")
        );
        setPlayer(currentPlayer || {});
        setSelectedTarget(null);
      }
    } catch {
      alert("Sunucuya bağlanılamadı.");
    }
  };

  // Faz butonları
  const handlePhase = async (phase) => {
    try {
      const res = await fetch(`${BASE_URL}/api/rooms/${roomId}/phase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phase }),
      });

      if (!res.ok) {
        const text = await res.text();
        alert(text || "Faz değişimi başarısız");
      } else {
        const room = await res.json();
        setRoom(room);
        setPlayers(room.players || []);
      }
    } catch {
      alert("Sunucuya bağlanılamadı.");
    }
  };

  const handleKickPlayer = async (username) => {
    if (!window.confirm(`${username} adlı oyuncuyu atmak istiyor musun?`))
      return;

    try {
      const res = await fetch(
        `${BASE_URL}/api/rooms/${room?.id}/kick/${username}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        alert(`Oyuncu atılamadı: ${(await res.json()).message}`);
      } else {
        alert(`${username} odadan atıldı.`);
        fetchRoom(); // listeyi güncelle
      }
    } catch (err) {
      alert("Oyuncu atılamadı: " + err.message);
    }
  };

  if (loading) return <div className="game-container">Yükleniyor...</div>;

  const roleTranslations = {
    VAMPIRE: "Vampir",
    VILLAGER: "Köylü",
    SEER: "Kahin",
    WITCH: "Cadı",
    HUNTER: "Avcı",
  };

  const getRoleName = (role) => {
    return roleTranslations[role] || role;
  };

  return (
    <div className="game-container">
      <h2>Oda: {room.name}</h2>
      {error && <div className="error">{error}</div>}

      {isAdmin && (
        <div className="phase-buttons">
          {room.currentPhase === "WAITING" && (
            <button onClick={() => handlePhase("start-game")}>
              Oyunu Başlat
            </button>
          )}
          {room.currentPhase === "NIGHT" && (
            <button onClick={() => handlePhase("end-night")}>Gece Bitir</button>
          )}
          {room.currentPhase === "DAY" && (
            <button onClick={() => handlePhase("end-day")}>Gündüz Bitir</button>
          )}
          {room.currentPhase === "ENDED" && (
            <button onClick={() => handlePhase("start-game")}>
              Yeni Oyun Başlat
            </button>
          )}
        </div>
      )}

      <div className="players-section">
        <h3>Oyuncular</h3>
        <ul>
          {players.map((p) => (
            <li
              key={p.user.username}
              onClick={() =>
                p.alive && p?.id !== player?.id && setSelectedTarget(p)
              }
              style={{
                cursor:
                  p.alive && p?.id !== player?.id ? "pointer" : "not-allowed",
                color: p.alive ? (p.voted ? "green" : "black") : "gray",
                fontWeight: selectedTarget?.id === p?.id ? "bold" : "normal",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor:
                  p?.id === player?.id
                    ? "#a4f561ff"
                    : selectedTarget?.id === p?.id
                    ? "#f7a308ff"
                    : "#f5f5f517",
                border:
                  p?.id === player?.id
                    ? "2px solid #2196f3"
                    : selectedTarget?.id === p?.id
                    ? "2px solid #ff9800"
                    : "1px solid #ddd",
                borderRadius: "4px",
                padding: "8px",
                margin: "2px 0",
                boxShadow:
                  p?.id === player?.id
                    ? "0 2px 8px rgba(33, 150, 243, 0.3)"
                    : selectedTarget?.id === p?.id
                    ? "0 2px 8px rgba(255, 152, 0, 0.3)"
                    : "none",
                transition: "all 0.2s ease",
              }}
            >
              <span>
                {p.user.username.toUpperCase()}
                {(!p.alive ||
                  player?.id === p?.id ||
                  room.currentPhase === "ENDED") &&
                  " - " + getRoleName(p.role)}{" "}
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span>
                  {p.alive ? (p.voted ? "Oyladı" : "Oylamadı") : "Ölü"}
                </span>
                {player?.user.id === room.owner.id && p?.id !== player?.id && (
                  <button
                    onClick={() => handleKickPlayer(p.user.username)}
                    style={{
                      backgroundColor: "#e74c3c",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Çıkar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="actions-section">
        <div className="actions-buttons">
          {room.currentPhase === "DAY" && player?.alive && (
            <button onClick={() => handleAction("vote")}>Suçla</button>
          )}
          {room.currentPhase === "NIGHT" &&
            player?.alive &&
            player?.role === "HUNTER" && (
              <button onClick={() => handleAction("protect")}>Koru</button>
            )}
          {room.currentPhase === "NIGHT" &&
            player?.alive &&
            player?.role === "SEER" && (
              <button onClick={() => handleAction("inspect")}>Sorgula</button>
            )}
          {room.currentPhase === "NIGHT" &&
            player?.alive &&
            player?.role !== "VAMPIRE" && (
              <button onClick={() => handleAction("watch")}>İzle</button>
            )}
          {room.currentPhase === "NIGHT" &&
            player?.alive &&
            player?.role === "VAMPIRE" && (
              <button onClick={() => handleAction("kill")}>Öldür</button>
            )}
          {room.currentPhase === "NIGHT" &&
            player?.alive &&
            player?.role === "WITCH" && (
              <button onClick={() => handleAction("poison")}>Zehirle</button>
            )}
        </div>
      </div>

      <div className="messages-section">
        <div className="private-messages">
          <h4>Kişisel Mesajlar</h4>
          <ul
            className="message-list"
            style={{ display: "flex", flexDirection: "column-reverse" }}
          >
            {player?.messages && player.messages.length > 0 ? (
              player.messages.map((msg, idx) => (
                <li key={idx} className="private-message">
                  {msg}
                </li>
              ))
            ) : (
              <li className="no-messages">Henüz kişisel mesaj yok</li>
            )}
          </ul>
        </div>
        <div className="public-messages">
          <h4>Genel Mesajlar</h4>
          <ul
            className="message-list"
            style={{ display: "flex", flexDirection: "column-reverse" }}
          >
            {room.messages && room.messages.length > 0 ? (
              room.messages.map((msg, idx) => (
                <li key={idx} className="public-message">
                  {msg}
                </li>
              ))
            ) : (
              <li className="no-messages">Henüz genel mesaj yok</li>
            )}
          </ul>
        </div>
      </div>

      <div className="actions-buttons">
        <button onClick={() => navigate("/lobby")}>Odadan Çıkış</button>
      </div>
    </div>
  );
}
