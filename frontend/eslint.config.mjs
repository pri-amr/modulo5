import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
    { ignores: [".next/**", "**/coverage/**", "node_modules/**"] },
    ...nextCoreWebVitals,
    ...nextTypescript,
    {
        // No se redeclara `plugins: { import: importPlugin }` (a diferencia del código del spec):
        // eslint-config-next/core-web-vitals ya registra el plugin "import" con su propia instancia
        // física (node_modules/.pnpm tiene dos instancias de eslint-plugin-import@2.32.0 con hashes
        // de peer-deps distintos: una es la dependencia directa declarada abajo, otra la que trae
        // eslint-config-next internamente). Redefinir la misma clave "import" con una instancia
        // distinta hace que ESLint 9 aborte con `ConfigError: Cannot redefine plugin "import"` antes
        // de analizar un solo archivo. La regla `import/order` y el resolver de abajo siguen
        // funcionando igual porque referencian la regla/el resolver por nombre, no por el objeto
        // plugin — usan la instancia que ya registró eslint-config-next.
        settings: {
            "import/resolver": {
                typescript: { project: "./tsconfig.json" }
            }
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "error",
            "no-undef": "off",
            "react/no-danger": "error",
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
                    pathGroups: [
                        {
                            pattern: "react",
                            group: "external",
                            position: "before"
                        },
                        {
                            pattern: "next",
                            group: "external",
                            position: "before"
                        },
                        {
                            pattern: "next/**",
                            group: "external",
                            position: "before"
                        },
                        {
                            pattern: "@/**",
                            group: "internal",
                            position: "after"
                        }
                    ],
                    pathGroupsExcludedImportTypes: ["react"],
                    alphabetize: { order: "asc", caseInsensitive: true }
                }
            ]
        }
    }
];

export default config;
