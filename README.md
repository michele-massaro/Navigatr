![Navigatr logo](./public/navigatr_banner.png "Navigatr")

# Navigatr

Navigatr is a lightweight self-hosted dashboard for launching your most-used services from a single place. The UI loads its configuration at runtime, so you can update services and header copy without rebuilding the app.

## Tech stack

- React + TypeScript
- Vite + Vitest
- Tailwind CSS
- Nginx (production container)

## Runtime configuration

Navigatr fetches configuration files at runtime:

- `GET /configuration/apps.json` for the list of services
- `GET /configuration/config.json` for header copy

During local development, edit the files in public/configuration/. In Docker, bind-mount the files into `/usr/share/nginx/html/configuration` so the container serves them directly.

## Local development

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Open http://localhost:5173

## Docker

Build the image and run the container:

- Build: `docker build -t navigatr .`
- Run: `docker run --rm -p 8080:80 \
-v $(pwd)/public/configuration/apps.json:/usr/share/nginx/html/configuration/apps.json:ro \
-v $(pwd)/public/configuration/config.json:/usr/share/nginx/html/configuration/config.json:ro \
navigatr`

Then open http://localhost:8080.

## Docker Compose

- Build and start: `docker compose up --build`

The Compose service maps port 8080 to the container’s port 80 and bind-mounts the runtime config files.

## Tests

- Watch mode: `npm run test`
- Single run: `npm run test:run`

## Configuration files

### public/configuration/apps.json

An array of services with the following fields:

- `id` (string, required): Unique identifier.
- `title` (string, required): Display name.
- `description` (string, required): Short summary.
- `url` (string, required): Target URL.
- `logo` (string, required): Path or URL to the icon.
- `category` (string, optional): Grouping label.

Example:

```json
[
  {
    "id": "plex",
    "title": "Plex",
    "description": "Media server",
    "url": "https://plex.example.local",
    "logo": "/assets/plex.svg",
    "category": "Media"
  }
]
```

### public/configuration/config.json

Header configuration fields:

- `title` (string, required): Main header title.
- `subtitle` (string, required): Supporting header text.

Example:

```json
{
  "title": "Home Server Dashboard",
  "subtitle": "Launch your most-used services from a single place and keep everything at a glance."
}
```

## License

[MIT](LICENSE)
