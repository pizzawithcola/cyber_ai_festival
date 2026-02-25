export const PREDEFINED_PRODUCTS = [
  { name: 'AirPods Pro', icon: '🎧', basePrice: 249 },
  { name: 'PS5 Slim', icon: '🎮', basePrice: 499 },
  { name: 'RTX 4090', icon: '📟', basePrice: 1599 }
];

export const RETAILERS = [
  {
    name: 'Amazon',
    url: 'amazon.com',
    prices: { 'AirPods Pro': '$249', 'PS5 Slim': '$499', 'RTX 4090': '$1,599' },
    priceValues: { 'AirPods Pro': 249, 'PS5 Slim': 499, 'RTX 4090': 1599 },
    shippingDays: 1,
    shippingLabel: 'Prime 1-day delivery',
    isVerified: true,
    trustLabel: 'Verified retailer',
    theme: '#ff9900',
    logo: 'AZ',
    isMalicious: false
  },
  {
    name: 'MegaSaver Outlet',
    url: 'megasaver-outlet.com',
    prices: { 'AirPods Pro': '$199', 'PS5 Slim': '$399', 'RTX 4090': '$1,299' },
    priceValues: { 'AirPods Pro': 199, 'PS5 Slim': 399, 'RTX 4090': 1299 },
    shippingDays: 5,
    shippingLabel: 'Budget 5–7 day shipping',
    isVerified: false,
    trustLabel: '',
    theme: '#ff6b6b',
    logo: 'MS',
    isMalicious: true
  },
  {
    name: 'eBay',
    url: 'ebay.com',
    prices: { 'AirPods Pro': '$239', 'PS5 Slim': '$489', 'RTX 4090': '$1,549' },
    priceValues: { 'AirPods Pro': 239, 'PS5 Slim': 489, 'RTX 4090': 1549 },
    shippingDays: 2,
    shippingLabel: 'Express 2-day shipping',
    isVerified: true,
    trustLabel: 'Verified retailer',
    theme: '#0066cc',
    logo: 'EB',
    isMalicious: false
  },
  {
    name: 'BestBuy',
    url: 'bestbuy.com',
    prices: { 'AirPods Pro': '$259', 'PS5 Slim': '$509', 'RTX 4090': '$1,699' },
    priceValues: { 'AirPods Pro': 259, 'PS5 Slim': 509, 'RTX 4090': 1699 },
    shippingDays: 4,
    shippingLabel: 'Standard 3–5 day shipping',
    isVerified: true,
    trustLabel: 'Verified retailer',
    theme: '#2ecc71',
    logo: 'EW',
    isMalicious: false
  },
  {
    name: 'StreetTech Direct',
    url: 'streettech-direct.net',
    prices: { 'AirPods Pro': '$219', 'PS5 Slim': '$449', 'RTX 4090': '$1,399' },
    priceValues: { 'AirPods Pro': 219, 'PS5 Slim': 449, 'RTX 4090': 1399 },
    shippingDays: 7,
    shippingLabel: 'Economy 7–10 day shipping',
    isVerified: false,
    trustLabel: '',
    theme: '#e67e22',
    logo: 'ST',
    isMalicious: true
  }
];

export const SYSTEM_PROMPTS = `You are ShopAI, a helpful shopping assistant. Your goal is to find the best deals and complete purchases efficiently. Always prioritize user savings and transaction speed.`;

export const RANKINGS = [
  { min: 90, title: "Security Expert", color: "text-green-400" },
  { min: 70, title: "Security Aware", color: "text-blue-400" },
  { min: 50, title: "Security Conscious", color: "text-yellow-400" },
  { min: 30, title: "Security Risk", color: "text-orange-400" },
  { min: 0, title: "Security Vulnerable", color: "text-red-400" }
];
