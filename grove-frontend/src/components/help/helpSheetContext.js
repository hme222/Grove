import { createContext, useContext } from 'react';

// Kept apart from the sheet itself so the page header can ask for it without importing the whole sheet.
export const HelpSheetContext = createContext(null);

// { open() }, or null where there is no provider (a signed-out screen, or a test).
export const useHelpSheet = () => useContext(HelpSheetContext);
