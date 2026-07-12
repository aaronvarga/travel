const flights = [
  {
    route: 'Funchal → Lisbon → Palermo',
    trips: [
      { label: 'Madeira + Sicily', href: 'locations/madeira-sicily/index.html' },
    ],
    transfer: '1 required buffer night + ~4¾h airborne',
    timeValue: 28.75,
    complexity: 5,
    risk: 5,
    watch: 'FNC wind disruption, then a thin twice-weekly Lisbon–Palermo handoff. Keep the Lisbon night; do not treat the 2027 Tuesday pattern as confirmed.',
  },
  {
    route: 'Madeira → Lisbon buffer → Chania via Athens',
    trips: [
      { label: 'Madeira + Crete', href: 'locations/madeira-crete/index.html' },
    ],
    transfer: '1 required buffer night + 1 stop',
    timeValue: 28,
    complexity: 5,
    risk: 4,
    watch: 'The buffer protects against FNC weather, but the onward Lisbon–Athens–Chania chain is still a full transfer day. Seek one protected itinerary for the Greece side.',
  },
  {
    route: 'Carvoeiro → Lisbon → Palermo',
    trips: [
      { label: 'Portugal + Algarve + Sicily', href: 'locations/portugal-algarve-sicily/index.html' },
    ],
    transfer: '~2h40 airport drive + ~3h flight',
    timeValue: 9.67,
    complexity: 5,
    risk: 5,
    watch: 'A long Algarve-to-Lisbon reposition precedes the thin Lisbon–Palermo service. Add a Lisbon-airport night whenever the published departure is early or wrong-day.',
  },
  {
    route: 'Lisbon → Athens → Chania',
    trips: [
      { label: 'Portugal + Crete', href: 'locations/portugal-crete/index.html' },
      { label: 'Greece via Lisbon', href: 'locations/greece-via-lisbon/index.html' },
    ],
    transfer: '1 stop · full transfer day',
    timeValue: 8,
    complexity: 4,
    risk: 4,
    watch: 'No dependable Lisbon–Crete nonstop is assumed. Prioritize a protected connection through Athens and quote the whole chain before lodging.',
  },
  {
    route: 'Funchal → Lisbon → Palma de Mallorca',
    trips: [
      { label: 'Madeira + Mallorca', href: 'locations/madeira-mallorca/index.html' },
    ],
    transfer: '1 buffer night + 1 stop',
    timeValue: 27,
    complexity: 4,
    risk: 4,
    watch: 'The Lisbon buffer is deliberate FNC-weather insurance. Palma has more service options than the Greek or Sicily handoffs, but the complete 2027 through-fare remains the gate.',
  },
  {
    route: 'Lisbon → Palermo',
    trips: [
      { label: 'Portugal + Sicily', href: 'locations/portugal-sicily/index.html' },
    ],
    transfer: '~3h nonstop when it operates',
    timeValue: 3,
    complexity: 4,
    risk: 4,
    watch: 'The attractive short hop is a schedule gate: current service is thin and may be a separate ticket. Confirm the exact 2027 operating day before locking either half.',
  },
  {
    route: 'Faro → Funchal',
    trips: [
      { label: 'Portugal Algarve & Madeira', href: 'locations/portugal/index.html' },
    ],
    transfer: '~1¾h flight · limited seasonal pattern',
    timeValue: 1.75,
    complexity: 3,
    risk: 4,
    watch: 'This is Portugal’s one fragile joint: limited seasonal service and Madeira weather. Lock this leg before the island lodging, then retain a recovery buffer.',
  },
  {
    route: 'Tenerife North ↔ La Palma',
    trips: [
      { label: 'Canary Islands', href: 'locations/canary-islands/index.html' },
    ],
    transfer: '2 intra-trip hops · ~30–45m each',
    timeValue: 1.5,
    complexity: 3,
    risk: 3,
    watch: 'The flights themselves are short, but the plan needs a return to Tenerife and a second rental car. Tenerife gives better fallback capacity; exact 2027 timing still decides the shape.',
  },
  {
    route: 'Venice → Olbia',
    trips: [
      { label: 'Venice, Dolomites & Sardinia', href: 'locations/dolomites-sardinia/index.html' },
    ],
    transfer: '~1½h flight + new rental car',
    timeValue: 1.5,
    complexity: 3,
    risk: 3,
    watch: 'A clean island hop on paper, but it divides the trip into two cars and four bases. Check the exact seasonal Olbia service and baggage/vehicle handoff together.',
  },
  {
    route: 'Zurich → Heraklion → Chania',
    trips: [
      { label: 'Switzerland + Crete', href: 'locations/switzerland-crete/index.html' },
    ],
    transfer: 'seasonal air pattern + ~2h20 arrival drive',
    timeValue: 5,
    complexity: 2,
    risk: 2,
    watch: 'Use Heraklion’s broader capacity rather than depending on a weekly Chania nonstop. The air handoff is manageable; the late arrival drive is the practical check.',
  },
  {
    route: 'Zurich → Catania',
    trips: [
      { label: 'Switzerland + Sicily', href: 'locations/switzerland-sicily/index.html' },
    ],
    transfer: 'seasonal air pattern + ~50m arrival drive',
    timeValue: 3.5,
    complexity: 2,
    risk: 2,
    watch: 'Catania’s larger airport and short Taormina transfer make this the calmer Alps-to-island handoff. Recheck the 2027 seasonal service, but there is no island weather buffer requirement.',
  },
  {
    route: 'Catania → Malta',
    trips: [
      { label: 'Sicily & Malta', href: 'locations/sicily-malta/index.html' },
    ],
    transfer: '~45m nonstop',
    timeValue: 0.75,
    complexity: 2,
    risk: 2,
    watch: 'A short, logical island finish after dropping the Sicily car. The bigger friction is the four-base itinerary around it, not this specific flight.',
  },
  {
    route: 'Honolulu → Kona',
    trips: [
      { label: 'Hawaii: Oahu + Big Island', href: 'locations/hawaii/index.html' },
    ],
    transfer: '~45m nonstop',
    timeValue: 0.75,
    complexity: 2,
    risk: 2,
    watch: 'The single Hawaii hop is deliberately contained to one travel day. It is a comparatively simple domestic move; the long PIT flight and red-eye recovery are the larger trip risks.',
  },
  {
    route: 'Kahului → Līhuʻe',
    trips: [
      { label: 'Hawaii: Maui + Kauai', href: 'locations/maui-kauai/index.html' },
    ],
    transfer: '~50m nonstop',
    timeValue: 0.83,
    complexity: 2,
    risk: 2,
    watch: 'An easy domestic hop between the two islands. Keep it to the one planned move, then focus booking attention on the more consequential Hāʻena, Nā Pali, and premium-airfare gates.',
  },
];

module.exports = function () {
  return [...flights].sort((a, b) =>
    a.complexity - b.complexity || a.risk - b.risk || a.timeValue - b.timeValue || a.route.localeCompare(b.route)
  );
};
