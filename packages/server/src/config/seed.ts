import { Store, Product, Inventory } from "@/models";



const STORES = [
  // North America
  { name: "New York Times Square", slug: "nyc-times-square", city: "New York", country: "USA" },
  { name: "San Francisco Union Square", slug: "sf-union-square", city: "San Francisco", country: "USA" },
  { name: "Toronto Eaton Centre", slug: "toronto-eaton", city: "Toronto", country: "Canada" },
  { name: "Mexico City Reforma", slug: "cdmx-reforma", city: "Mexico City", country: "Mexico" },
  
  // South America
  { name: "São Paulo Paulista", slug: "sp-paulista", city: "São Paulo", country: "Brazil" },
  { name: "Buenos Aires Palermo", slug: "ba-palermo", city: "Buenos Aires", country: "Argentina" },
  { name: "Lima Miraflores", slug: "lima-miraflores", city: "Lima", country: "Peru" },
  
  // Europe
  { name: "London Oxford Street", slug: "london-oxford", city: "London", country: "UK" },
  { name: "Paris Champs-Élysées", slug: "paris-champs", city: "Paris", country: "France" },
  { name: "Berlin Alexanderplatz", slug: "berlin-alex", city: "Berlin", country: "Germany" },
  { name: "Amsterdam Dam Square", slug: "amsterdam-dam", city: "Amsterdam", country: "Netherlands" },
  { name: "Stockholm Sergels Torg", slug: "stockholm-sergels", city: "Stockholm", country: "Sweden" },
  
  // Asia
  { name: "Tokyo Shibuya", slug: "tokyo-shibuya", city: "Tokyo", country: "Japan" },
  { name: "Singapore Orchard Road", slug: "sg-orchard", city: "Singapore", country: "Singapore" },
  { name: "Seoul Gangnam", slug: "seoul-gangnam", city: "Seoul", country: "South Korea" },
  { name: "Mumbai Bandra", slug: "mumbai-bandra", city: "Mumbai", country: "India" },
  { name: "Dubai Mall", slug: "dubai-mall", city: "Dubai", country: "UAE" },
  { name: "Shanghai Nanjing Road", slug: "shanghai-nanjing", city: "Shanghai", country: "China" },
  
  // Africa
  { name: "Cape Town V&A Waterfront", slug: "capetown-va", city: "Cape Town", country: "South Africa" },
  { name: "Lagos Victoria Island", slug: "lagos-vi", city: "Lagos", country: "Nigeria" },
  { name: "Nairobi Westlands", slug: "nairobi-westlands", city: "Nairobi", country: "Kenya" },
  { name: "Cairo City Stars", slug: "cairo-citystars", city: "Cairo", country: "Egypt" },
  
  // Oceania
  { name: "Sydney Pitt Street", slug: "sydney-pitt", city: "Sydney", country: "Australia" },
  { name: "Melbourne CBD", slug: "melbourne-cbd", city: "Melbourne", country: "Australia" },
  { name: "Auckland Queen Street", slug: "auckland-queen", city: "Auckland", country: "New Zealand" },
];

const PRODUCTS = [
  // Premium Electronics (ELC-XXX)
  { sku: "ELC-001", name: "MacBook Pro 16\" M3 Max", category: "Electronics", price: 3499.99 },
  { sku: "ELC-002", name: "MacBook Air 15\" M3", category: "Electronics", price: 1299.99 },
  { sku: "ELC-003", name: "iPad Pro 13\" M4", category: "Electronics", price: 1299.99 },
  { sku: "ELC-004", name: "iPhone 15 Pro Max 256GB", category: "Electronics", price: 1199.99 },
  { sku: "ELC-005", name: "iPhone 15 Pro 128GB", category: "Electronics", price: 999.99 },
  { sku: "ELC-006", name: "AirPods Pro 2nd Gen", category: "Electronics", price: 249.99 },
  { sku: "ELC-007", name: "AirPods Max", category: "Electronics", price: 549.99 },
  { sku: "ELC-008", name: "Apple Watch Ultra 2", category: "Electronics", price: 799.99 },
  { sku: "ELC-009", name: "Apple Watch Series 9", category: "Electronics", price: 399.99 },
  { sku: "ELC-010", name: "Sony WH-1000XM5", category: "Electronics", price: 349.99 },
  { sku: "ELC-011", name: "Bose QuietComfort Ultra", category: "Electronics", price: 429.99 },
  { sku: "ELC-012", name: "Samsung 32\" 4K Monitor", category: "Electronics", price: 449.99 },
  { sku: "ELC-013", name: "LG UltraWide 34\"", category: "Electronics", price: 699.99 },
  { sku: "ELC-014", name: "Logitech MX Master 3S", category: "Electronics", price: 99.99 },
  { sku: "ELC-015", name: "Logitech MX Keys", category: "Electronics", price: 119.99 },
  { sku: "ELC-016", name: "Keychron Q1 Pro", category: "Electronics", price: 199.99 },
  { sku: "ELC-017", name: "Elgato Stream Deck", category: "Electronics", price: 149.99 },
  { sku: "ELC-018", name: "Webcam Logitech Brio 4K", category: "Electronics", price: 199.99 },
  { sku: "ELC-019", name: "CalDigit TS4 Dock", category: "Electronics", price: 449.99 },
  { sku: "ELC-020", name: "Anker USB-C Hub 10-in-1", category: "Electronics", price: 79.99 },
  
  // Premium Furniture (FRN-XXX)
  { sku: "FRN-001", name: "Herman Miller Aeron Chair", category: "Furniture", price: 1395.99 },
  { sku: "FRN-002", name: "Steelcase Leap V2", category: "Furniture", price: 1199.99 },
  { sku: "FRN-003", name: "Secretlab Titan Evo", category: "Furniture", price: 519.99 },
  { sku: "FRN-004", name: "Uplift V2 Standing Desk", category: "Furniture", price: 799.99 },
  { sku: "FRN-005", name: "Jarvis Bamboo Desk", category: "Furniture", price: 699.99 },
  { sku: "FRN-006", name: "Fully Monitor Arm Dual", category: "Furniture", price: 329.99 },
  { sku: "FRN-007", name: "Rain Design mStand", category: "Furniture", price: 49.99 },
  { sku: "FRN-008", name: "Grovemade Desk Shelf", category: "Furniture", price: 229.99 },
  { sku: "FRN-009", name: "BenQ ScreenBar Plus", category: "Furniture", price: 129.99 },
  { sku: "FRN-010", name: "Dyson Solarcycle Morph", category: "Furniture", price: 649.99 },
  { sku: "FRN-011", name: "Humanscale Foot Rocker", category: "Furniture", price: 89.99 },
  { sku: "FRN-012", name: "Branch Furniture Drawer", category: "Furniture", price: 249.99 },
  
  // Office Supplies (OFS-XXX)
  { sku: "OFS-001", name: "Moleskine Classic XL", category: "Office Supplies", price: 24.99 },
  { sku: "OFS-002", name: "Leuchtturm1917 A5", category: "Office Supplies", price: 19.99 },
  { sku: "OFS-003", name: "Pilot Vanishing Point", category: "Office Supplies", price: 152.99 },
  { sku: "OFS-004", name: "LAMY 2000 Fountain Pen", category: "Office Supplies", price: 199.99 },
  { sku: "OFS-005", name: "Zebra Sarasa Clip 10-Pack", category: "Office Supplies", price: 14.99 },
  { sku: "OFS-006", name: "Post-it Super Sticky", category: "Office Supplies", price: 18.99 },
  { sku: "OFS-007", name: "Quartet Glass Whiteboard", category: "Office Supplies", price: 189.99 },
  { sku: "OFS-008", name: "Expo Dry Erase Set", category: "Office Supplies", price: 22.99 },
  { sku: "OFS-009", name: "Brother P-Touch Label Maker", category: "Office Supplies", price: 59.99 },
  { sku: "OFS-010", name: "Swingline Heavy Duty Stapler", category: "Office Supplies", price: 34.99 },
  { sku: "OFS-011", name: "Bostitch Electric Sharpener", category: "Office Supplies", price: 29.99 },
  { sku: "OFS-012", name: "Scotch Desktop Dispenser", category: "Office Supplies", price: 24.99 },
  
  // Appliances (APL-XXX)
  { sku: "APL-001", name: "Breville Barista Express", category: "Appliances", price: 699.99 },
  { sku: "APL-002", name: "Fellow Ode Grinder", category: "Appliances", price: 299.99 },
  { sku: "APL-003", name: "Chemex 8-Cup Classic", category: "Appliances", price: 44.99 },
  { sku: "APL-004", name: "Fellow Stagg EKG Kettle", category: "Appliances", price: 169.99 },
  { sku: "APL-005", name: "Nespresso Vertuo Next", category: "Appliances", price: 179.99 },
  { sku: "APL-006", name: "Dyson Pure Cool TP04", category: "Appliances", price: 549.99 },
  { sku: "APL-007", name: "Blueair Blue Pure 311", category: "Appliances", price: 249.99 },
  { sku: "APL-008", name: "Vornado 660 Air Circulator", category: "Appliances", price: 99.99 },
  { sku: "APL-009", name: "Honeywell Space Heater", category: "Appliances", price: 64.99 },
  { sku: "APL-010", name: "Ember Mug 14oz", category: "Appliances", price: 149.99 },
  
  // Accessories (ACC-XXX)
  { sku: "ACC-001", name: "Peak Design Everyday V2 20L", category: "Accessories", price: 259.99 },
  { sku: "ACC-002", name: "Bellroy Tech Kit", category: "Accessories", price: 69.99 },
  { sku: "ACC-003", name: "Twelve South BookArc", category: "Accessories", price: 59.99 },
  { sku: "ACC-004", name: "Native Union Desk Mat", category: "Accessories", price: 79.99 },
  { sku: "ACC-005", name: "Orbitkey Desk Mat", category: "Accessories", price: 89.99 },
  { sku: "ACC-006", name: "Grovemade Wool Felt Pad", category: "Accessories", price: 89.99 },
  { sku: "ACC-007", name: "Anker 3-in-1 MagSafe Cube", category: "Accessories", price: 149.99 },
  { sku: "ACC-008", name: "Nomad Base One Max", category: "Accessories", price: 149.99 },
  { sku: "ACC-009", name: "Yeti Rambler 26oz", category: "Accessories", price: 35.99 },
  { sku: "ACC-010", name: "Hydro Flask 32oz", category: "Accessories", price: 44.99 },
  { sku: "ACC-011", name: "Felix Gray Blue Light", category: "Accessories", price: 95.99 },
  { sku: "ACC-012", name: "Twelve South Curve Flex", category: "Accessories", price: 79.99 },
  { sku: "ACC-013", name: "Moft Laptop Stand", category: "Accessories", price: 29.99 },
  { sku: "ACC-014", name: "Anker PowerCore 26800", category: "Accessories", price: 65.99 },
  { sku: "ACC-015", name: "Satechi R1 Presenter", category: "Accessories", price: 59.99 },
  
  // Storage & Organization (STG-XXX)
  { sku: "STG-001", name: "Samsung T7 Shield 2TB SSD", category: "Storage", price: 189.99 },
  { sku: "STG-002", name: "SanDisk Extreme Pro 1TB", category: "Storage", price: 129.99 },
  { sku: "STG-003", name: "WD My Passport 4TB", category: "Storage", price: 109.99 },
  { sku: "STG-004", name: "Seagate Backup Plus 5TB", category: "Storage", price: 119.99 },
  { sku: "STG-005", name: "LaCie Rugged Mini 4TB", category: "Storage", price: 149.99 },
  
  // Audio & Video (AV-XXX)
  { sku: "AV-001", name: "Rode NT-USB Mini", category: "Audio/Video", price: 99.99 },
  { sku: "AV-002", name: "Blue Yeti X", category: "Audio/Video", price: 169.99 },
  { sku: "AV-003", name: "Shure MV7", category: "Audio/Video", price: 249.99 },
  { sku: "AV-004", name: "Elgato Key Light", category: "Audio/Video", price: 199.99 },
  { sku: "AV-005", name: "Logitech Litra Glow", category: "Audio/Video", price: 59.99 },
  { sku: "AV-006", name: "Sony ZV-1 II Vlog Camera", category: "Audio/Video", price: 899.99 },
  { sku: "AV-007", name: "DJI Pocket 3", category: "Audio/Video", price: 519.99 },
  
  // Gaming (GMG-XXX)
  { sku: "GMG-001", name: "PlayStation 5 Slim", category: "Gaming", price: 449.99 },
  { sku: "GMG-002", name: "Xbox Series X", category: "Gaming", price: 499.99 },
  { sku: "GMG-003", name: "Nintendo Switch OLED", category: "Gaming", price: 349.99 },
  { sku: "GMG-004", name: "Steam Deck OLED 512GB", category: "Gaming", price: 549.99 },
  { sku: "GMG-005", name: "Razer BlackWidow V4", category: "Gaming", price: 169.99 },
  { sku: "GMG-006", name: "SteelSeries Arctis Nova Pro", category: "Gaming", price: 349.99 },
  { sku: "GMG-007", name: "Razer DeathAdder V3", category: "Gaming", price: 89.99 },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export async function seedDatabase() {
  console.log("=> Reseeding database...");
  await Promise.all([
    Store.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
  ]);

  // Create stores
  const stores = await Store.insertMany(
    STORES.map(({ name, slug }) => ({ name, slug }))
  );

  // Create products
  const products = await Product.insertMany(PRODUCTS);

  // Create inventory with drastic differences in product counts per store
  // Distribution: flagship (all 67), large (40-60), medium (15-35), small (3-12), empty (0)
  const inventoryItems: { storeId: unknown; productId: unknown; quantity: number; lowStockThreshold: number }[] = [];
  
  // Define store tiers for variety (indices into sorted stores array)
  const storeTiers = stores.map((_, i) => {
    if (i === 0) return "flagship";      // 1 flagship with all products
    if (i < 4) return "large";           // 3 large stores
    if (i < 10) return "medium";         // 6 medium stores
    if (i < 20) return "small";          // 10 small stores
    if (i < 24) return "tiny";           // 4 tiny stores
    return "empty";                       // 1 empty store (newest)
  });

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];
    const tier = storeTiers[i];
    
    let productCount: number;
    switch (tier) {
      case "flagship":
        productCount = products.length; // All 86 products
        break;
      case "large":
        productCount = randomInt(55, 75);
        break;
      case "medium":
        productCount = randomInt(25, 50);
        break;
      case "small":
        productCount = randomInt(8, 22);
        break;
      case "tiny":
        productCount = randomInt(1, 6);
        break;
      case "empty":
      default:
        productCount = 0; // New store, no inventory yet
        break;
    }
    
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    const storeProducts = shuffled.slice(0, productCount);

    for (const product of storeProducts) {
      const isHighDemand = Math.random() < 0.3;
      const isLowStock = Math.random() < 0.2;
      
      let quantity: number;
      if (isLowStock) {
        quantity = randomInt(1, 9);
      } else if (isHighDemand) {
        quantity = randomInt(100, 500);
      } else {
        quantity = randomInt(15, 150);
      }
      
      const threshold = randomInt(8, 20);

      inventoryItems.push({
        storeId: store._id,
        productId: product._id,
        quantity,
        lowStockThreshold: threshold,
      });
    }
  }

  await Inventory.insertMany(inventoryItems);

  console.log(`=> Database seeded: ${stores.length} stores (product counts: 0–${products.length}), ${products.length} products, ${inventoryItems.length} inventory items`);
}
