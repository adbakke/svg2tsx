import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import JSZip from "jszip";

export const BatchProcessor: React.FC = () => {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ processed: number; errors: Array<{ file: string; error: string }> } | null>(
    null,
  );
  const [convertedFiles, setConvertedFiles] = useState<Array<{ name: string; content: string }>>([]);

  const onDrop = async (acceptedFiles: File[]) => {
    setProcessing(true);
    setResult(null);
    setConvertedFiles([]);

    const errors: Array<{ file: string; error: string }> = [];
    let processed = 0;

    try {
      for (const file of acceptedFiles) {
        if (file.name.toLowerCase().endsWith(".svg")) {
          try {
            const content = await file.text();

            // Convert to JSX
            const response = await axios.post("/api", {
              input: {
                svg: content,
                options: {},
              },
            });

            setConvertedFiles((prev) => [
              ...prev,
              {
                name: file.name.replace(".svg", ".jsx"),
                content: response.data.jsx,
              },
            ]);
            processed++;
          } catch (error) {
            errors.push({
              file: file.name,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      setResult({
        processed,
        errors,
      });
    } catch (error) {
      console.error("Error processing files:", error);
      setResult({
        processed: 0,
        errors: [{ file: "", error: error instanceof Error ? error.message : String(error) }],
      });
    } finally {
      setProcessing(false);
    }
  };

  const downloadFile = (file: { name: string; content: string }) => {
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    const zip = new JSZip();

    // Add all files to the zip
    convertedFiles.forEach((file) => {
      zip.file(file.name, file.content);
    });

    // Generate the zip file
    const content = await zip.generateAsync({ type: "blob" });

    // Create download link
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted-svg-files.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/svg+xml": [".svg"],
    },
  });

  return (
    <div className="p-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        {processing ? (
          <p>Processing files...</p>
        ) : isDragActive ? (
          <p>Drop the SVG files here...</p>
        ) : (
          <p>Drag and drop SVG files here, or click to select files</p>
        )}
      </div>

      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Results:</h3>
          <p>Processed {result.processed} files</p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <h4 className="font-semibold text-red-600">Errors:</h4>
              <ul className="list-disc list-inside">
                {result.errors.map((error, index) => (
                  <li key={index} className="text-red-500">
                    {error.file}: {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {convertedFiles.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Converted Files:</h3>
            <button onClick={downloadAll} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Download ZIP
            </button>
          </div>
          <ul className="space-y-2">
            {convertedFiles.map((file, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>{file.name}</span>
                <button onClick={() => downloadFile(file)} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
                  Download
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;
