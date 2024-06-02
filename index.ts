import http from "http";
import { parse } from "url";
import winston from "winston";
import { WebSocketServer } from "ws";

const port = 8080;

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

const server = http.createServer((req, res) => {});

const wss_server = new WebSocketServer({ server });

const connections: { [key: string]: any } = {};
const users: { [key: string]: Message } = {};

type Message = {
  username: string;
  state: {
    x: number;
    y: number;
    session: string | "offline" | "online";
  };
};

const handleMessage = (message: string, id: string) => {
  try {
    const _message = JSON.parse(message);
    logger.info("Received message", { id, message: _message });
  } catch (error) {
    logger.error("Error parsing message", { id, message, error });
  }
};

const handleClose = (id: string) => {
  delete connections[id];
  delete users[id];
  logger.info("Connection closed", { id });
};

wss_server.on("connection", (connection, req) => {
  const { id, user } = parse(req.url!, true).query;

  if (typeof id !== "string" || typeof user !== "string") {
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
      session: "offline",
    },
  };

  logger.info("New connection", { id, user });

  connection.on("message", (message) => handleMessage(message.toString(), id));
  connection.on("close", () => handleClose(id));
});

server.listen(port, () => {
  logger.info(`Server started on port ${port}`);
});
