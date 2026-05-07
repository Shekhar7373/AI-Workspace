export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      colors: {
        ink: "#101418",
        paper: "#f6f7f2",
        moss: "#51624b",
        fern: "#7b8f62",
        clay: "#b5674d",
        steel: "#5f7480",
        wheat: "#e4d5ad"
      }
    }
  },
  plugins: []
};
