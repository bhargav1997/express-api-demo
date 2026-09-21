import express from "express";

import userRoutes from "./routes/user.routes.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
   res.status(200).json({
      success: true,
      message: "API is healthy",
   });
});

app.use("/api/users", userRoutes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;
