import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      container: {
        center: true,
        padding: "1.5rem",
        screens: {
          // 640px to 767px
          sm: "640px",

          // 768px to 1023px
          md: "768px",

          // 1024px to 1279px
          lg: "1024px",

          // 1280px and above
          xl: "1280px",
        },
      },
    },
  },
  plugins: [],
};
export default config;
