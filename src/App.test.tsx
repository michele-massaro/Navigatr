import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("App", () => {
  it("renders services when config loads successfully", async () => {
    const services = [
      {
        id: "plex",
        title: "Plex",
        description: "Media server",
        url: "https://plex.example.local",
        logo: "/assets/plex.svg",
      },
    ];

    const headerConfig = {
      title: "My Home Stack",
      subtitle: "Everything in one place.",
    };

    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      if (input === "/config.json") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(headerConfig),
        } as unknown as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(services),
      } as unknown as Response);
    });

    render(<App />);

    expect(screen.getByText("Loading configuration…")).toBeInTheDocument();
    expect(await screen.findByText("Plex")).toBeInTheDocument();
    expect(screen.getByText("Media server")).toBeInTheDocument();
    expect(screen.getByText("My Home Stack")).toBeInTheDocument();
    expect(screen.getByText("Everything in one place.")).toBeInTheDocument();
  });

  it("renders a user-friendly message when config is missing", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      if (input === "/config.json") {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: vi.fn(),
        } as unknown as Response);
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: vi.fn(),
      } as unknown as Response);
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Configuration file not found. Please add apps.json to the public directory.",
      );
    });
  });

  it("renders a user-friendly message when config is invalid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      if (input === "/config.json") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            title: "Header",
            subtitle: "Subtitle",
          }),
        } as unknown as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error("Unexpected token")),
      } as unknown as Response);
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Configuration file contains invalid JSON.",
      );
    });
  });

  it("falls back to default header copy when header config is missing", async () => {
    const services = [
      {
        id: "grafana",
        title: "Grafana",
        description: "Metrics",
        url: "https://grafana.example.local",
        logo: "/assets/grafana.svg",
      },
    ];

    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      if (input === "/config.json") {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: vi.fn(),
        } as unknown as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(services),
      } as unknown as Response);
    });

    render(<App />);

    expect(await screen.findByText("Grafana")).toBeInTheDocument();
    expect(screen.getByText("Home Server Dashboard")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Launch your most-used services from a single place and keep everything at a glance.",
      ),
    ).toBeInTheDocument();
  });
});
