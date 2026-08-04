import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./dashboard-page";

vi.mock("../charts/overview-chart", () => ({
  RiskMixChart: () => <div data-testid="risk-chart">Risk Chart</div>,
  SearchTrendChart: () => <div data-testid="trend-chart">Trend Chart</div>
}));

describe("Dashboard rendering", () => {
  it("renders portal metrics, provider status, tables, and chart slots", () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    });
    render(
      <QueryClientProvider client={client}>
        <DashboardPage />
      </QueryClientProvider>
    );

    expect(screen.getByText("Merchant Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Searches Used")).toBeInTheDocument();
    expect(screen.getByText("Provider Status")).toBeInTheDocument();
    expect(screen.getByTestId("trend-chart")).toBeInTheDocument();
    expect(screen.getByTestId("risk-chart")).toBeInTheDocument();
    expect(screen.getByText("No search history has been returned by the API yet.")).toBeInTheDocument();
  });
});
