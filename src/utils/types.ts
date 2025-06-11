export type Options = {
  memo: boolean;
  typescript: boolean;
  cleanupIds: boolean;
  jsxSingleQuote: boolean;
};

export type Variables = {
  input: {
    svg: string;
    filename: string;
    options?: Partial<Options>;
  };
};
