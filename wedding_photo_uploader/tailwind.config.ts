import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        eucalyptus: "url('/image/background_eucalyptus.jpg')",
        image3: "url('/image/background_image3.jpg')",
        eucalyptus2: "url('/image/eucalyptus2.jpg')",
      },
    },
  },
  plugins: [],
};
export default config;
