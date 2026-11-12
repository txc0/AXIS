// ============================================================================
//  Fixed site copy: studio details, services, FAQ, values.
//  Edit freely; changes appear after a rebuild/redeploy.
//  Catalog, articles, events, projects and team live in server/src/db/seed-data.js.
// ============================================================================

export const STUDIO = {
  address: ['House 12, Road 7, Dhanmondi', 'Dhaka 1209, Bangladesh'],
  mapsQuery: 'House 12, Road 7, Dhanmondi, Dhaka 1209, Bangladesh',
  hours: ['Saturday to Thursday, 10:00 to 19:00', 'Closed on Fridays'],
  email: 'theaxis.info@gmail.com',
  phone: '01988285098',
};

// Home page "Discover our worlds" tiles: [label, shop category, image]
export const DISCOVER = [
  ['Glass domes', 'ready', 'pr5'], ['Jars', 'ready', 'pr4'], ['Hanging globes', 'ready', 'pr7'],
  ['Living basins', 'ready', 'pr6'], ['Zen gardens', 'ready', 'pr3'], ['Plants for terrariums', 'plants', 'pr1'],
];

export const SERVICES = [
  ['House plans', 'Designs for homes on Bangladeshi plots, adapted to your site, budget and family.'],
  ['Green roofs', 'Planted roofs for new buildings and retrofits, engineered for monsoon rain and summer heat.'],
  ['Living walls', 'Vertical gardens for homes, offices and shops, with simple watering systems.'],
  ['Interiors', 'Calm, planted interiors that bring the garden indoors.'],
];

export const STEPS = [
  ['Consultation', 'A free first meeting at the studio or on your site.'],
  ['Concept', 'Sketches, a planting plan and a clear budget.'],
  ['Design', 'Drawings, approvals and engineering.'],
  ['Build', 'We work with trusted builders and visit the site throughout.'],
];

export const ABOUT = {
  intro: 'AXIS began on a balcony with three jars and a borrowed bag of moss. Today we are a studio of growers, designers and architects who believe every space, from a desk to a rooftop, can hold something alive.',
  stats: [['2021', 'founded'], ['3,200+', 'terrariums planted'], ['14', 'buildings designed'], ['1,200+', 'community members']],
  values: [
    ['Alive, not decorative', 'Every piece is a working ecosystem, planted and watched for two weeks before it leaves the studio.'],
    ['Local first', 'We grow our own moss and ferns and source glass, wood and stone from Bangladeshi makers.'],
    ['Built for this climate', 'From jars to rooftops, our designs are made for monsoon rain, heat and humidity.'],
  ],
};

export const COMMUNITY = {
  memberBase: 1240, // members from before the website; added to the live count
  buildsShared: '386',
  districts: '12',
  challenge: {
    title: 'A monsoon forest in a jar',
    text: 'Build a closed world that captures the rainy season and share it in the Greenhouse. Members vote, and the winning build goes on the studio shelf.',
    image: 'pr4',
  },
};

export const CONTACT_TOPICS = ['General question', 'Architecture project', 'Corporate gifting', 'Press'];

export const CARE = {
  tips: [
    ['Light', 'Bright, indirect light. Keep closed jars out of direct sun.'],
    ['Water', 'Closed jars: every few months. Open bowls: only when the soil is dry.'],
    ['Air', 'Open a fogged jar for an hour. Keep open bowls where air moves.'],
  ],
  faq: [
    ['Closed terrariums', [
      ['How often should I water?', 'Rarely. A healthy closed jar recycles its own water. Add a few spoons only if the glass has not fogged for a week.'],
      ['How much light does it need?', 'Bright, indirect light, a metre or two from a window. Direct sun through glass overheats the plants.'],
      ['Should I ever open the lid?', 'Open it for an hour if the glass stays fully fogged all day, or if you see mould.'],
    ]],
    ['Open bowls and succulents', [
      ['When do I water?', 'Only when the soil is completely dry, usually every 10 to 14 days. Water the soil, not the leaves.'],
      ['Where should it live?', 'Your sunniest spot. Turn it weekly so the plants grow straight.'],
    ]],
    ['Troubleshooting', [
      ['White fuzz on the soil', 'That is mould. Remove it with a cotton bud and open the lid for a day. If it returns, ask the plant clinic about springtails.'],
      ['Yellow or mushy leaves', 'Usually too much water. Remove the affected leaves and let the jar breathe.'],
      ['Plants growing tall and pale', 'They need more light. Move the jar closer to a window.'],
    ]],
  ],
};