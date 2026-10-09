import { EmptyState } from "./EmptyState";
import { EMPTY_STATES } from "../constants/emptyStates";

// Every story uses the real config from constants/emptyStates.js, so the
// copy here is the copy the app ships.
export default {
  title: "Grove/EmptyState",
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component:
          "Shown wherever a list has nothing in it yet. Each state says what is missing, why it matters, and the one next step, without blaming the person.",
      },
    },
  },
};

export const CollectionZeroPlants = { args: { config: EMPTY_STATES.collection_zero_plants } };
export const CareAllDone = { args: { config: EMPTY_STATES.care_all_done } };
export const SwapsLocked = {
  args: { config: EMPTY_STATES.swaps_locked, currentStreak: 12 },
};
export const FeedNoGrove = { args: { config: EMPTY_STATES.feed_no_grove } };
export const BouquetNone = { args: { config: EMPTY_STATES.bouquet_none } };
export const LibraryNoPhotos = { args: { config: EMPTY_STATES.library_no_photos } };
export const GoalsNone = { args: { config: EMPTY_STATES.goals_none } };
export const RoomsNone = { args: { config: EMPTY_STATES.rooms_none } };
