import { useState, ChangeEvent } from "react";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { Quicksand } from "next/font/google";

const darkGreen = "#274442";
const lightGreen = "#748E81";
const white = "#E9E5E3";

const maximumSizeMessage =
  "Maksymalny rozmiar pojedynczego zdjecia / filmu wynosi 50 MB";
const choosePhotoMessage = "Wybierz zdjecia lub film";

const quicksand = Quicksand({
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
  const [isActive, setIsActive] = useState(false); // Track if button is active or not

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
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
        event.target.value = "";
        setIsActive(false);
        return;
      }

      const initialStatuses = validFiles.map((file) => ({
        file,
        status: UploadStatus.UPLOADING,
      }));

      setIsUploading(true);
      setFileUploadStatuses(initialStatuses);
      setIsActive(true); // Set button as active when files are selected

      for (const file of validFiles) {
        const fileIndex = validFiles.indexOf(file);
        updateFileStatus(fileIndex, UploadStatus.UPLOADING);

        const formData = new FormData();
        formData.append("file", file);

        // Timeout promise to fail the upload after 12 seconds
        const timeout = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Upload timed out after 12 seconds"));
          }, 12000);
        });

        try {
          // Race the upload promise against the timeout promise
          const uploadPromise = fetch("/api/files", {
            method: "POST",
            body: formData,
            headers: {
              "x-file-name": file.name,
              "x-file-type": file.type,
            },
          });

          const response = await Promise.race([uploadPromise, timeout]);

          if (response.ok) {
            const result = await response.json();
            updateFileStatus(fileIndex, UploadStatus.SUCCESS);
          } else {
            updateFileStatus(fileIndex, UploadStatus.FAILURE);
            alert("Upload failed: " + response.statusText);
          }
        } catch (error) {
          // If the timeout occurs or any error is thrown
          console.error("Error uploading file:", error);
          updateFileStatus(fileIndex, UploadStatus.FAILURE);
          alert(
            error.message || "An unexpected error occurred during the upload.",
          );
        }
      }

      // Reset the UI after uploads finish or fail
      setTimeout(() => {
        setIsUploading(false);
        setFileUploadStatuses([]);
      }, 2000);
    } else {
      setIsActive(false); // Reset button state if upload is canceled
      event.target.value = "";
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
            className={`${quicksand.className} flex flex-col items-center bg-[${darkGreen}] p-8 `}
          >
            <div className="upload-label-container">
              <div className="upload-label-container-child">
                <label
                  id="uploadLabel"
                  htmlFor="file"
                  className={`text-[${white}]`}
                >
                  {`${choosePhotoMessage}`}
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
            </div>
            <p className={`${quicksand.className} max-file-note mt-4`}>
              {`${maximumSizeMessage}`}
            </p>
          </div>
        )}

        {isUploading && (
          <div
            id="uploadStatusBox"
            className={`${quicksand.className} bg-[${darkGreen}]`}
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
