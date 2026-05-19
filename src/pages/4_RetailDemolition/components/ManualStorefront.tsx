import React, { useState } from 'react';
import { Search, Star, ShoppingCart } from 'lucide-react';
import { PREDEFINED_PRODUCTS, RETAILERS } from '../constants/gameData';
import type { Product } from '../constants/gameData';

interface ManualStorefrontProps {
  onSelectProduct: (product: Product, retailerName: string) => void;
  cartItemCount: number;
  onViewCart: () => void;
}

const ManualStorefront: React.FC<ManualStorefrontProps> = ({ onSelectProduct, cartItemCount, onViewCart }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Each product is shown from a random retailer — we pair products with retailers
  // to create a realistic marketplace. 8 products across 5 retailers.
  const productListings = PREDEFINED_PRODUCTS.map((product, i) => {
    // Assign retailers round-robin: first few from verified, mix in malicious
    const retailerOrder = [0, 2, 3, 1, 0, 4, 2, 1]; // Amazon, eBay, BestBuy, MegaSaver, Amazon, StreetTech, eBay, MegaSaver
    const retailer = RETAILERS[retailerOrder[i % retailerOrder.length]];
    return { product, retailer };
  });

  const filtered = searchQuery
    ? productListings.filter(({ product }) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : productListings;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b shadow-sm shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-black text-slate-900">ShopAI Market</h1>
          <button onClick={onViewCart} className="relative p-2">
            <ShoppingCart size={20} className="text-slate-600" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
          />
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(({ product, retailer }) => {
            const price = retailer.priceValues[product.name] || product.basePrice;
            const fakeOriginal = retailer.fakeOriginalPrices?.[product.name];
            return (
              <button
                key={`${product.name}-${retailer.name}`}
                onClick={() => onSelectProduct(product, retailer.name)}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden text-left hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98]"
              >
                {/* Product image */}
                <div className="aspect-square bg-slate-100 flex items-center justify-center p-3 relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.classList.add('fallback-icon');
                    }}
                  />
                  {retailer.urgencyText && (
                    <div className="absolute top-1 left-1 right-1 bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-md text-center truncate">
                      {retailer.urgencyText.split('!')[0]}!
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-2.5">
                  <div className="text-[11px] text-slate-500 truncate">{retailer.name}</div>
                  <div className="text-xs font-bold text-slate-900 truncate">{product.name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          size={10}
                          className={s <= Math.round(retailer.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] text-slate-400">({retailer.reviewCount.toLocaleString()})</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-sm font-black text-slate-900">${price.toLocaleString()}</span>
                    {fakeOriginal && (
                      <span className="text-[10px] text-slate-400 line-through">{fakeOriginal}</span>
                    )}
                  </div>
                  {!retailer.isVerified && (
                    <div className="mt-1 text-[9px] text-red-500 font-bold">Best Price</div>
                  )}
                  {retailer.isVerified && (
                    <div className="mt-1 text-[9px] text-green-600 font-bold flex items-center gap-0.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full inline-block" /> Verified
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ManualStorefront;
