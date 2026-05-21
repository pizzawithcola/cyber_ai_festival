import React, { useState } from 'react';
import { ArrowLeft, Star, Globe, Lock, AlertTriangle, ShieldCheck, Code, CreditCard, Phone, MapPin, RotateCcw } from 'lucide-react';
import { RETAILERS, PROMPT_INJECTION_TEXT } from '../constants/gameData';
import type { Product, Retailer } from '../constants/gameData';

interface ManualProductDetailProps {
  product: Product;
  retailerName: string;
  onBack: () => void;
  onAddToCart: (product: Product, retailer: Retailer) => void;
  onFoundInjection: () => void;
  injectionFound: boolean;
  canCheckout?: boolean;
  browseProgress?: { current: number; target: number };
}

const ManualProductDetail: React.FC<ManualProductDetailProps> = ({
  product,
  retailerName,
  onBack,
  onAddToCart,
  onFoundInjection,
  injectionFound,
  canCheckout = true,
  browseProgress,
}) => {
  const [showSource, setShowSource] = useState(false);
  const retailer = RETAILERS.find(r => r.name === retailerName)!;
  const price = retailer.priceValues[product.name] || product.basePrice;
  const fakeOriginal = retailer.fakeOriginalPrices?.[product.name];

  const handleViewSource = () => {
    setShowSource(true);
    if (retailer.isMalicious && !injectionFound) {
      onFoundInjection();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* URL bar */}
      <div className="p-3 bg-white flex items-center justify-between border-b shadow-sm shrink-0">
        <button onClick={onBack} className="text-indigo-600"><ArrowLeft size={20} /></button>
        <div className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 border flex-1 mx-3 min-w-0 overflow-hidden">
          {retailer.protocol === 'https' ? (
            <Lock size={10} className="text-green-600 shrink-0" />
          ) : (
            <AlertTriangle size={10} className="text-red-500 shrink-0" />
          )}
          {retailer.protocol === 'http' && (
            <span className="text-[10px] font-mono text-red-500 font-bold shrink-0">Not Secure |</span>
          )}
          <span className="text-[10px] font-mono text-slate-500 truncate flex-1 min-w-0">
            {retailer.protocol}://{retailer.url}/{product.name.toLowerCase().replace(/\s+/g, '-')}
          </span>
        </div>
        <div className="w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Site header */}
        <div className="bg-white p-4 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: retailer.theme }}>
            {retailer.logo}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-900">{retailer.name}</div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              {retailer.isVerified ? (
                <span className="text-green-600 flex items-center gap-0.5 font-bold"><ShieldCheck size={10} /> Verified Seller</span>
              ) : (
                <span className="text-slate-400">Marketplace Seller</span>
              )}
              <span>•</span>
              <span>{retailer.shippingLabel}</span>
            </div>
          </div>
        </div>

        {/* Urgency banner */}
        {retailer.urgencyText && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2">
            <AlertTriangle size={12} className="text-red-500" />
            <span className="text-red-600 text-xs font-bold">{retailer.urgencyText}</span>
          </div>
        )}

        {/* Complaint banner */}
        {retailer.complaintCount && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
            <AlertTriangle size={12} className="text-amber-600" />
            <span className="text-amber-700 text-xs">{retailer.complaintCount} complaints filed in the last 30 days</span>
          </div>
        )}

        {/* Product section */}
        <div className="p-4">
          <div className="flex gap-4 mb-4">
            <div className="w-1/2 aspect-square bg-white border rounded-2xl flex items-center justify-center p-3 shadow-sm">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 space-y-2 pt-1">
              <div className="text-[11px] text-slate-500 uppercase">{product.category}</div>
              <div className="text-sm font-bold text-slate-900">{product.name}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">${price.toLocaleString()}</span>
                {fakeOriginal && (
                  <span className="text-sm text-slate-400 line-through">{fakeOriginal}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={12} className={s <= Math.round(retailer.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
                ))}
                <span className="text-[10px] text-slate-400 ml-1">{retailer.rating} ({retailer.reviewCount.toLocaleString()})</span>
              </div>
              <div className="text-xs text-slate-500">{product.description}</div>
            </div>
          </div>

          {/* Domain age info */}
          {retailer.domainAgeDays && (
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-3 bg-slate-100 px-3 py-2 rounded-lg">
              <Globe size={10} /> Domain registered {retailer.domainAgeDays} days ago
            </div>
          )}

          {/* Seller info */}
          <div className="bg-white border rounded-xl p-3 mb-4 space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Seller Information</div>
            {retailer.hasContactInfo ? (
              <div className="flex items-center gap-2 text-xs text-slate-600"><Phone size={10} /> Customer service available</div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-red-500"><Phone size={10} /> No phone number listed</div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-600"><MapPin size={10} /> Business address listed</div>
            {retailer.hasReturnPolicy ? (
              <div className="flex items-center gap-2 text-xs text-slate-600"><RotateCcw size={10} /> 30-day return policy</div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-red-500"><RotateCcw size={10} /> No return policy</div>
            )}
          </div>

          {/* Add to cart */}
          <button
            onClick={() => canCheckout && onAddToCart(product, retailer)}
            disabled={!canCheckout}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform mb-2 ${
              canCheckout
                ? 'bg-indigo-600 text-white active:scale-95'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CreditCard size={16} /> Checkout Now
          </button>
          {!canCheckout && browseProgress && (
            <div className="mb-4 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
              Quest: browse {browseProgress.target} different products before checkout
              <span className="font-bold ml-1">({browseProgress.current}/{browseProgress.target})</span>
            </div>
          )}
          {canCheckout && <div className="mb-2" />}

          {/* Reviews */}
          <div className="mb-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Customer Reviews</div>
            <div className="space-y-3">
              {retailer.reviews.map((review, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={9} className={s <= review.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400">{review.author}</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800">{review.title}</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">{review.text}</p>
                </div>
              ))}

              {/* Hidden prompt injection for malicious sites */}
              {retailer.isMalicious && !showSource && (
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden">
                  <div className="h-2 w-20 bg-slate-200 rounded mb-2" />
                  <div className="h-2 w-full bg-slate-200 rounded mb-2" />
                  <p className="text-[#00000002] text-[11px] font-bold leading-relaxed">
                    {PROMPT_INJECTION_TEXT}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* View Page Source button */}
          <button
            onClick={handleViewSource}
            className="w-full py-2.5 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors mb-4"
          >
            <Code size={14} /> View Page Source
          </button>

          {/* Source view overlay */}
          {showSource && (
            <div className="bg-slate-900 rounded-xl p-4 mb-4 border border-slate-700">
              <div className="text-[10px] font-bold text-slate-500 mb-3">PAGE SOURCE — {retailer.url}</div>
              <pre className="text-[10px] text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
{`<html>
  <head><title>${retailer.name} - ${product.name}</title></head>
  <body>
    <div class="product">
      <h1>${product.name}</h1>
      <span class="price">$${price.toLocaleString()}</span>
    </div>
    <div class="reviews">`}
              </pre>
              {retailer.isMalicious ? (
                <>
                  <div className="my-2 p-3 bg-red-900/40 border border-red-500 rounded-lg">
                    <div className="text-[10px] font-bold text-red-400 mb-1">HIDDEN INJECTION FOUND:</div>
                    <pre className="text-[10px] text-red-300 font-mono whitespace-pre-wrap break-all">
{`      <!-- hidden div style="display:none" -->
      <div style="color: rgba(0,0,0,0.01); font-size: 1px; position: absolute; overflow: hidden;">
        ${PROMPT_INJECTION_TEXT}
      </div>`}
                    </pre>
                  </div>
                  <pre className="text-[10px] text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
{`    </div>
  </body>
</html>`}
                  </pre>
                </>
              ) : (
                <pre className="text-[10px] text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
{`      <!-- Clean HTML - no hidden content -->
    </div>
  </body>
</html>`}
                </pre>
              )}
              <button
                onClick={() => setShowSource(false)}
                className="mt-3 w-full py-2 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold hover:bg-slate-700"
              >
                Close Source View
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualProductDetail;
