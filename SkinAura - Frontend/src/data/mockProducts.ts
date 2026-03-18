export interface Ingredient {
  name: string;
  safety: "low" | "moderate" | "high";
  description: string;
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  safety: number;
  eco: number;
  image: string;
  category: string;
  description: string;
  ingredients: Ingredient[];
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "2% Salicylic Acid Cleanser",
    brand: "Minimalist",
    safety: 8.7,
    eco: 7.5,
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400",
    category: "Cleanser",
    description: "A gentle yet effective cleanser with salicylic acid to unclog pores and control excess oil for acne-prone skin.",
    ingredients: [
      { name: "Salicylic Acid", safety: "moderate", description: "A beta hydroxy acid used to unclog pores and treat acne." },
      { name: "Zinc PCA", safety: "low", description: "Helps regulate oil production and soothe skin." },
      { name: "Glycerin", safety: "low", description: "A safe humectant that attracts moisture to the skin." },
      { name: "Coco Glucoside", safety: "low", description: "A mild cleansing agent derived from coconut." },
    ],
  },
  {
    id: 2,
    name: "Gentle Skin Cleanser",
    brand: "Cetaphil",
    safety: 9.2,
    eco: 7.0,
    image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=400",
    category: "Cleanser",
    description: "A dermatologist-recommended gentle cleanser that removes dirt and impurities without stripping the skin's natural moisture.",
    ingredients: [
      { name: "Water", safety: "low", description: "Base solvent used in skincare products." },
      { name: "Glycerin", safety: "low", description: "Moisturizing humectant." },
      { name: "Cetyl Alcohol", safety: "low", description: "Fatty alcohol used to soften skin." },
      { name: "Propylene Glycol", safety: "moderate", description: "Humectant that helps retain moisture." },
    ],
  },
  {
    id: 3,
    name: "Ubtan Face Wash",
    brand: "Mamaearth",
    safety: 7.8,
    eco: 8.4,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=400",
    category: "Face Wash",
    description: "An Ayurvedic-inspired face wash with turmeric and saffron for a natural glow and gentle exfoliation.",
    ingredients: [
      { name: "Turmeric Extract", safety: "low", description: "Known for anti-inflammatory and antibacterial benefits." },
      { name: "Saffron Extract", safety: "low", description: "Helps brighten skin tone." },
      { name: "Walnut Beads", safety: "moderate", description: "Natural exfoliant used to remove dead skin cells." },
      { name: "Aloe Vera", safety: "low", description: "Soothes and hydrates skin." },
    ],
  },
  {
    id: 4,
    name: "Neem Face Wash",
    brand: "Himalaya Herbals",
    safety: 7.1,
    eco: 7.6,
    image: "https://images.unsplash.com/photo-1570194065650-d99fb4ee3313?auto=format&fit=crop&q=80&w=400",
    category: "Face Wash",
    description: "A purifying neem face wash that fights acne-causing bacteria and provides deep cleansing for oily and combination skin.",
    ingredients: [
      { name: "Neem Extract", safety: "low", description: "Natural antibacterial ingredient used for acne-prone skin." },
      { name: "Turmeric Extract", safety: "low", description: "Anti-inflammatory botanical ingredient." },
      { name: "Glycerin", safety: "low", description: "Hydrating humectant." },
      { name: "Sodium Laureth Sulfate", safety: "moderate", description: "Cleansing surfactant used to create foam." },
    ],
  },
  {
    id: 5,
    name: "Bio Morning Nectar Moisturizer",
    brand: "Biotique",
    safety: 8.0,
    eco: 8.6,
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400",
    category: "Moisturizer",
    description: "A nourishing moisturizer enriched with honey and wheat germ to provide all-day hydration and a healthy glow.",
    ingredients: [
      { name: "Honey", safety: "low", description: "Natural humectant that helps moisturize skin." },
      { name: "Wheat Germ", safety: "low", description: "Rich in vitamins and antioxidants." },
      { name: "Aloe Vera", safety: "low", description: "Hydrates and soothes skin." },
      { name: "Carrot Extract", safety: "low", description: "Contains antioxidants and vitamins beneficial for skin." },
    ],
  },
  {
    id: 6,
    name: "Vitamin C + E Super Bright Moisturizer",
    brand: "Dot & Key",
    safety: 8.5,
    eco: 7.9,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400",
    category: "Moisturizer",
    description: "A brightening moisturizer powered by Vitamin C and E to reduce dullness and protect skin from environmental stressors.",
    ingredients: [
      { name: "Vitamin C", safety: "low", description: "Antioxidant that brightens skin and reduces dullness." },
      { name: "Vitamin E", safety: "low", description: "Helps protect skin from environmental damage." },
      { name: "Hyaluronic Acid", safety: "low", description: "Powerful hydrating ingredient." },
      { name: "Glycerin", safety: "low", description: "Moisture-binding humectant." },
    ],
  },
  {
    id: 7,
    name: "Sun Expert SPF 50 Sunscreen",
    brand: "Lakme",
    safety: 6.8,
    eco: 6.2,
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400",
    category: "Sunscreen",
    description: "A lightweight SPF 50 sunscreen offering broad-spectrum UVA/UVB protection for daily outdoor use.",
    ingredients: [
      { name: "Octinoxate", safety: "moderate", description: "UVB filter used in sunscreens." },
      { name: "Avobenzone", safety: "moderate", description: "UVA filter providing broad spectrum protection." },
      { name: "Zinc Oxide", safety: "low", description: "Mineral sunscreen ingredient that reflects UV rays." },
      { name: "Glycerin", safety: "low", description: "Hydrating ingredient." },
    ],
  },
  {
    id: 8,
    name: "10% Niacinamide Serum",
    brand: "The Derma Co",
    safety: 9.0,
    eco: 7.8,
    image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=400",
    category: "Serum",
    description: "A potent niacinamide serum that minimizes pores, controls oil, and improves overall skin texture.",
    ingredients: [
      { name: "Niacinamide", safety: "low", description: "Vitamin B3 that helps improve skin texture and reduce pores." },
      { name: "Zinc PCA", safety: "low", description: "Controls oil production and reduces acne." },
      { name: "Panthenol", safety: "low", description: "Moisturizing ingredient also known as Vitamin B5." },
      { name: "Glycerin", safety: "low", description: "Hydrates skin." },
    ],
  },
  {
    id: 9,
    name: "Delicate Facial Cleanser Kashmiri Saffron",
    brand: "Forest Essentials",
    safety: 8.4,
    eco: 8.8,
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400",
    category: "Cleanser",
    description: "A luxurious Ayurvedic cleanser with Kashmiri saffron and honey for gentle cleansing and natural radiance.",
    ingredients: [
      { name: "Kashmiri Saffron", safety: "low", description: "Traditional ingredient used for skin brightening." },
      { name: "Aloe Vera", safety: "low", description: "Hydrates and calms skin." },
      { name: "Honey", safety: "low", description: "Natural moisturizer." },
      { name: "Rose Water", safety: "low", description: "Soothing floral water used in skincare." },
    ],
  },
  {
    id: 10,
    name: "Green Tea Oil-Free Moisturizer",
    brand: "Plum",
    safety: 8.6,
    eco: 8.1,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400",
    category: "Moisturizer",
    description: "A lightweight, oil-free moisturizer with green tea extract that hydrates without clogging pores.",
    ingredients: [
      { name: "Green Tea Extract", safety: "low", description: "Antioxidant that helps protect skin from environmental damage." },
      { name: "Glycolic Acid", safety: "moderate", description: "Exfoliating alpha hydroxy acid." },
      { name: "Aloe Vera", safety: "low", description: "Hydrating botanical ingredient." },
      { name: "Glycerin", safety: "low", description: "Moisturizing humectant." },
    ],
  },
];

export const MOCK_ALTERNATIVES: Product[] = [
  MOCK_PRODUCTS[4],
  MOCK_PRODUCTS[8],
  MOCK_PRODUCTS[1],
];

export const ALL_INGREDIENTS = [
  "Salicylic Acid", "Zinc PCA", "Glycerin", "Coco Glucoside", "Cetyl Alcohol",
  "Propylene Glycol", "Turmeric Extract", "Saffron Extract", "Walnut Beads",
  "Aloe Vera", "Neem Extract", "Sodium Laureth Sulfate", "Honey", "Wheat Germ",
  "Carrot Extract", "Vitamin C", "Vitamin E", "Hyaluronic Acid", "Octinoxate",
  "Avobenzone", "Zinc Oxide", "Niacinamide", "Panthenol", "Kashmiri Saffron",
  "Rose Water", "Green Tea Extract", "Glycolic Acid",
];

export const ALL_COMPANIES = [
  "Minimalist", "Cetaphil", "Mamaearth", "Himalaya Herbals", "Biotique",
  "Dot & Key", "Lakme", "The Derma Co", "Forest Essentials", "Plum",
];
