import { createContext, useState } from "react";

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [phase, setPhase] = useState("LOBBY"); // NIGHT / DAY / RESULT
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);

  return (
    <GameContext.Provider
      value={{ phase, setPhase, players, setPlayers, winner, setWinner }}
    >
      {children}
    </GameContext.Provider>
  );
};
