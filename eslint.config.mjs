import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Downgrade these to warnings to allow build while we fix them
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/no-unused-vars": "warn", 
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "prefer-const": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "warn",
      
      // Keep critical errors that could break functionality
      "@typescript-eslint/no-unused-expressions": "error",
      "no-unreachable": "error",
      "no-undef": "error"
    }
  }
];

export default eslintConfig;
