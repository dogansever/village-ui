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
  const [isAdmin, setIsAdmin] = useState(false);
  const token = localStorage.getItem("token");
  const [player, setPlayer] = useState({});
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    visible: false,
  });
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const BASE_URL = process.env.REACT_APP_API_URL;

  // Notification gösterme fonksiyonu
  const showNotification = (message, type = "info") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  // Timer başlatma fonksiyonu
  const startTimer = (seconds = 60) => {
    setTimer(seconds);
    setTimerActive(true);
    showNotification(`⏰ ${seconds} saniye düşünme süresi başladı!`, "info");
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  // Timer formatı (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Rol ve faz çevirileri
  const roleTranslations = {
    VAMPIRE: "Vampir",
    VILLAGER: "Köylü",
    SEER: "Kahin",
    WITCH: "Cadı",
    HUNTER: "Avcı",
  };

  const phaseTranslations = {
    WAITING: "Bekliyor",
    NIGHT: "Gece",
    DAY: "Gündüz",
    VOTING: "Oylama",
    ENDED: "Bitti",
  };

  const getRoleName = (role) => {
    return roleTranslations[role] || role;
  };

  const getPhaseName = (phase) => {
    return phaseTranslations[phase] || phase;
  };

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Oda bilgisi alınamadı");
      const room = await res.json();
      setRoom(room);
      setPlayers(room.players || []);
      setIsAdmin(room.owner.username === localStorage.getItem("username"));
      const currentPlayer = room.players.find(
        (p) => p.user.username === localStorage.getItem("username")
      );

      if (!currentPlayer) navigate("/lobby");

      setPlayer(currentPlayer || {});
      setError("");
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
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [token, roomId, navigate, fetchRoom]);

  const handleAction = async (actionType) => {
    try {
      if (!selectedTarget) {
        showNotification("⚠️ Önce hedef seçin", "warning");
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
        const error = await res.json();
        showNotification(
          `❌ ${error.message || "Aksiyon başarısız oldu"}`,
          "error"
        );
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
      showNotification("❌ Sunucuya bağlanılamadı", "error");
    }
  };

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
        showNotification(`❌ ${text || "Faz değişimi başarısız"}`, "error");
      } else {
        const room = await res.json();
        setRoom(room);
        setPlayers(room.players || []);

        // Faz değiştiğinde timer başlat
        if (
          room.currentPhase !== "ENDED" &&
          (phase === "start-game" ||
            phase === "end-night" ||
            phase === "end-day")
        ) {
          startTimer(60); // 60 saniye
        }
      }
    } catch {
      showNotification("❌ Sunucuya bağlanılamadı", "error");
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
        const error = await res.json();
        showNotification(`❌ ${error.message}`, "error");
      } else {
        showNotification(`✅ ${username} odadan atıldı`, "success");
        fetchRoom();
      }
    } catch (err) {
      showNotification(`❌ Oyuncu atılamadı: ${err.message}`, "error");
    }
  };

  if (loading) {
    return (
      <div className="game-container">
        <div className="loading-card">
          <h2>🧛‍♂️ Yükleniyor...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-background">
        <div className="game-card">
          {/* Header */}
          <div className="game-header">
            <div className="header-info">
              <h1>🧛‍♂️ {room.name}</h1>
              <h2>⏰ Faz: {getPhaseName(room.currentPhase)}</h2>
            </div>
            <button onClick={() => navigate("/lobby")} className="exit-btn">
              🚪 Odadan Çık
            </button>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="admin-section">
              <h3>👑 Yönetici Kontrolleri</h3>
              <div className="phase-buttons">
                {room.currentPhase === "WAITING" && (
                  <button
                    onClick={() => handlePhase("start-game")}
                    className="phase-btn start-btn"
                  >
                    🎮 Oyunu Başlat
                  </button>
                )}
                {room.currentPhase === "NIGHT" && (
                  <button
                    onClick={() => handlePhase("end-night")}
                    className="phase-btn night-btn"
                  >
                    🌙 Gece Bitir
                  </button>
                )}
                {room.currentPhase === "DAY" && (
                  <button
                    onClick={() => handlePhase("end-day")}
                    className="phase-btn day-btn"
                  >
                    ☀️ Gündüz Bitir
                  </button>
                )}
                {room.currentPhase === "ENDED" && (
                  <button
                    onClick={() => handlePhase("start-game")}
                    className="phase-btn restart-btn"
                  >
                    🔄 Yeni Oyun
                  </button>
                )}

                {/* Timer kontrol butonları */}
                <div className="timer-controls">
                  <button
                    onClick={() => startTimer(60)}
                    className="timer-btn"
                    disabled={timerActive}
                  >
                    ⏲️ 1dk Timer
                  </button>
                  <button
                    onClick={() => startTimer(30)}
                    className="timer-btn"
                    disabled={timerActive}
                  >
                    ⏲️ 30sn Timer
                  </button>
                  <button
                    onClick={() => {
                      setTimerActive(false);
                      setTimer(0);
                    }}
                    className="timer-btn stop-timer"
                    disabled={!timerActive}
                  >
                    ⏹️ Durdur
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification */}
          {notification.visible && (
            <div className={`notification ${notification.type}`}>
              {notification.message}
            </div>
          )}

          {/* Timer */}
          {timerActive && (
            <div
              className={`timer-display ${timer <= 10 ? "timer-warning" : ""}`}
            >
              ⏰ Kalan Süre: {formatTime(timer)}
            </div>
          )}

          {error && <div className="error-message">❌ {error}</div>}
          {/* Rest of the component remains the same... */}
          {/* Players Section */}
          <div className="players-section">
            <h3>👥 Oyuncular ({players.length})</h3>
            <div className="players-list">
              {players.map((p) => (
                <div
                  key={p.user.username}
                  onClick={() =>
                    p.alive && p?.id !== player?.id && setSelectedTarget(p)
                  }
                  className={`player-card ${
                    p?.id === player?.id
                      ? "current-player"
                      : selectedTarget?.id === p?.id
                      ? "selected-target"
                      : !p.alive
                      ? "dead-player"
                      : ""
                  } ${p.alive && p?.id !== player?.id ? "clickable" : ""}`}
                >
                  <div className="player-info">
                    <span className="player-name">
                      {p.user.username.toUpperCase()}
                      {(!p.alive ||
                        player?.id === p?.id ||
                        room.currentPhase === "ENDED") &&
                        ` - ${getRoleName(p.role)}`}
                    </span>
                    <span className="player-status">
                      {p.alive
                        ? p.voted
                          ? "✅ Oyladı"
                          : "⏳ Oylamadı"
                        : "💀 Ölü"}
                    </span>
                  </div>
                  {player?.user.id === room.owner.id &&
                    p?.id !== player?.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleKickPlayer(p.user.username);
                        }}
                        className="kick-btn"
                      >
                        🚫 Çıkar
                      </button>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions Section */}
          <div className="actions-section">
            <h3>⚡ Aksiyonlar</h3>
            <div className="actions-buttons">
              {room.currentPhase === "DAY" && player?.alive && (
                <button
                  onClick={() => handleAction("vote")}
                  className="action-btn vote-btn"
                >
                  ⚖️ Suçla
                </button>
              )}
              {room.currentPhase === "NIGHT" &&
                player?.alive &&
                player?.role === "HUNTER" && (
                  <button
                    onClick={() => handleAction("protect")}
                    className="action-btn protect-btn"
                  >
                    🛡️ Koru
                  </button>
                )}
              {room.currentPhase === "NIGHT" &&
                player?.alive &&
                player?.role === "HUNTER" && (
                  <button
                    onClick={() => handleAction("hunt")}
                    className="action-btn protect-btn"
                  >
                    🗡️ Avla
                  </button>
                )}
              {room.currentPhase === "NIGHT" &&
                player?.alive &&
                player?.role === "SEER" && (
                  <button
                    onClick={() => handleAction("inspect")}
                    className="action-btn inspect-btn"
                  >
                    🔍 Sorgula
                  </button>
                )}
              {room.currentPhase === "NIGHT" &&
                player?.alive &&
                player?.role !== "HUNTER" &&
                player?.role !== "VAMPIRE" && (
                  <button
                    onClick={() => handleAction("watch")}
                    className="action-btn watch-btn"
                  >
                    👁️ İzle
                  </button>
                )}
              {room.currentPhase === "NIGHT" &&
                player?.alive &&
                player?.role === "VAMPIRE" && (
                  <button
                    onClick={() => handleAction("kill")}
                    className="action-btn kill-btn"
                  >
                    🗡️ Öldür
                  </button>
                )}
              {room.currentPhase === "NIGHT" &&
                player?.alive &&
                player?.role === "WITCH" && (
                  <button
                    onClick={() => handleAction("poison")}
                    className="action-btn poison-btn"
                  >
                    🧪 Zehirle
                  </button>
                )}
            </div>
            {selectedTarget && (
              <div className="selected-info">
                🎯 Seçili Hedef: <strong>{selectedTarget.user.username}</strong>
              </div>
            )}
          </div>

          {/* Messages Section */}
          <div className="messages-section">
            <h3>💬 Mesajlar</h3>

            <div className="messages-container">
              <div className="private-messages">
                <h4>🔒 Kişisel Mesajlar</h4>
                <div className="message-list">
                  {player?.messages && player.messages.length > 0 ? (
                    player.messages
                      .slice()
                      .reverse()
                      .map((msg, idx) => (
                        <div key={idx} className="message private-message">
                          {msg}
                        </div>
                      ))
                  ) : (
                    <div className="no-messages">Henüz kişisel mesaj yok</div>
                  )}
                </div>
              </div>

              <div className="public-messages">
                <h4>📢 Genel Mesajlar</h4>
                <div className="message-list">
                  {room.messages && room.messages.length > 0 ? (
                    room.messages
                      .slice()
                      .reverse()
                      .map((msg, idx) => (
                        <div key={idx} className="message public-message">
                          {msg}
                        </div>
                      ))
                  ) : (
                    <div className="no-messages">Henüz genel mesaj yok</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
