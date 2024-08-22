import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";

const GOOGLE_SCRIPT_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzKRfFdkhtLCGDVah_ik9aAwdmtVksGGFeLBKNs7etxVzMHf4sHU9UnyGAhtQtfJdwOSg/exec";

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing so we can handle it with formidable
  },
};

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
    const form = formidable({});

    form.parse(req, async (err, _: any, files: any) => {
      if (err) {
        console.error("Error parsing form:", err);
        return res
          .status(500)
          .json({ success: false, error: "Error parsing form data." });
      }

      const file = files.file[0]; // Assuming only one file is uploaded
      const fileName = file.originalFilename ?? "uploaded_file";
      const mimeType = file.mimetype ?? "application/octet-stream";

      // Read the file into a buffer
      const fileBuffer = fs.readFileSync(file.filepath);

      // Convert the buffer to a base64 string
      const base64Data = fileBuffer.toString("base64");

      // Create the payload to send to Google Apps Script
      const bodyData = {
        fileName: fileName,
        mimeType: mimeType,
        file: base64Data,
      };

      try {
        const response = await fetch(GOOGLE_SCRIPT_WEB_APP_URL, {
          method: "POST",
          body: JSON.stringify(bodyData),
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data: GoogleScriptResponse = await response.json();

        if (response.ok) {
          return res.status(200).json(data.file);
        } else {
          console.error("Error from Google Apps Script:", data.error);
          return res.status(500).json({ success: false, error: data.error });
        }
      } catch (error) {
        console.error(
          "Error sending to Google Apps Script:",
          (error as Error).message,
        );
        return res
          .status(500)
          .json({ success: false, error: (error as Error).message });
      }
    });
  } else if (req.method === "GET") {
    try {
      const response = await fetch(GOOGLE_SCRIPT_WEB_APP_URL);
      const data = await response.json();

      if (data) {
        return res.status(200).json(data);
      } else {
        return res.status(500).json({ success: false });
      }
    } catch (error) {
      console.error("Error fetching files:", (error as Error).message);
      return res
        .status(500)
        .json({ success: false, error: (error as Error).message });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
