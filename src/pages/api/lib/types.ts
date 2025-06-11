export interface Options {
  typescript?: boolean;
  cleanupIds?: boolean;
  memo?: boolean;
  jsxSingleQuote?: boolean;
}

export interface SVGRConfig {
  plugins: Array<string | { name: string; options?: any }>;
  typescript: boolean;
  ref: boolean;
  titleProp: boolean;
  descProp: boolean;
  expandProps: boolean;
  svgProps: Record<string, string>;
  template: (code: string, config: any, state: any) => string;
}
