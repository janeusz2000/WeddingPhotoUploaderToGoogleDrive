import type { NextApiRequest, NextApiResponse } from 'next';

const GOOGLE_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzKRfFdkhtLCGDVah_ik9aAwdmtVksGGFeLBKNs7etxVzMHf4sHU9UnyGAhtQtfJdwOSg/exec";

export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle file uploads ourselves
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {

      const buffers: Buffer[] = [];

      req.on('data', (chunk) => {
        buffers.push(chunk);
      });

      req.on('end', async () => {
        const buffer = Buffer.concat(buffers);

        const fileName = req.headers['x-file-name'] as string || 'uploaded_file';
        const mimeType = req.headers['x-file-type'] as string || 'application/octet-stream';

        // Convert the buffer to a base64 string
        const base64Data = buffer.toString('base64');

        // Create an object with the necessary data
        const bodyData = {
          fileName: fileName,
          mimeType: mimeType,
          file: base64Data,
        };

        try {
          const response = await fetch(GOOGLE_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(bodyData),
            headers: {
              'Content-Type': 'application/json',
            },
          });


          const data = await response.json();


          if (response.ok) {
            return res.status(200).json(data.file);
          } else {
            console.error('Error from Google Apps Script:', data.error);
            return res.status(500).json({ success: false, error: data.error });
          }
        } catch (error) {
          console.error('Error sending to Google Apps Script:', error.message);
          return res.status(500).json({ success: false, error: error.message });
        }
      });
    } catch (error) {
      console.error('Error during file upload processing:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      const response = await fetch(GOOGLE_SCRIPT_WEB_APP_URL);
      const data = await response.json();

      if (data) {
        return res.status(200).json(data);
      } else {
        return res.status(500).json({ success: false });
      }
    } catch (error) {
      console.error('Error fetching files:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
