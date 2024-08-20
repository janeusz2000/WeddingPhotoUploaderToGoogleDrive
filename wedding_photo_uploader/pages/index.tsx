// pages/index.tsx
import { useState, useEffect, ChangeEvent } from 'react';

interface FileData {
  name: string;
  url: string;
  id: string;
  mimeType: string;
  dateCreated: string;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);

  useEffect(() => {
    const fetchFiles = async () => {
      const response = await fetch('/api/files');
      const data: FileData[] = await response.json();
      setFiles(data);
    };

    fetchFiles();
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
        headers: {
          'x-file-name': selectedFile.name,
          'x-file-type': selectedFile.type,
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert('File uploaded successfully!');
        setFiles([...files, result]);
      } else {
        console.error('Upload failed:', result.error);
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('An unexpected error occurred during the upload.');
    }
  };

  return (
    <div>
      <h1>Upload Image to Google Drive</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>

      <h2>Uploaded Files:</h2>
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              {file.name}
            </a> (Uploaded on {new Date(file.dateCreated).toLocaleString()})
          </li>
        ))}
      </ul>
    </div>
  );
}
