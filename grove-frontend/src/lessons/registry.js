import { CARDS as SOIL_CARDS } from '../pages/SoilFingerTestVariation';
import { CARDS as HABIT_CARDS } from '../pages/HabitStackingVariations';
import { CARDS as ER_CARDS } from '../pages/PlantERVariations';
import { LIGHT_BASICS_CARDS, WINDOW_MAP_CARDS } from './light/lightCards';
import { LESSONS as RESET_CARDS } from '../pages/ResetCourseVariation';

// Lesson id to card list. The text lives in the lesson pages and is used as written.
export const LESSON_CARDS = {
  'soil-finger-test': SOIL_CARDS,
  'plant-parent-reset': RESET_CARDS,
  'plant-er': ER_CARDS,
  'habit-stacking': HABIT_CARDS,
  'light-basics': LIGHT_BASICS_CARDS,
  'window-map': WINDOW_MAP_CARDS,
};
