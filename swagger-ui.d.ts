declare module 'swagger-ui-dist' {
  interface SwaggerUIBundleOptions {
    dom_id: string;
    url?: string;
    spec?: object;
    docExpansion?: 'list' | 'full' | 'none';
    deepLinking?: boolean;
    presets?: any[];
    layout?: string;
    syntax?: boolean;
    [key: string]: any;
  }

  interface SwaggerUIBundle {
    (options: SwaggerUIBundleOptions): any;
    presets: {
      apis: any;
    };
    SwaggerUIStandalonePreset: any;
  }

  const SwaggerUIBundle: SwaggerUIBundle;
  export default SwaggerUIBundle;
} 