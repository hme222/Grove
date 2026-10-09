import { StatusDot } from "./StatusDot";

const STATUSES = ["healthy", "needs_water", "urgent", "propagating", "dormant"];

export default {
  title: "Grove/StatusDot",
  component: StatusDot,
  argTypes: {
    status: { control: "select", options: STATUSES },
    size: { control: "inline-radio", options: ["sm", "lg"] },
  },
  args: { status: "healthy", size: "sm", showLabel: true },
};

export const Playground = {};

export const AllStatusesWithLabels = {
  render: (args) => (
    <div style={{ display: "grid", gap: 12 }}>
      {STATUSES.map((status) => (
        <StatusDot key={status} {...args} status={status} showLabel />
      ))}
    </div>
  ),
};

// Dot-only is how the plant grid uses it. Colour is the only channel here,
// so it should always sit next to text that names the status.
export const DotsOnly = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12 }}>
      {STATUSES.map((status) => (
        <StatusDot key={status} {...args} status={status} showLabel={false} />
      ))}
    </div>
  ),
};
