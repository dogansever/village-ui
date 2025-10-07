import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export const useWebSocket = (roomId, onMessageReceived) => {
  const clientRef = useRef(null);

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws-game");
    const client = new Client({
      webSocketFactory: () => socket,
      debug: () => {},
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/room/${roomId}`, (message) => {
          const data = JSON.parse(message.body);
          onMessageReceived(data);
        });
      },
    });
    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [roomId, onMessageReceived]);

  const sendMessage = (destination, body) => {
    clientRef.current.publish({ destination, body: JSON.stringify(body) });
  };

  return { sendMessage };
};
