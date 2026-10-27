# Real-device walk-through (iPhone)

A 30-minute pass for the things a desktop browser cannot show. Use a real phone, the deployed build or your local build over the network, and the first-run test user.

Before you start
- Reset the first-run user: from `grove-backend`, `python3 seed_testing.py groveling`. Sign in as `groveling.testing@grove.app` (password: `TEST_PASSWORD` in `seed_testing.py`).
- Note the iOS version, the text size setting, and whether Low Power Mode is on.

1. First run (about 8 minutes)
   - Open the home page signed out. You should land on the welcome screen with "Already have an account? Sign in".
   - Step through the three intro slides, the account step, the zip step (try a US zip, a bad zip, and skip), the four questions (answer one, skip one) and the plan screen.
   - Check: photos load and are not stretched, text is readable, the keyboard does not hide the Continue button, the back button works on every step, and the plan names your answers.
   - Write down any step where you hesitated for more than three seconds.
2. Today and the first care (5 minutes)
   - Add a plant. Open Today. Do the soil check, then water. Water a second plant, then clear the list and read the end-of-round card.
   - Check: the due wording is calm, the one step under each plant matches the plant type, Undo appears and works.
3. Lessons (5 minutes)
   - Open Plant Parent Reset and Plant ER. Answer a quiz question wrong, read the reason, retry, finish.
   - Open "Sources for this lesson" and tap a link.
4. Large text and zoom (3 minutes)
   - Settings, Display, Text Size: set it to the largest Accessibility size. Visit Today, Plants, a plant page, a lesson and the first-run steps.
   - Check: nothing is cut off, tabs scroll, buttons stay reachable.
5. VoiceOver (5 minutes)
   - Turn VoiceOver on. Go through the welcome step, one quiz question, Today and the Water all dialog.
   - Check: headings are announced, the quiz right/wrong feedback is spoken, the selected tab is announced, the dialog traps focus and Cancel is reachable.
6. Sun glare and one hand (2 minutes)
   - Take the phone outside or turn brightness to maximum. Open Today and a plant page.
   - Check: the pale grey text, the status icons and the lime buttons are still legible. Try the bottom navigation with one thumb.
7. Poor connection (2 minutes)
   - Turn on Airplane Mode and open Today and a plant page, then turn it off and tap Try again.
   - Check: you see an honest "Couldn't load" message, not an empty list, and retry recovers.

Record results as: screen, what you did, what happened, severity (blocked / confusing / cosmetic).
