import { logger } from "@/src/logger";
import { setupWebSocket } from "@/src/websocket";
import { createServer } from "http";
import { WebSocketServer } from "ws";

const port = 8080;

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("WebSocket server is running\n");
});

const wss_server = new WebSocketServer({ server });

setupWebSocket(wss_server);

server.listen(port, () => {
  logger.info(`Server started on port ${port}`);
});
