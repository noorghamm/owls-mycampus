# Owls MyCampus

A playable Glasgow campus timetable. Steer Rowan the barn owl over an illustrated Gilmorehill, catch moonfeathers and bring stamped lecture passes back to the roost.

## Play locally

Run `npm start` and visit [the local game](http://127.0.0.1:4873/). This command uses Python 3. The game itself is static HTML, CSS and JavaScript in `dist/` and needs no build or package installation.

- The timetable opens with the next unchecked class, room and day schedule. **Export calendar** downloads the three sample lectures for Apple Calendar or another calendar app.
- Open **Campus map** and choose **Fly to next class**. Steer with arrow keys or WASD, or tap a point on the chart. **Guide me** flies to the destination automatically. Escape or **Land later** exits flight.
- Open a pass from either the map or the timetable. The first stamp for each lecture earns 10 points. The third adds a 20-point full-flight bonus.
- Catch golden moonfeathers in flight. Visit the Science & Engineering common room and give one to each adviser companion. Support links work from the start.
- Pin a midday break, confirm the two registration seals, or add and drop the sample optional course.

Progress is stored in the browser on the current device. The timetable, check-ins, enrolment, funding and rooms are illustrative. Only the labelled support links open university resources or an email application.

## Project

The shared student record and sample data are in `dist/data.js`, flight controls in `dist/flight.js`, and campus views in `dist/app.js`. Original SVG artwork is in `dist/art/`. Run `npm test` with Node 20 or later.

Created with OpenAI Codex from the Group Y Owls MyCampus prototype. AI assistance covered implementation, illustration and verification. The application is an independent student prototype.

