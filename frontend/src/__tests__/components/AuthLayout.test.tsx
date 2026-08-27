import { readFileSync } from "fs";
import path from "path";

import { render, screen } from "@testing-library/react";

import AuthLayout from "@/components/AuthLayout";

describe("AuthLayout", () => {
  it("test-block1-authlayout-empty-children-no-error", () => {
    expect(() => render(<AuthLayout>{null}</AuthLayout>)).not.toThrow();

    expect(screen.getByTestId("auth-layout-icon-panel")).toBeInTheDocument();
  });

  it("test-block1-card-width-desktop", () => {
    render(<AuthLayout>contenido</AuthLayout>);

    expect(screen.getByTestId("auth-layout-card")).toHaveClass("sm:w-[40%]");
  });

  it("test-block1-icon-panel-visible-desktop", () => {
    render(<AuthLayout>contenido</AuthLayout>);

    expect(screen.getByTestId("auth-layout-icon-panel")).toHaveClass("sm:flex");
  });

  it("test-block1-icon-panel-hidden-mobile", () => {
    render(<AuthLayout>contenido</AuthLayout>);

    expect(screen.getByTestId("auth-layout-icon-panel")).toHaveClass("hidden");
  });

  it("test-block1-form-panel-centered-mobile", () => {
    render(<AuthLayout>contenido</AuthLayout>);

    const contentPanel = screen.getByTestId("auth-layout-content-panel");

    expect(contentPanel).toHaveClass("w-full", "items-center", "justify-center");
    expect(contentPanel).toHaveTextContent("contenido");
  });

  it("test-block1-panels-split-50-50", () => {
    render(<AuthLayout>contenido</AuthLayout>);

    expect(screen.getByTestId("auth-layout-icon-panel")).toHaveClass("sm:w-1/2");
    expect(screen.getByTestId("auth-layout-content-panel")).toHaveClass("sm:w-1/2");
  });

  it("test-block1-card-radius-1rem", () => {
    render(<AuthLayout>contenido</AuthLayout>);

    expect(screen.getByTestId("auth-layout-card")).toHaveClass("rounded-[1rem]");
  });

  it("test-block1-icon-inline-svg-no-library", () => {
    const { container } = render(<AuthLayout>contenido</AuthLayout>);

    expect(container.querySelector("svg")).toBeInTheDocument();

    const source = readFileSync(
      path.resolve(__dirname, "../../components/AuthLayout.tsx"),
      "utf-8",
    );
    const importLines = source.match(/^import .*/gm) ?? [];
    const externalLibraryImports = importLines.filter(
      (line) => !line.includes('"react"') && !line.includes("from \"react\""),
    );

    expect(externalLibraryImports).toHaveLength(0);
  });
});
