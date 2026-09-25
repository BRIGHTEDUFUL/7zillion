import type { Insight, Package, Product, Solution, SpecEntry } from "@/types/content";
export type {
  Company,
  EventType,
  ActivityLogEntry,
  Insight,
  Package,
  Product,
  Project,
  Service,
  Solution,
  SpecEntry,
} from "@/types/content";

import aboutImage from "@/assets/brand/about.jpg";
import blowingImage from "@/assets/brand/product-blowing.jpg";
import conveyorImage from "@/assets/brand/product-conveyor.jpg";
import fillingImage from "@/assets/brand/product-filling.jpg";
import labelingImage from "@/assets/brand/product-labeling.jpg";
import packagingImage from "@/assets/brand/product-packaging.jpg";
import processingImage from "@/assets/brand/product-processing.jpg";
import treatmentImage from "@/assets/brand/product-treatment.jpg";
import cansLineImage from "@/assets/brand/line-cans.jpg";
import csdLineImage from "@/assets/brand/line-csd.jpg";
import juiceLineImage from "@/assets/brand/line-juice.jpg";
import waterLineImage from "@/assets/brand/line-water.jpg";
import projectFiveLImage from "@/assets/brand/project-5l.jpg";
import projectFilterImage from "@/assets/brand/project-filter.jpg";
import projectWaterImage from "@/assets/brand/project-water.jpg";

/**
 * House terminology — applied to every string in this file.
 *
 *   "A–Z"     installation and setup scope: design, civil works, electrical,
 *             assembly, commissioning, training. Scope language, never a
 *             heading flourish.
 *   "Turnkey" a complete package that is ready to produce. It appears in a
 *             package's given name — never as a suffix on a heading, never in
 *             the home hero eyebrow (that line carries the real throughput
 *             range), and never within the same section as "A–Z".
 *
 * Neither term is used as filler: if a phrase reads the same without it,
 * drop it.
 */

export const company = {
  name: "Seven Zillions",
  tagline: "Cooperation and Interdependence",
  slogan: "We Are The Production Line Builders",
  site: "www.sevenzillions.com",
  email: "info@sevenzillions.com",
  address: "Esereso Divine Junction, Kaka Yan Opoku Street, Kumasi",
  city: "Kumasi, Ghana",
  phones: ["+233 554 602 103", "+233 500 065 757", "+233 505 466 150"],
  whatsapp: "+233 20 509 9553",
  whatsappHref: "https://wa.me/233205099553",
  promise: "On-Time Delivery",
  founded: "20+ years of packaging engineering",
} as const;

export const navLinks = [
  { label: "Products", to: "/products" },
  { label: "Solutions", to: "/solutions" },
  { label: "Projects", to: "/projects" },
  { label: "Services", to: "/services" },
  { label: "About us", to: "/about" },
  { label: "Blog", to: "/blog" },
  { label: "Contact us", to: "/contact" },
] as const;

/**
 * Static route paths. Detail pages are always addressed as `to + params` so
 * TanStack Router's generated path types stay satisfied.
 */
export type StaticPath =
  | "/"
  | "/products"
  | "/solutions"
  | "/projects"
  | "/services"
  | "/about"
  | "/blog"
  | "/contact"
  | "/admin";

export type FooterLink =
  | { label: string; to: StaticPath; params?: undefined }
  | { label: string; to: "/products/$slug"; params: { slug: string } }
  | { label: string; to: "/solutions/$slug"; params: { slug: string } };

export type FooterColumn = { title: string; links: FooterLink[] };

export const footerColumns: FooterColumn[] = [
  {
    title: "Equipment",
    links: [
      { label: "Filling machines", to: "/products/$slug", params: { slug: "filling-machines" } },
      { label: "Water treatment", to: "/products/$slug", params: { slug: "water-treatment" } },
      { label: "Blow molding", to: "/products/$slug", params: { slug: "blow-molding" } },
      {
        label: "Packaging machines",
        to: "/products/$slug",
        params: { slug: "packaging-machines" },
      },
      { label: "View all products", to: "/products" },
    ],
  },
  {
    title: "Solutions",
    links: [
      {
        label: "Water filling line",
        to: "/solutions/$slug",
        params: { slug: "water-filling-line" },
      },
      {
        label: "Juice filling line",
        to: "/solutions/$slug",
        params: { slug: "juice-filling-line" },
      },
      { label: "CSD filling line", to: "/solutions/$slug", params: { slug: "csd-filling-line" } },
      { label: "Cans filling line", to: "/solutions/$slug", params: { slug: "cans-filling-line" } },
      { label: "View all solutions", to: "/solutions" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", to: "/about" },
      { label: "Projects", to: "/projects" },
      { label: "Services", to: "/services" },
      { label: "Knowledge center", to: "/blog" },
      { label: "Contact us", to: "/contact" },
      { label: "Admin", to: "/admin" },
    ],
  },
];

/** @deprecated Use SpecEntry from @/types/content instead */
export type Spec = SpecEntry;

export const products: Product[] = [
  {
    slug: "filling-machines",
    name: "Filling machines",
    category: "Filling & closing",
    image: fillingImage,
    summary: "Rinser, filler and capper mono-blocks for water, juice, carbonated drinks and cans.",
    detail:
      "The filling station is where line quality is either built or lost. Fill level, closure integrity and saleable output all start here — not at the packaging end. Seven Zillions supplies rinsing, filling and capping units as a single mono-block so that three critical operations happen in one controlled environment, with no exposed bottle between rinse and cap.",
    detail2:
      "The cap steriliser and cap elevator are included as standard, not optional extras, because hygiene failures at the cap stage produce defective product that only shows up after distribution. Line speeds range from 2,000 to 36,000 containers per hour and the mono-block is configured for the specific product — still water, juice, carbonated soft drink or canned beverage — before it leaves the factory.",
    highlights: [
      "Tribloc rinser–filler–capper mono-block — three operations, one clean environment",
      "Cap online steriliser and automatic cap elevator included as standard",
      "Filling technologies for PET, glass and cans",
      "Line speeds from 2,000 to 36,000 containers per hour",
      "Product-specific configuration confirmed before factory acceptance",
    ],
    specs: [
      { label: "Output range", value: "2,000 – 36,000 containers/h" },
      { label: "Containers", value: "PET · Glass · Cans" },
      { label: "Products", value: "Water · Juice · CSD · Cans" },
      { label: "Operation", value: "Continuous, 24 h capable" },
    ],
    whatsappMessage:
      "Hello Seven Zillions, I am interested in your Filling Machines (rinser–filler–capper mono-block). Please send me pricing and technical details.",
  },
  {
    slug: "water-treatment",
    name: "Water treatment systems",
    category: "Process",
    image: treatmentImage,
    summary:
      "Pretreatment, reverse osmosis and terminal treatment feeding purified water to the filling line.",
    detail:
      "Water quality determines product quality — and a water treatment plant sized to the wrong capacity or specified from the wrong raw-water analysis will produce unstable output regardless of how good the filling equipment is. Seven Zillions designs and supplies treatment systems around a recent raw-water analysis and the hourly demand of the production line, not off a standard catalogue.",
    detail2:
      "The standard configuration for a bottled-water line is a 10 T/H reverse-osmosis plant. Pretreatment handles feed-water preparation — multi-media filtration, activated carbon, softener, iron and manganese removal. The RO stage reduces dissolved salts to the required treated-water standard. Terminal treatment with ozone and UV finishes the process before water is stored and supplied to the filling line. After-sales support on the treatment plant runs for 24 months.",
    highlights: [
      "Designed around a raw-water analysis — not a catalogue specification",
      "Pretreatment: multi-media, carbon, softener, iron and manganese removal",
      "Deep treatment: membrane separation and ion exchange",
      "Terminal treatment: ozone and UV before filling",
      "24-month after-sales support on the treatment plant",
    ],
    specs: [
      { label: "Treatment capacity", value: "10 T/H — 10,000 litres/h" },
      { label: "Process", value: "Pretreatment · Reverse osmosis · Terminal" },
      { label: "Integration", value: "Storage and supply to the filling line" },
      { label: "Basis of design", value: "Raw-water analysis and hourly demand" },
    ],
    whatsappMessage:
      "Hello Seven Zillions, I would like to enquire about your Water Treatment Systems. Please send me more information on capacity, pricing, and the design process.",
  },
  {
    slug: "processing-systems",
    name: "Beverage processing systems",
    category: "Process",
    image: processingImage,
    summary: "Blending, mixing and carbonation skids sized around your formulation and output.",
    detail:
      "Processing is where formulation risk lives. The equipment that precedes the filler — mixing, blending, carbonation — must be configured for the actual beverage, because juice and carbonated soft drinks need different processing conditions even when they share downstream equipment. Specifying the processing stage generically is how lines end up producing product that fails quality checks at the filler.",
    detail2:
      "Seven Zillions reviews the beverage list and formulation-sensitive properties before selecting processing equipment. Where products allow it, shared downstream configuration reduces capital cost — but the filling technology and product circuit are always reviewed independently per product. CIP-ready circuits are standard. Output is sized to the required saleable volume, not the nameplate speed of the blending skid.",
    highlights: [
      "Beverage list and formulation properties reviewed before equipment selection",
      "Formulation-sensitive process design — juice and CSD treated separately",
      "Mixing, blending and carbonation stages configured per product",
      "CIP-ready circuits as standard across all processing equipment",
      "Output sized to saleable volume, not nameplate speed",
    ],
    specs: [
      { label: "Scope", value: "Mixing · Blending · Carbonation" },
      { label: "Design input", value: "Beverage list and processing method" },
      { label: "Hygiene", value: "CIP-ready circuits" },
      { label: "Output", value: "Sized to saleable output, not nameplate speed" },
    ],
    whatsappMessage:
      "Hello Seven Zillions, I am interested in Beverage Processing Systems (mixing, blending, carbonation). Please contact me with more details.",
  },
  {
    slug: "blow-molding",
    name: "Blow molding machines",
    category: "Bottle manufacturing",
    image: blowingImage,
    summary: "Six-cavity blowing for 500, 750 and 850 ml PET preforms at 6,000–70,000 pcs/h.",
    detail:
      "Blowing turns PET preforms into finished bottles at the front of the line, and the quality of that process — uniform wall thickness, consistent geometry — directly affects fill accuracy and closure integrity downstream. The six-cavity system handles 500 ml, 750 ml and 850 ml preforms, with a preform heater that ensures uniform heating before each blow cycle.",
    detail2:
      "HP air compressors are sized for the blowing process and supplied as part of the package, because under-specified compressors are the most common cause of inconsistent bottle quality in blowing operations. An air conveyor connects the blowing output to the buffer stage, and buffer conveyors of up to 150 m decouple blowing from filling so a brief stoppage at one station does not halt the whole line. The turnkey blowing package includes factory layout, installation, electrical works and operator training.",
    highlights: [
      "Six-cavity single-unit system — high output from a compact footprint",
      "Preform heater ensures uniform heating and consistent wall thickness",
      "HP air compressors sized and supplied for the blowing process",
      "Air conveyor and up to 150 m of buffer conveyor included",
      "Turnkey package: layout, installation, training and 50,000 starter preforms",
    ],
    specs: [
      { label: "Cavities", value: "6" },
      { label: "Output", value: "6,000 – 70,000 pcs/h by mould" },
      { label: "Bottle sizes", value: "500 ml · 750 ml · 850 ml PET" },
      { label: "Application", value: "Drinking water and beverages" },
    ],
    whatsappMessage:
      "Hello Seven Zillions, I would like more information on your Blow Molding Machines (6-cavity PET bottle blowing). Please share pricing and specifications.",
  },
  {
    slug: "labeling-machines",
    name: "Labeling machines",
    category: "Identification",
    image: labelingImage,
    summary: "Automatic stick and OPP labeling with laser date and batch coding.",
    detail:
      "Labelling and coding are the last operations that determine whether a filled, closed bottle is legally saleable. Regulatory and brand information must be applied accurately and verified in the same pass — not checked at a separate inspection station that creates a bottleneck. Seven Zillions supplies automatic stick labeling and OPP labeling machines together with a laser printer for date coding and batch numbering.",
    detail2:
      "Change parts for the approved container range are confirmed at the time of order so that format changes on the line do not require sourcing parts after installation. Label presence and position are checked in-line. The laser coder eliminates consumable ink costs and produces permanent, tamper-evident coding that meets export market requirements. Both labeling formats — stick and OPP wrap-around — are available as a combined system or separately depending on the packaging range.",
    highlights: [
      "Automatic stick labeling for high-precision, repeatable placement",
      "OPP labeling for wrap-around formats on PET and glass",
      "Laser date coding and batch numbering — no ink consumables",
      "In-line label presence and position verification",
      "Change parts for the approved container range confirmed at order",
    ],
    specs: [
      { label: "Label types", value: "Stick · OPP · Wrap-around" },
      { label: "Coding", value: "Laser date and batch printing" },
      { label: "Format change", value: "Agreed change parts and transfers" },
      { label: "Inspection", value: "Label presence and position checks" },
    ],
    whatsappMessage:
      "Hello Seven Zillions, I am enquiring about your Labeling Machines (stick and OPP labeling with laser coding). Please send technical and pricing information.",
  },
  {
    slug: "packaging-machines",
    name: "Packaging machines",
    category: "Secondary packaging",
    image: packagingImage,
    summary: "PE film shrink wrapping, pack formation and automatic palletising.",
    detail:
      "Secondary packaging is what determines how product reaches the distributor and what the retailer receives. A correctly filled, closed and labelled bottle that arrives at the depot in a broken or poorly formed pack is unsaleable. Seven Zillions closes every production line with automatic PE film wrapping into shrink packs and automatic palletising in the agreed distribution format.",
    detail2:
      "Pack format — bottles per pack, pack geometry, film weight — is agreed against the actual distribution and retail requirements before the equipment is ordered. Coding is carried through from the bottle to the pack level so traceability is maintained across the complete unit of distribution. Palletising formats are confirmed for the destination market's pallet dimensions and stacking limits. The packaging stage is accepted as part of the complete line acceptance test, not separately.",
    highlights: [
      "Automatic PE film wrapping into shrink packs — format agreed at order",
      "Pack coding carrying traceability from bottle to distribution unit",
      "Automatic palletising confirmed for destination pallet dimensions",
      "Accepted as part of the complete line test — not separately",
      "Integration with upstream labeling and coding verified in acceptance",
    ],
    specs: [
      { label: "Pack format", value: "PE film shrink wrap" },
      { label: "End of line", value: "Automatic palletising" },
      { label: "Coding", value: "Carried through to pack level" },
      { label: "Acceptance", value: "Correctly filled, closed, labeled and packed" },
    ],
    whatsappMessage:
      "Hello Seven Zillions, I am interested in your Packaging Machines (PE film shrink wrap and palletising). Please contact me with more details.",
  },
  {
    slug: "conveyors",
    name: "Packs & bottle conveyors",
    category: "Handling",
    image: conveyorImage,
    summary: "Air conveyors and buffer conveyors linking blowing, filling and packaging.",
    detail:
      "Conveying is what keeps a production line continuous. Without adequate buffer capacity between blowing and filling, a 30-second stoppage at the blower halts the entire line. Seven Zillions plans the conveying layout as part of the complete line engineering — not as an afterthought — because the buffer lengths and air conveyor routing determine whether the floor plan is viable before a single machine is positioned.",
    detail2:
      "Air conveyors move preforms and empty bottles from the blower to the filling stage without contact that could contaminate or deform the bottle neck. Buffer conveyors provide up to 150 m of holding capacity between blowing and filling, sized to the speed differential and the acceptable stoppage time for the specific line. Pack conveyors at the end of the line feed the shrink wrapper and palletiser. Engineering drawings for the complete conveyor layout are supplied as part of the project documentation.",
    highlights: [
      "Conveying layout planned as part of the complete line engineering",
      "Air conveyor for preforms and empty bottles — non-contact neck handling",
      "Buffer conveyors up to 150 m between blowing and filling",
      "Pack conveyors feeding shrink wrapper and palletiser",
      "Engineering drawings for the full layout supplied with the project",
    ],
    specs: [
      { label: "Buffer capacity", value: "Up to 150 m of conveyor" },
      { label: "Types", value: "Air · Buffer · Pack conveyors" },
      { label: "Function", value: "Decouples blowing from filling" },
      { label: "Layout", value: "Engineering drawings supplied" },
    ],
    whatsappMessage:
      "Hello Seven Zillions, I would like to enquire about your Conveyor Systems (air conveyors and buffer conveyors). Please send me more information.",
  },
];

export const solutions: Solution[] = [
  {
    slug: "water-filling-line",
    name: "Water Filling Production Line",
    image: waterLineImage,
    eyebrow: "Mineral & purified water",
    summary:
      "From raw water to a labelled, packed bottle — treatment, blowing, filling and packaging in one line.",
    detail:
      "The water line is the most complete project we deliver, because it starts before the bottle exists. Water treatment and bottle making sit upstream of the tribloc, and packaging sits downstream, so capacity has to be balanced across all three rather than specified machine by machine.",
    capacity: "1,200 – 24,000 BPH",
    process: [
      {
        title: "Water treatment",
        copy: "Pretreatment, reverse osmosis and terminal treatment deliver purified water at the required hourly demand.",
      },
      {
        title: "Bottle blowing",
        copy: "PET preforms are heated and blown into 500, 750 or 850 ml bottles on the six-cavity system.",
      },
      {
        title: "Rinsing, filling, capping",
        copy: "The tribloc rinses, fills and caps each bottle in one continuous motion under a sterilised cap.",
      },
      {
        title: "Labelling & coding",
        copy: "Stick or OPP labels are applied and laser date and batch coding is printed in the same pass.",
      },
      {
        title: "Packaging & palletising",
        copy: "Bottles are shrink wrapped into packs and palletised in the agreed distribution format.",
      },
    ],
    equipment: [
      "Water treatment system (RO and filtration)",
      "Blowing system with preform heater",
      "Tribloc rinser, filler and capper",
      "Cap online steriliser and cap elevator",
      "HP air compressors and air conveyor",
      "150 m of buffer conveyor",
      "Automatic stick labeling machine",
      "Laser printer",
      "Automatic PE film wrapping machine",
    ],
    specs: [
      { label: "Base capacity", value: "3,600 BPH standard configuration" },
      { label: "Bottle sizes", value: "500 ml · 750 ml · 850 ml PET" },
      { label: "Workforce", value: "20 – 25 employees per shift" },
      { label: "Operation", value: "24 hours continuous" },
    ],
  },
  {
    slug: "juice-filling-line",
    name: "Juice Filling Production Line",
    image: juiceLineImage,
    eyebrow: "Juice & formulated drinks",
    summary:
      "Processing and filling configured around the product — because juice and CSD do not share a filling technology.",
    detail:
      "Juice carries formulation-sensitive properties that decide the processing method, the fill technology and the cleaning schedule. Some projects can share selected downstream equipment, but the filling technology and product circuit must be reviewed before anything is committed.",
    capacity: "2,000 – 18,000 BPH",
    process: [
      {
        title: "Formulation review",
        copy: "Beverage list, formulation-sensitive properties and required processing method are confirmed first.",
      },
      {
        title: "Processing",
        copy: "Mixing and blending configured to the product, with hygiene designed into the circuit.",
      },
      {
        title: "Filling",
        copy: "A compatible shared configuration or a separate filler, recommended on the actual products.",
      },
      {
        title: "Closure & inspection",
        copy: "Fill quantity, closure quality and package appearance checked against agreed criteria.",
      },
      {
        title: "Labelling & packing",
        copy: "Labeling, coding, secondary packaging and palletising in the required format.",
      },
    ],
    equipment: [
      "Beverage processing and mixing system",
      "Rinser, filler and capper for the product circuit",
      "Cap steriliser and elevator",
      "Inspection and fill-level control",
      "Labeling and laser coding",
      "Packaging and palletising",
      "Conveying between stages",
    ],
    specs: [
      { label: "Output range", value: "2,000 – 18,000 BPH" },
      { label: "Containers", value: "PET · Glass" },
      { label: "Changeover", value: "Frequency and cleaning schedule agreed" },
      { label: "Acceptance", value: "Saleable output, not nameplate speed" },
    ],
  },
  {
    slug: "csd-filling-line",
    name: "CSD Filling Production Line",
    image: csdLineImage,
    eyebrow: "Carbonated soft drinks",
    summary:
      "Carbonation-aware filling where product temperature, pressure and closure quality are controlled together.",
    detail:
      "Carbonated drinks add variables that still lines do not have: carbonation-related performance, product temperature and closure or seam quality all interact. The line is accepted against those measurements rather than against the speed printed on the machine.",
    capacity: "2,000 – 36,000 BPH",
    process: [
      {
        title: "Carbonation & mixing",
        copy: "Carbonation set to specification with the process water treated beforehand.",
      },
      {
        title: "Counter-pressure filling",
        copy: "Filling conditions held to prevent CO₂ loss and foaming.",
      },
      {
        title: "Crowning or capping",
        copy: "Closure quality verified — torque and seal are part of the acceptance test.",
      },
      {
        title: "Inspection",
        copy: "Fill quantity, carbonation performance and product temperature measured.",
      },
      {
        title: "Packing",
        copy: "Labelling, coding, secondary packaging and palletising completed.",
      },
    ],
    equipment: [
      "Water treatment and carbonation unit",
      "Counter-pressure filler and capper",
      "Inspection equipment",
      "Labeling and coding",
      "Packaging and palletising",
      "Conveying and line control",
    ],
    specs: [
      { label: "Output range", value: "2,000 – 36,000 BPH" },
      { label: "Containers", value: "PET · Glass · Cans" },
      { label: "Measured", value: "Carbonation · Temperature · Closure quality" },
      { label: "Product circuit", value: "Reviewed separately from still drinks" },
    ],
  },
  {
    slug: "cans-filling-line",
    name: "Cans Filling Production Line",
    image: cansLineImage,
    eyebrow: "Aluminium & steel cans",
    summary:
      "Seaming, filling and handling configured for cans — a different closure technology from bottles.",
    detail:
      "Cans close by seaming rather than capping, which changes the filler, the handling and the downstream equipment. Representative cans, ends and product conditions are made available for testing before the line is accepted.",
    capacity: "2,000 – 36,000 cans/h",
    process: [
      {
        title: "Container handling",
        copy: "Can rinser and handling configured for the agreed can and end dimensions.",
      },
      {
        title: "Filling",
        copy: "Fill volume controlled against the representative product conditions.",
      },
      {
        title: "Seaming",
        copy: "Seam quality measured — double-seam inspection is part of acceptance.",
      },
      {
        title: "Coding & packaging",
        copy: "Date coding, secondary packaging and palletising in the required format.",
      },
      {
        title: "Acceptance test",
        copy: "Saleable output confirmed with representative cans, ends and product.",
      },
    ],
    equipment: [
      "Can rinser and filler",
      "Seamer with seam inspection",
      "Conveying and pack handling",
      "Coding equipment",
      "Packaging and palletising",
    ],
    specs: [
      { label: "Output range", value: "2,000 – 36,000 cans/h" },
      { label: "Containers", value: "Aluminium and steel cans" },
      { label: "Critical check", value: "Double-seam quality" },
      { label: "Test material", value: "Representative cans, ends and product" },
    ],
  },
];

/** Additional beverage lines we deliver — carried as text, no photography yet. */
export const extraSolutionLines = [
  "Sachet Water Production Line",
  "Bottled Water & Beverage Production Line",
  "3–5 Gallon Water Production Line",
];

export const packages: Package[] = [
  {
    slug: "turnkey-water-line-3600",
    name: "Turnkey 3,600 BPH Mineral Water Production Line",
    summary:
      "A complete factory setup from design through to training — not a machine sale, but a production-ready water plant.",
    includes: [
      "Factory design and engineering drawings",
      "Full equipment list for a functioning factory",
      "Installation works at your site",
      "Electrical works and equipment wiring",
      "On-site operation, maintenance and troubleshooting training",
      "Ongoing PET preform and cap supply",
    ],
    specs: [
      { label: "Base capacity", value: "3,600 BPH" },
      { label: "Bottle sizes", value: "500 · 750 · 850 ml PET" },
      { label: "Output per size", value: "5,000 – 6,000 pcs/h" },
      { label: "Workforce", value: "20 – 25 per shift" },
      { label: "Operation", value: "24 hours continuous" },
    ],
  },
  {
    slug: "turnkey-blowing-line-5000",
    name: "Turnkey 5,000 BPH PET Bottle Blowing Line",
    summary:
      "For producers who already hold preforms: a complete blowing factory for drinking water and beverage bottles, drawing to staff training included.",
    includes: [
      "Consultation, design and factory layout drawing",
      "One unit six-cavity bottle blowing machine",
      "HP air compressors and air conveyor system",
      "Installation and electrical works",
      "On-field operator training",
      "50,000 PET preforms supplied free to start production",
    ],
    specs: [
      { label: "Capacity", value: "5,000 BPH" },
      { label: "Cavities", value: "6" },
      { label: "Bottle sizes", value: "500 · 750 · 850 ml" },
      { label: "Workforce", value: "5 – 10 workers" },
      { label: "Operation", value: "24 hours / day" },
    ],
  },
];

export const checklist = [
  "Beverage list, formulation-sensitive properties and required processing method.",
  "Container material, drawings or samples, fill volumes and closure specifications.",
  "Required saleable output for each important product and package combination.",
  "Planned production hours, changeover frequency and cleaning schedule.",
  "Available floor space, ceiling height, utility conditions and destination voltage.",
  "Required inspection, coding, labeling, secondary packaging and palletizing format.",
  "Target installation date and the service scope expected from Seven Zillions.",
  "A recent raw-water analysis, where water treatment is in scope.",
];

export const deliverySteps = [
  "Requirement review",
  "Technical proposal",
  "Layout confirmation",
  "Manufacturing",
  "Factory testing",
  "Shipment",
  "Installation",
  "Commissioning",
  "Training",
];

export const acceptance = [
  "Saleable output measured across the complete line, not the nameplate speed of one machine.",
  "Fill quantity and closure or seam quality verified against agreed limits.",
  "Carbonation-related performance and product temperature checked where relevant.",
  "Package appearance, changeover steps and alarm response demonstrated.",
  "Representative bottles, caps, cans, ends and labels available for testing.",
];

export const waterProcess = [
  {
    title: "Pretreatment",
    copy: "Multi-media filters, activated carbon, softener, iron and manganese removal, with ultra-filtration or micro-filtration where the raw water requires it.",
  },
  {
    title: "Deep treatment",
    copy: "Membrane treatment and ion exchange reduce dissolved salts and bring the water to the required treated-water standard.",
  },
  {
    title: "Terminal treatment",
    copy: "Ozone and UV disinfection complete the process before treated water is stored and supplied to the filling line.",
  },
];

export const services = [
  {
    title: "Single spare parts supply",
    copy: "Individual components and consumables so a stopped machine goes back into production quickly.",
  },
  {
    title: "Installation and setup",
    copy: "Our technical team travels to your site and assembles the complete line, including civil guidance and steel platforms.",
  },
  {
    title: "Ongoing maintenance and support",
    copy: "Service and support across the lifecycle of the equipment, with 24-month after-sales support on treatment plant.",
  },
  {
    title: "Custom single project engineering",
    copy: "Layout, utilities and controls engineered around your floor space, ceiling height and destination voltage.",
  },
  {
    title: "Complete production line development",
    copy: "Full engineering for an individual machine or for an entire production line, from process flow to commissioning.",
  },
  {
    title: "Raw material supply",
    copy: "PET preforms and caps supplied after installation so the line keeps running.",
  },
];

export const projects = [
  {
    date: "2025-12-10",
    title: "1,200 BPH Fully Automatic 5L Water Bottling Line in Africa",
    copy: "A 1,200 BPH fully automatic 5L water bottling line delivered in Africa, integrating bottle feeding, rinsing, filling, capping, coding, packing and palletizing.",
    image: projectFiveLImage,
  },
  {
    date: "2024-05-29",
    title: "24,000 BPH Mineral Water Production Line Commissioned in Africa",
    copy: "A 24,000 BPH mineral water production line was installed and commissioned for an African customer, adding efficient local bottled-water capacity.",
    image: projectWaterImage,
  },
  {
    date: "2023-12-11",
    title: "25 T/H Water Treatment System Commissioned in West Africa",
    copy: "Seven Zillions designed, built and commissioned a 25 T/H water treatment system for a West African producer — filtration, carbon and softening ahead of reverse osmosis, with treated-water storage delivering the required treated-water standard.",
    image: projectFilterImage,
  },
];

export const insights: Insight[] = [
  {
    num: "01",
    slug: "drinking-water-production-process",
    title: "Drinking Water Production Process",
    copy: "Well water and tap water purification, from source testing through to hygienic bottling.",
    body: [
      "Every drinking-water project starts with the raw water itself. Source-water hardness, salinity, turbidity, iron, manganese and microbiology determine the process route, so a recent raw-water analysis is the first thing Seven Zillions asks for. Without it, equipment can be selected that delivers unstable water quality, low recovery or unnecessary operating cost.",
      "Treatment is then built in three parts. Pretreatment prepares the feed water — multi-media filters, activated carbon, softener and iron or manganese removal. Deep treatment does the actual purification through membrane separation or ion exchange. Terminal treatment with ozone and UV finishes the water before it is stored and sent to the filling line.",
      "The final stage is hygienic bottling: blowing, rinsing, filling, capping, labelling, coding, packing and palletising. Acceptance is measured as correctly filled, closed, labeled and packed product — not as the speed printed on any single machine.",
    ],
  },
  {
    num: "02",
    slug: "mineral-water-production-line-process",
    title: "Natural Mineral Water Production Line Process",
    copy: "A complete practical guide from protected source to finished bottle.",
    body: [
      "A mineral water line is judged on continuity. The base configuration is rated at 3,600 bottles per hour, while the blowing system can run 6,000 to 70,000 pieces per hour depending on the mould — so buffer conveyors between blowing and filling are what keep the line balanced rather than idle.",
      "Between those stages sits the tribloc: a mono-block that rinses the empty bottle, fills it and caps it in one continuous motion, with a cap online steriliser ensuring hygiene before sealing. Downstream, stick labeling, laser coding and PE film wrapping turn a filled bottle into a distributable pack.",
      "For a plant running 24 hours, the practical constraints are people and materials. A fully automated line needs 20 to 25 employees per shift, and preform and cap supply has to be secured — otherwise a well-specified line still stops.",
    ],
  },
  {
    num: "03",
    slug: "planning-a-beverage-filling-line",
    title: "How to Plan a Beverage Filling Line",
    copy: "Capacity, utilities, bottle formats and the decisions that shape a reliable line.",
    body: [
      "Send the information that lets a line be sized around a real production plan: beverage list and processing method, container material and fill volumes, required saleable output per product, production hours and changeover frequency, floor space and destination voltage, inspection and palletising format, and your target installation date.",
      "From that, Seven Zillions returns a recommended process flow, equipment list, layout concept, utility requirements, commercial quotation and delivery plan. Current equipment families cover approximately 2,000 to 36,000 containers per hour, but committed output depends on beverage, container size, closure, filling conditions and the complete line scope.",
      "The decision that saves the most money is made first: whether one machine can serve several products. Juice and carbonated soft drinks generally need different processing and filling conditions, and a single line does not automatically handle PET, glass and cans. Change parts, transfers, closures and filling technology are confirmed against the approved package range before anything is built.",
    ],
  },
];

export const faqs = [
  {
    q: "Do you supply a complete beverage filling line?",
    a: "Yes. The scope can extend from water or beverage processing through filling, labeling, coding, packaging and palletizing, with layout and line-control integration.",
  },
  {
    q: "Can one machine fill juice and carbonated soft drinks?",
    a: "These products generally need different processing and filling conditions. Some projects can share selected downstream equipment, but the filling technology and product circuit must be reviewed. Seven Zillions will recommend a compatible shared configuration or separate fillers based on the actual products.",
  },
  {
    q: "Can the line run PET bottles, glass bottles and cans?",
    a: "Seven Zillions offers equipment families for all three package types. A single line does not automatically handle every container. Change parts, transfers, closures, filling technology and downstream equipment are confirmed for the approved package range.",
  },
  {
    q: "What production speed is available?",
    a: "Current equipment families cover approximately 2,000 to 36,000 containers per hour. The committed output depends on beverage, container size, closure, filling conditions and the complete line scope.",
  },
  {
    q: "How is the final price determined?",
    a: "Price depends on product process, package, required output, automation level, inspection, utilities, packaging format and service scope. Seven Zillions prepares a project-specific quotation after reviewing these inputs.",
  },
  {
    q: "Can Seven Zillions provide installation and training?",
    a: "Installation, commissioning and operator training can be included in the agreed service scope. The proposal states responsibilities, site prerequisites and any items supplied by the customer.",
  },
  {
    q: "What information is required to design the water treatment system?",
    a: "Please provide a recent raw-water analysis, required treated-water standard, hourly demand, operating hours, available utilities and installation space. Seven Zillions uses these data to select pretreatment, membrane or polishing stages.",
  },
  {
    q: "Why is a raw-water analysis required before equipment selection?",
    a: "Source-water hardness, salinity, turbidity, iron, manganese, microbiology and other parameters determine the process route. Selecting equipment without these data can lead to unstable water quality, low recovery or unnecessary operating cost.",
  },
  {
    q: "Can the system be expanded if the water source changes?",
    a: "Expansion or process changes may be possible, but the new feed-water analysis and demand must be reviewed. Tanks, pumps, membranes, pretreatment capacity, controls and available space determine what can be reused.",
  },
  {
    q: "Can this equipment be integrated into a complete production line?",
    a: "Yes. Seven Zillions can coordinate upstream processing or bottle making with filling, labeling, coding, packaging, conveying and palletizing. Layout, utilities, controls, factory testing, installation, commissioning and training are defined by the agreed project scope.",
  },
];

export const about = {
  image: aboutImage,
  lead: "Seven Zillions designs and builds industrial facilities, cleanrooms and high-tech manufacturing sites — and delivers the engineering, technical services and equipment that make them run.",
  paragraphs: [
    "We manage large-scale industrial facility construction, plant design and the implementation of lean manufacturing production lines, and we supply automation controls, integration services and industrial systems that optimise factory production. For investors, that extends to business proposal and contract work, due diligence and factory operational optimisation.",
    "For beverage producers we are the comprehensive partner in water and beverage manufacturing. Whether you need to upgrade a single component, arrange ongoing maintenance, or build a complete production line, we supply it — single spare parts, installation, maintenance and full engineering for individual projects or entire production lines.",
  ],
  points: [
    "A–Z line layout and utility planning",
    "Factory testing and documented commissioning",
    "Installation, training and spare-parts support",
  ],
} as const;

export const customers = [
  "Ghana",
  "Nigeria",
  "Ethiopia",
  "Kenya",
  "South Africa",
  "Tanzania",
  "Uganda",
  "Côte d'Ivoire",
  "Indonesia",
  "China",
] as const;

export const productBySlug = (slug: string) => products.find((item) => item.slug === slug);
export const solutionBySlug = (slug: string) => solutions.find((item) => item.slug === slug);
export const packageBySlug = (slug: string) => packages.find((item) => item.slug === slug);
export const insightBySlug = (slug: string) => insights.find((item) => item.slug === slug);
