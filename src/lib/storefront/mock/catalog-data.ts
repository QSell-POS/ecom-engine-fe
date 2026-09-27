import type {
  Brand,
  Category,
  Collection,
  Product,
  ProductBadge,
  ProductOption,
  ProductVariant,
  Review,
  StoreMedia,
  StoreProfile,
  Vertical,
} from "../types";
import { photo, type PhotoKey } from "./images";

// DEMO CATALOGS (development only). One realistic catalog per store vertical,
// generated deterministically from compact specs so ids, stock, ratings and
// reviews are stable across reloads and between server and client. Replaced
// by the NestJS catalog API in production (see ../server.ts).

type OptionSpec = [name: string, values: string[]];

type ProductSpec = {
  name: string;
  category: string;
  brand: string;
  price: number;
  compare?: number;
  photos: PhotoKey[];
  blurb: string;
  options?: OptionSpec[];
  collections?: ("new-arrivals" | "best-sellers")[];
  soldOut?: boolean;
  tags?: string[];
};

type VerticalSpec = {
  categories: { slug: string; name: string; description: string; photo: PhotoKey }[];
  brands: { slug: string; name: string; description: string; photo: PhotoKey }[];
  editorial: { slug: string; title: string; description: string; photo: PhotoKey };
  highlights: Record<string, string[]>;
  details: string;
  products: ProductSpec[];
  reviews: { title: string; body: string }[];
  media: { hero: PhotoKey[]; banners: PhotoKey[]; lifestyle: PhotoKey[] };
};

const SWATCHES: Record<string, string> = {
  Black: "#1c1917", White: "#f8fafc", Ivory: "#f5f0e6", Cream: "#efe6d2", Sand: "#d6c3a5", Camel: "#b58a5a",
  Brown: "#6b4a32", Olive: "#6b705c", Sage: "#a3b18a", Navy: "#1e2a44", Indigo: "#3b4a7a", Blue: "#2563eb",
  Stone: "#a8a29e", Grey: "#9ca3af", Graphite: "#374151", Silver: "#d1d5db", Red: "#b91c1c", Rose: "#d8a7a0",
  Coral: "#e76f51", Mustard: "#d4a017", Green: "#2f5d50", Teal: "#1f6f78", Terracotta: "#c2663d", Natural: "#d9c7a7",
  Oak: "#b7916a", Walnut: "#5c3d2e", Tan: "#c68b59", Pink: "#f4b6c2", Lilac: "#b8a1d9", Midnight: "#111827",
};

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"];
const SHOE_SIZES = ["38", "39", "40", "41", "42", "43", "44", "45"];

const FASHION: VerticalSpec = {
  categories: [
    { slug: "outerwear", name: "Outerwear", description: "Jackets and coats cut for everyday layering.", photo: "leatherLook" },
    { slug: "knitwear", name: "Knitwear", description: "Soft knits and sweatshirts in natural fibres.", photo: "creamKnit" },
    { slug: "denim", name: "Denim", description: "Rigid and stretch denim in relaxed and slim fits.", photo: "jeansStreet" },
    { slug: "dresses", name: "Dresses", description: "Easy silhouettes from beach to evening.", photo: "beachDress" },
    { slug: "essentials", name: "Essentials", description: "The tees and loungewear you'll reach for daily.", photo: "whiteTee" },
    { slug: "shoes", name: "Shoes", description: "Sneakers and trainers built to walk the city.", photo: "suedeSneaker" },
    { slug: "accessories", name: "Accessories", description: "Bags, eyewear and watches to finish the look.", photo: "tanBag" },
  ],
  brands: [
    { slug: "atelier-nord", name: "Atelier Nord", description: "Scandinavian tailoring with a quiet edge.", photo: "streetCoat" },
    { slug: "common-thread", name: "Common Thread", description: "Organic cotton basics, made to be worn in.", photo: "hangingTops" },
    { slug: "linea", name: "Linea", description: "Fluid dresses and soft tailoring in natural fabrics.", photo: "seaside" },
    { slug: "saltwater", name: "Saltwater", description: "Sneakers and accessories for life on the move.", photo: "sculptedTrainer" },
  ],
  editorial: { slug: "autumn-edit", title: "The Autumn Edit", description: "Layers, texture and warm neutrals for the new season.", photo: "earthRack" },
  highlights: {
    outerwear: ["Fully lined", "Relaxed, boxy fit", "Two front pockets"],
    knitwear: ["Soft brushed finish", "Ribbed cuffs and hem", "Pre-washed to minimise shrinkage"],
    denim: ["Organic cotton denim", "Mid-rise, five pockets", "Garment washed"],
    dresses: ["Lightweight and breathable", "Fully lined bodice", "Midi length"],
    essentials: ["Heavyweight organic cotton", "Relaxed fit", "Made in Portugal"],
    shoes: ["Cushioned insole", "Rubber cup sole", "True to size"],
    accessories: ["Premium materials", "Designed to last", "Dust bag included"],
  },
  details: "Designed in our studio and made in small runs by partner workshops we visit every season. Machine wash cold, dry flat, and it will look better with every wear.",
  products: [
    { name: "Cropped Leather Jacket", category: "outerwear", brand: "atelier-nord", price: 289, compare: 349, photos: ["leatherJacket", "leatherLook"], blurb: "Supple lambskin in a cropped, boxy cut that works over everything.", options: [["Color", ["Black", "Brown"]], ["Size", APPAREL_SIZES]], collections: ["best-sellers"] },
    { name: "Suede Bomber Jacket", category: "outerwear", brand: "atelier-nord", price: 219, photos: ["bomber", "streetCoat"], blurb: "A soft suede bomber in a warm terracotta tone, lined for cooler days.", options: [["Color", ["Terracotta", "Olive"]], ["Size", APPAREL_SIZES]], collections: ["new-arrivals"] },
    { name: "Open-Knit Cotton Sweater", category: "knitwear", brand: "linea", price: 98, photos: ["creamKnit", "summer"], blurb: "An airy open-knit sweater with a relaxed V-neck and fringed hem.", options: [["Color", ["Cream", "Sand"]], ["Size", APPAREL_SIZES]], collections: ["new-arrivals"] },
    { name: "Organic Crewneck Sweatshirt", category: "knitwear", brand: "common-thread", price: 68, photos: ["sweatshirt", "flatLay"], blurb: "Loopback organic cotton in a clean, slightly oversized crew.", options: [["Color", ["White", "Grey", "Navy"]], ["Size", APPAREL_SIZES]], collections: ["best-sellers"] },
    { name: "Heavyweight Hoodie", category: "knitwear", brand: "common-thread", price: 84, photos: ["hoodie", "pinkStudio"], blurb: "A 450gsm brushed hoodie with a double-layer hood and roomy pocket.", options: [["Color", ["Grey", "Black"]], ["Size", APPAREL_SIZES]] },
    { name: "Classic Straight Jeans", category: "denim", brand: "common-thread", price: 110, photos: ["jeansStack", "jeansStreet"], blurb: "Our signature straight leg in 13oz rigid denim that softens beautifully.", options: [["Color", ["Indigo", "Black"]], ["Size", ["26", "27", "28", "29", "30", "31", "32"]]], collections: ["best-sellers"] },
    { name: "Distressed Slim Jeans", category: "denim", brand: "saltwater", price: 98, compare: 125, photos: ["jeansStreet", "jeansStack"], blurb: "A slim, stretch-comfort fit with hand-finished distressing.", options: [["Color", ["Blue"]], ["Size", ["26", "27", "28", "29", "30", "31", "32"]]] },
    { name: "Linen Wrap Dress", category: "dresses", brand: "linea", price: 145, photos: ["beachDress", "seaside"], blurb: "A flowing wrap dress in washed European linen with a tie waist.", options: [["Color", ["Blue", "Sand"]], ["Size", APPAREL_SIZES]], collections: ["new-arrivals", "best-sellers"] },
    { name: "Silk Maxi Dress", category: "dresses", brand: "linea", price: 189, compare: 240, photos: ["redDress", "summer"], blurb: "Bias-cut sandwashed silk that moves with you, for evenings that run late.", options: [["Color", ["Red", "Black"]], ["Size", APPAREL_SIZES]] },
    { name: "Relaxed Lounge Pants", category: "essentials", brand: "common-thread", price: 72, photos: ["loungePants", "tealStudio"], blurb: "Soft French-terry pants with a drawstring waist and tapered cuff.", options: [["Color", ["Rose", "Grey"]], ["Size", APPAREL_SIZES]], collections: ["new-arrivals"] },
    { name: "Essential Cotton Tee", category: "essentials", brand: "common-thread", price: 32, photos: ["whiteTee", "teeRack"], blurb: "The perfect white tee: heavyweight, crisp neckline, slightly boxy.", options: [["Color", ["White", "Black", "Sand"]], ["Size", APPAREL_SIZES]], collections: ["best-sellers"] },
    { name: "Graphic Heritage Tee", category: "essentials", brand: "saltwater", price: 38, photos: ["graphicTee", "pinkStudio"], blurb: "A vintage-washed tee with our archive graphic, printed by hand.", options: [["Color", ["Stone"]], ["Size", APPAREL_SIZES]] },
    { name: "Knit Runner Sneakers", category: "shoes", brand: "saltwater", price: 129, photos: ["redRunner", "retroTrainer"], blurb: "A featherweight knit runner with responsive foam for all-day comfort.", options: [["Color", ["Red", "Black"]], ["Size", SHOE_SIZES]], collections: ["best-sellers"] },
    { name: "Suede Court Sneakers", category: "shoes", brand: "saltwater", price: 145, photos: ["suedeSneaker", "flatLay"], blurb: "Tan suede court shoes with a padded collar and gum-tone sole.", options: [["Color", ["Tan"]], ["Size", SHOE_SIZES]], collections: ["new-arrivals"] },
    { name: "Sculpted Trainers", category: "shoes", brand: "saltwater", price: 159, compare: 199, photos: ["sculptedTrainer", "retroTrainer"], blurb: "Architectural trainers with a layered upper and chunky sole.", options: [["Color", ["White"]], ["Size", SHOE_SIZES]] },
    { name: "Retro Air Trainers", category: "shoes", brand: "saltwater", price: 139, photos: ["retroTrainer", "redRunner"], blurb: "A '90s runner revived with a visible air unit and suede overlays.", options: [["Color", ["White", "Coral"]], ["Size", SHOE_SIZES]], soldOut: true },
    { name: "Leather Top-Handle Bag", category: "accessories", brand: "atelier-nord", price: 265, photos: ["tanBag", "boutique"], blurb: "Structured vegetable-tanned leather with a detachable shoulder strap.", options: [["Color", ["Tan", "Black"]]], collections: ["best-sellers"] },
    { name: "Structured Mini Bag", category: "accessories", brand: "atelier-nord", price: 240, compare: 290, photos: ["redBag", "shopper"], blurb: "A compact statement bag in glossy calf leather with a gold clasp.", options: [["Color", ["Red"]]], collections: ["new-arrivals"] },
    { name: "Round Metal Sunglasses", category: "accessories", brand: "saltwater", price: 120, photos: ["roundSunglasses", "summer"], blurb: "Lightweight round frames with polarised, UV400 lenses.", options: [["Color", ["Green", "Black"]]] },
    { name: "Classic Wayfarer Sunglasses", category: "accessories", brand: "saltwater", price: 95, photos: ["wayfarers", "yellowSuit"], blurb: "The shape that never dates, in hand-polished acetate.", options: [["Color", ["Black"]]], collections: ["best-sellers"] },
    { name: "Minimal Leather Watch", category: "accessories", brand: "atelier-nord", price: 180, photos: ["leatherWatch", "suit"], blurb: "A 38mm case, sapphire crystal and an Italian leather strap.", options: [["Color", ["Brown", "Black"]]] },
    { name: "Everyday Backpack", category: "accessories", brand: "common-thread", price: 125, photos: ["backpack", "flatLay"], blurb: "Water-resistant recycled canvas with a padded 15\" laptop sleeve.", options: [["Color", ["Navy", "Black"]]], collections: ["new-arrivals"] },
    { name: "Six-Panel Cap", category: "accessories", brand: "saltwater", price: 35, photos: ["cap", "teeRack"], blurb: "A structured cap with an embroidered patch and adjustable snap.", options: [["Color", ["Grey"]]] },
  ],
  reviews: [
    { title: "Beautiful quality", body: "The fabric feels far more expensive than the price. It has already become my most-worn piece." },
    { title: "Perfect fit", body: "I ordered my usual size and it fits exactly as described. The cut is really flattering." },
    { title: "Exceeded expectations", body: "Arrived quickly, beautifully packaged, and the colour is even nicer in person." },
    { title: "Wear it constantly", body: "Soft, well made and easy to style. I'll be ordering a second colour." },
    { title: "Lovely, runs slightly large", body: "Really happy with it. I'd size down if you're between sizes." },
    { title: "Great everyday staple", body: "Washes well and keeps its shape. Exactly what I was looking for." },
    { title: "So many compliments", body: "Every time I wear it someone asks where it's from. Great design." },
    { title: "Good, not perfect", body: "Nice quality overall, although delivery took a couple of days longer than expected." },
  ],
  media: {
    hero: ["streetCoat", "tealStudio", "earthRack"],
    banners: ["neutralRack", "seaside", "shopper"],
    lifestyle: ["boutique", "wardrobe", "hangingTops", "yellowSuit", "suit", "summer"],
  },
};

const ELECTRONICS: VerticalSpec = {
  categories: [
    { slug: "audio", name: "Audio", description: "Headphones, earbuds and speakers tuned for detail.", photo: "yellowHeadphones" },
    { slug: "phones", name: "Phones", description: "The latest smartphones, unlocked.", photo: "phoneTable" },
    { slug: "laptops", name: "Laptops & Tablets", description: "Thin, powerful machines for work and play.", photo: "laptopNeon" },
    { slug: "wearables", name: "Wearables", description: "Smartwatches and fitness trackers.", photo: "watchApps" },
    { slug: "cameras", name: "Cameras", description: "Capture it all, from instant prints to 4K.", photo: "mirrorless" },
    { slug: "accessories", name: "Gaming & Accessories", description: "Controllers, keyboards and smart home.", photo: "controllerWhite" },
  ],
  brands: [
    { slug: "aurora", name: "Aurora", description: "Premium audio engineered in Copenhagen.", photo: "hifi" },
    { slug: "kinetic", name: "Kinetic", description: "Phones and wearables that keep up with you.", photo: "watchWrist" },
    { slug: "northwave", name: "Northwave", description: "Laptops and tablets for creators.", photo: "laptopGlow" },
    { slug: "pixelcraft", name: "Pixelcraft", description: "Cameras and gaming gear for enthusiasts.", photo: "cameraDark" },
  ],
  editorial: { slug: "work-from-anywhere", title: "Work From Anywhere", description: "Everything you need for a desk setup that travels.", photo: "workspace" },
  highlights: {
    audio: ["Active noise cancellation", "Up to 30 hours of battery", "Multipoint Bluetooth 5.3"],
    phones: ["6.1\" OLED display", "Triple camera system", "All-day battery"],
    laptops: ["Retina-class display", "Up to 18 hours of battery", "Backlit keyboard"],
    wearables: ["Heart-rate and sleep tracking", "Water resistant to 50m", "7-day battery"],
    cameras: ["Large sensor", "4K video", "Wi-Fi transfer"],
    accessories: ["Low-latency wireless", "USB-C charging", "Works with all major platforms"],
  },
  details: "Every product ships with a 2-year warranty, free next-day delivery on orders over $50 and 30-day no-quibble returns.",
  products: [
    { name: "Studio Wireless Headphones", category: "audio", brand: "aurora", price: 299, photos: ["yellowHeadphones", "hifi"], blurb: "Studio-grade drivers with adaptive noise cancellation and a 30-hour battery.", options: [["Color", ["Black", "White"]]], collections: ["best-sellers"] },
    { name: "Aurora ANC Over-Ear", category: "audio", brand: "aurora", price: 349, compare: 399, photos: ["anc", "techDesk"], blurb: "Our quietest headphones yet, with memory-foam cushions for long listening.", options: [["Color", ["Black", "Silver"]]], collections: ["best-sellers"] },
    { name: "Classic Wired Headphones", category: "audio", brand: "aurora", price: 129, photos: ["wiredHeadphones", "devices"], blurb: "Reference-tuned wired headphones with a detachable braided cable.", options: [["Color", ["Black"]]] },
    { name: "Hi-Fi Headphones", category: "audio", brand: "aurora", price: 249, photos: ["hifi", "yellowHeadphones"], blurb: "Open-back, hand-assembled drivers for a wide, natural soundstage.", options: [["Color", ["Silver"]]], collections: ["new-arrivals"] },
    { name: "True Wireless Earbuds", category: "audio", brand: "kinetic", price: 149, photos: ["redBuds", "budsCase"], blurb: "Pocketable earbuds with punchy bass and a 24-hour charging case.", options: [["Color", ["Black", "Red"]]], collections: ["best-sellers"] },
    { name: "Pro Earbuds with Case", category: "audio", brand: "kinetic", price: 179, compare: 199, photos: ["budsCase", "airBuds"], blurb: "Noise-cancelling earbuds with spatial audio and wireless charging.", options: [["Color", ["White", "Graphite"]]] },
    { name: "Air Pro Earbuds", category: "audio", brand: "kinetic", price: 229, photos: ["airBuds", "budsCase"], blurb: "Adaptive transparency, personalised fit and six hours on a charge.", options: [["Color", ["White"]]], collections: ["new-arrivals"] },
    { name: "Portable Bluetooth Speaker", category: "audio", brand: "aurora", price: 99, photos: ["speakerPortable", "techFlatLay"], blurb: "Rugged, waterproof and loud enough for any gathering.", options: [["Color", ["Black", "Blue"]]], collections: ["best-sellers"] },
    { name: "Bookshelf Speakers (Pair)", category: "audio", brand: "aurora", price: 399, photos: ["speakerShelf", "devices"], blurb: "Walnut-veneer cabinets with silk dome tweeters and room correction.", options: [["Color", ["Walnut", "Black"]]] },
    { name: "Prism Light Speaker", category: "audio", brand: "pixelcraft", price: 129, compare: 159, photos: ["speakerPrism", "techDesk"], blurb: "360° sound wrapped in a light show that syncs to the beat.", options: [["Color", ["Black"]]] },
    { name: "Kinetic X Smartphone", category: "phones", brand: "kinetic", price: 899, photos: ["phoneTable", "phoneHand"], blurb: "A 6.1\" OLED display, all-day battery and a camera that shines at night.", options: [["Color", ["Blue", "Black"]], ["Storage", ["128 GB", "256 GB", "512 GB"]]], collections: ["best-sellers"] },
    { name: "Kinetic X Pro", category: "phones", brand: "kinetic", price: 1099, photos: ["phoneWood", "phoneTable"], blurb: "Pro camera system with 5× optical zoom and a titanium frame.", options: [["Color", ["Graphite", "Silver"]], ["Storage", ["256 GB", "512 GB", "1 TB"]]], collections: ["new-arrivals"] },
    { name: "Kinetic Lite", category: "phones", brand: "kinetic", price: 699, compare: 749, photos: ["phoneHand", "phoneWood"], blurb: "Everything you need in a lighter, more affordable package.", options: [["Color", ["Black", "White"]], ["Storage", ["128 GB", "256 GB"]]] },
    { name: "UltraBook 14", category: "laptops", brand: "northwave", price: 1299, photos: ["laptopDesk", "workspace"], blurb: "A 1.2kg aluminium laptop with an 18-hour battery and silent cooling.", options: [["Memory", ["16 GB", "32 GB"]], ["Storage", ["512 GB", "1 TB"]]], collections: ["best-sellers"] },
    { name: "Northwave Book Pro 16", category: "laptops", brand: "northwave", price: 2199, photos: ["laptopNeon", "laptopDark"], blurb: "A 16\" mini-LED display and workstation performance for creators.", options: [["Memory", ["32 GB", "64 GB"]], ["Storage", ["1 TB", "2 TB"]]], collections: ["new-arrivals"] },
    { name: "Creator Laptop 15", category: "laptops", brand: "northwave", price: 1699, compare: 1899, photos: ["laptopGlow", "laptopDark"], blurb: "Colour-accurate OLED and a dedicated GPU for editing on the go.", options: [["Memory", ["16 GB", "32 GB"]]] },
    { name: "Slate Tablet 11", category: "laptops", brand: "northwave", price: 649, photos: ["tablet", "tabletHand"], blurb: "An 11\" 120Hz display with pencil support and a laptop-class chip.", options: [["Color", ["Silver", "Graphite"]], ["Storage", ["128 GB", "256 GB"]]] },
    { name: "Pulse Smartwatch", category: "wearables", brand: "kinetic", price: 399, photos: ["watchBlack", "watchApps"], blurb: "Always-on display, ECG and a week of battery in a sleek aluminium case.", options: [["Color", ["Black", "Silver"]], ["Size", ["41 mm", "45 mm"]]], collections: ["best-sellers"] },
    { name: "Stride Fitness Watch", category: "wearables", brand: "kinetic", price: 299, compare: 349, photos: ["watchWrist", "watchApps"], blurb: "Built for training: GPS, heart-rate zones and recovery insights.", options: [["Color", ["Black"]], ["Size", ["41 mm", "45 mm"]]] },
    { name: "Mirrorless Camera Kit", category: "cameras", brand: "pixelcraft", price: 1199, photos: ["mirrorless", "cameraDark"], blurb: "A 26MP APS-C sensor, in-body stabilisation and a 18–55mm lens.", options: [["Color", ["Black"]]], collections: ["best-sellers"] },
    { name: "Instant Film Camera", category: "cameras", brand: "pixelcraft", price: 129, photos: ["instant", "techFlatLay"], blurb: "Point, shoot, and hold the print a minute later. Film sold separately.", options: [["Color", ["White"]]], collections: ["new-arrivals"] },
    { name: "Wireless Controller, White", category: "accessories", brand: "pixelcraft", price: 69, photos: ["controllerWhite", "controllerBlack"], blurb: "Haptic feedback, adaptive triggers and a 30-hour battery.", options: [["Color", ["White"]]], collections: ["best-sellers"] },
    { name: "Wireless Controller, Black", category: "accessories", brand: "pixelcraft", price: 59, compare: 69, photos: ["controllerBlack", "controllerWhite"], blurb: "Pro-grade controls with remappable back buttons.", options: [["Color", ["Black"]]] },
    { name: "Low-Profile Mechanical Keyboard", category: "accessories", brand: "northwave", price: 149, photos: ["keyboardMech", "keyboardWhite"], blurb: "Hot-swappable tactile switches in a 75% aluminium body.", options: [["Layout", ["US", "UK"]]], collections: ["new-arrivals"] },
    { name: "Ergonomic Wireless Mouse", category: "accessories", brand: "northwave", price: 49, photos: ["mouse", "workspace"], blurb: "A sculpted shape, silent clicks and three-device switching.", options: [["Color", ["Graphite"]]], soldOut: true },
    { name: "Smart Home Hub", category: "accessories", brand: "kinetic", price: 129, photos: ["smartHome", "devices"], blurb: "Control lights, locks and speakers from one voice-enabled hub.", options: [["Color", ["White", "Black"]]] },
  ],
  reviews: [
    { title: "Incredible sound", body: "The clarity and bass are outstanding. Noise cancelling is on par with brands twice the price." },
    { title: "Fast and reliable", body: "Setup took two minutes and it has worked flawlessly every day since." },
    { title: "Worth every penny", body: "Premium build, great battery life and delivery was next day as promised." },
    { title: "Battery lasts forever", body: "I charge it once a week at most. Really impressed." },
    { title: "Great, minor quibble", body: "Excellent overall. The companion app could be a bit more intuitive." },
    { title: "Upgrade from my old one", body: "Noticeably faster and the screen is gorgeous. Very happy." },
    { title: "Solid purchase", body: "Does exactly what it says. Customer support answered my question within an hour." },
    { title: "Stylish and practical", body: "Looks fantastic on my desk and performs even better." },
  ],
  media: {
    hero: ["devices", "techDesk", "laptopDark"],
    banners: ["workspace", "team", "techFlatLay"],
    lifestyle: ["tabletHand", "watchWrist", "cameraDark", "keyboardWhite", "phoneHand", "laptopGlow"],
  },
};

const BEAUTY: VerticalSpec = {
  categories: [
    { slug: "skincare", name: "Skincare", description: "Cleansers and creams for a calm, healthy complexion.", photo: "whiteBottles" },
    { slug: "serums", name: "Serums & Oils", description: "Concentrated actives that target what your skin needs.", photo: "goldDropper" },
    { slug: "makeup", name: "Makeup", description: "Buildable colour for the everyday and the evening.", photo: "palette" },
    { slug: "fragrance", name: "Fragrance", description: "Signature scents, blended in Grasse.", photo: "perfumeRose" },
    { slug: "sets", name: "Gift Sets", description: "Curated rituals, beautifully boxed.", photo: "botanicals" },
  ],
  brands: [
    { slug: "petal-co", name: "Petal & Co", description: "Clean, plant-powered skincare since 2014.", photo: "facial" },
    { slug: "dune", name: "Dune", description: "Minimal formulas inspired by desert botanicals.", photo: "sandTube" },
    { slug: "maison-fleur", name: "Maison Fleur", description: "Fine fragrance from a family perfumery.", photo: "perfumePeach" },
    { slug: "verde", name: "Verde", description: "Colour cosmetics that care for your skin.", photo: "brushes" },
  ],
  editorial: { slug: "evening-ritual", title: "The Evening Ritual", description: "Unwind, repair and wake up glowing.", photo: "serumDrop" },
  highlights: {
    skincare: ["Suitable for sensitive skin", "Fragrance-free", "Dermatologist tested"],
    serums: ["High-performance actives", "Lightweight, fast-absorbing", "Vegan and cruelty-free"],
    makeup: ["Long-wearing", "Buildable coverage", "Enriched with skin-loving oils"],
    fragrance: ["Eau de parfum concentration", "Blended in Grasse", "Refillable bottle"],
    sets: ["Gift-ready packaging", "Travel-friendly sizes", "Save vs. buying separately"],
  },
  details: "Formulated without parabens, sulfates or synthetic fragrance. Vegan, cruelty-free and packaged in recyclable glass.",
  products: [
    { name: "Gentle Daily Cleanser", category: "skincare", brand: "petal-co", price: 34, photos: ["whiteBottles", "shelfie"], blurb: "A creamy, low-foam cleanser that removes make-up without stripping.", options: [["Size", ["150 ml", "300 ml"]]], collections: ["best-sellers"] },
    { name: "Renewal Face Cream", category: "skincare", brand: "dune", price: 42, photos: ["purpleTubes", "botanicals"], blurb: "A rich moisturiser with ceramides and squalane for all-day comfort.", options: [["Size", ["50 ml"]]], collections: ["best-sellers"] },
    { name: "Barrier Repair Lotion", category: "skincare", brand: "petal-co", price: 38, photos: ["creamTube", "shelfie"], blurb: "Lightweight hydration that strengthens a stressed skin barrier.", options: [["Size", ["50 ml", "100 ml"]]], collections: ["new-arrivals"] },
    { name: "Exfoliating Gel Trio", category: "skincare", brand: "dune", price: 29, compare: 36, photos: ["gelTubes", "sandTube"], blurb: "Three gentle AHA gels to smooth and brighten, one for each skin mood.", options: [["Size", ["3 × 30 ml"]]] },
    { name: "Overnight Recovery Balm", category: "skincare", brand: "petal-co", price: 46, photos: ["balmJars", "creamHand"], blurb: "A melting balm that works while you sleep; wake up to plumper skin.", options: [["Size", ["50 ml"]]], collections: ["new-arrivals"] },
    { name: "Hydra Glow Tube", category: "skincare", brand: "dune", price: 26, photos: ["sandTube", "botanicals"], blurb: "Hyaluronic gel-cream with a dewy, glass-skin finish.", options: [["Size", ["75 ml"]]] },
    { name: "Silk Body Cream", category: "skincare", brand: "petal-co", price: 36, photos: ["creamHand", "balmJars"], blurb: "Shea and oat body cream with a soft, powdery neroli scent.", options: [["Size", ["200 ml"]]], collections: ["best-sellers"] },
    { name: "Cleansing Foam", category: "skincare", brand: "dune", price: 28, photos: ["blueBottle", "shelfie"], blurb: "A cloud-like foam that lifts impurities and leaves skin soft.", options: [["Size", ["150 ml"]]] },
    { name: "Botanical Face Oil", category: "serums", brand: "petal-co", price: 58, photos: ["dropperBottle", "botanicals"], blurb: "Cold-pressed rosehip, jojoba and sea buckthorn for a radiant glow.", options: [["Size", ["30 ml"]]], collections: ["best-sellers"] },
    { name: "Vitamin C Brightening Serum", category: "serums", brand: "dune", price: 64, photos: ["goldDropper", "serumDrop"], blurb: "15% stabilised vitamin C to even tone and fade dark spots.", options: [["Size", ["30 ml", "50 ml"]]], collections: ["new-arrivals", "best-sellers"] },
    { name: "Night Recovery Serum", category: "serums", brand: "petal-co", price: 72, compare: 85, photos: ["serumDrop", "goldDropper"], blurb: "Gentle retinal and peptides for smoother, firmer skin by morning.", options: [["Size", ["30 ml"]]] },
    { name: "Satin Lipstick", category: "makeup", brand: "verde", price: 24, photos: ["lipstick", "palette"], blurb: "Cushiony colour with a satin finish that never dries lips.", options: [["Shade", ["Red", "Rose", "Coral"]]], collections: ["best-sellers"] },
    { name: "Nude Eyeshadow Palette", category: "makeup", brand: "verde", price: 48, compare: 58, photos: ["palette", "brushes"], blurb: "Twelve blendable mattes and shimmers for every occasion.", options: [["Shade", ["Nude"]]] },
    { name: "Complexion Kit", category: "makeup", brand: "verde", price: 54, photos: ["compact", "palette"], blurb: "Pressed powder, bronzer and highlighter in one refillable compact.", options: [["Shade", ["Light", "Medium", "Deep"]]], collections: ["new-arrivals"] },
    { name: "Essential Brush Set", category: "makeup", brand: "verde", price: 39, photos: ["brushes", "compact"], blurb: "Five vegan brushes for face and eyes, in a travel roll.", options: [["Color", ["Pink"]]] },
    { name: "Rose Eau de Parfum", category: "fragrance", brand: "maison-fleur", price: 120, photos: ["perfumeRose", "perfumePeach"], blurb: "Damask rose, pink pepper and a warm musky base.", options: [["Size", ["50 ml", "100 ml"]]], collections: ["best-sellers"] },
    { name: "Bleu Marine Eau de Toilette", category: "fragrance", brand: "maison-fleur", price: 98, photos: ["perfumeBlue", "perfumeNoir"], blurb: "Crisp bergamot, sea salt and cedarwood. Fresh all day.", options: [["Size", ["50 ml", "100 ml"]]] },
    { name: "Peach Blossom Parfum", category: "fragrance", brand: "maison-fleur", price: 135, compare: 150, photos: ["perfumePeach", "perfumeRose"], blurb: "Luminous white peach, jasmine and sandalwood.", options: [["Size", ["50 ml"]]], collections: ["new-arrivals"] },
    { name: "Noir Intense Parfum", category: "fragrance", brand: "maison-fleur", price: 145, photos: ["perfumeNoir", "perfumeBlue"], blurb: "Dark plum, oud and vanilla for evenings that linger.", options: [["Size", ["50 ml"]]], soldOut: true },
    { name: "Discovery Set", category: "sets", brand: "petal-co", price: 68, photos: ["shelfie", "botanicals"], blurb: "Six of our best-sellers in travel sizes: the perfect introduction.", options: [["Size", ["6 × 15 ml"]]], collections: ["best-sellers"] },
    { name: "Complete Ritual Set", category: "sets", brand: "petal-co", price: 89, compare: 110, photos: ["botanicals", "whiteBottles"], blurb: "Cleanse, treat and moisturise: a full routine, beautifully boxed.", options: [["Size", ["4 pieces"]]] },
  ],
  reviews: [
    { title: "My skin has never looked better", body: "Two weeks in and my skin is visibly calmer and brighter. Holy grail." },
    { title: "Gentle and effective", body: "I have very sensitive skin and this caused zero irritation. Lovely texture." },
    { title: "Smells divine", body: "Subtle, natural scent and it absorbs in seconds. Will repurchase." },
    { title: "Beautiful packaging", body: "Feels so luxurious. It made a wonderful gift for my sister." },
    { title: "Great, a little goes a long way", body: "Pricey but the bottle lasts ages, so it works out well." },
    { title: "Glowing!", body: "People keep asking what I've changed in my routine. It's this." },
    { title: "Nice but subtle", body: "Pleasant to use. Results are gradual rather than dramatic." },
    { title: "Staple in my routine", body: "I've been using it for a year and won't switch. Consistently good." },
  ],
  media: {
    hero: ["facial", "beautyPortrait", "botanicals"],
    banners: ["shelfie", "serumDrop", "perfumeRose"],
    lifestyle: ["whiteBottles", "goldDropper", "creamHand", "compact", "sandTube", "balmJars"],
  },
};

const HOME: VerticalSpec = {
  categories: [
    { slug: "living", name: "Living Room", description: "Sofas and chairs to sink into.", photo: "greenSofa" },
    { slug: "lighting", name: "Lighting", description: "Pendants and lamps that set the mood.", photo: "tealPendant" },
    { slug: "dining", name: "Kitchen & Dining", description: "Stoneware, seating and serveware.", photo: "bowls" },
    { slug: "bedroom", name: "Bedroom", description: "Linen, pillows and bedside essentials.", photo: "bedroom" },
    { slug: "decor", name: "Plants & Decor", description: "Living greenery and finishing touches.", photo: "succulent" },
  ],
  brands: [
    { slug: "oak-ash", name: "Oak & Ash", description: "Solid-wood furniture, built to be passed down.", photo: "woodChair" },
    { slug: "hearth-studio", name: "Hearth Studio", description: "Soft furnishings in natural fabrics.", photo: "pillow" },
    { slug: "lumen", name: "Lumen", description: "Lighting designed in Milan, made in Europe.", photo: "floorLamp" },
    { slug: "terra", name: "Terra", description: "Hand-thrown ceramics and potted plants.", photo: "mug" },
  ],
  editorial: { slug: "slow-living", title: "Slow Living", description: "Natural textures and calm corners for a home that restores you.", photo: "sunroom" },
  highlights: {
    living: ["Kiln-dried hardwood frame", "Removable, washable covers", "10-year frame warranty"],
    lighting: ["Dimmable", "E27 bulb included", "Fabric braided cable"],
    dining: ["Dishwasher safe", "Hand finished", "Food-safe glaze"],
    bedroom: ["Stonewashed European linen", "Breathable and temperature regulating", "OEKO-TEX certified"],
    decor: ["Delivered in a ceramic pot", "Easy care", "Pet friendly"],
  },
  details: "Delivered free by our two-person team, who will place it in the room of your choice and take the packaging away.",
  products: [
    { name: "Velvet Three-Seat Sofa", category: "living", brand: "hearth-studio", price: 1290, compare: 1490, photos: ["greenSofa", "loft"], blurb: "Deep seats, feather-wrapped cushions and a rich cotton velvet.", options: [["Color", ["Green", "Terracotta", "Stone"]]], collections: ["best-sellers"] },
    { name: "Leather Lounge Sofa", category: "living", brand: "oak-ash", price: 1690, photos: ["leatherSofa", "livingRoom"], blurb: "Aniline leather that ages beautifully, on a solid oak base.", options: [["Color", ["Tan", "Brown"]]], collections: ["new-arrivals"] },
    { name: "Modular Corner Sofa", category: "living", brand: "hearth-studio", price: 1390, photos: ["blueSofa", "greySofa"], blurb: "Rearrange the modules as your space changes. Covers are washable.", options: [["Color", ["Blue", "Grey"]]] },
    { name: "Tufted Accent Chair", category: "living", brand: "hearth-studio", price: 420, photos: ["tuftedChair", "sunroom"], blurb: "A button-tufted chair with turned legs, for a reading corner.", options: [["Color", ["Ivory", "Sage"]]], collections: ["best-sellers"] },
    { name: "Teal Enamel Pendant", category: "lighting", brand: "lumen", price: 189, photos: ["tealPendant", "kitchenIsland"], blurb: "Spun-steel pendant with a hand-applied enamel finish.", options: [["Color", ["Teal", "Black", "White"]]], collections: ["best-sellers"] },
    { name: "Task Floor Lamp", category: "lighting", brand: "lumen", price: 240, photos: ["floorLamp", "lounge"], blurb: "An adjustable arm and weighted base; perfect beside a sofa.", options: [["Color", ["Grey", "Black"]]], collections: ["new-arrivals"] },
    { name: "Matte Black Pendant", category: "lighting", brand: "lumen", price: 149, compare: 179, photos: ["blackPendant", "kitchen"], blurb: "A classic dome pendant in powder-coated matte black.", options: [["Color", ["Black"]]] },
    { name: "Oak Bar Stool", category: "dining", brand: "oak-ash", price: 145, photos: ["stool", "kitchenIsland"], blurb: "Solid white oak with a footrest, sized for kitchen islands.", options: [["Finish", ["Oak", "Walnut"]]] },
    { name: "Rustic Dining Chair", category: "dining", brand: "oak-ash", price: 180, photos: ["woodChair", "cooking"], blurb: "Steam-bent ash with a woven seat, made by hand in Portugal.", options: [["Finish", ["Natural"]]], collections: ["best-sellers"] },
    { name: "Molded Side Chair", category: "dining", brand: "oak-ash", price: 129, compare: 159, photos: ["blackChair", "loft"], blurb: "A mid-century shell chair on tapered oak legs.", options: [["Color", ["Black", "White"]]] },
    { name: "Porcelain Mug", category: "dining", brand: "terra", price: 18, photos: ["mug", "bowls"], blurb: "Thin-walled porcelain that keeps coffee hot and feels lovely in hand.", options: [["Color", ["White"]]], collections: ["new-arrivals"] },
    { name: "Stoneware Bowl Set", category: "dining", brand: "terra", price: 64, photos: ["bowls", "cooking"], blurb: "Four speckled stoneware bowls with a raw clay rim.", options: [["Color", ["Natural", "Stone"]]], collections: ["best-sellers"] },
    { name: "Stonewashed Linen Bedding Set", category: "bedroom", brand: "hearth-studio", price: 220, compare: 260, photos: ["bedroom", "bedside"], blurb: "Duvet cover and two pillowcases in breathable French linen.", options: [["Size", ["Double", "King", "Super King"]], ["Color", ["Natural", "Sage"]]], collections: ["best-sellers"] },
    { name: "Linen Cushion", category: "bedroom", brand: "hearth-studio", price: 45, photos: ["pillow", "greySofa"], blurb: "A feather-filled cushion in slubby washed linen.", options: [["Color", ["White", "Mustard", "Sage"]]] },
    { name: "Oak Bedside Table", category: "bedroom", brand: "oak-ash", price: 199, photos: ["bedside", "bedroom"], blurb: "A single drawer and open shelf, in solid oiled oak.", options: [["Finish", ["Oak"]]], soldOut: true },
    { name: "Amber Soy Candle", category: "decor", brand: "terra", price: 38, photos: ["candle", "pampasSofa"], blurb: "Fig, cedar and amber. Hand-poured, with a 50-hour burn.", options: [["Size", ["200 g", "400 g"]]], collections: ["new-arrivals", "best-sellers"] },
    { name: "Succulent in Glazed Pot", category: "decor", brand: "terra", price: 42, photos: ["succulent", "sunroom"], blurb: "An easy-care succulent in a hand-glazed ceramic pot.", options: [["Color", ["Teal"]]] },
    { name: "Cactus in Terracotta", category: "decor", brand: "terra", price: 36, compare: 45, photos: ["cactus", "lounge"], blurb: "A sculptural cactus in a classic terracotta pot.", options: [["Size", ["Small", "Medium"]]], collections: ["new-arrivals"] },
  ],
  reviews: [
    { title: "Even better in person", body: "The quality is superb and the colour is exactly as pictured. It completely changed the room." },
    { title: "Delivery was a dream", body: "The team carried it upstairs, set it up and took all the packaging. Five stars." },
    { title: "Beautifully made", body: "You can tell it's built to last. Solid, heavy and perfectly finished." },
    { title: "So comfortable", body: "We spend every evening on it. Worth the investment." },
    { title: "Lovely, took a while", body: "Gorgeous piece, though delivery took three weeks. Worth the wait." },
    { title: "Perfect gift", body: "Bought as a housewarming present and it was a huge hit." },
    { title: "Great value", body: "Feels far more expensive than it is. Would buy again." },
    { title: "Calm and elegant", body: "Exactly the understated look we wanted for our bedroom." },
  ],
  media: {
    hero: ["livingRoom", "sunroom", "greySofa"],
    banners: ["loft", "kitchen", "bedroom"],
    lifestyle: ["pampasSofa", "lounge", "yellowChairRoom", "cooking", "kitchenIsland", "bedside"],
  },
};

const SPECS: Record<Vertical, VerticalSpec> = { fashion: FASHION, electronics: ELECTRONICS, beauty: BEAUTY, home: HOME };

// --------------------------------------------------------------- generation

/** Small deterministic PRNG so demo data is identical on server and client. */
function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export const slugify = (text: string) =>
  text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const AUTHORS = ["Emma W.", "Liam K.", "Sofia R.", "Noah B.", "Mia T.", "Lucas P.", "Ava M.", "Ethan S.", "Chloe D.", "Oliver H.", "Isla F.", "James C.", "Zara N.", "Leo G."];
const NOW = Date.UTC(2026, 8, 20);
const daysAgo = (days: number) => new Date(NOW - days * 86_400_000).toISOString();

type Generated = {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  collections: Collection[];
  reviews: Map<string, Review[]>;
  /** Popularity used by "Best selling" sort (internal to the mock). */
  sold: Map<string, number>;
  media: StoreMedia;
};

function cartesian(options: OptionSpec[]): Record<string, string>[] {
  return options.reduce<Record<string, string>[]>(
    (combos, [name, values]) => combos.flatMap((combo) => values.map((value) => ({ ...combo, [name]: value }))),
    [{}],
  );
}

function generate(vertical: Vertical): Generated {
  const spec = SPECS[vertical];
  const categoryRefs = new Map(spec.categories.map((c) => [c.slug, { id: `${vertical}-cat-${c.slug}`, slug: c.slug, name: c.name }]));
  const brandRefs = new Map(spec.brands.map((b) => [b.slug, { id: `${vertical}-brand-${b.slug}`, slug: b.slug, name: b.name }]));
  const reviews = new Map<string, Review[]>();
  const sold = new Map<string, number>();

  const products = spec.products.map((p, index): Product => {
    const id = `${vertical}-p${String(index + 1).padStart(2, "0")}`;
    const random = seeded(id);
    const slug = slugify(p.name);
    const optionSpecs = p.options ?? [];
    const options: ProductOption[] = optionSpecs.map(([name, values]) => ({
      name,
      values: values.map((value) => ({ value, swatch: /color|shade|finish/i.test(name) ? SWATCHES[value] : undefined })),
    }));

    const combos = cartesian(optionSpecs);
    const upgradeOption = optionSpecs.find(([name]) => /storage|memory|size/i.test(name) && vertical !== "fashion");
    const variants: ProductVariant[] = combos.map((combo, i) => {
      // Bigger storage / sizes cost more (except apparel sizes).
      const step = upgradeOption ? upgradeOption[1].indexOf(combo[upgradeOption[0]]) : 0;
      const bump = step > 0 ? Math.round(p.price * 0.15 * step) : 0;
      const inventory = p.soldOut ? 0 : random() < 0.12 ? 0 : random() < 0.2 ? 1 + Math.floor(random() * 4) : 8 + Math.floor(random() * 40);
      return {
        id: `${id}-v${i + 1}`,
        title: Object.values(combo).join(" / ") || "Default",
        options: combo,
        sku: `${vertical.slice(0, 2).toUpperCase()}-${String(index + 1).padStart(3, "0")}-${i + 1}`,
        price: p.price + bump,
        compareAtPrice: p.compare ? p.compare + bump : null,
        inventory,
      };
    });
    if (variants.every((v) => v.inventory === 0) && !p.soldOut) variants[0].inventory = 12;

    const isNew = p.collections?.includes("new-arrivals") ?? false;
    const isBest = p.collections?.includes("best-sellers") ?? false;
    const available = variants.some((v) => v.inventory > 0);

    // Reviews: 3–12 per product, skewed positive like real stores.
    const count = 3 + Math.floor(random() * 10);
    const list: Review[] = Array.from({ length: count }, (_, r) => {
      const roll = random();
      const rating = roll < 0.62 ? 5 : roll < 0.9 ? 4 : roll < 0.97 ? 3 : 2;
      const template = spec.reviews[Math.floor(random() * spec.reviews.length)];
      return {
        id: `${id}-r${r + 1}`,
        productId: id,
        author: AUTHORS[Math.floor(random() * AUTHORS.length)],
        rating,
        title: template.title,
        body: template.body,
        createdAt: daysAgo(3 + Math.floor(random() * 240)),
        verified: random() > 0.2,
      };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    reviews.set(id, list);
    sold.set(id, Math.floor(random() * 400) + (isBest ? 600 : 0));

    const badges: ProductBadge[] = [];
    if (!available) badges.push("sold-out");
    else if (p.compare) badges.push("sale");
    if (isNew) badges.push("new");
    if (isBest && badges.length < 2) badges.push("bestseller");

    const [main, ...rest] = p.photos;
    const category = categoryRefs.get(p.category)!;
    return {
      id,
      slug,
      name: p.name,
      description: `${p.blurb} ${spec.details}`,
      highlights: spec.highlights[p.category] ?? [],
      brand: brandRefs.get(p.brand)!,
      category,
      collections: [...(p.collections ?? []), ...(p.compare ? ["sale"] : [])],
      tags: [category.name.toLowerCase(), ...(p.tags ?? [])],
      images: [
        photo(main, p.name, { w: 1200, h: 1500 }),
        photo(main, `${p.name}, detail`, { w: 1200, h: 1500, zoom: 1.9, focusY: 0.45 }),
        ...rest.map((key) => photo(key, `${p.name} styled`, { w: 1200, h: 1500 })),
      ],
      price: Math.min(...variants.map((v) => v.price)),
      compareAtPrice: p.compare ?? null,
      options,
      variants,
      rating: { average: Math.round((list.reduce((sum, r) => sum + r.rating, 0) / list.length) * 10) / 10, count: list.length },
      badges,
      available,
      createdAt: daysAgo(isNew ? 2 + Math.floor(random() * 20) : 30 + Math.floor(random() * 300)),
    };
  });

  const countBy = (key: "category" | "brand", slug: string) => products.filter((p) => p[key].slug === slug).length;
  const categories: Category[] = spec.categories.map((c) => ({
    ...categoryRefs.get(c.slug)!,
    description: c.description,
    image: photo(c.photo, c.name, { w: 900, h: 1100 }),
    productCount: countBy("category", c.slug),
  }));
  const brands: Brand[] = spec.brands.map((b) => ({
    ...brandRefs.get(b.slug)!,
    description: b.description,
    image: photo(b.photo, b.name, { w: 900, h: 700 }),
    productCount: countBy("brand", b.slug),
  }));
  const collections: Collection[] = [
    { id: `${vertical}-col-new`, slug: "new-arrivals", title: "New Arrivals", description: "Just landed: the latest additions to the collection.", image: photo(spec.media.banners[0], "New arrivals", { w: 1600, h: 900 }) },
    { id: `${vertical}-col-best`, slug: "best-sellers", title: "Best Sellers", description: "The pieces our customers love most.", image: photo(spec.media.banners[1], "Best sellers", { w: 1600, h: 900 }) },
    { id: `${vertical}-col-sale`, slug: "sale", title: "Sale", description: "Limited-time prices on favourites.", image: photo(spec.media.banners[2], "Sale", { w: 1600, h: 900 }) },
    { id: `${vertical}-col-ed`, slug: spec.editorial.slug, title: spec.editorial.title, description: spec.editorial.description, image: photo(spec.editorial.photo, spec.editorial.title, { w: 1600, h: 900 }) },
  ];

  const media: StoreMedia = {
    hero: spec.media.hero.map((key) => photo(key, "", { w: 2000, h: 1100 })),
    banners: spec.media.banners.map((key) => photo(key, "", { w: 1600, h: 1000 })),
    lifestyle: spec.media.lifestyle.map((key) => photo(key, "", { w: 1200, h: 1400 })),
  };

  return { products, categories, brands, collections, reviews, sold, media };
}

const cache = new Map<Vertical, Generated>();

export function demoCatalog(vertical: Vertical): Generated {
  let data = cache.get(vertical);
  if (!data) {
    data = generate(vertical);
    cache.set(vertical, data);
  }
  return data;
}

// ---------------------------------------------------------- demo store profiles

const CHECKOUT = { freeShippingThreshold: 75, standardRate: 6, expressRate: 15, taxRate: 0.08 };

export function demoStoreProfile(vertical: Vertical, name: string, tagline: string): StoreProfile {
  const spec = SPECS[vertical];
  const handle = slugify(name).replace(/-/g, "");
  return {
    name,
    tagline,
    logo: "",
    favicon: "",
    currency: "USD",
    contact: { email: `hello@${handle}.com`, phone: "+1 (555) 014-2290", address: "118 Mercer Street, New York, NY 10012" },
    social: {
      instagram: `https://instagram.com/${handle}`,
      facebook: `https://facebook.com/${handle}`,
      x: "",
      tiktok: `https://tiktok.com/@${handle}`,
      youtube: "",
      pinterest: vertical === "home" || vertical === "fashion" ? `https://pinterest.com/${handle}` : "",
    },
    announcement: {
      enabled: true,
      text: `Free shipping on orders over $${CHECKOUT.freeShippingThreshold} · 30-day returns`,
      link: "/products",
    },
    navigation: [
      { label: "New in", href: "/products?collection=new-arrivals" },
      ...spec.categories.slice(0, 4).map((c) => ({ label: c.name, href: `/categories/${c.slug}` })),
      { label: "Sale", href: "/products?collection=sale" },
    ],
    checkout: CHECKOUT,
  };
}
