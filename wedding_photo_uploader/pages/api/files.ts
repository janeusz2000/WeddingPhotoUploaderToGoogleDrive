"use server";

import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Storage } from "@google-cloud/storage";
import path from "path";

// Overwrite Vercel max timeout duration
export const maxDuration = 5 * 60;

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing so we can handle it with formidable
  },
};

// Initialize Google Cloud Storage with environment variables
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "",
  },
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME ?? "");

// Type definitions for the expected response from Google Apps Script
interface GoogleScriptResponse {
  success: boolean;
  file?: {
    name: string;
    url: string;
    id: string;
    mimeType: string;
    dateCreated: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    console.log("Handling POST request");

    const form = formidable({});
    form.parse(req, async (err, _: any, files: any) => {
      if (err) {
        console.error("Error parsing form:", err);
        return res
          .status(500)
          .json({ success: false, error: "Error parsing form data." });
      }

      const fileResponses = [];

      // Normalize the files array - ensure that it's always an array
      const uploadedFiles = Array.isArray(files.file)
        ? files.file
        : [files.file];

      console.log(`Files received: ${JSON.stringify(files)}`);

      // Iterate over each file in the files object
      for (const file of uploadedFiles) {
        const fileName = `${uuidv4()}`;
        const mimeType = file.mimetype ?? "application/octet-stream";

        console.log(`Preparing to upload file: ${file.originalFilename}`);

        try {
          console.log(`trying to readFileSYnc()`);
          // Read the file into a buffer
          const fileBuffer = fs.readFileSync(file.filepath);

          console.log(`Prepared file buffer: ${JSON.stringify(fileBuffer)}`);
          const base64Data = fileBuffer.toString("base64");

          console.log(`Base64Data: ${JSON.stringify(base64Data)}`);
          const buffer = Buffer.from(base64Data, "base64");

          console.log(`buffer: ${JSON.stringify(buffer)}`);
          const extension = path.extname(file.originalFilename);

          console.log(`extension: ${JSON.stringify(extension)}`);
          const blob = bucket.file(`${Date.now()}-${fileName}${extension}`);

          console.log(`blob: ${JSON.stringify(blob)}`);
          const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: file.type,
          });

          console.log(`blobStream: ${JSON.stringify(blobStream)}`);

          blobStream.on("error", (err) => {
            const errorMessage = JSON.stringify(err);
            console.error(
              `Error during uploading file to bucket: ${errorMessage}`,
            );
            fileResponses.push({ success: false, error: errorMessage });
          });

          blobStream.on("finish", () => {
            console.log(`Successfully uploaded file: ${file.originalFilename}`);
            fileResponses.push({ success: true });
          });

          blobStream.end(buffer);
        } catch (error: any) {
          const errorMessage = JSON.stringify(error);
          console.error(`Error uploading file to bucket: ${errorMessage}`);
          fileResponses.push({
            success: false,
            error: errorMessage,
          });
        }
      }

      console.log("File upload responses:", JSON.stringify(fileResponses));

      // Return the responses for all the files
      return res.status(200).json(fileResponses);
    });
  } else {
    res.setHeader("Allow", ["POST"]);
    console.log(`Method ${req.method} Not Allowed`);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
