import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#b3ccff",
          300: "#80a9ff",
          400: "#4d80ff",
          500: "#265ef5",
          600: "#1a45d1",
          700: "#1836a8",
          800: "#182f85",
          900: "#182a6b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
