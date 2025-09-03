/** @type {import('tailwindcss').Config} */
const { platformSelect, platformColor } = require("nativewind/theme");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        error: platformSelect({
          // Now you can provide platform specific values
          ios: platformColor("systemRed"),
          android: platformColor("?android:colorError"),
          default: "red",
        }),
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
};
