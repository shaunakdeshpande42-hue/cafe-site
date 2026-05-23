export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  badge?: string;
}

export const categories = [
  { id: "patisserie", label: "Patisserie" },
  { id: "cakes", label: "Cakes & Bakes" },
  { id: "chocolates", label: "Artisanal Chocolates" },
  { id: "drinks", label: "Drinks" },
  { id: "savouries", label: "Savouries" },
];

export const menuItems: MenuItem[] = [
  // Patisserie
  {
    id: "classic-eclair",
    name: "Classic Chocolate Éclair",
    description: "Choux pastry filled with vanilla cream, topped with dark chocolate ganache.",
    price: 160,
    category: "patisserie",
    badge: "Bestseller",
  },
  {
    id: "paris-brest",
    name: "Paris-Brest",
    description: "Ring-shaped choux with praline cream and caramelised hazelnuts.",
    price: 220,
    category: "patisserie",
  },
  {
    id: "lemon-tart",
    name: "Lemon Curd Tart",
    description: "Buttery shortcrust shell with silky lemon curd and Italian meringue.",
    price: 180,
    category: "patisserie",
  },
  {
    id: "basque-cheesecake",
    name: "Basque Cheesecake Slice",
    description: "Burnt Basque-style cheesecake — creamy inside with a deep caramel top.",
    price: 200,
    category: "patisserie",
    badge: "Fan Favourite",
  },
  {
    id: "croissant",
    name: "Butter Croissant",
    description: "Laminated dough with 48-hour fermentation. Crisp outside, pull-apart inside.",
    price: 120,
    category: "patisserie",
  },
  {
    id: "choux-religieuse",
    name: "Religieuse",
    description: "Double choux with coffee pastry cream and coffee fondant glaze.",
    price: 190,
    category: "patisserie",
  },

  // Cakes
  {
    id: "chocolate-hazelnut-cake",
    name: "Chocolate Hazelnut Cake",
    description: "Rich dark chocolate sponge, hazelnut praline cream, chocolate mirror glaze.",
    price: 650,
    category: "cakes",
    badge: "Signature",
  },
  {
    id: "pistachio-rose-cake",
    name: "Pistachio & Rose Cake",
    description: "Pistachio frangipane, rose whipped cream, topped with dried rose petals.",
    price: 700,
    category: "cakes",
  },
  {
    id: "vanilla-fruit-cake",
    name: "Vanilla Chantilly & Fresh Fruit",
    description: "Light vanilla sponge with diplomat cream and seasonal fresh fruit.",
    price: 600,
    category: "cakes",
    badge: "New",
  },
  {
    id: "red-velvet",
    name: "Red Velvet",
    description: "Velvety cocoa sponge with cream cheese frosting and white chocolate shards.",
    price: 620,
    category: "cakes",
  },
  {
    id: "custom-cake",
    name: "Custom Celebration Cake",
    description: "Designed entirely around you. Choose your flavour, design, and size. 48-hr advance order.",
    price: 1200,
    category: "cakes",
    badge: "Custom Order",
  },

  // Chocolates
  {
    id: "caramel-crunch",
    name: "Caramel Crunch Bar",
    description: "Milk chocolate with salted caramel feuilletine. 100g hand-wrapped bar.",
    price: 380,
    category: "chocolates",
    image: "/gallery/3.webp",
    badge: "Bestseller",
  },
  {
    id: "dark-collection",
    name: "Dark Chocolate Collection",
    description: "Six bonbons: 70% Madagascan dark, espresso, and sea salt variants.",
    price: 450,
    category: "chocolates",
  },
  {
    id: "milk-truffle-box",
    name: "Milk Truffle Box",
    description: "Nine handmade milk chocolate truffles dusted with cocoa powder.",
    price: 520,
    category: "chocolates",
    badge: "Gift Box",
  },
  {
    id: "hazelnut-praline-bar",
    name: "Hazelnut Praline Bar",
    description: "Belgian milk chocolate with house-made hazelnut praline filling. 100g.",
    price: 400,
    category: "chocolates",
  },

  // Drinks
  {
    id: "hot-chocolate",
    name: "EM Hot Chocolate",
    description: "House blend drinking chocolate, steamed whole milk, topped with cream.",
    price: 280,
    category: "drinks",
    badge: "Signature",
  },
  {
    id: "flat-white",
    name: "Flat White",
    description: "Double ristretto with silky microfoam milk.",
    price: 220,
    category: "drinks",
  },
  {
    id: "iced-latte",
    name: "Iced Café Latte",
    description: "Cold-pressed espresso over ice, topped with chilled whole milk.",
    price: 240,
    category: "drinks",
  },
  {
    id: "rose-lychee-lemonade",
    name: "Rose & Lychee Lemonade",
    description: "Fresh lemon juice, rose syrup, lychee, and sparkling water.",
    price: 220,
    category: "drinks",
    badge: "New",
  },

  // Savouries
  {
    id: "focaccia-sandwich",
    name: "Focaccia Sandwich",
    description: "House-baked focaccia with roasted peppers, spinach, cherry tomatoes, and feta.",
    price: 320,
    category: "savouries",
    image: "/gallery/11.webp",
    badge: "Chef's Pick",
  },
  {
    id: "mushroom-quiche",
    name: "Wild Mushroom Quiche",
    description: "Shortcrust pastry, slow-cooked wild mushrooms, Gruyère, and fresh herbs.",
    price: 280,
    category: "savouries",
  },
];
