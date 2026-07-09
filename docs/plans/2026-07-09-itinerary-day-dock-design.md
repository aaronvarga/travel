# Itinerary Day Dock

## Purpose

Make long day-by-day itineraries easier to scan and navigate without taking readers away from the itinerary content.

## Approved interaction

- Show the navigator only while the Day-by-Day section intersects the viewport.
- On screens 1180px and wider, use a fixed vertical dock on the right edge.
- Keep the dock container transparent so the thumbnails float directly over the page.
- Magnify the current day and its neighbors as the reader approaches the next day, creating a restrained macOS Dock-like wave.
- On smaller screens, present the same days as a compact, swipeable strip at the bottom of the viewport.
- Use each day's first available itinerary photo as its thumbnail.
- Use plane, car, ship, or map symbols when a day has no photo.
- Reveal the date, day number, title, and short description on desktop hover or keyboard focus.
- Show the selected day's date, number, and title above the mobile strip.
- Jump to a day through ordinary hash links so browser history and no-script behavior remain predictable.
- Complete dock-triggered day jumps in about 220ms and keep the magnification response near 70ms.

## Implementation

The shared `itinerary` macro emits one accessible link per rendered day. A dependency-free controller discovers the corresponding day cards and their first images, assigns fallback symbols, tracks the itinerary with `IntersectionObserver`, and updates the magnification wave inside `requestAnimationFrame`. CSS controls the desktop/mobile layouts and visual transitions.

Reduced-motion users receive a simple active-day size change with transitions disabled. The dock is excluded from print output and remains hidden when JavaScript is unavailable.

## Verification

- Build every itinerary successfully.
- Confirm each dock link resolves to exactly one day card.
- Confirm the dock item count matches the day-card count on every generated page.
- Compile-check the embedded controller.
- Verify wide-screen, compact-screen, hover, focus, click, scroll-boundary, and reduced-motion behavior in a browser when the in-app preview surface is available.
