import { render, screen, waitFor } from "@testing-library/react";

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("el elemento raíz del layout refleja la clase del tema actual", async () => {
    render(
      <RootLayout>
        <p>contenido</p>
      </RootLayout>,
    );

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });
});
