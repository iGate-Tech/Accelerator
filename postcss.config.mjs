export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    'postcss-preset-env': {
      stage: 1,
      features: {
        'custom-properties': true,
      },
    },
  },
}