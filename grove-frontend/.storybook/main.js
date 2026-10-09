const path = require("path");

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
module.exports = {
  stories: ["../src/**/*.stories.@(js|jsx)"],
  addons: [
    "@storybook/preset-create-react-app",
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
  ],
  framework: { name: "@storybook/react-webpack5", options: {} },
  staticDirs: ["../public"],
  // The app resolves "@/..." through craco; Storybook reads CRA's webpack
  // config without craco, so the alias is repeated here.
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "../src"),
    };
    return config;
  },
};
