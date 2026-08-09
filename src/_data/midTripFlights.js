const flights = [
  {
    route: 'Funchal → Lisbon → Palermo',
    trips: [
      { label: 'Madeira + Sicily', href: 'locations/madeira-sicily/index.html' },
    ],
    transfer: '1 required buffer night + ~6½–10h one-stop journey',
    timeValue: 32,
    complexity: 5,
    risk: 4,
    watch: 'Exact June 15 inventory has no nonstop. Keep the Lisbon night, then use a sold one-stop via Rome, Zurich, or Munich rather than the former easyJet assumption.',
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
    watch: 'The June 14 Aegean Lisbon–Athens–Chania itinerary is selling on one ticket. Keep the buffer because FNC weather can still disrupt the positioning leg.',
  },
  {
    route: 'Carvoeiro → Lisbon → Palermo',
    trips: [
      { label: 'Portugal (Algarve) + Sicily', href: 'locations/portugal-algarve-sicily/index.html' },
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
      { label: 'Portugal (Lisbon) + Crete', href: 'locations/portugal-crete/index.html' },
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
    transfer: '1 buffer night + ~1h55 nonstop',
    timeValue: 27,
    complexity: 4,
    risk: 3,
    watch: 'TAP sells the exact June 15 Lisbon–Palma nonstop. The Lisbon buffer remains deliberate FNC-weather insurance; only the complete open-jaw price remains a gate.',
  },
  {
    route: 'Lisbon → Palermo',
    trips: [
      { label: 'Portugal (Lisbon) + Sicily', href: 'locations/portugal-sicily/index.html' },
    ],
    transfer: '~6½–10h · 1 stop',
    timeValue: 8,
    complexity: 5,
    risk: 4,
    watch: 'No nonstop sells on June 14. Use a live one-stop via Zurich, Munich, or Rome and keep the full day clear for the transfer.',
  },
  {
    route: 'Faro → Funchal',
    trips: [
      { label: 'Portugal (Algarve + Madeira)', href: 'locations/portugal/index.html' },
    ],
    transfer: '~5h35 · 1 stop via Lisbon',
    timeValue: 5.6,
    complexity: 4,
    risk: 3,
    watch: 'There is no Friday nonstop on June 18. The sold one-stop via Lisbon works, but Madeira weather still makes the recovery buffer valuable.',
  },
  {
    route: 'Tenerife North ↔ La Palma',
    trips: [
      { label: 'Canary Islands', href: 'locations/canary-islands/index.html' },
    ],
    transfer: '2 intra-trip hops · ~30–45m each',
    timeValue: 1.5,
    complexity: 3,
    risk: 2,
    watch: 'Binter sells the exact June 15/20 nonstops. The remaining friction is the return to Tenerife and second rental car, not flight publication.',
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
    transfer: '~2h50 nonstop + ~2h20 arrival drive',
    timeValue: 5,
    complexity: 2,
    risk: 2,
    watch: 'Edelweiss/SWISS sells two exact June 14 Zurich–Heraklion nonstops. The late Heraklion-to-Chania drive is now the practical check.',
  },
  {
    route: 'Zurich → Catania',
    trips: [
      { label: 'Switzerland + Sicily', href: 'locations/switzerland-sicily/index.html' },
    ],
    transfer: '~2h05 nonstop + ~50m arrival drive',
    timeValue: 3.5,
    complexity: 2,
    risk: 2,
    watch: 'Edelweiss/SWISS sells the exact June 14 nonstop. Catania’s larger airport and short Taormina transfer keep this the calmer Alps-to-island handoff.',
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
    watch: 'Ryanair/Malta Air sells exact June 20 nonstops. The bigger friction is the four-base itinerary around it, not this specific flight.',
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
    watch: 'Multiple exact June 15 nonstops sell around $150 round trip. Keep the single move, then focus booking attention on Hāʻena, Nā Pali, and the protected outer open-jaw.',
  },
];

module.exports = function () {
  return [...flights].sort((a, b) =>
    a.complexity - b.complexity || a.risk - b.risk || a.timeValue - b.timeValue || a.route.localeCompare(b.route)
  );
};
