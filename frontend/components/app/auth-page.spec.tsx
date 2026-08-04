import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthPage } from "./auth-page";

describe("Authentication frontend forms", () => {
  it("validates login email input before submission", async () => {
    render(<AuthPage mode="login" submitLabel="Login" title="Login" />);

    fireEvent.change(screen.getByPlaceholderText("Email address"), { target: { value: "not-email" } });
    const form = screen.getByRole("button", { name: "Login" }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
  });

  it("renders registration business name field", () => {
    render(<AuthPage mode="register" submitLabel="Register" title="Create Account" />);

    expect(screen.getByPlaceholderText("Business name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
  });
});
