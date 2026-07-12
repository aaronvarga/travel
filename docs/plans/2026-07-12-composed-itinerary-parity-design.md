# Composed itinerary visual parity

Composed itineraries use the canonical itinerary visual language and section order. They do not maintain a separate lightweight page shell.

Every normal itinerary section remains visible. Available reusable or calculated information is rendered in the standard cards, tables, map, and day-by-day components. Its verification state is shown beside the relevant heading or value:

- **Estimated** for deterministic composition outputs such as dates, PTO, scores, nights, and budget rollups.
- **Unverified** for useful source-leg facts whose final paired-trip application or 2027 logistics have not been audited.
- **Verified source** for destination-local content carried unchanged from a reviewed source itinerary.

When a normal section has no meaningful composer data, its usual section heading remains and the body becomes a dashed status panel reading **Not yet verified**, with a short description of what research or decision is missing. This makes incompleteness visually inspectable without inventing content.

The composed renderer reuses the canonical hero, navigation, content width, typography, day cards, carousels, map shell, tables, evidence cards, gallery dialog, responsive behavior, and page scripts. Shared shell CSS is deterministically extracted from the canonical itinerary source so composed pages track the existing visual system instead of drifting.

