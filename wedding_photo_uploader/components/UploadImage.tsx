import { useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({
  weight: "400",
  subsets: ["latin"],
});

const darkGreen = "#274442";
const lightGreen = "#748E81";
const white = "#E9E5E3";
const UPLOADING_WAIT_UNTIL_FINISHED: number = 1000;
const DISPLAY_THANKS_MESSGE_DURATION: number = 5000;

const choosePhotoMessage = "Wybierz zdjecia lub film";

enum UploadStatus {
  IDLE = 1,
  UPLOADING,
  SUCCESS,
  FAILURE,
}

interface UploadStatusTrack {
  status: UploadStatus;
  name: String;
}

const UploadImage = () => {
  const [displayThanksMessage, setDisplayThanksMessage] =
    useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatusTrack[]>([]);

  const updateFileStatus = (index: number, status: UploadStatus) => {
    setUploadStatuses((prevStatuses) => {
      const newStatuses = [...prevStatuses];
      newStatuses[index] = { ...newStatuses[index], status };
      return newStatuses;
    });
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);

      setUploadStatuses(
        selectedFiles.map((file) => {
          return {
            status: UploadStatus.UPLOADING,
            name: file.name,
          };
        }),
      );

      await uploadImage(selectedFiles);
    }
  };

  const getSignedUrl = async (file: File | null, newFileName: string) => {
    if (!file) return;

    const response = await fetch("/api/generatePutUrl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename: newFileName, contentType: file.type }),
    });

    const data = await response.json();
    return data.url;
  };

  const uploadImage = async (filesToUpload: File[]) => {
    setIsUploading(true);
    if (!filesToUpload) return;

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const newFileName = `${Date.now()}-${file.name}`;
      const url = await getSignedUrl(file, newFileName);

      if (url) {
        const result = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (result.ok) {
          console.log(`File: ${newFileName} uploaded successfully`);
          updateFileStatus(i, UploadStatus.SUCCESS);
        } else {
          console.error(`File: ${newFileName} upload failed`);
          updateFileStatus(i, UploadStatus.FAILURE);
        }
      }
    }

    setTimeout(() => {
      setIsUploading(false);
      setDisplayThanksMessage(true);

      setTimeout(() => {
        setDisplayThanksMessage(false);
      }, DISPLAY_THANKS_MESSGE_DURATION);
    }, UPLOADING_WAIT_UNTIL_FINISHED);
  };

  return (
    <>
      {isUploading && (
        <div
          id="uploadStatusBox"
          className={`${quicksand.className} bg-[${darkGreen}]`}
        >
          {uploadStatuses.map((fileStatus, index) => (
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
              <span className="file-name">{fileStatus.name}</span>
            </div>
          ))}
        </div>
      )}
      {!isUploading && !displayThanksMessage && (
        <>
          <div className="upload-label-container">
            <div
              className={`upload-label-container-child ${quicksand.className}`}
            >
              <label
                id="uploadLabel"
                htmlFor="file"
                className={`test-[${white}]`}
              >
                {`${choosePhotoMessage}`}
              </label>
              <input
                type="file"
                id="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                multiple
              />
            </div>
          </div>
        </>
      )}
      {displayThanksMessage && (
          <>
            <div className={`thanks-message ${quicksand.className} text-xl flex flex-col items-center`}>
              <div className="w-full items-center justify-center flex flex-row">
                <p>Dziekujemy!</p>
              </div>
              <div className="w-full">
                <p>Wyslemy wam zdjecia po weselu!</p>
              </div>
            </div>
          </>
      )}
    </>
  );
};

export default UploadImage;
