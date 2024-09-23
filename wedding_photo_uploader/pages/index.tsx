import { useState, ChangeEvent } from "react";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { Great_Vibes } from "next/font/google";

const darkGreen = "#274442";
const lightGreen = "#748E81";
const white = "#E9E5E3";

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
});

enum UploadStatus {
  IDLE = 1,
  UPLOADING,
  SUCCESS,
  FAILURE,
}

interface FileUploadStatus {
  file: File;
  status: UploadStatus;
}

export default function Home() {
  const [fileUploadStatuses, setFileUploadStatuses] = useState<
    FileUploadStatus[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const maxFileSizeMB = 50;
      const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

      const filesArray = Array.from(event.target.files);
      const validFiles = filesArray.filter(
        (file) => file.size <= maxFileSizeBytes,
      );

      if (validFiles.length === 0) {
        alert(
          "All selected files are too large. Each file must be under 50MB.",
        );
        return;
      }

      const initialStatuses = validFiles.map((file) => ({
        file,
        status: UploadStatus.UPLOADING,
      }));

      setIsUploading(true);
      setFileUploadStatuses(initialStatuses);

      for (const file of validFiles) {
        const fileIndex = validFiles.indexOf(file);
        updateFileStatus(fileIndex, UploadStatus.UPLOADING);

        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetch("/api/files", {
            method: "POST",
            body: formData,
            headers: {
              "x-file-name": file.name,
              "x-file-type": file.type,
            },
          });

          const result = await response.json();

          if (response.ok) {
            updateFileStatus(fileIndex, UploadStatus.SUCCESS);
          } else {
            console.error("Upload failed:", result.error);
            updateFileStatus(fileIndex, UploadStatus.FAILURE);
            alert("Upload failed: " + result.error);
          }
        } catch (error) {
          console.error("Error uploading file:", error);
          updateFileStatus(fileIndex, UploadStatus.FAILURE);
          alert("An unexpected error occurred during the upload.");
        }
      }

      setTimeout(() => {
        setIsUploading(false);
        setFileUploadStatuses([]);
      }, 2000);
    }
  };

  const updateFileStatus = (index: number, status: UploadStatus) => {
    setFileUploadStatuses((prevStatuses) => {
      const newStatuses = [...prevStatuses];
      newStatuses[index] = { ...newStatuses[index], status };
      return newStatuses;
    });
  };

  return (
    <>
      <div
        className={`h-screen w-screen flex justify-center items-center bg-image3 bg-cover`}
      >
        {fileUploadStatuses.length === 0 && (
          <div
            className={`${greatVibes.className} flex flex-col items-center bg-[${darkGreen}] p-8 rounded-lg shadow-lg text-center transition-transform transform hover:scale-125 hover:bg-[#8FA38E] w-full max-w-md`}
          >
            <div className="upload-label-container">
              <label
                id="uploadLabel"
                htmlFor="file"
                className={`text-[${white}]`}
              >
                Select Photos or Videos
              </label>
            </div>
            <input
              type="file"
              id="file"
              name="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className={`mt-4 cursor-pointer text-[${lightGreen}]`}
            />
            <p className="max-file-note mt-4">
              Max file size allowed is 50MB per file.
            </p>
          </div>
        )}

        {isUploading && (
          <div
            id="uploadStatusBox"
            className={`${greatVibes.className} bg-[${darkGreen}]`}
          >
            {fileUploadStatuses.map((fileStatus, index) => (
              <div key={index} className="file-status">
                <div className="status-icon">
                  {fileStatus.status === UploadStatus.UPLOADING && (
                    <FaSpinner
                      className="animate-spin spin-slow"
                      size={24}
                      style={{ color: lightGreen }}
                    />
                  )}
                  {fileStatus.status === UploadStatus.SUCCESS && (
                    <FaCheckCircle size={24} style={{ color: lightGreen }} />
                  )}
                  {fileStatus.status === UploadStatus.FAILURE && (
                    <FaTimesCircle size={24} style={{ color: lightGreen }} />
                  )}
                </div>
                <span className="file-name">{fileStatus.file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
