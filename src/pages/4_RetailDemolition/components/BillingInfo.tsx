import React, { useState } from 'react';
import { CreditCard, User, MapPin, Shield, ChevronDown } from 'lucide-react';
import { SAVED_CARDS, SAVED_ADDRESSES } from '../constants/gameData';
import type { SavedCard, SavedAddress } from '../constants/gameData';

interface BillingInfoProps {
  onContinue: (firstName: string, lastName: string, card: SavedCard, address: SavedAddress) => void;
}

const BillingInfo: React.FC<BillingInfoProps> = ({ onContinue }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [cardDropdownOpen, setCardDropdownOpen] = useState(false);
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);

  const isFormValid = firstName.trim() !== '' && lastName.trim() !== '' && selectedCard !== null && selectedAddress !== null;

  return (
    <div className="flex-1 flex flex-col bg-white p-6 overflow-hidden relative">
      <div className="flex items-center gap-2 text-indigo-600 mb-6 shrink-0 font-black">
        <Shield size={20} /> ACCOUNT SETUP
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Set Up Your Shopping Profile</h2>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-indigo-800 leading-relaxed">
              Enter your name and select your saved payment and address info — just like your browser would autofill them.
            </p>
          </div>
        </div>

        <div className="space-y-5 px-1">
          {/* Name fields — manual entry */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Your Name</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Credit Card dropdown */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Payment Method</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setCardDropdownOpen(!cardDropdownOpen); setAddressDropdownOpen(false); }}
                className="w-full flex items-center justify-between pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <CreditCard size={16} className="absolute left-3 top-3 text-slate-400" />
                <span className={selectedCard ? 'text-black' : 'text-slate-400'}>
                  {selectedCard ? selectedCard.label : 'Select saved card...'}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${cardDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {cardDropdownOpen && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                  {SAVED_CARDS.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => { setSelectedCard(card); setCardDropdownOpen(false); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-indigo-50 flex items-center gap-3 border-b border-slate-100 last:border-0"
                    >
                      <CreditCard size={14} className="text-slate-400" />
                      <div>
                        <div className="font-medium text-slate-900">{card.label}</div>
                        <div className="text-xs text-slate-400">Expires {card.expiry}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Address dropdown */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Shipping Address</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setAddressDropdownOpen(!addressDropdownOpen); setCardDropdownOpen(false); }}
                className="w-full flex items-center justify-between pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                <span className={selectedAddress ? 'text-black truncate mr-2' : 'text-slate-400'}>
                  {selectedAddress ? selectedAddress.label : 'Select saved address...'}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ${addressDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {addressDropdownOpen && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                  {SAVED_ADDRESSES.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => { setSelectedAddress(addr); setAddressDropdownOpen(false); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-indigo-50 flex items-center gap-3 border-b border-slate-100 last:border-0"
                    >
                      <MapPin size={14} className="text-slate-400" />
                      <div>
                        <div className="font-medium text-slate-900">{addr.label}</div>
                        <div className="text-xs text-slate-400">{addr.phone}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {selectedCard && selectedAddress && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="text-xs font-bold text-green-700 mb-2">SELECTED INFO</div>
              <div className="text-sm text-green-800 space-y-1">
                <div>Name: {firstName} {lastName}</div>
                <div>Card: {selectedCard.label}</div>
                <div>Ship to: {selectedAddress.label}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 pt-4">
        <button
          onClick={() => onContinue(firstName, lastName, selectedCard!, selectedAddress!)}
          disabled={!isFormValid}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            isFormValid
              ? 'bg-indigo-600 text-white shadow-lg active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          Continue to Shopping
        </button>
      </div>
    </div>
  );
};

export default BillingInfo;
