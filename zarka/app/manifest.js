const ICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect width='512' height='512' rx='96' fill='#f26a1b'/><text x='256' y='340' font-size='260' font-family='Arial' font-weight='700' fill='white' text-anchor='middle'>Z</text></svg>"
  );

export default function manifest() {
  return {
    name: "Zarka",
    short_name: "Zarka",
    description: "Offline-first money transfers for Southern Africa",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7f0",
    theme_color: "#f26a1b",
    icons: [{ src: ICON, sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
