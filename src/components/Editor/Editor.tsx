import { useMemo } from "react";
import AceEditor from "react-ace";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "tailwindcss/defaultConfig";

// Import modes without workers
import "brace/mode/jsx";
import "@/components/Editor/theme";

export interface EditorProps {
  mode: "svg" | "jsx";
  value?: string;
  readOnly?: boolean;
  onChange?(value: string): void;
}

const editorDefaultProps = {
  setOptions: {
    /**
     * Disable code folding.
     */
    showFoldWidgets: false,
    // Disable workers to prevent SVG worker errors
    useWorker: false,
  },
  editor: {
    /**
     * Needed to suppress component's debug message.
     */
    $blockScrolling: Number.POSITIVE_INFINITY,
  },
};

export const Editor: React.FC<EditorProps> = ({ mode, value, readOnly, onChange }) => {
  const config = useMemo(() => resolveConfig(tailwindConfig), []);

  const [fontSize, { lineHeight }] = config.theme.fontSize.sm;

  return (
    <AceEditor
      {...editorDefaultProps}
      fontSize={fontSize}
      lineHeight={lineHeight}
      theme="svg2jsx"
      mode={mode === "svg" ? "jsx" : mode} // Use JSX mode for SVG to avoid worker issues
      value={value}
      readOnly={readOnly}
      onChange={onChange}
    />
  );
};

export default Editor;
