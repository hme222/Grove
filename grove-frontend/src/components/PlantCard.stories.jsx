import PlantCard from "./PlantCard";

const plant = (overrides) => ({
  id: "p1",
  common_name: "Golden Pothos",
  latin_name: "Epipremnum aureum",
  nickname: "",
  photo_url: null,
  status: "healthy",
  ...overrides,
});

export default {
  title: "Grove/PlantCard",
  component: PlantCard,
  decorators: [(Story) => <div className="max-w-tip"><Story /></div>],
};

export const Healthy = { args: { plant: plant() } };
export const DueSoon = {
  args: { plant: plant({ id: "p2", common_name: "Fiddle Leaf Fig", latin_name: "Ficus lyrata", status: "needs_water" }) },
};
export const Overdue = {
  args: { plant: plant({ id: "p3", common_name: "Peace Lily", latin_name: "Spathiphyllum wallisii", nickname: "Lily", status: "urgent" }) },
};
export const SelectedInBulkMode = {
  args: { plant: plant(), selectionMode: true, selected: true, onSelect: () => {} },
};
