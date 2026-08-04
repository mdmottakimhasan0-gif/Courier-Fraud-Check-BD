import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RiskMixChart, SearchTrendChart } from "./overview-chart";

describe("Chart rendering", () => {
  it("renders chart components without crashing in jsdom", () => {
    const trend = render(<SearchTrendChart />);
    const risk = render(<RiskMixChart />);

    expect(trend.container).toBeTruthy();
    expect(risk.container).toBeTruthy();
  });
});
