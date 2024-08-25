import { useState, ChangeEvent } from "react";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { Great_Vibes } from 'next/font/google';

const darkGreen = "#274442";
// const blueGreen = "#4F7375";
const lightGreen = "#748E81";
// const greyGreen = "#8FA38E";
// const anotherGreyGreen = "#A3BAB4";
const white = "#E9E5E3";

const greatVibes = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
});

enum UploadStatus {
  IDLE = 1,
  UPLOADING,
  SUCCESS,
  FAILURE,
}

export default function Home() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(
    UploadStatus.IDLE,
  );

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setUploadStatus(UploadStatus.UPLOADING);

      const formData = new FormData();
      formData.append("file", event.target.files[0]);

      try {
        const response = await fetch("/api/files", {
          method: "POST",
          body: formData,
          headers: {
            "x-file-name": event.target.files[0].name,
            "x-file-type": event.target.files[0].type,
          },
        });

        const result = await response.json();

        if (response.ok) {
          setUploadStatus(UploadStatus.SUCCESS);
        } else {
          console.error("Upload failed:", result.error);
          setUploadStatus(UploadStatus.FAILURE);
          alert("Upload failed: " + result.error);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setUploadStatus(UploadStatus.FAILURE);
        alert("An unexpected error occurred during the upload.");
      } finally {
        const delay = 4000;
        const timer = setTimeout(() => {
          setUploadStatus(UploadStatus.IDLE);
        }, delay);

        return () => clearTimeout(timer);
      }
    }
  };

  return (
    <>
      <div className={`h-screen w-screen flex justify-center items-center bg-image3 bg-cover`}>
        {uploadStatus === UploadStatus.IDLE && (
          <div className={`${greatVibes.className} bg-[${darkGreen}] p-8 rounded-lg shadow-lg text-center transition-transform transform hover:scale-125 hover:bg-[#8FA38E]`}>
            <label id="uploadLabel" htmlFor="file" className={`text-[${white}]`}>
              Select Photos or Videos
            </label>
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
        )}
        {uploadStatus === UploadStatus.UPLOADING && (
          <div className={`flex flex-col items-center`} style={{color: darkGreen}}>
            <FaSpinner className="animate-spin spin-slow" size={100}/>
          </div>
        )}
        {uploadStatus === UploadStatus.SUCCESS && (
          <div className={`flex flex-col items-center`} style={{color: darkGreen}}>
            <FaCheckCircle size={100} style={{ color: lightGreen }}/>
          </div>
        )}
        {uploadStatus === UploadStatus.FAILURE && (
          <div className={`flex flex-col items-center`} style={{color: darkGreen}}>
            <FaTimesCircle size={100}/>
          </div>
        )}
      </div>
    </>
  );
}
