import express, { json, static as _static, Request, Response } from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import settings from "./config/settings";
import globalExceptionHandler from "./middleware/globalExceptionHandler";
import router from "./routes/index";
import { webhookHandler } from "./routes/applicationRoute";
import fs from "fs";
import archiver from "archiver";
import { calendlyWebhookHandler } from "./routes/adminRoute";

const app = express();
export const corsOptions = {
  origin: [
    <string>process.env.CLIENT_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3100",
    "http://127.0.0.1:3100",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://de-admin.toverbers.com",
    "https://de-client.toverbers.com",
    "https://de-web.toverbers.com"
  ],
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/uploads", _static(path.resolve("uploads")));
app.use("/public", _static(path.resolve("public")));

//STRIPE WEBHOOK
app.post('/api/v1/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(json()); 

//Calendly webhook
app.post('/api/v1/webhooks/calendly', (req, res) => {
  calendlyWebhookHandler(req, res)
  res.status(200).send('Webhook received');
});

//APPLICATION FILE DOWNLOAD API
app.post('/api/v1/download', async (req: Request, res: Response) => {
  //const filename = '02b0afab-f469-44b7-b5ef-cc6cef9da010.png';//req.params.filename;
  const {files, type} = req.body;

  let array: any = []
  files.map((filename: any) => {
    if(type === 'admin') {
      array.push(path.join(__dirname, '../uploads/applications', filename))
    } else if (type === 'chat') {
      array.push(path.join(__dirname, '../uploads/photo', filename))
    } else {
      array.push(path.join(__dirname, '../uploads/successful-applications', filename))
    }
  })

  const application = {
    successful: array
  };

  const archive = archiver('zip', { zlib: { level: 9 } });
  const zipFilename = `application_docs.zip`;

  // Set headers for the response
  res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
  res.setHeader('Content-Type', 'application/zip');

  // Pipe the archive to the response stream
  archive.pipe(res);

  for (const filePath of application.successful) {
    if (fs.existsSync(filePath)) {
      const fileNameInZip = path.basename(filePath); // Get the base file name
      console.log('Adding file to zip:', filePath);
      archive.file(filePath, { name: fileNameInZip });
    } else {
      console.error('File not found:', filePath);
      res.status(404).send('File not found'); // Return 404 if the file does not exist
      return; // Stop further processing
    }
  }

  // Finalize the archive (this finishes the stream)
  try {
    await archive.finalize();
  } catch (error) {
    console.error('Error finalizing archive:', error);
    res.status(500).send('Error creating zip file');
  }
});

app.use(`${settings.service.apiRoot}`, router); // All routes middleware

app.use(globalExceptionHandler);

export default app;
