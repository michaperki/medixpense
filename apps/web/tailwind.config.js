// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // You can adjust these colors to your preference
        gray: {
          300: '#d1d5db', // Lighter border color
          500: '#6b7280', // Medium text color (placeholders)
          700: '#374151', // Darker text color (input text)
          900: '#111827', // Darkest text color (headings)
        },
        blue: {
          500: '#3b82f6', // Focus ring color
          600: '#2563eb', // Button color
          700: '#1d4ed8', // Button hover color
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // If you're using the forms plugin
  ],
}
