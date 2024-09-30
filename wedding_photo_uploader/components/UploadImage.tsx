import { useState } from 'react';

const UploadImage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const getSignedUrl = async () => {
    if (!file) return;

    const response = await fetch('/api/generatePutUrl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename: file.name }),
    });

    const data = await response.json();
    setUploadUrl(data.url);
    return data.url;
  };

  const uploadImage = async () => {
    if (!file) return;

    const url = await getSignedUrl();

    if (url) {
      const result = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
        },
        body: file,
      });

      if (result.ok) {
        alert('File uploaded successfully');
      } else {
        alert('File upload failed');
      }
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadImage} disabled={!file}>
        Upload Image
      </button>
    </div>
  );
};

export default UploadImage;
