import express, { Request, Response } from "express";
import { getController } from "./controllers/getController";

const app = express();

app.get("/health", (req: Request, res: Response) => {
  res.send();
});

app.get("/api", async (req: Request, res: Response) => {
  const response = await getController(res);
  res.send(response);
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
