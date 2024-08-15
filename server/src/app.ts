import express, { json, static as _static } from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import settings from "./config/settings";
import globalExceptionHandler from "./middleware/globalExceptionHandler";
import router from "./routes";

const app = express();
export const corsOptions = {
  origin: [
    <string>process.env.CLIENT_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],
  credentials: true,
};

app.use(helmet());
app.use(cookieParser());
app.use(cors(corsOptions)); //handle cors operations
app.use(json()); // Parse incoming requests data
app.use(morgan("dev")); //Route debugger
app.use("/uploads", _static(path.resolve("uploads")));

app.use(`${settings.service.apiRoot}`, router); //All routes middleware

app.use(globalExceptionHandler); //Handle error globally

export default app;
