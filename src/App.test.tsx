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

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(services),
    } as unknown as Response);

    render(<App />);

    expect(screen.getByText("Loading configuration…")).toBeInTheDocument();
    expect(await screen.findByText("Plex")).toBeInTheDocument();
    expect(screen.getByText("Media server")).toBeInTheDocument();
  });

  it("renders a user-friendly message when config is missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn(),
    } as unknown as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Configuration file not found. Please add apps.json to the public directory.",
      );
    });
  });

  it("renders a user-friendly message when config is invalid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new Error("Unexpected token")),
    } as unknown as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Configuration file contains invalid JSON.",
      );
    });
  });
});
