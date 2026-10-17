// ---------------------------------------------------------------------------
// Site content managed from the admin (announcement bars, homepage section
// order/visibility, campaign banners and drops). Marketing can change the
// storefront without touching code.
// ---------------------------------------------------------------------------

export const DEFAULT_SITE = {
  // Admin-uploaded garment photographs, keyed by garment type id.
  // { 'premium-tee': { front, back, left, right }, 'chino': {...} }
  garmentImages: {},
  announcements: [
    { id: 'ann-1', text: 'ABUJA DELIVERY • CUSTOM 3D DESIGNS • PAYSTACK + PAY ON DELIVERY', tone: 'dark', active: true },
    { id: 'ann-2', text: 'FREE DELIVERY ON ORDERS ABOVE ₦100,000', tone: 'success', active: true },
    { id: 'ann-3', text: 'NEW DROP AVAILABLE — SHOP NOW →', tone: 'info', active: true },
  ],
  homepageSections: [
    { id: 'hero', label: '01 Hero campaign', active: true },
    { id: 'drop', label: '02 The latest drop', active: true },
    { id: 'showcase', label: '03 3D customizer showcase', active: true },
    { id: 'occasion', label: '04 Shop by occasion', active: true },
    { id: 'templates', label: '05 Ready-made templates', active: true },
    { id: 'black-edit', label: '06 Editorial — The Black Edit', active: true },
    { id: 'cream-edit', label: '07 The Cream Edit', active: true },
    { id: 'how', label: '08 How it works', active: true },
    { id: 'worn', label: '09 Worn by you', active: true },
    { id: 'cta', label: '10 Final CTA', active: true },
  ],
  drops: [
    { id: 'drop-03', number: 'DROP 03', name: 'AFTER DARK', status: 'live', endsAt: Date.now() + 1000 * 60 * 60 * 38, blurb: 'Night-weight graphics on jet black. Limited run of 50.' },
    { id: 'drop-04', number: 'DROP 04', name: 'CREAM SEASON', status: 'scheduled', startsAt: Date.now() + 1000 * 60 * 60 * 12, blurb: 'Minimal cream essentials. Landing soon.' },
  ],
  collections: [
    { id: 'black-edit', name: 'THE BLACK EDIT', color: 'black', blurb: 'Jet black essentials, never basic.' },
    { id: 'cream-edit', name: 'THE CREAM EDIT', color: 'cream', blurb: 'Clean. Minimal. Yours.' },
    { id: 'street', name: 'STREET COLLECTION', color: 'orange', blurb: 'Abuja street energy, printed sharp.' },
    { id: 'grad-2026', name: 'GRADUATION 2026', color: 'navy', blurb: 'Class of 2026 — group rates available.' },
    { id: 'couples', name: 'COUPLES', color: 'white', blurb: 'Matching sets for two.' },
    { id: 'corporate', name: 'CORPORATE', color: 'grey', blurb: 'Team kits that look boardroom-ready.' },
  ],
  journal: [
    { id: 'j1', title: '5 Ways to Style a Black T-Shirt', tag: 'Style', read: '4 min' },
    { id: 'j2', title: 'How to Design a Great Custom T-Shirt', tag: 'Guide', read: '6 min' },
    { id: 'j3', title: 'Graduation T-Shirt Ideas for 2026', tag: 'Ideas', read: '5 min' },
  ],
}

export const OCCASIONS = [
  { id: 'birthday', label: 'BIRTHDAY' },
  { id: 'couples', label: 'COUPLES' },
  { id: 'graduation', label: 'GRADUATION' },
  { id: 'church', label: 'CHURCH' },
  { id: 'events', label: 'EVENTS' },
  { id: 'memes', label: 'FUNNY / MEMES' },
  { id: 'family', label: 'FAMILY' },
  { id: 'corporate', label: 'CORPORATE' },
]

export const LOOKS = [
  { id: 'look-1', title: 'AFTER DARK', caption: 'LOOK 01 — Jet Black / Custom Graphic', span: 7, color: 'black', design: { text: 'AFTER\nDARK', color: '#2563eb', font: 'display' }, hotspot: { top: '38%', left: '46%' } },
  { id: 'look-2', title: 'SOFT LIFE', caption: 'LOOK 02 — Cream / Serif Mark', span: 5, color: 'cream', design: { text: 'SOFT\nLIFE', color: '#090909', font: 'serif' }, hotspot: { top: '44%', left: '52%' } },
  { id: 'look-3', title: 'GRACE TRIBE', caption: 'LOOK 03 — Orange / Church Unit', span: 5, color: 'orange', design: { text: 'GRACE\nTRIBE', color: '#f3ebdd', font: 'display' }, hotspot: { top: '40%', left: '50%' } },
  { id: 'look-4', title: 'ZURI LABS', caption: 'LOOK 04 — Navy / Brand Kit', span: 7, color: 'navy', design: { text: 'ZURI\nLABS', color: '#f0c65d', font: 'mono' }, hotspot: { top: '36%', left: '48%' } },
]

export const DESIGN_TEMPLATES = [
  { id: 'tpl-great-wave', title: 'Great Wave', occasion: 'events', color: 'black', graphic: 'wave' },
  { id: 'tpl-tiger-crest', title: 'Tiger Crest', occasion: 'events', color: 'orange', graphic: 'tiger' },
  { id: 'tpl-eagle-head', title: 'Eagle Head', occasion: 'graduation', color: 'navy', graphic: 'eagle' },
  { id: 'tpl-oni-mask', title: 'Oni Mask', occasion: 'birthday', color: 'black', graphic: 'oni' },
  { id: 'tpl-sacred-sake', title: 'Serpent', occasion: 'birthday', color: 'olive', graphic: 'snake' },
  { id: 'tpl-sakura', title: 'Sakura Bloom', occasion: 'couples', color: 'cream', graphic: 'sakura' },
  { id: 'tpl-koi-fish', title: 'Koi Fortune', occasion: 'couples', color: 'white', graphic: 'koi' },
  { id: 'tpl-summit', title: 'Summit', occasion: 'corporate', color: 'charcoal', graphic: 'mountain' },
  { id: 'tpl-rising-sun', title: 'Rising Sun', occasion: 'church', color: 'black', graphic: 'sun' },
  { id: 'tpl-compass', title: 'True North', occasion: 'corporate', color: 'navy', graphic: 'compass' },
  { id: 'tpl-thunder', title: 'Thunder Dept.', occasion: 'graduation', color: 'black', graphic: 'bolt' },
  { id: 'tpl-bloom', title: 'Full Bloom', occasion: 'memes', color: 'cream', graphic: 'bloom' },
  { id: 'tpl-birthday-king', title: 'Birthday King', occasion: 'birthday', color: 'black', textColor: '#f59e0b', text: 'BIRTHDAY\nKING', font: 'display' },
  { id: 'tpl-class-2026', title: 'Class of 2026', occasion: 'graduation', color: 'navy', textColor: '#f59e0b', text: 'CLASS\n2026', font: 'serif' },
  { id: 'tpl-soft-life', title: 'Soft Life', occasion: 'memes', color: 'black', textColor: '#f59e0b', text: 'SOFT\nLIFE', font: 'serif' },
  { id: 'tpl-zuri-labs', title: 'Zuri Labs Kit', occasion: 'corporate', color: 'grey', textColor: '#090909', text: 'ZURI\nLABS', font: 'mono' },
]

export const CUSTOMER_STYLES = [
  { id: 'cs-1', name: 'Chiamaka O.', role: 'Event planner, Abuja', color: 'black', design: { graphic: 'wave' }, quote: 'The 3D preview sold my clients instantly. Ordered 40 shirts on Tuesday, delivered Thursday — flawless print.' },
  { id: 'cs-2', name: 'Tunde A.', role: 'Founder, Zuri Labs', color: 'navy', design: { graphic: 'eagle' }, quote: 'We run our whole merch operation here now. The admin dashboard makes coupon campaigns effortless.' },
  { id: 'cs-3', name: 'Blessing E.', role: 'Youth pastor', color: 'orange', design: { graphic: 'tiger' }, quote: 'WELCOME10 made our first order painless. The shirts came out better than the mockups.' },
]
