import React from 'react';
import { ShieldCheck, CreditCard, MapPin, Package, ArrowLeft } from 'lucide-react';
import type { Product, Retailer, SavedCard, SavedAddress } from '../constants/gameData';

interface CheckoutConfirmationProps {
  product: Product;
  retailer: Retailer;
  card: SavedCard;
  address: SavedAddress;
  firstName: string;
  lastName: string;
  mode: 'manual' | 'agent';
  onConfirm: () => void;
  onCancel: () => void;
}

const CheckoutConfirmation: React.FC<CheckoutConfirmationProps> = ({
  product,
  retailer,
  card,
  address,
  firstName,
  lastName,
  mode,
  onConfirm,
  onCancel,
}) => {
  const price = retailer.priceValues[product.name] || product.basePrice;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b shadow-sm shrink-0 flex items-center gap-3">
        <button onClick={onCancel} className="text-indigo-600"><ArrowLeft size={20} /></button>
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-indigo-600" />
          <span className="font-bold text-slate-900">
            {mode === 'agent' ? 'Agent Confirmation' : 'Confirm Purchase'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {mode === 'agent' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            The AI agent has selected this purchase for you. Please review and confirm.
          </div>
        )}

        {/* Product */}
        <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 border">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border p-2">
            <img src={product.image} alt={product.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-900">{product.name}</div>
            <div className="text-xs text-slate-500">{retailer.name}</div>
            <div className="text-lg font-black text-slate-900 mt-1">${price.toLocaleString()}</div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-slate-50 rounded-xl p-4 border space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <CreditCard size={12} /> Payment
          </div>
          <div className="text-sm text-slate-800">{card.label}</div>
          <div className="text-xs text-slate-500">Name: {firstName} {lastName}</div>
        </div>

        {/* Shipping */}
        <div className="bg-slate-50 rounded-xl p-4 border space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <MapPin size={12} /> Ship To
          </div>
          <div className="text-sm text-slate-800">{address.label}</div>
          <div className="text-xs text-slate-500">{address.phone}</div>
        </div>

        {/* Shipping method */}
        <div className="bg-slate-50 rounded-xl p-4 border space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <Package size={12} /> Delivery
          </div>
          <div className="text-sm text-slate-800">{retailer.shippingLabel}</div>
        </div>

        {/* Seller trust info */}
        {!retailer.isVerified && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
            This seller is not verified. Proceed with caution.
          </div>
        )}

        {/* Block manual purchase from malicious retailer */}
        {mode === 'manual' && retailer.isMalicious && (
          <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4">
            <div className="text-sm font-bold text-red-700 mb-1">⚠️ Purchase Blocked</div>
            <div className="text-xs text-red-600 leading-relaxed">
              This seller has too many red flags — low ratings, complaints, missing contact info, and an insecure connection.
              In the real world, you should never check out from a site like this. Go back and choose a safer seller.
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="p-4 bg-white border-t space-y-2 shrink-0">
        {mode === 'manual' && retailer.isMalicious ? (
          <button
            onClick={onCancel}
            className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold active:scale-95 transition-transform"
          >
            Go Back & Choose a Safer Seller
          </button>
        ) : (
          <>
            <button
              onClick={onConfirm}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold active:scale-95 transition-transform"
            >
              Confirm Purchase — ${price.toLocaleString()}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2.5 text-slate-500 rounded-xl text-sm font-medium"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutConfirmation;
