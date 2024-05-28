const { WebSocketServer, WebSocket } = require("ws");
const dotenv = require("dotenv");
const CryptoJS = require('crypto-js');
const winston = require('winston');

dotenv.config();
const secretKey = 'minha-chave-secreta';

// Configuração do winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}] - ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'server.log' })
    ]
});

const wss = new WebSocketServer({ port: process.env.PORT || 8080 });

wss.on("connection", (ws) => {
    logger.info("Client connected");

    ws.on("error", (error) => {
        logger.error(`Client error: ${error}`);
    });

    ws.on("message", (encryptedMessage) => {
        try {
            // Descriptografa a mensagem recebida
            const bytes = CryptoJS.AES.decrypt(encryptedMessage.toString(), secretKey);
            const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
            logger.info(`Mensagem recebida: ${decryptedMessage}`);

            // Reenvia a mensagem criptografada para todos os clientes conectados
            wss.clients.forEach((client) => {
                // if (client !== ws && client.readyState === WebSocket.OPEN) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(encryptedMessage.toString());
                }
            });
        } catch (e) {
            logger.error('Erro ao processar a mensagem:', e);
        }
    });

    ws.on('close', () => {
        logger.info('Client disconnected');
    });
});
