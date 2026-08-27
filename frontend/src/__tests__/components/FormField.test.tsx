import { render, screen } from "@testing-library/react";

import FormField from "@/components/FormField";

describe("FormField", () => {
  it("test-block2-formfield-labelsize-default-sm", () => {
    render(
      <FormField label="Campo" htmlFor="campo">
        <input id="campo" />
      </FormField>,
    );

    expect(screen.getByText("Campo")).toHaveClass("text-sm");
  });

  it("test-block2-formfield-labelsize-base", () => {
    render(
      <FormField label="Campo" htmlFor="campo" labelSize="base">
        <input id="campo" />
      </FormField>,
    );

    expect(screen.getByText("Campo")).toHaveClass("text-base");
  });
});
