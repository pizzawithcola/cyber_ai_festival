export const PREDEFINED_PRODUCTS = [
  { name: 'AirPods Pro', icon: '🎧' },
  { name: 'PS5 Slim', icon: '🎮' },
  { name: 'RTX 4090', icon: '📟' }
];

export const RETAILERS = [
  {
    name: 'Amazon',
    url: 'amazon.com',
    price: '$1,549',
    priceValue: 1549,
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
    price: '$899',
    priceValue: 899,
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
    price: '$1,499',
    priceValue: 1499,
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
    price: '$1,699',
    priceValue: 1699,
    shippingDays: 4,
    shippingLabel: 'Standard 3–5 day shipping',
    isVerified: true,
    trustLabel: 'Verified retailer',
    theme: '#2ecc71',
    logo: 'EW',
    isMalicious: false
  },
  {
    name: 'UrbanDeals',
    url: 'urbandeals.shop',
    price: '$1,199',
    priceValue: 1199,
    shippingDays: 6,
    shippingLabel: 'No-rush shipping',
    isVerified: false,
    trustLabel: '',
    theme: '#9b59b6',
    logo: 'UD',
    isMalicious: false
  },
  {
    name: 'StreetTech Direct',
    url: 'streettech-direct.net',
    price: '$999',
    priceValue: 999,
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
