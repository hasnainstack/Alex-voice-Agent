import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12181F", // dispatch board panel background
        surface: "#1B2430", // card surface on the dark board
        surfaceHover: "#232E3D",
        paper: "#EDEFF2", // page background, light neutral (not warm cream)
        paperCard: "#FFFFFF",
        beacon: "#E8A33D", // active-call / in-transit amber
        beaconDim: "#8A6428",
        confirmed: "#2BAF98", // call-ended / delivered teal
        line: "#D8DBE0", // hairlines on light zones
        lineDark: "rgba(255,255,255,0.09)", // hairlines on dark zones
        ink900: "#171D26",
        ink600: "#4B5563",
        ink400: "#8992A0",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        travel: {
          "0%": { left: "0%" },
          "100%": { left: "100%" },
        },
        beaconPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232, 163, 61, 0.55)" },
          "70%": { boxShadow: "0 0 0 10px rgba(232, 163, 61, 0)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        travel: "travel 2.6s ease-in-out infinite alternate",
        beaconPulse: "beaconPulse 1.8s ease-out infinite",
        rise: "rise 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
