import type { StoreImage } from "../types";

// DEMO IMAGERY (development only). Curated Unsplash photos so every demo store
// looks finished: products, banners, categories and brands never render empty.
// In production, images come from the merchant's catalog/media library via
// the API; nothing outside ./mock references these ids.

const PHOTOS = {
  // Fashion
  rack: "1523381210434-271e8be1f52b",
  boutique: "1441986300917-64674bd600d8",
  shopper: "1483985988355-763728e1935b",
  yellowSuit: "1515886657613-9f3515b0c78f",
  hangingTops: "1490481651871-ab68de25d43d",
  creamKnit: "1434389677669-e08b4cac3105",
  wardrobe: "1445205170230-053b83016050",
  summer: "1469334031218-e382a71b716b",
  leatherLook: "1487222477894-8943e31ef7b2",
  neutralRack: "1512436991641-6745cdb1723f",
  whiteTee: "1521572163474-6864f9cf17ab",
  graphicTee: "1576566588028-4147f3842f27",
  leatherJacket: "1551028719-00167b16eac5",
  bomber: "1591047139829-d91aecb6caea",
  jeansStack: "1542272604-787c3835535d",
  jeansStreet: "1541099649105-f69ad21f3246",
  loungePants: "1594633312681-425c7b97ccd1",
  redDress: "1595777457583-95e059d581b8",
  beachDress: "1539008835657-9e8e9680c956",
  redRunner: "1542291026-7eec264c27ff",
  suedeSneaker: "1549298916-b41d501d3772",
  sculptedTrainer: "1560769629-975ec94e6a86",
  retroTrainer: "1600185365483-26d7a4cc7519",
  backpack: "1553062407-98eeb64c6a62",
  redBag: "1584917865442-de89df76afd3",
  tanBag: "1590874103328-eac38a683ce7",
  roundSunglasses: "1511499767150-a48a237f0083",
  wayfarers: "1572635196237-14b3f281503f",
  whiteWatch: "1523275335684-37898b6baf30",
  leatherWatch: "1524592094714-0f0654e20314",
  cap: "1556306535-0f09a537f0a3",
  teeRack: "1576871337622-98d48d1cf531",
  sweatshirt: "1620799140408-edc6dcb6d633",
  hoodie: "1556821840-3a63f95609a7",
  pinkStudio: "1503342217505-b0a15ec3261c",
  suit: "1507679799987-c73779587ccf",
  tealStudio: "1509631179647-0177331693ae",
  streetCoat: "1485968579580-b6d095142e6e",
  seaside: "1496747611176-843222e1e57c",
  earthRack: "1558769132-cb1aea458c5e",
  flatLay: "1525507119028-ed4c629a60a3",
  // Electronics
  yellowHeadphones: "1505740420928-5e560c06d30e",
  anc: "1546435770-a3e426bf472b",
  wiredHeadphones: "1583394838336-acd977736f90",
  hifi: "1484704849700-f032a568e944",
  redBuds: "1606220588913-b3aacb4d2f46",
  budsCase: "1590658268037-6bf12165a8df",
  airBuds: "1572569511254-d8f925fe2cbb",
  devices: "1498049794561-7780e7231661",
  laptopDesk: "1496181133206-80ce9b88a853",
  laptopNeon: "1517336714731-489689fd1ca8",
  laptopGlow: "1525547719571-a2d4ac8945e2",
  phoneTable: "1511707171634-5f897ff02aa9",
  phoneWood: "1592899677977-9c10ca588bbd",
  phoneHand: "1510557880182-3d4d3cba35a5",
  watchBlack: "1546868871-7041f2a55e12",
  watchApps: "1579586337278-3befd40fd17a",
  watchWrist: "1508685096489-7aacd43bd3b1",
  speakerPortable: "1608043152269-423dbba4e7e1",
  speakerShelf: "1545454675-3531b543be5d",
  speakerPrism: "1589003077984-894e133dabab",
  cameraDark: "1516035069371-29a1b244cc32",
  mirrorless: "1502920917128-1aa500764cbd",
  instant: "1526170375885-4d8ecf77b99f",
  workspace: "1593642632559-0c6d3fc62b89",
  keyboardWhite: "1587829741301-dc798b83add3",
  keyboardMech: "1618384887929-16ec33fab9ef",
  mouse: "1527864550417-7fd91fc51a46",
  controllerWhite: "1606144042614-b2417e99c4e3",
  controllerBlack: "1592840496694-26d035b52b48",
  tablet: "1544244015-0df4b3ffc6b0",
  tabletHand: "1561154464-82e9adf32764",
  techFlatLay: "1550009158-9ebf69173e03",
  techDesk: "1468495244123-6c6c332eeece",
  team: "1519389950473-47ba0277781c",
  laptopDark: "1531297484001-80022131f5a1",
  smartHome: "1558089687-f282ffcbc126",
  // Beauty
  compact: "1522335789203-aabd1fc54bc9",
  brushes: "1596462502278-27bfdc403348",
  purpleTubes: "1571781926291-c477ebfd024b",
  facial: "1570172619644-dfd03ed5d881",
  sandTube: "1556228578-8c89e6adf883",
  gelTubes: "1608248597279-f99d160bfcbc",
  creamTube: "1620916566398-39f1143ab7be",
  dropperBottle: "1611930022073-b7a4ba5fcccd",
  shelfie: "1598440947619-2c35fc9aa908",
  botanicals: "1612817288484-6f916006741a",
  whiteBottles: "1631729371254-42c2892f0e6e",
  lipstick: "1586495777744-4413f21062fa",
  palette: "1512496015851-a90fb38ba796",
  beautyPortrait: "1487412947147-5cebf100ffc2",
  serumDrop: "1515377905703-c4788e51af15",
  perfumePeach: "1541643600914-78b084683601",
  perfumeRose: "1592945403244-b3fbafd7f539",
  perfumeBlue: "1523293182086-7651a899d37f",
  perfumeNoir: "1594035910387-fea47794261f",
  blueBottle: "1556229010-6c3f2c9ca5f8",
  goldDropper: "1617897903246-719242758050",
  balmJars: "1599305090598-fe179d501227",
  creamHand: "1601049541289-9b1b7bbbfe19",
  // Home
  greenSofa: "1555041469-a586c61ea9bc",
  greySofa: "1493663284031-b7e3aefcae8e",
  yellowChairRoom: "1586023492125-27b2c045efd7",
  lounge: "1524758631624-e2822e304c36",
  tuftedChair: "1567538096630-e0c55bd6374c",
  stool: "1503602642458-232111445657",
  woodChair: "1506439773649-6e0eb8cfb237",
  blackChair: "1592078615290-033ee584e267",
  leatherSofa: "1540574163026-643ea20ade25",
  tealPendant: "1513506003901-1e6a229e2d15",
  floorLamp: "1507473885765-e6ed057f782c",
  blackPendant: "1565814329452-e1efa11c5b89",
  succulent: "1485955900006-10f4d324d411",
  cactus: "1459411552884-841db9b3cc2a",
  mug: "1514228742587-6b1558fcca3d",
  bowls: "1610701596007-11502861dcfa",
  pampasSofa: "1578500494198-246f612d3b3d",
  kitchenIsland: "1602028915047-37269d1a73f7",
  candle: "1603006905003-be475563bc59",
  pillow: "1584100936595-c0654b55a2e2",
  bedside: "1522771739844-6a9f6d5f14af",
  bedroom: "1505693416388-ac5ce068fe85",
  kitchen: "1556911220-bff31c812dba",
  cooking: "1556909114-f6e7ad7d3136",
  blueSofa: "1484101403633-562f891dc89a",
  loft: "1538688525198-9b88f6f53126",
  livingRoom: "1616486338812-3dadae4b4ace",
  sunroom: "1618220179428-22790b461013",
  // General retail
  shopRail: "1441984904996-e0b6ba687e04",
  openSign: "1472851294608-062f824d29cc",
  giftBags: "1607082348824-0a96f2a4b9da",
} as const;

export type PhotoKey = keyof typeof PHOTOS;

type Crop = { w?: number; h?: number; zoom?: number; focusY?: number };

/** Unsplash CDN URL. `zoom` makes a close-up "detail shot" of the same photo. */
export function photoUrl(key: PhotoKey, { w = 1200, h, zoom, focusY = 0.5 }: Crop = {}) {
  const params = new URLSearchParams({ auto: "format", fit: "crop", w: String(w), q: "80" });
  if (h) params.set("h", String(h));
  if (zoom) {
    params.set("crop", "focalpoint");
    params.set("fp-x", "0.5");
    params.set("fp-y", String(focusY));
    params.set("fp-z", String(zoom));
  }
  return `https://images.unsplash.com/photo-${PHOTOS[key]}?${params}`;
}

export const photo = (key: PhotoKey, alt: string, crop?: Crop): StoreImage => ({ url: photoUrl(key, crop), alt });
