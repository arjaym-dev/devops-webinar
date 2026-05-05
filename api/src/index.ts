import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  console.log("Health check endpoint hit", {
    status: "ok",
    timestamp: new Date().toISOString(),
  });

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/ping", (_req: Request, res: Response) => {
  console.log("Ping endpoint hit", { timestamp: new Date().toISOString() });
  res.status(200).json({ message: "pong" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
