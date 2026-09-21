import app from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, () => {
   console.log(`Server running on http://localhost:${env.PORT}`);
});

const shutdown = () => {
   console.log("Shutting down server...");

   server.close(() => {
      console.log("Server closed");
      process.exit(0);
   });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
