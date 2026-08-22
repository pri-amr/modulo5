import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist/**", "**/coverage/**", "node_modules/**"] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: { import: importPlugin },
        rules: {
            "@typescript-eslint/no-explicit-any": "error",
            // tsc ya valida los identificadores no declarados; no-undef da falsos positivos
            // sistemáticos con TypeScript (globals ambientes, tipos, etc.) — recomendación
            // documentada de typescript-eslint.
            "no-undef": "off",
            "import/order": [
                "error",
                {
                    groups: [
                        "builtin",
                        "external",
                        "internal",
                        "parent",
                        "sibling",
                        "index"
                    ],
                    alphabetize: { order: "asc", caseInsensitive: true }
                }
            ]
        }
    }
);
