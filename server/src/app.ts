import express, { json, static as _static, Request } from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import settings from "./config/settings";
import globalExceptionHandler from "./middleware/globalExceptionHandler";
import router from "./routes";
import { webhookHandler } from "./routes/applicationRoute";
import StripeWebhookService from "./services/StripeWebhookService";

const webhookService = new StripeWebhookService(settings.stripe.secret_key);

const app = express();
export const corsOptions = {
  origin: [
    <string>process.env.CLIENT_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://localhost:5174"
  ],
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/uploads", _static(path.resolve("uploads")));

app.post('/api/v1/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(json()); 

app.use(`${settings.service.apiRoot}`, router); // All routes middleware

app.use(globalExceptionHandler);

export default app;
