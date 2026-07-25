import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

app.listen(env.PORT, () => {
  logger.info(`voucher bridge listening on :${env.PORT}`);
  console.log("NODE_ENV =", process.env.NODE_ENV);
  process.on("uncaughtException", (err) => {
  console.error("[uncaught]", err.message);
});

  process.on("unhandledRejection", (err) => {
  console.error("[unhandled]", err);
});

});
