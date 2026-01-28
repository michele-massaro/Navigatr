import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App, { groupServicesBySection } from "./App";
import type { Service } from "./types";

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
      if (input === "/configuration/config.json") {
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
      if (input === "/configuration/config.json") {
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
        "Configuration file not found. Please add apps.json to the public/configuration directory.",
      );
    });
  });

  it("renders a user-friendly message when config is invalid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      if (input === "/configuration/config.json") {
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
      if (input === "/configuration/config.json") {
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

describe("groupServicesBySection", () => {
  const createService = (id: string, section?: string): Service => ({
    id,
    title: `Service ${id}`,
    description: "Test service",
    url: `https://${id}.example.local`,
    logo: "/test.svg",
    section,
  });

  it("groups services by section with ungrouped first", () => {
    const services: Service[] = [
      createService("a", "Media"),
      createService("b"),
      createService("c", "Home"),
    ];

    const result = groupServicesBySection(services);

    expect(result).toHaveLength(3);
    expect(result[0].section).toBe("");
    expect(result[0].services[0].id).toBe("b");
    // Named sections in alphabetical order
    expect(result[1].section).toBe("Home");
    expect(result[2].section).toBe("Media");
  });

  it("returns alphabetically sorted sections", () => {
    const services: Service[] = [
      createService("a", "Monitoring"),
      createService("b", "Home"),
      createService("c", "Media"),
    ];

    const result = groupServicesBySection(services);

    expect(result.map((g) => g.section)).toEqual([
      "Home",
      "Media",
      "Monitoring",
    ]);
  });

  it("treats empty string section as ungrouped", () => {
    const services: Service[] = [
      createService("a", ""),
      createService("b", "Media"),
    ];

    const result = groupServicesBySection(services);

    expect(result).toHaveLength(2);
    expect(result[0].section).toBe("");
    expect(result[0].services[0].id).toBe("a");
  });

  it("preserves single-group layout when no sections defined", () => {
    const services: Service[] = [
      createService("a"),
      createService("b"),
      createService("c"),
    ];

    const result = groupServicesBySection(services);

    expect(result).toHaveLength(1);
    expect(result[0].section).toBe("");
    expect(result[0].services).toHaveLength(3);
  });

  it("groups multiple services in same section together", () => {
    const services: Service[] = [
      createService("a", "Media"),
      createService("b", "Media"),
      createService("c", "Home"),
    ];

    const result = groupServicesBySection(services);

    const mediaGroup = result.find((g) => g.section === "Media");
    expect(mediaGroup?.services).toHaveLength(2);
    expect(mediaGroup?.services.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("handles all services with sections (no ungrouped)", () => {
    const services: Service[] = [
      createService("a", "Media"),
      createService("b", "Home"),
    ];

    const result = groupServicesBySection(services);

    expect(result).toHaveLength(2);
    expect(result.every((g) => g.section !== "")).toBe(true);
  });

  it("handles empty services array", () => {
    const result = groupServicesBySection([]);
    expect(result).toHaveLength(0);
  });

  it("trims whitespace from section names", () => {
    const services: Service[] = [
      createService("a", "  Media  "),
      createService("b", "Media"),
    ];

    const result = groupServicesBySection(services);

    expect(result).toHaveLength(1);
    expect(result[0].section).toBe("Media");
    expect(result[0].services).toHaveLength(2);
  });
});
