import { NextApiRequest, NextApiResponse } from "next";
import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID ?? "",
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL ?? "",
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "",
  },
});

const bucketName = process.env.GCP_BUCKET_NAME || "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "method not allowed" });
  }

  try {
    const { filename, contentType } = req.body;

    if (!filename) {
      return res.status(400).json({ message: "Filename is required" });
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 1000 * 60 * 15, // 15 minutes
      contentType: contentType,
    });

    res.status(200).json({ url });
  } catch (error: any) {
    console.error(`Error generating signed URL`, error);
    res.status(500).json({ message: `Failed to generate signed URL` });
  }
}
