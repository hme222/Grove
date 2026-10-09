import React from "react";
import { MemoryRouter } from "react-router-dom";
import "../src/index.css";
import "../src/App.css";
import "../src/lib/microAnimations.css";

/** @type { import('@storybook/react').Preview } */
const preview = {
  // Several components call useNavigate; stories render inside a router so
  // they mount without the app shell.
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ padding: 24, background: "var(--grove-paper)", minHeight: "100vh" }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    controls: { matchers: { color: /(background|color)$/i } },
    a11y: { test: "todo" },
  },
};

export default preview;
