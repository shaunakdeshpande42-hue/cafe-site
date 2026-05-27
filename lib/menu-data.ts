export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  badge?: string;
  note?: string; // e.g. "Pack of 6", "450g", "500g · 1kg available"
}

export const categories = [
  { id: "desserts",   label: "Desserts" },
  { id: "cakes",      label: "Cakes" },
  { id: "bakes",      label: "Bakes & Breads" },
  { id: "savoury",    label: "Savoury" },
  { id: "beverages",  label: "Beverages" },
];

export const menuItems: MenuItem[] = [

  // ── DESSERTS ──────────────────────────────────────────────────────────────

  {
    id: "profiteroles",
    name: "Profiteroles",
    description: "Light choux puffs filled with silky pastry cream, finished with a dark chocolate glaze.",
    price: 155,
    category: "desserts",
  },
  {
    id: "chocolate-eclairs",
    name: "Chocolate Eclairs",
    description: "Classic French éclairs — crisp choux, velvety chocolate cream, glossy ganache on top.",
    price: 185,
    category: "desserts",
    badge: "Bestseller",
  },
  {
    id: "hazelnut-paris-brest",
    name: "Hazelnut Paris Brest",
    description: "Ring-shaped choux pastry filled with house-made hazelnut praline cream.",
    price: 235,
    category: "desserts",
    badge: "Signature",
  },
  {
    id: "cookies-cream-cheesecake",
    name: "Cookies & Cream Cheesecake",
    description: "Oreo crumb base, whipped cream cheese filling, finished with a cookies and cream topping.",
    price: 235,
    category: "desserts",
  },
  {
    id: "biscoff-cheesecake",
    name: "Biscoff Cheesecake",
    description: "Speculoos biscuit base with a creamy Biscoff cheesecake layer and caramelised Biscoff drizzle.",
    price: 255,
    category: "desserts",
    badge: "Bestseller",
  },
  {
    id: "tiramisu-tub",
    name: "Tiramisu Tub",
    description: "Espresso-soaked ladyfingers layered with mascarpone cream and dusted with cocoa.",
    price: 315,
    category: "desserts",
  },
  {
    id: "triple-chocolate-mousse-tub",
    name: "Triple Chocolate Mousse Tub",
    description: "Three layers of white, milk, and dark chocolate mousse — intensely rich and smooth.",
    price: 320,
    category: "desserts",
    badge: "Signature",
  },
  {
    id: "mille-feuille",
    name: "Mille Feuille",
    description: "Shatteringly crisp puff pastry layers with vanilla pastry cream and caramel glaze.",
    price: 255,
    category: "desserts",
  },

  // ── CAKES ─────────────────────────────────────────────────────────────────
  // Prices shown are for 500g. 1kg available at double price.

  {
    id: "cake-dark-chocolate",
    name: "Dark Chocolate Cake",
    description: "Indulgent dark chocolate sponge layered with rich chocolate ganache and cream.",
    price: 1100,
    category: "cakes",
    note: "500g · 1kg available (₹2200)",
  },
  {
    id: "cake-vanilla-fruit",
    name: "Vanilla Fruit Cake",
    description: "Light vanilla sponge with whipped cream and a medley of seasonal fresh fruits.",
    price: 1100,
    category: "cakes",
    note: "500g · 1kg available (₹2200)",
  },
  {
    id: "cake-red-velvet-raspberry",
    name: "Red Velvet Raspberry",
    description: "Classic red velvet sponge with cream cheese frosting and fresh raspberry compote.",
    price: 1200,
    category: "cakes",
    badge: "Bestseller",
    note: "500g · 1kg available (₹2400)",
  },
  {
    id: "cake-hazelnut",
    name: "Hazelnut Cake",
    description: "Vanilla sponge base with hazelnut praline cream and a toasted hazelnut finish.",
    price: 1200,
    category: "cakes",
    note: "Vanilla Sponge Based · 500g · 1kg available (₹2400)",
  },
  {
    id: "cake-coffee",
    name: "Coffee Cake",
    description: "Chocolate sponge base with espresso-infused cream and a dusting of cocoa.",
    price: 1150,
    category: "cakes",
    note: "Chocolate Sponge Based · 500g · 1kg available (₹2300)",
  },
  {
    id: "cake-pistachio-white-chocolate",
    name: "Pistachio White Chocolate",
    description: "Pistachio sponge with cream cheese and white chocolate frosting — delicate and rich.",
    price: 1200,
    category: "cakes",
    badge: "Signature",
    note: "Pistachio Sponge · Cream Cheese & White Chocolate Frosting · 500g · 1kg available (₹2400)",
  },

  // ── BAKES & BREADS ────────────────────────────────────────────────────────

  // Tea Cakes (450g)
  {
    id: "tea-cake-date-walnut",
    name: "Date & Walnut Tea Cake",
    description: "Moist tea cake studded with Medjool dates and crunchy walnuts. Perfect with a cup of tea.",
    price: 540,
    category: "bakes",
    note: "450g",
  },
  {
    id: "tea-cake-double-chocolate",
    name: "Double Chocolate Tea Cake",
    description: "Rich chocolate loaf cake with chocolate chips throughout — intensely chocolatey.",
    price: 560,
    category: "bakes",
    note: "450g",
  },
  {
    id: "tea-cake-pistachio",
    name: "Pistachio Tea Cake",
    description: "Tender pistachio-flavoured loaf with a beautiful green crumb and subtle nuttiness.",
    price: 580,
    category: "bakes",
    badge: "Signature",
    note: "450g",
  },
  {
    id: "tea-cake-marble",
    name: "Marble Tea Cake",
    description: "Classic vanilla and chocolate swirled into a stunning marble loaf — timeless and comforting.",
    price: 520,
    category: "bakes",
    note: "450g",
  },

  // Breads
  {
    id: "chocolate-babka",
    name: "Chocolate Babka",
    description: "Swirled enriched dough packed with dark chocolate filling. Beautifully twisted and baked golden.",
    price: 540,
    category: "bakes",
    badge: "Signature",
    note: "450g",
  },
  {
    id: "pesto-babka",
    name: "Pesto Babka",
    description: "Savoury babka swirled with vibrant house-made basil pesto. Brilliant with soup or on its own.",
    price: 510,
    category: "bakes",
    note: "450g",
  },
  {
    id: "bombolini-custard-raspberry",
    name: "Bombolini — Custard Raspberry",
    description: "Pillowy Italian doughnut filled with silky vanilla custard and raspberry jam.",
    price: 285,
    category: "bakes",
    badge: "Bestseller",
  },
  {
    id: "bombolini-biscoff",
    name: "Bombolini — Biscoff",
    description: "Fluffy bombolini filled with Biscoff cream and dusted with cinnamon sugar.",
    price: 310,
    category: "bakes",
  },
  {
    id: "bombolini-chocolate-caramel",
    name: "Bombolini — Chocolate Caramel",
    description: "Light doughnut with dark chocolate ganache and salted caramel filling.",
    price: 280,
    category: "bakes",
  },

  // Cookies
  {
    id: "palmiers",
    name: "Palmiers",
    description: "Caramelised puff pastry butterfly cookies — crisp, buttery, and irresistible.",
    price: 270,
    category: "bakes",
    note: "Pack of 4",
  },
  {
    id: "biscoff-cookie",
    name: "Biscoff Cookie",
    description: "Chunky cookies packed with Biscoff spread and Biscoff crumble for a double hit.",
    price: 280,
    category: "bakes",
    note: "Pack of 6",
  },
  {
    id: "anzac-cookies",
    name: "Anzac Cookies",
    description: "Golden oat cookies — chewy, wholesome, and made without refined sugar.",
    price: 280,
    category: "bakes",
    badge: "VE · GF · RSF",
    note: "Pack of 6",
  },
  {
    id: "brown-butter-choc-chip",
    name: "Brown Butter Chocolate Chip",
    description: "Nutty brown butter cookies loaded with dark chocolate chips — crisp edges, chewy centre.",
    price: 280,
    category: "bakes",
    note: "Pack of 6",
  },
  {
    id: "double-chocolate-cookie",
    name: "Double Chocolate Cookie",
    description: "Deep cocoa cookie dough with chunks of dark and milk chocolate throughout.",
    price: 280,
    category: "bakes",
    note: "Pack of 6",
  },
  {
    id: "macaroons",
    name: "Macaroons",
    description: "French macarons with a crisp shell and smooth ganache or buttercream filling.",
    price: 570,
    category: "bakes",
    badge: "Signature",
    note: "Pack of 6",
  },

  // ── SAVOURY ───────────────────────────────────────────────────────────────
  // All toasts come with a side of salad and chips. Bread is house-made.

  {
    id: "focaccia",
    name: "Focaccia",
    description: "House-made focaccia seasoned with olive oil, rosemary, and flaked sea salt.",
    price: 375,
    category: "savoury",
    badge: "Chef's Pick",
  },
  {
    id: "avocado-toast",
    name: "Avocado Toast",
    description: "Crushed avocado on house-baked bread with chilli flakes and a squeeze of lemon.",
    price: 475,
    category: "savoury",
    note: "Served with salad & chips",
  },
  {
    id: "cucumber-cream-cheese-toast",
    name: "Cucumber & Cream Cheese Toast",
    description: "Whipped cream cheese and thinly sliced cucumber on house-baked bread.",
    price: 375,
    category: "savoury",
    note: "Served with salad & chips",
  },
  {
    id: "tomato-feta-toast",
    name: "Tomato & Feta Toast",
    description: "Roasted cherry tomatoes and crumbled feta on house-baked bread with fresh herbs.",
    price: 425,
    category: "savoury",
    note: "Served with salad & chips",
  },
  {
    id: "mushroom-spinach-toast",
    name: "Mushroom & Spinach Toast",
    description: "Sautéed mushrooms and wilted spinach on house-baked bread with a herb dressing.",
    price: 425,
    category: "savoury",
    badge: "Bestseller",
    note: "Served with salad & chips",
  },
  {
    id: "veg-tartlets",
    name: "Veg Tartlets",
    description: "Buttery shortcrust pastry tartlets filled with roasted seasonal vegetables.",
    price: 175,
    category: "savoury",
  },

  // ── BEVERAGES ─────────────────────────────────────────────────────────────

  // Coffee
  {
    id: "espresso",
    name: "Espresso",
    description: "A single or double shot of our house-blend espresso — bold, balanced, aromatic.",
    price: 170,
    category: "beverages",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    description: "Espresso with equal parts steamed milk and thick, velvety microfoam.",
    price: 260,
    category: "beverages",
    badge: "Popular",
  },
  {
    id: "latte",
    name: "Latte",
    description: "Smooth espresso with a generous pour of steamed milk and a light foam top.",
    price: 260,
    category: "beverages",
  },
  {
    id: "mocha",
    name: "Mocha",
    description: "Espresso blended with rich chocolate, topped with steamed milk and foam.",
    price: 290,
    category: "beverages",
  },
  {
    id: "americano",
    name: "Americano",
    description: "Espresso diluted with hot or cold water — clean, full-bodied coffee.",
    price: 210,
    category: "beverages",
    note: "Hot or Cold",
  },
  {
    id: "flat-white",
    name: "Flat White",
    description: "Double ristretto with silky microfoam — stronger than a latte, smoother than a cap.",
    price: 260,
    category: "beverages",
  },
  {
    id: "macchiato",
    name: "Macchiato",
    description: "Espresso 'stained' with a dollop of steamed milk foam.",
    price: 270,
    category: "beverages",
  },
  {
    id: "spanish-latte",
    name: "Spanish Latte",
    description: "Espresso with sweetened condensed milk and steamed milk — rich and slightly sweet.",
    price: 270,
    category: "beverages",
    badge: "Popular",
  },
  {
    id: "cortado",
    name: "Cortado",
    description: "Equal parts espresso and warm milk, reducing the acidity without losing the coffee character.",
    price: 270,
    category: "beverages",
  },
  {
    id: "cold-brew",
    name: "Cold Brew",
    description: "Coffee steeped cold for 18 hours — smooth, low-acidity, naturally sweet.",
    price: 280,
    category: "beverages",
  },
  {
    id: "oj-cold-brew",
    name: "OJ Cold Brew",
    description: "Our cold brew coffee combined with fresh-squeezed orange juice — surprisingly perfect.",
    price: 320,
    category: "beverages",
    badge: "Signature",
  },
  {
    id: "classic-cold-coffee",
    name: "Classic Cold Coffee",
    description: "Chilled espresso blended with milk and a hint of sugar — simple and satisfying.",
    price: 290,
    category: "beverages",
  },

  // Handcrafted Drinks
  {
    id: "biscoff-frappe",
    name: "Biscoff Frappe",
    description: "Blended iced drink with Biscoff spread, espresso, and milk — rich and indulgent.",
    price: 360,
    category: "beverages",
    badge: "Bestseller",
  },
  {
    id: "nutella-frappe",
    name: "Nutella Frappe",
    description: "Creamy blended frappe with Nutella and espresso, topped with whipped cream.",
    price: 340,
    category: "beverages",
  },
  {
    id: "cookies-cream-frappe",
    name: "Cookies & Cream Frappe",
    description: "Blended Oreo frappe with milk and cream — rich, thick, and decadent.",
    price: 340,
    category: "beverages",
  },
  {
    id: "hot-chocolate",
    name: "Hot Chocolate",
    description: "House drinking chocolate made with real cocoa, steamed milk, and a hint of vanilla.",
    price: 340,
    category: "beverages",
    badge: "Signature",
  },

  // Tea
  {
    id: "black-tea",
    name: "Black Tea",
    description: "Classic brewed black tea — robust and warming.",
    price: 180,
    category: "beverages",
  },
  {
    id: "green-tea",
    name: "Green Tea",
    description: "Delicate green tea — light, fresh, and calming.",
    price: 180,
    category: "beverages",
  },
  {
    id: "peach-iced-tea",
    name: "Peach Iced Tea",
    description: "Chilled brewed tea with ripe peach syrup and a squeeze of lemon.",
    price: 250,
    category: "beverages",
  },
  {
    id: "strawberry-iced-tea",
    name: "Strawberry Iced Tea",
    description: "Refreshing iced tea with strawberry syrup and fresh mint.",
    price: 250,
    category: "beverages",
  },
];
