import { logger } from "@/src/logger";
import { Message } from "@/src/types";
import { parse } from "url";
import { WebSocket, WebSocketServer } from "ws";

const connections: { [key: string]: WebSocket } = {};
const users: { [key: string]: Message } = {};

const broadcast = (message: string) => {
  Object.values(connections).forEach((connection) => {
    connection.send(message);
  });
};

const handleMessage = (message: string, id: string) => {
  try {
    const _message: Message = JSON.parse(message);
    const user = users[id];
    user.state = _message.state;

    broadcast(JSON.stringify(user));

    logger.info("Message received", { id, message: _message });
  } catch (error) {
    logger.error("Error parsing message", {
      id,
      message,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const handleClose = (id: string) => {
  const username = users[id]?.username;
  delete connections[id];
  delete users[id];

  broadcast(JSON.stringify({ id, state: { session: "offline" } }));

  logger.info("Connection closed", {
    id,
    user: username,
  });
};

export const setupWebSocket = (wss_server: WebSocketServer) => {
  wss_server.on("connection", (connection, req) => {
    const query = parse(req.url!, true).query;
    const id = query.id as string;
    const user = query.user as string;

    if (!id || !user) {
      logger.warn("Invalid connection parameters", { id, user });
      connection.close();
      return;
    }

    connections[id] = connection;

    users[id] = {
      username: user,
      state: {
        x: 0,
        y: 0,
        session: "online",
      },
    };

    broadcast(JSON.stringify({ id, state: { session: "online" } }));

    logger.info("Connection stabilized", {
      id,
      user,
      connections: Object.keys(connections).length,
    });

    connection.on("message", (message) =>
      handleMessage(message.toString(), id)
    );
    connection.on("close", () => handleClose(id));
  });
};
