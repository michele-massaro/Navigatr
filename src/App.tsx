import { useEffect, useState } from "react";
import type { HeaderConfig, Service } from "./types";
import "./App.css";

type LoadStatus = "loading" | "error" | "success";

const loadingMessage = "Loading configuration…";
const notFoundMessage =
  "Configuration file not found. Please add apps.json to the public/configuration directory.";
const invalidJsonMessage = "Configuration file contains invalid JSON.";
const defaultHeaderConfig: HeaderConfig = {
  title: "Home Server Dashboard",
  subtitle:
    "Launch your most-used services from a single place and keep everything at a glance.",
};

const isHeaderConfig = (data: unknown): data is HeaderConfig => {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as HeaderConfig;
  return (
    typeof candidate.title === "string" &&
    typeof candidate.subtitle === "string"
  );
};

function App() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [services, setServices] = useState<Service[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [headerConfig, setHeaderConfig] =
    useState<HeaderConfig>(defaultHeaderConfig);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const loadHeaderConfig = async () => {
      try {
        const response = await fetch("/configuration/config.json", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Unable to load header configuration (HTTP ${response.status}).`,
          );
        }

        let data: unknown;
        try {
          data = await response.json();
        } catch {
          throw new Error("Header configuration contains invalid JSON.");
        }

        if (!isHeaderConfig(data)) {
          throw new Error(
            "Header configuration must include title and subtitle strings.",
          );
        }

        if (!isActive) {
          return;
        }

        setHeaderConfig(data);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.warn(
          error instanceof Error
            ? error.message
            : "Unable to load header configuration.",
        );
        setHeaderConfig(defaultHeaderConfig);
      }
    };

    const loadConfig = async () => {
      setStatus("loading");
      setErrorMessage("");

      try {
        const response = await fetch("/configuration/apps.json", {
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(notFoundMessage);
          }

          throw new Error(
            `Unable to load configuration (HTTP ${response.status}).`,
          );
        }

        let data: unknown;
        try {
          data = await response.json();
        } catch {
          throw new Error(invalidJsonMessage);
        }

        if (!Array.isArray(data)) {
          throw new Error("Configuration file must be an array of services.");
        }

        if (!isActive) {
          return;
        }

        setServices(data as Service[]);
        setStatus("success");
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load configuration.",
        );
        setStatus("error");
      }
    };

    void loadHeaderConfig();
    void loadConfig();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Navigatr
          </p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            {headerConfig.title}
          </h1>
          <p className="max-w-2xl text-sm text-slate-400 sm:text-base">
            {headerConfig.subtitle}
          </p>
        </header>

        {status === "loading" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-200">
            {loadingMessage}
          </div>
        )}

        {status === "error" && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-100"
          >
            <p className="font-semibold">Unable to load configuration</p>
            <p className="mt-2 text-rose-100/90">{errorMessage}</p>
          </div>
        )}

        {status === "success" && (
          <section className="space-y-6">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>{services.length} services available</span>
            </div>

            {services.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-400">
                Add services to configuration/apps.json to populate your
                dashboard.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <a
                    key={service.id}
                    href={service.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:-translate-y-1 hover:border-slate-600 hover:bg-slate-900/70"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                        <img
                          src={service.logo}
                          alt={service.title}
                          className="h-10 w-10 object-contain"
                        />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-white">
                          {service.title}
                        </h2>
                        <p className="text-sm text-slate-400">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{service.category ?? "General"}</span>
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
                        Open
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
