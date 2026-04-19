import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./GamePage.css";

export default function GamePage() {
  const [actionDisabled, setActionDisabled] = useState(false);
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
    VAMPIRE: { name: "Vampir", icon: "🧛‍♂️", color: "#8b0000" },
    VILLAGER: { name: "Köylü", icon: "👨‍🌾", color: "#228b22" },
    SEER: { name: "Kahin", icon: "🔮", color: "#4169e1" },
    WITCH: { name: "Cadı", icon: "🧙‍♀️", color: "#800080" },
    HUNTER: { name: "Avcı", icon: "🏹", color: "#b8860b" },
  };

  const phaseTranslations = {
    WAITING: "Oyuncular bekleniyor",
    NIGHT: "Şu an Gece oynanıyor",
    DAY: "Şu an Gündüz oynanıyor",
    ENDED: "Yeni bir oyun başlamak üzere",
  };

  const getRoleName = (role) => {
    const roleData = roleTranslations[role];
    if (roleData) {
      return (
        <span className="role-display" style={{ color: roleData.color }}>
          {roleData.icon} {roleData.name}
        </span>
      );
    }
    return role;
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
    if (actionDisabled) return;
    if (!window.confirm("Bu aksiyonu yapmak istediğinize emin misiniz?")) return;
    setActionDisabled(true);
    try {
      if (!selectedTarget) {
        showNotification("⚠️ Önce hedef seçin", "warning");
        setActionDisabled(false);
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
    }finally {
      setActionDisabled(false);
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
                    onClick={() => {
                      if (window.confirm("Yeni oyun başlatmak istediğinize emin misiniz?")) {
                        handlePhase("start-game");
                      }
                    }}
                    className="phase-btn start-btn"
                  >
                    🎮 Oyunu Başlat
                  </button>
                )}
                {room.currentPhase === "NIGHT" && (
                  <button
                    onClick={() => {
                      if (window.confirm("Geceyi bitirmek istediğinize emin misiniz?")) {
                        handlePhase("end-night");
                      }
                    }}
                    className="phase-btn night-btn"
                  >
                    🌙 Geceyi Bitir
                  </button>
                )}
                {room.currentPhase === "DAY" && (
                  <button
                    onClick={() => {
                      if (window.confirm("Gündüzü bitirmek istediğinize emin misiniz?")) {
                        handlePhase("end-day");
                      }
                    }}
                    className="phase-btn day-btn"
                  >
                    ☀️ Gündüzü Bitir
                  </button>
                )}
                {room.currentPhase === "ENDED" && (
                  <button
                    onClick={() => {
                      if (window.confirm("Yeni oyun başlatmak istediğinize emin misiniz?")) {
                        handlePhase("start-game");
                      }
                    }}
                    className="phase-btn restart-btn"
                  >
                    🔄 Yeni Oyun
                  </button>
                )}
                {room.currentPhase !== "ENDED" && (
                  <button
                    onClick={() => {
                      if (window.confirm("Oyunu bitirmek istediğinize emin misiniz?")) {
                        handlePhase("end-game");
                      }
                    }}
                    className="phase-btn end-btn"
                  >
                    🛑 Oyunu Bitir
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
                      {p.user.wins > 0 && (
                        <span className="wins-stars">
                          {" "}
                          {Array.from(
                            { length: Math.min(p.user.wins, 5) },
                            (_, i) => (
                              <span key={i} className="star">
                                ⭐
                              </span>
                            )
                          )}
                          {p.user.wins > 5 && (
                            <span className="wins-count">({p.user.wins})</span>
                          )}
                        </span>
                      )}
                      {p.user.evils > 0 && (
                        <span className="evils-bats">
                          {" "}
                          {Array.from(
                            { length: Math.min(p.user.evils, 3) },
                            (_, i) => (
                              <span key={i} className="bat">
                                🦇
                              </span>
                            )
                          )}
                          {p.user.evils > 3 && (
                            <span className="evils-count">
                              ({p.user.evils})
                            </span>
                          )}
                        </span>
                      )}
                      {(!p.alive ||
                        player?.id === p?.id ||
                        room.currentPhase === "ENDED") && (
                        <span className="role-separator"> - </span>
                      )}
                      {(!p.alive ||
                        player?.id === p?.id ||
                        room.currentPhase === "ENDED") &&
                        getRoleName(p.role)}
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
            {selectedTarget && (
              <div className="selected-info">
                🎯 Seçili Hedef: <strong>{selectedTarget.user.username}</strong>
              </div>
            )}
            <div className="actions-buttons">
              {room.currentPhase === "DAY" && player?.alive && (
                <button
                  onClick={() => handleAction("vote")}
                  className="action-btn vote-btn"
                  disabled={actionDisabled}
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
                    disabled={actionDisabled}
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
                    disabled={actionDisabled}
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
                    disabled={actionDisabled}
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
                    disabled={actionDisabled}
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
                    disabled={actionDisabled}
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
                    disabled={actionDisabled}
                  >
                    🧪 Zehirle
                  </button>
                )}
            </div>
          </div>

          {/* Messages Section */}
          <div className="messages-section">
            <h3>💬 Mesajlar</h3>

            <div className="messages-container">
              <div className="private-messages">
                <h4>🔒 Kişisel Mesajlar</h4>
                <div className="message-list">
                  {player?.messages?.length > 0
                    ? player.messages
                        .slice()
                        .reverse()
                        .map((msg, idx) => (
                          <div key={idx} className="message private-message">
                            {msg}
                          </div>
                        ))
                    : null}

                  {player?.messagesOld?.length > 0
                    ? player.messagesOld
                        .slice()
                        .reverse()
                        .map((msg, idx) => (
                          <div
                            key={idx}
                            className="message private-message-old"
                          >
                            {msg}
                          </div>
                        ))
                    : null}

                  {player?.messages?.length > 0 ||
                  player?.messagesOld?.length > 0 ? null : (
                    <div className="no-messages">Henüz kişisel mesaj yok</div>
                  )}
                </div>
              </div>

              <div className="public-messages">
                <h4>📢 Genel Mesajlar</h4>
                <div className="message-list">
                  {room.messages?.length > 0 &&
                    room.messages
                      .slice()
                      .reverse()
                      .map((msg, idx) => (
                        <div key={idx} className="message public-message">
                          {msg}
                        </div>
                      ))}
                  {room.messagesOld?.length > 0 &&
                    room.messagesOld
                      .slice()
                      .reverse()
                      .map((msg, idx) => (
                        <div key={idx} className="message public-message-old">
                          {msg}
                        </div>
                      ))}
                  {room.messages?.length !== 0 ||
                  room.messagesOld?.length !== 0 ? null : (
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
