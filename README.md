# PDF Docs Setting

## How to build

To build the PDF documentation, follow these steps:

1. Adjust `src/main.tsx` to build UMD module:
```ts
import React from "react";
import './index.css'

export * from './modules/docs-setting/pdf/loader';
```

2. Adjust `tsconfig.app.json` to VITE bundle:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

3. Run the build command:
```bash
bun run build
```

4. Copy the generated file from `dist/pdf-docs-setting.umd.js` & `dist/pdf-docs-setting.css` to your desired location for use in your project.