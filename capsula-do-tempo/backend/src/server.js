import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Carrega as variáveis do arquivo . env para a memória (process.env)
dotenv.config();

const app = express();

// Middlewares globais:
// 1 cors: Permintindo que reuquisições vindas de outra porta (como localhost:5137 do React) Sejam aceitas.
app.use(cors());

// Rota de teste (Health Check)
// Quando você acessar a rota /api/status, o servidor responderá com um status 200 e uma mensagem indicando que o backend está funcionando corretamente.
app.get("/api/status", (req, res) => {
    return res.status(200).json({
        status: "ok",
        message: "Backend da Capsula do tempo Funcionando!",
        timestamp: new Date().toISOString(),
    });
});


//Inicialização do servidor na porta definida no arquivo .env ou na porta 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});