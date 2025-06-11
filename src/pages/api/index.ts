import type { NextApiRequest, NextApiResponse } from "next";
import { reactify } from "./lib/reactify";

// Function to convert filename to PascalCase component name
const getComponentName = (filename: string): string => {
  // Remove file extension and convert to PascalCase
  return filename
    .replace(/\.[^/.]+$/, "") // Remove extension
    .split(/[-_\s]/) // Split by hyphen, underscore, or space
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
};

// Function to convert SVG to JSX
export const svg2jsx = async (svg: string, options = {}) => {
  return reactify(svg, {
    typescript: true,
    cleanupIds: false,
    ...options,
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    // Handle both formats (with and without input wrapper)
    const data = req.body.input || req.body;
    const { svg, filename, options = {} } = data;

    if (!svg) {
      console.error("Missing SVG content in request:", data);
      return res.status(400).json({ error: "SVG content is required" });
    }

    if (!filename) {
      console.error("Missing filename in request:", data);
      return res.status(400).json({ error: "Filename is required" });
    }

    console.log("Processing file:", filename);
    const componentName = getComponentName(filename);
    console.log("Generated component name:", componentName);

    const jsx = await reactify(
      svg,
      {
        typescript: true,
        cleanupIds: false,
        ...options,
      },
      componentName,
    );

    console.log("Successfully generated JSX for", filename);
    return res.status(200).json({ jsx });
  } catch (error) {
    console.error("Error processing SVG:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return res.status(500).json({
      error: "Failed to process SVG",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
