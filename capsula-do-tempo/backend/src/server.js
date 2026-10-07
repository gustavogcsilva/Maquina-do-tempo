import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();

// 1. Headers de segurança (remove X-Powered-By, adiciona proteções HSTS, XSS, etc.)
app.use(helmet());

// 2. Proteção contra DoS e força bruta (Rate Limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo de 100 requisições por IP por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições deste IP. Tente novamente mais tarde." }
});
app.use(limiter);

// 3. CORS restrito por ambiente
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",") 
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (como mobile apps, Postman/curl em dev)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Bloqueado pela política de CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// 4. Parser de JSON com limite de tamanho para evitar DoS por payload pesado
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 5. Health Check
app.get("/api/status", (req, res) => {
  return res.status(200).json({
    status: "ok",
    message: "Backend da Cápsula do Tempo em execução!",
    timestamp: new Date().toISOString(),
  });
});

// Tratamento global de erros para não vazar stack traces em produção
app.use((err, req, res, next) => {
  console.error(err.stack);
  const isProduction = process.env.NODE_ENV === "production";
  return res.status(500).json({
    error: isProduction ? "Erro interno do servidor." : err.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor seguro rodando na porta ${PORT}`);
});