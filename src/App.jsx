import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LobbyPage from "./pages/LobbyPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import GamePage from "./pages/GamePage";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Private Routes */}
        <Route
          path="/lobby"
          element={
            <PrivateRoute>
              <LobbyPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/create-room"
          element={
            <PrivateRoute>
              <CreateRoomPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/game/:roomId"
          element={
            <PrivateRoute>
              <GamePage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
