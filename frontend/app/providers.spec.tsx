import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Providers, useAppPreferences } from "./providers";

function PreferenceProbe() {
  const { locale, setLocale, theme, toggleTheme } = useAppPreferences();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setLocale("bn")} type="button">
        Bangla
      </button>
      <button onClick={toggleTheme} type="button">
        Theme
      </button>
    </div>
  );
}

describe("Frontend app providers", () => {
  it("supports theme and localization state", () => {
    render(
      <Providers>
        <PreferenceProbe />
      </Providers>
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    fireEvent.click(screen.getByRole("button", { name: "Bangla" }));
    fireEvent.click(screen.getByRole("button", { name: "Theme" }));
    expect(screen.getByTestId("locale")).toHaveTextContent("bn");
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });
});
