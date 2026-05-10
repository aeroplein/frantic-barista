export const COLORS = {
  espresso: "#A67B5B",
  oatMilk: "#FFF8E7",
  berrySyrup: "#FFB6C1",
  matcha: "#C5E1A5",
  caramel: "#D4A373",
  walnutSyrup: "#6D4C41",
  ice: "rgba(255, 255, 255, 0.95)",
  iceStroke: "#B3E5FC",
  straw: "#F4ACB7",
  heart: "#FDF2F4",
  heartStroke: "#F4ACB7",
  almondMilk: "#EFD5B5",
  lavenderSyrup: "#E6E6FA",
  whippedCream: "#FFFFFF"
};

export const SHOP_ITEMS = [
  { id: 'almondMilk', name: 'Almond Milk', cost: 200, icon: '🥛', color: '#EFD5B5', desc: 'Premium alternative for higher tips', levelRequired: 5 },
  { id: 'lavenderSyrup', name: 'Lavender Syrup', cost: 150, icon: '🌿', color: '#E6E6FA', desc: 'Botanical notes for floral fusion', levelRequired: 6 },
  { id: 'whippedCream', name: 'Whipped Cream', cost: 300, icon: '☁️', color: '#FFFFFF', desc: "Artistic fluffiness with 'S' key", levelRequired: 7 },
  { id: 'croissants', name: 'Bakery Case', cost: 400, icon: '🥐', color: '#F5E6D3', desc: 'Fresh croissants & pastries', levelRequired: 8 },
  { id: 'blender', name: 'Cold Blender', cost: 500, icon: '🌪️', color: '#E0E0E0', desc: 'Vibrant whipped milkshakes', levelRequired: 10 },
  { id: 'scooper', name: 'Scooper Station', cost: 350, icon: '🍦', color: '#FFF5F8', desc: 'Hand-scooped artisanal flavors', levelRequired: 12 }
];

export const INGREDIENT_KEYS = {
  e: 'espresso',
  o: 'oatMilk',
  b: 'berrySyrup',
  m: 'matcha',
  c: 'caramel',
  w: 'walnutSyrup',
  a: 'almondMilk',
  l: 'lavenderSyrup',
  s: 'whippedCream'
};

export const TEMPERATURE_KEYS = {
  h: 'hot',
  i: 'iced'
};

export const PASTRY_TYPES = {
  croissant: { name: 'Croissant', color: '#E6B980', icon: '🥐' },
  cookie: { name: 'Choco Cookie', color: '#6D4C41', icon: '🍪' },
  muffin: { name: 'Blueberry Muffin', color: '#9575CD', icon: '🧁' }
};

export const PASTRY_KEYS = {
  p: 'cycle' // Cycle through available pastries
};
