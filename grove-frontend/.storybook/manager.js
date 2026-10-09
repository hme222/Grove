import { addons } from "@storybook/manager-api";
import { create } from "@storybook/theming/create";

// Brand the shell as Grove's UI library instead of the generic Storybook
// name, using the app's own palette from src/index.css.
addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "Grove UI",
    brandUrl: "https://hillaryesposito.org/case-study/grove/",
    brandTarget: "_self",
    colorPrimary: "#3B6D11",
    colorSecondary: "#2D5016",
    appBg: "#F5F0E8",
    appContentBg: "#FFFFFF",
    appBorderColor: "#D3C9B8",
    textColor: "#1A1A17",
    barSelectedColor: "#2D5016",
  }),
});

// Storybook writes the tab title itself ("<story> ⋅ Storybook") on every
// navigation and has no option for the suffix, so rename it as it changes.
const BRAND = "Grove UI";
const rename = () => {
  const t = document.title;
  const next = t === "Storybook" || t.startsWith("@storybook/")
    ? BRAND
    : t.replace(/ ⋅ Storybook$/, ` ⋅ ${BRAND}`);
  if (next !== t) document.title = next;
};
rename();
new MutationObserver(rename).observe(document.querySelector("title"), {
  childList: true,
  characterData: true,
  subtree: true,
});
