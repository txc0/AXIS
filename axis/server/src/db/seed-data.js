// ============================================================================
//  ALL EDITABLE SITE CONTENT LIVES HERE.
//  After editing: restart the server (dev does this automatically) or run `npm run seed`.
//  • "slug" is the permanent ID. Don't change it once live; change the name instead.
//  • To hide something without deleting it, add `active: false`.
//  • List order = display order.
//  • image: a file name in client/public/images ("pr0" means pr0.jpg; "moss.webp" also works).
//  • Prices are whole taka (BDT).
// ============================================================================

export default {
  products: [
    { slug: 'dwarf-haworthia', name: 'Dwarf Haworthia Succulent', price: 18, image: 'pr0', category: 'plants', description: 'A compact rosette succulent. Thrives on bright light and very little water.' },
    { slug: 'maidenhair-fern', name: 'Miniature Maidenhair Fern', price: 28, image: 'pr1', category: 'plants', description: 'Delicate, fan-shaped leaves. Loves humidity and soft light.' },
    { slug: 'cushion-moss', name: 'Emerald Cushion Moss', price: 22, image: 'pr2', category: 'plants', description: 'Dense, velvety moss that carpets the floor of a closed terrarium.' },
    { slug: 'zen-stone-garden', name: 'Zen Stone Garden', price: 135, image: 'pr3', category: 'ready', description: 'Smooth stones and an air plant on a stone base. Calm and low-care.' },
    { slug: 'desert-sunset-jar', name: 'Desert Sunset Jar', price: 95, image: 'pr4', category: 'ready', description: 'Layered terracotta sands with rosette succulents in a lidded glass jar.' },
    { slug: 'cloud-forest', name: 'Cloud Forest Enclosure', price: 180, image: 'pr5', category: 'ready', description: 'A glass cloche over fern, moss and stone on a wooden base.' },
    { slug: 'urban-basin', name: 'Urban Landscape Basin', price: 250, image: 'pr6', category: 'ready', description: 'An open concrete basin planted like a tiny city park.' },
    { slug: 'hanging-globe', name: 'Architectural Hanging Globe', price: 120, image: 'pr7', category: 'ready', description: 'A teardrop glass globe with an air plant, hung from a single cord.' },
    { slug: 'desktop-vessel', name: 'Minimalist Desktop Vessel', price: 85, image: 'pf2', category: 'ready', description: 'A rounded glass bowl of succulents on sand. Small footprint, big presence.' },
    // category "custom" is a pointer to the builder; its price is the "From" price shown in the shop.
    { slug: 'custom-terrarium', name: 'Custom Terrarium', price: 120, image: 'cu', category: 'custom', description: 'Design your own: vessel, landscape, plants and accents, with a live price.' },
  ],

  // Builder options. grp: vessel | land | plant | accent.
  // wet: true = needs moisture (used for the "this plant won't be happy here" warning).
  // Vessel keys jar/dome/cube/globe and plant keys fern/succ/mush/grass have drawings in
  // client/src/components/terrarium.js. New keys still work and get a generic drawing.
  builder_options: [
    { grp: 'vessel', key: 'jar', name: 'Jar', price: 60 },
    { grp: 'vessel', key: 'dome', name: 'Dome', price: 90 },
    { grp: 'vessel', key: 'cube', name: 'Cube', price: 75 },
    { grp: 'vessel', key: 'globe', name: 'Globe', price: 110 },
    { grp: 'land', key: 'forest', name: 'Forest floor', price: 25, wet: true, meta: { colors: ['#3a2a1e', '#2f5a34'] } },
    { grp: 'land', key: 'desert', name: 'Desert', price: 20, wet: false, meta: { colors: ['#c9a574', '#e2c690'] } },
    { grp: 'land', key: 'zen', name: 'Zen', price: 30, wet: false, meta: { colors: ['#d9d6cc', '#efece4'], pattern: 'raked' } },
    { grp: 'land', key: 'moss', name: 'Moss hill', price: 35, wet: true, meta: { colors: ['#2d3a28', '#4f8a43'] } },
    { grp: 'plant', key: 'fern', name: 'Fern', price: 28, wet: true },
    { grp: 'plant', key: 'succ', name: 'Succulent', price: 18, wet: false },
    { grp: 'plant', key: 'mush', name: 'Mushroom', price: 22, wet: true },
    { grp: 'plant', key: 'grass', name: 'Dune grass', price: 15, wet: false },
    { grp: 'accent', key: 'led', name: 'Warm LED', price: 20 },
    { grp: 'accent', key: 'stone', name: 'Stones', price: 10 },
    { grp: 'accent', key: 'wood', name: 'Driftwood', price: 14 },
  ],

  // art: court | tower | pav | roof (drawings in client/src/components/arch-art.js)
  projects: [
    { slug: 'courtyard-house', name: 'Courtyard House', location: 'Uttara, Dhaka', year: '2025', type: 'Private residence', area: '2,400 sq ft', status: 'Completed', art: 'court', bg: '#dcdfd7',
      summary: 'A single-storey family home wrapped around a planted courtyard that pulls cool air through every room.',
      body: [
        'The family wanted a house that stayed cool without running air conditioning all day. We arranged every room around an open courtyard, so each one has windows on two sides and a breeze path through the middle.',
        'The flat roof carries a planted layer of grasses and sedums. It shades the slab from the afternoon sun and slows rainwater during the monsoon.',
        'In the courtyard, a single mango tree gives shade, privacy and fruit.',
      ] },
    { slug: 'monsoon-tower', name: 'Monsoon Tower', location: 'Gulshan, Dhaka', year: '2026', type: 'Mixed use', area: '38,000 sq ft', status: 'In design', art: 'tower', bg: '#dadde0',
      summary: 'Shops, offices and homes stacked on a narrow plot, each floor shaded by a deep planted balcony.',
      body: [
        'Monsoon Tower stacks shops, offices and homes on a narrow Gulshan plot. Each floor has a deep planted balcony that shades the glass below it.',
        'Rainwater collected on the roof feeds the balcony planters by gravity, so the building waters its own gardens for most of the year.',
      ] },
    { slug: 'river-pavilion', name: 'River Pavilion', location: 'Narayanganj', year: '2024', type: 'Community pavilion', area: '1,100 sq ft', status: 'Completed', art: 'pav', bg: '#e6e1d8',
      summary: 'A covered meeting place on the riverbank, lifted on slim columns so breezes off the water pass straight through.',
      body: [
        'A shaded gathering space for a riverside community. The roof sits on slim columns and the sides stay open, so it never feels enclosed.',
        'The planted roof keeps the space beneath cool even at midday, and the low edge of greenery softens the view from the water.',
      ] },
    { slug: 'rooftop-retreat', name: 'Rooftop Retreat', location: 'Dhanmondi, Dhaka', year: '2025', type: 'Roof garden retrofit', area: '1,800 sq ft', status: 'Completed', art: 'roof', bg: '#e3e1db',
      summary: 'An unused concrete roof turned into a garden for a family of five.',
      body: [
        'Lightweight planters keep the new garden within the load limits of the original building, confirmed by a structural engineer before any soil went up.',
        'A timber pergola carries climbing jasmine, giving shade in summer and a fragrant place to sit in the evening.',
      ] },
  ],

  // body: one string per paragraph. Start a string with "## " to make it a heading.
  // featured: true puts the article in the big slot at the top of /journal.
  articles: [
    { slug: 'first-closed-terrarium', featured: true, title: 'How to build your first closed terrarium', category: 'Guide', published_at: '2026-10-22', minutes: 6, image: 'pr5',
      excerpt: 'Five layers, one jar and a little patience. The build we teach every Saturday, step by step.',
      body: [
        'A closed terrarium is a tiny water cycle. Plants breathe out moisture, it beads on the glass, and it falls back into the soil. Get the layers right and it can look after itself for months.',
        '## 1. Choose the vessel',
        'Any clear glass container with a lid will work. A wide opening makes planting easier; a narrow neck holds humidity better. Wash it with plain water, never soap.',
        '## 2. Build the layers',
        'Start with two to three centimetres of small stones for drainage, then a thin layer of activated charcoal to keep water fresh. Add a moss barrier so soil does not wash down, then five to eight centimetres of a light, airy mix.',
        '## 3. Plant and place',
        'Use small, humidity-loving plants such as ferns, fittonia and cushion moss. Press them in gently, add stones or wood, mist lightly and close the lid. Keep it in bright, indirect light, never direct sun.',
        '## 4. The first two weeks',
        'Some fog is normal. If the glass stays fully misted all day, open the lid for an hour. If it never fogs at all, add a few spoons of water. After that, most jars need water only every few months.',
      ] },
    { slug: 'moss-and-monsoon', title: 'Why moss loves the monsoon', category: 'Plants', published_at: '2026-10-15', minutes: 4, image: 'pf0',
      excerpt: 'Moss drinks through its leaves, which makes a humid Dhaka monsoon perfect weather for it.',
      body: [
        'Moss has no roots in the way most plants do. It takes in water through its leaves, which is why the rainy season suits it so well.',
        '## Mist, do not pour',
        'Rather than pouring water on moss, mist it. In a closed jar, the moisture you add circulates for weeks.',
        '## Light without heat',
        'Moss enjoys a north-facing window. Direct sun through glass will bake it within days.',
        'In the dry winter months, check your jars more often. A light mist once a week keeps the cushions green.',
      ] },
    { slug: 'desert-bowls', title: 'Desert bowls: low-care landscapes in glass', category: 'Plants', published_at: '2026-10-08', minutes: 5, image: 'pf2',
      excerpt: 'Not every small world needs fog. Open bowls with succulents and sand are the easiest to live with.',
      body: [
        'Open bowls are perfect for sunny desks and busy people. They need light and very little water.',
        '## Drainage is everything',
        'Succulents rot when their roots sit in water. Use a gritty mix, a layer of coarse sand, and water only when the soil is completely dry.',
        '## Bright light, good airflow',
        'Place open bowls on a sunny sill. Turn them every week so the plants grow evenly instead of leaning toward the light.',
      ] },
    { slug: 'green-roofs-dhaka', title: 'Green roofs that survive a Dhaka summer', category: 'Architecture', published_at: '2026-10-01', minutes: 7, image: 'hero',
      excerpt: 'A planted roof can cool the room beneath it by several degrees. Here is how we build them to last.',
      body: [
        'In a city as hot and dense as Dhaka, a planted roof makes a difference you feel every afternoon.',
        '## Start with the structure',
        'Soil holds water and water is heavy. Before planting, an engineer should confirm the slab can carry the load when the roof is fully soaked.',
        '## Layers, again',
        'A green roof is a terrarium at the size of a house: waterproofing, a root barrier, drainage, filter fabric, a light growing medium and plants chosen for sun and rain.',
        '## Plants that last',
        'We favour hardy grasses, sedums and local ground covers that survive monsoon downpours and dry spells with little care.',
      ] },
    { slug: 'saturday-workshops', title: 'Inside our Saturday workshops', category: 'Studio', published_at: '2026-09-24', minutes: 3, image: 'pg1',
      excerpt: 'Three hours, eight people and a table full of glass, stones and moss.',
      body: [
        'Every Saturday the big table in our studio fills up. In three hours, people who have never planted anything leave with a closed world of their own.',
        'We keep groups small, eight people at most, so everyone gets time with our growers. Tea and all materials are included.',
        '## Who comes',
        'Students, couples, grandparents with grandchildren and, more and more, teams from offices looking for something calm to do together.',
      ] },
    { slug: 'zen-garden-care', title: 'Caring for a zen stone garden', category: 'Guide', published_at: '2026-09-17', minutes: 3, image: 'pr3',
      excerpt: 'Mostly stillness, with one air plant for life. It needs very little, but that little matters.',
      body: [
        'A stone garden asks for almost nothing, which is exactly why small mistakes show.',
        '## Air plants drink differently',
        'Soak the air plant in room-temperature water for twenty minutes every one to two weeks, then let it dry upside down before returning it to the stones.',
        '## Keep the stones clean',
        'Dust dulls the stones over time. Wipe them with a damp cloth once a month.',
      ] },
  ],

  // Past events disappear from the site automatically 3 hours after they start.
  // Always include the +06:00 time zone.
  events: [
    { slug: '2026-11-14-first-terrarium', starts_at: '2026-11-14T10:00:00+06:00', title: 'Your first closed terrarium', details: 'Saturday workshop · 10:00 to 13:00 · materials included', seats: 8 },
    { slug: '2026-11-21-moss-walls', starts_at: '2026-11-21T10:00:00+06:00', title: 'Moss walls and kokedama', details: 'Saturday workshop · 10:00 to 13:00 · materials included', seats: 6 },
    { slug: '2026-11-26-green-roofs-talk', starts_at: '2026-11-26T17:00:00+06:00', title: 'Green roofs for homeowners', details: 'Free talk with the architecture team · 17:00', seats: 40 },
    { slug: '2026-11-28-kids-build-day', starts_at: '2026-11-28T10:00:00+06:00', title: 'Kids build day', details: 'Ages 7 to 12 with a parent · 10:00 to 12:00', seats: 10 },
  ],

  team: [
    { slug: 'farhana-islam', name: 'Farhana Islam', role: 'Founder and lead architect', initials: 'FI', color: '#5e6b55' },
    { slug: 'rakib-hasan', name: 'Rakib Hasan', role: 'Head grower', initials: 'RH', color: '#7a6650' },
    { slug: 'nadia-chowdhury', name: 'Nadia Chowdhury', role: 'Terrarium designer', initials: 'NC', color: '#4e5a63' },
    { slug: 'imran-kabir', name: 'Imran Kabir', role: 'Community and workshops', initials: 'IK', color: '#6b6358' },
  ],

  // likes here is only the starting number. Real likes are counted in the database and kept.
  builds: [
    { slug: 'monsoon-jar', image: 'pr4', author: 'Nusrat R.', title: 'Monsoon jar', likes: 48 },
    { slug: 'cloud-valley', image: 'pr5', author: 'Arif H.', title: 'Cloud valley', likes: 61 },
    { slug: 'hanging-fog', image: 'pr7', author: 'Sadia K.', title: 'Hanging fog', likes: 37 },
    { slug: 'quiet-garden', image: 'pr3', author: 'Tanvir A.', title: 'Quiet garden', likes: 29 },
    { slug: 'concrete-park', image: 'pr6', author: 'Mehedi S.', title: 'Concrete park', likes: 44 },
    { slug: 'dune-bowl', image: 'pf2', author: 'Lamia T.', title: 'Dune bowl', likes: 33 },
  ],

  threads: [
    { slug: 'condensation-will-not-clear', initials: 'NR', title: 'Condensation will not clear after two weeks', category: 'Plant clinic', replies: 14, posted_at: '2026-11-10T14:00:00+06:00' },
    { slug: 'dhanmondi-roof-retrofit', initials: 'TA', title: 'Green roof retrofit for a Dhanmondi rooftop', category: 'Green architecture', replies: 27, posted_at: '2026-11-10T11:00:00+06:00' },
    { slug: 'fittonia-month-six', initials: 'SK', title: 'Month six of my fittonia journal', category: 'Growth journals', replies: 9, posted_at: '2026-11-09T16:00:00+06:00' },
    { slug: 'local-stones-zen-bowl', initials: 'MH', title: 'Best local stones for a zen bowl?', category: 'Materials', replies: 18, posted_at: '2026-11-08T12:00:00+06:00' },
  ],
};