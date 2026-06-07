import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore prisma scripts (seed/utility files, not app code)
    "prisma/**",
    "prisma.config.ts",
  ]),
  {
    rules: {
      // These rules cause false positives for common React data-fetching patterns
      // (calling fetchData inside useEffect is standard and intentional)
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",

      // Allow `any` type — project uses dynamic API responses extensively
      "@typescript-eslint/no-explicit-any": "off",

      // Allow @ts-ignore (legacy code compatibility)
      "@typescript-eslint/ban-ts-comment": "off",

      // Allow require() in .js files (not used in app source anyway)
      "@typescript-eslint/no-require-imports": "off",

      // Unused vars → warn only, not error
      "@typescript-eslint/no-unused-vars": "warn",

      // Allow <img> tag (project doesn't use next/image)
      "@next/next/no-img-element": "off",

      // Allow unescaped entities (common in Indonesian text)
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
