import React, { createContext, useState, useCallback, useMemo } from "react";
import useDebouncedEffect from "use-debounced-effect";
import { useCopyToClipboard } from "usehooks-ts";

import { useApi } from "@/hooks/useApi";
import { useLocalStorageToggle } from "@/hooks/useLocalStorageToggle";

import { EDITOR_DEBOUNCE_TIME } from "@/utils/const";
import { readAndFormatFileContents } from "@/utils/helpers";

export interface AppBarCodeDeckStoreContextType {
  svg?: string;
  jsx?: string;
  filename?: string;
  typescript?: boolean;
  cleanupIds?: boolean;
  memo?: boolean;
  jsxSingleQuote?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  isPending?: boolean;
  isCopied?: boolean;
  setSvg: (value: string | undefined) => void;
  setFilename: (value: string | undefined) => void;
  setTypeScript: () => void;
  setCleanupIds: () => void;
  setMemo: () => void;
  setJsxSingleQuote: () => void;
  handleCopy: () => void;
  handleDrop: (files: ReadonlyArray<File>) => Promise<void>;
}

export interface AppBarCodeDeckStoreProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode | ReadonlyArray<React.ReactNode>;
}

export const AppBarCodeDeckStoreContext = createContext<AppBarCodeDeckStoreContextType>({
  svg: undefined,
  jsx: undefined,
  filename: undefined,
  typescript: undefined,
  cleanupIds: undefined,
  memo: undefined,
  jsxSingleQuote: undefined,
  isSuccess: undefined,
  isError: undefined,
  isPending: undefined,
  isCopied: undefined,
  setSvg: () => { },
  setFilename: () => { },
  setTypeScript: () => { },
  setCleanupIds: () => { },
  setMemo: () => { },
  setJsxSingleQuote: () => { },
  handleDrop: async () => { },
  handleCopy: () => { },
});

export const AppBarCodeDeckStore: React.FC<AppBarCodeDeckStoreProps> = ({ children }) => {
  const [svg, setSvg] = useState<string | undefined>();
  const [filename, setFilename] = useState<string | undefined>();
  const [copied, copyToClipboard] = useCopyToClipboard();

  const [typescript, setTypeScript] = useLocalStorageToggle("typescript");
  const [cleanupIds, setCleanupIds] = useLocalStorageToggle("cleanupIds");
  const [memo, setMemo] = useLocalStorageToggle("memo");
  const [jsxSingleQuote, setJsxSingleQuote] = useLocalStorageToggle("jsxSingleQuote");

  const { jsx, isSuccess, isError, isPending, mutate, reset } = useApi();

  const isCopied = useMemo(() => {
    if (copied) {
      return btoa(jsx) === btoa(copied);
    }
  }, [jsx, copied]);

  const clear = useCallback(() => {
    reset();
    setSvg(undefined);
    setFilename(undefined);
  }, [reset]);

  const handleDrop = useCallback(async ([file]: ReadonlyArray<File>) => {
    try {
      const fileContents = await readAndFormatFileContents(file);
      setSvg(fileContents);
      setFilename(file.name);
    } catch (error) { }
  }, []);

  const handleCopy = useCallback(async () => {
    if (jsx) {
      try {
        await copyToClipboard(jsx);
      } catch (error) { }
    }
  }, [jsx, copyToClipboard]);

  useDebouncedEffect(
    () => {
      if (svg && filename) {
        mutate({
          input: {
            svg,
            filename,
            options: {
              typescript,
              cleanupIds
            }
          }
        });
      } else {
        clear();
      }
    },
    EDITOR_DEBOUNCE_TIME,
    [svg, filename, typescript, cleanupIds, mutate, clear],
  );

  return (
    <AppBarCodeDeckStoreContext.Provider
      value={{
        svg,
        jsx,
        filename,
        typescript,
        cleanupIds,
        memo,
        jsxSingleQuote,
        isSuccess,
        isError,
        isPending,
        isCopied,
        setSvg,
        setFilename,
        setTypeScript,
        setCleanupIds,
        setMemo,
        setJsxSingleQuote,
        handleDrop,
        handleCopy,
      }}
    >
      {children}
    </AppBarCodeDeckStoreContext.Provider>
  );
};

export default AppBarCodeDeckStore;
