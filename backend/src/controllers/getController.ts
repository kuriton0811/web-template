import { Response } from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const getController = async (res: Response) => {
  try {
    // クライアント設定
    const client = new DynamoDBClient({
      region: "ap-northeast-1",
      endpoint: "http://localhost:8000", // ローカルでない場合はundefinedにする
    });
    const docClient = DynamoDBDocumentClient.from(client);

    // データを取得する関数
    const command = new ScanCommand({
      TableName: "Users",
    });

    const response = await docClient.send(command);
    res.status(200).json(response.Items);
  } catch (error) {
    console.error("Error in getController:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
