import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button component", () => {
  it("renders accessible actions and handles clicks", () => {
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Search</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
