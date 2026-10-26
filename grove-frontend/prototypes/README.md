# Design prototypes (not part of the app)

Early design explorations kept for reference. They are outside `src/`, so they are not bundled
or routed, and they are not covered by the token check. Lesson text that the app uses now lives
in `src/lessons/cards/`. To revive one, move it back under `src/` and bring it onto the design
tokens first.

`RoomScanScreen.js` (photo of a room, the scan finds several plants) was moved here because
nothing routes to it: `AddPlantPage` only offers "Search by name" and "Identify with a photo".
It still needs `plantAPI.scanRoom` (`POST /plants/scan-room`). To revive it, add a third option to
the Add plant chooser, move it back under `src/pages/`, and bring it onto the tokens first.
