/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "rgb(22 24 28 / <alpha-value>)",
        panel: {
          DEFAULT: "rgb(29 32 39 / <alpha-value>)",
          2: "rgb(35 38 46 / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(48 52 61 / <alpha-value>)",
          soft: "rgb(39 43 51 / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(232 234 238 / <alpha-value>)",
          dim: "rgb(154 162 176 / <alpha-value>)",
          faint: "rgb(107 114 128 / <alpha-value>)",
        },
        signal: "rgb(216 222 233 / <alpha-value>)",
        flag: "rgb(255 122 69 / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SF Mono",
          "Cascadia Mono",
          "Menlo",
          "monospace",
        ],
      },
      accentColor: {
        flag: "#ff7a45",
      },
    },
  },
  plugins: [],
};
