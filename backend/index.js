import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import morgan from "morgan";
import apiRoutes from "./routes/api-routes.js";
import { registerSocketRoutes } from "./routes/socket-routes.js";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";
import { env } from "./utils/env.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
    },
});

app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
}));

app.all("/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(morgan("dev"));

app.use("/", apiRoutes);

app.use((req, res, next) => {
    return res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`,
        data: null
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null
    });
});

registerSocketRoutes(io);

const PORT = env.PORT;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
