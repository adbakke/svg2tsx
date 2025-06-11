import { optimize } from "svgo";
import { Options } from "@/pages/api/lib/types";

const wrapPathData = (pathData: string, indent: number): string => {
  if (pathData.length <= 80) return pathData;

  const indentStr = " ".repeat(indent);
  // Split at command letters (M, L, C, etc.) to keep path commands together
  const segments = pathData.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g) || [];
  return segments.join(`\n${indentStr}`);
};

export const reactify = async (
  svg: string,
  options: Options,
  componentName: string = "SvgIcon",
): Promise<string> => {
  try {
    const { typescript = false, cleanupIds = false } = options;

    // Basic SVG optimization
    const optimizedSvg = optimize(svg).data;

    // Format SVG properties and children
    const formattedSvg = optimizedSvg
      // Format SVG opening tag with attributes
      .replace(/<svg([^>]*)>/g, (match: string, attrs: string) => {
        // Remove any existing class attribute since we'll use className
        const cleanAttrs = attrs.replace(/\s+class="[^"]*"/, "");
        const formattedAttrs = cleanAttrs
          .trim()
          .split(/\s+/)
          .map((attr: string) => `        ${attr}`)
          .join("\n");
        return `    <svg\n        className={className}\n${formattedAttrs}>`;
      })
      // Format SVG closing tag
      .replace(/<\/svg>/g, "\n    </svg>")
      // Format children (like path) with their attributes on one line
      .replace(/(<[^>]*>)/g, (match: string) => {
        if (match.startsWith("</")) return match;
        return `\n        ${match}`;
      })
      // Clean up any double newlines
      .replace(/\n\s*\n/g, "\n")
      .trim();

    // Convert to React component with proper indentation
    const jsx = `const ${componentName} = ({ className = '' }: { className?: string }) => (
    ${formattedSvg}
)

export default ${componentName}`;

    return jsx;
  } catch (error) {
    console.error("Error in reactify:", error);
    throw new Error(
      `Failed to convert SVG to React component: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
