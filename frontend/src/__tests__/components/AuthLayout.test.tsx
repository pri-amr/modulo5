import { readFileSync } from "fs";
import { createRequire } from "module";
import path from "path";

import { render, screen } from "@testing-library/react";
import { compile } from "tailwindcss";

import AuthLayout from "@/components/AuthLayout";

type TailwindPackage = {
    exports: { ".": { style: string } };
};

// La entrada CSS no se resuelve por módulo: Jest mapea todo .css al styleMock de next/jest, así que se deriva del manifiesto y se lee del disco.
const tailwindPackagePath = createRequire(__filename).resolve(
    "tailwindcss/package.json"
);
const tailwindPackage = JSON.parse(
    readFileSync(tailwindPackagePath, "utf-8")
) as TailwindPackage;

const TAILWIND_ROOT = path.dirname(tailwindPackagePath);
const TAILWIND_ENTRY = path.resolve(
    TAILWIND_ROOT,
    tailwindPackage.exports["."].style
);

type MediaBlock = {
    condition: string;
    body: string;
};

type WidthMedia = {
    condition: string;
    width: string;
};

const loadStylesheet = async (
    id: string,
    base: string
): Promise<{ path: string; base: string; content: string }> => {
    const target =
        id === "tailwindcss" ? TAILWIND_ENTRY : path.resolve(base, id);

    return {
        path: target,
        base: path.dirname(target),
        content: readFileSync(target, "utf-8")
    };
};

const extractMediaBlocks = (css: string): MediaBlock[] => {
    const blocks: MediaBlock[] = [];
    const marker = "@media";

    for (
        let start = css.indexOf(marker);
        start !== -1;
        start = css.indexOf(marker, start + 1)
    ) {
        const open = css.indexOf("{", start);

        if (open === -1) {
            continue;
        }

        let depth = 0;
        let end = open;

        for (; end < css.length; end += 1) {
            if (css[end] === "{") {
                depth += 1;
            } else if (css[end] === "}") {
                depth -= 1;

                if (depth === 0) {
                    break;
                }
            }
        }

        blocks.push({
            condition: css.slice(start + marker.length, open).trim(),
            body: css.slice(open + 1, end)
        });
    }

    return blocks;
};

const extractWidthMedia = (css: string): WidthMedia[] =>
    extractMediaBlocks(css).reduce<WidthMedia[]>((acc, block) => {
        const match = block.body.match(/(?<![-\w])width:\s*([^;]+);/);

        return match
            ? [...acc, { condition: block.condition, width: match[1].trim() }]
            : acc;
    }, []);

const compileCardClasses = async (classNames: string[]): Promise<string> => {
    const compiled = await compile('@import "tailwindcss";', {
        base: TAILWIND_ROOT,
        loadStylesheet
    });

    return compiled.build(classNames);
};

describe("AuthLayout", () => {
    it("test-block1-authlayout-empty-children-no-error", () => {
        expect(() => render(<AuthLayout>{null}</AuthLayout>)).not.toThrow();

        expect(
            screen.getByTestId("auth-layout-icon-panel")
        ).toBeInTheDocument();
    });

    it("test-block4-card-width-base-and-cap", () => {
        render(<AuthLayout>contenido</AuthLayout>);

        expect(screen.getByTestId("auth-layout-card")).toHaveClass(
            "w-full",
            "max-w-4xl"
        );
    });

    it("test-block4-card-width-responsive", () => {
        render(<AuthLayout>contenido</AuthLayout>);

        const card = screen.getByTestId("auth-layout-card");

        expect(card).toHaveClass("sm:w-[70%]");
        expect(card).toHaveClass("min-[75rem]:w-[40%]");
        expect(card).not.toHaveClass("sm:w-[40%]");
        expect(card).not.toHaveClass("min-[1200px]:w-[40%]");
    });

    it("test-block4-card-width-cascade-order", async () => {
        render(<AuthLayout>contenido</AuthLayout>);

        const cardClasses = screen
            .getByTestId("auth-layout-card")
            .className.split(/\s+/)
            .filter(Boolean);
        const widthMedia = extractWidthMedia(
            await compileCardClasses(cardClasses)
        );
        const emittedWidths = widthMedia.map((entry) => entry.width);
        const wideCondition = widthMedia.find(
            (entry) => entry.width === "40%"
        )?.condition;

        expect(emittedWidths).toContain("70%");
        expect(emittedWidths.indexOf("40%")).toBeGreaterThan(
            emittedWidths.indexOf("70%")
        );
        expect(wideCondition).toContain("75rem");
    });

    it("test-block1-icon-panel-visible-desktop", () => {
        render(<AuthLayout>contenido</AuthLayout>);

        expect(screen.getByTestId("auth-layout-icon-panel")).toHaveClass(
            "sm:flex"
        );
    });

    it("test-block1-icon-panel-hidden-mobile", () => {
        render(<AuthLayout>contenido</AuthLayout>);

        expect(screen.getByTestId("auth-layout-icon-panel")).toHaveClass(
            "hidden"
        );
    });

    it("test-block1-form-panel-centered-mobile", () => {
        render(<AuthLayout>contenido</AuthLayout>);

        const contentPanel = screen.getByTestId("auth-layout-content-panel");

        expect(contentPanel).toHaveClass(
            "w-full",
            "items-center",
            "justify-center"
        );
        expect(contentPanel).toHaveTextContent("contenido");
    });

    it("test-block1-panels-split-50-50", () => {
        render(<AuthLayout>contenido</AuthLayout>);

        expect(screen.getByTestId("auth-layout-icon-panel")).toHaveClass(
            "sm:w-1/2"
        );
        expect(screen.getByTestId("auth-layout-content-panel")).toHaveClass(
            "sm:w-1/2"
        );
    });

    it("test-block1-card-radius-1rem", () => {
        render(<AuthLayout>contenido</AuthLayout>);

        expect(screen.getByTestId("auth-layout-card")).toHaveClass(
            "rounded-[1rem]"
        );
    });

    it("test-block1-icon-inline-svg-no-library", () => {
        const { container } = render(<AuthLayout>contenido</AuthLayout>);

        expect(container.querySelector("svg")).toBeInTheDocument();

        const source = readFileSync(
            path.resolve(__dirname, "../../components/AuthLayout.tsx"),
            "utf-8"
        );
        const importLines = source.match(/^import .*/gm) ?? [];
        const externalLibraryImports = importLines.filter(
            (line) =>
                !line.includes('"react"') && !line.includes('from "react"')
        );

        expect(externalLibraryImports).toHaveLength(0);
    });
});
