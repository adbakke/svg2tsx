import { promises as fs } from "node:fs";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import { svg2jsx } from "./index";
import { reactify } from "./lib/reactify";

export type BatchData = {
  processed: number;
  errors: Array<{ file: string; error: string }>;
};

export default async (req: NextApiRequest, res: NextApiResponse<BatchData>) => {
  if (req.method !== "POST") {
    res.status(StatusCodes.METHOD_NOT_ALLOWED);
    return null;
  }

  const { inputFolder, outputFolder, options } = req.body.input;

  if (!inputFolder || !outputFolder) {
    res.status(StatusCodes.BAD_REQUEST).json({
      processed: 0,
      errors: [{ file: "", error: "Input and output folders are required" }],
    });
    return;
  }

  try {
    // Create output folder if it doesn't exist
    await fs.mkdir(outputFolder, { recursive: true });

    // Read all files from input folder
    const files = await fs.readdir(inputFolder);
    const svgFiles = files.filter((file: string) => file.toLowerCase().endsWith(".svg"));

    const errors: Array<{ file: string; error: string }> = [];
    let processed = 0;

    // Process each SVG file
    for (const file of svgFiles) {
      try {
        const inputPath = path.join(inputFolder, file);
        const outputPath = path.join(outputFolder, file.replace(".svg", ".jsx"));

        // Read SVG content
        const svgContent = await fs.readFile(inputPath, "utf-8");

        // Convert to JSX
        const result = await svg2jsx(svgContent, options);
        const jsx = await reactify(result, options);

        // Write JSX file
        await fs.writeFile(outputPath, jsx, "utf-8");
        processed++;
      } catch (error) {
        errors.push({
          file,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    res.status(StatusCodes.OK).json({
      processed,
      errors,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      processed: 0,
      errors: [{ file: "", error: error instanceof Error ? error.message : String(error) }],
    });
  }
};
