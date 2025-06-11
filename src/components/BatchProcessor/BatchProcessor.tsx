import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import JSZip from "jszip";

interface OptionKey {
  key: string;
  index: number;
}

export const BatchProcessor: React.FC = () => {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    processed: number;
    errors: Array<{ file: string; error: string }>;
  } | null>(null);
  const [convertedFiles, setConvertedFiles] = useState<Array<{ name: string; content: string }>>(
    [],
  );

  const onDrop = async (acceptedFiles: File[]) => {
    console.log("Files dropped:", acceptedFiles);
    setProcessing(true);
    setResult(null);
    setConvertedFiles([]);

    const errors: Array<{ file: string; error: string }> = [];
    let processed = 0;
    const newConvertedFiles: Array<{ name: string; content: string }> = [];

    try {
      // Sort files by name to maintain order
      const sortedFiles = [...acceptedFiles].sort((a, b) => a.name.localeCompare(b.name));
      console.log(
        "Processing",
        sortedFiles.length,
        "files:",
        sortedFiles.map((f) => f.name).join(", "),
      );

      // Process files sequentially
      for (const file of sortedFiles) {
        if (file.name.toLowerCase().endsWith(".svg")) {
          try {
            console.log("Processing file:", file.name);
            const content = await file.text();

            // Convert to JSX with TypeScript always enabled
            const response = await axios.post("/api", {
              input: {
                svg: content,
                filename: file.name,
                options: {
                  typescript: true,
                  cleanupIds: false,
                },
              },
            });

            if (!response.data || !response.data.jsx) {
              throw new Error("Invalid response from server");
            }

            // Get the base name without extension
            const baseName = file.name.replace(".svg", "");

            // Convert to component name format
            const componentName = baseName
              .split(/[-_\s]/)
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join("");

            console.log("Successfully converted:", file.name, "to", componentName);

            newConvertedFiles.push({
              name: `${componentName}.tsx`,
              content: response.data.jsx,
            });
            processed++;
          } catch (error) {
            console.error("Error processing file:", file.name, error);
            errors.push({
              file: file.name,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        } else {
          console.log("Skipping non-SVG file:", file.name);
          errors.push({
            file: file.name,
            error: "Not an SVG file",
          });
        }
      }

      console.log("Finished processing. Success:", processed, "Errors:", errors.length);

      // Update state with all processed files at once
      setConvertedFiles(newConvertedFiles);
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
    onDragEnter: () => console.log("Drag enter"),
    onDragLeave: () => console.log("Drag leave"),
    onDropRejected: (rejectedFiles) => console.log("Files rejected:", rejectedFiles),
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
            <button
              onClick={downloadAll}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Download ZIP
            </button>
          </div>
          <ul className="space-y-2">
            {convertedFiles.map((file, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>{file.name}</span>
                <button
                  onClick={() => downloadFile(file)}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
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
