module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    {
      pattern:
        /(ring|bg)-(primary|secondary|red|green|gray|yellow|blue)-(500|600|700|800)/,
    },
    {
      pattern: /(bg|text)-gray-(50|100|200|400|900)/,
    },
    "text-red-500",
    "text-green-500",
  ],
  theme: {
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "4rem",
    },
    extend: {
      animation: {
        "infinite-scroll": "infinite-scroll 25s linear infinite",
      },
      keyframes: {
        "infinite-scroll": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
      },
      colors: {
        primary: {
          100: "#b3d1ff",
          200: "#80b3ff",
          300: "#4da0ff",
          400: "#ffa619",
          500: "#2A2B2E",
          600: "#1869ff",
          700: "#1884ff",
          800: "#0059ff",
          900: "#005aff",
        },
        gray: {
          100: "#f7fafc",
          200: "#edf2f7",
          300: "#e2e8f0",
          400: "#cbd5e0",
          500: "#a0aec0",
          600: "bg-[#303633]",
          700: "#2d3748",
          800: "#141716",
        },
        primaryBlack: {
          400: "#141716",
        },
      },
      lineHeight: {
        hero: "4.5rem",
      },
    },
  },
};
