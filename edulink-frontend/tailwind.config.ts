import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1E3A5F',
        },
        accent: '#7C3AED',
        success: '#16A34A',
        warning: '#D97706',
        error: '#DC2626',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        border: '#E5E7EB',
      },
    },
  },
  plugins: [],
};
export default config;
