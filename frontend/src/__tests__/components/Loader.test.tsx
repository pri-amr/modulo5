import { render, screen } from "@testing-library/react";

import Loader from "@/components/Loader";

describe("Loader", () => {
  it("renderiza el spinner cuando visible es true", () => {
    render(<Loader visible />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("no renderiza nada cuando visible es false", () => {
    const { container } = render(<Loader visible={false} />);

    expect(container).toBeEmptyDOMElement();
  });
});
