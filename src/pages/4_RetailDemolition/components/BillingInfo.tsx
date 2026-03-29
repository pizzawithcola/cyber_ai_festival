import React, { useState, useEffect } from 'react';
import { CreditCard, User, Mail, Phone, MapPin, Shield } from 'lucide-react';

const BillingInfo = ({ onContinue }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    address: '',
    city: '',
    zipCode: '',
    phone: ''
  });

  const [isFormValid, setIsFormValid] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Check if all required fields are filled
    const isValid = Object.values(newFormData).every(val => val.trim() !== '');
    setIsFormValid(isValid);
  };

  const fillWithTestData = () => {
    const testData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      cardNumber: '4242 4242 4242 4242',
      expiry: '12/25',
      cvv: '123',
      address: '123 Main Street',
      city: 'San Francisco',
      zipCode: '94102',
      phone: '(555) 123-4567'
    };
    setFormData(testData);
    setIsFormValid(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-white p-6 overflow-hidden relative">
      <div className="flex items-center gap-2 text-indigo-600 mb-6 shrink-0 font-black">
        <Shield size={20} /> SECURITY SETUP
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Welcome to the Future of Shopping</h2>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-indigo-800 leading-relaxed">
              This game lets you experience <strong>agentic shopping</strong> that will become common in the near future. 
              AI agents will handle your purchases automatically, but there are many security risks in these systems. 
              Before we begin, let's set up your billing information to simulate a realistic shopping experience.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Billing Information</h3>
            <button
              onClick={fillWithTestData}
              className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
            >
              Fill with Test Data
            </button>
          </div>

          <div className="px-2">
            <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <CreditCard size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Card Number"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="MM/YY"
                value={formData.expiry}
                onChange={(e) => handleInputChange('expiry', e.target.value)}
                className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="CVV"
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Street Address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="ZIP Code"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 pt-4">
        <button
          onClick={onContinue}
          disabled={!isFormValid}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            isFormValid
              ? 'bg-indigo-600 text-white shadow-lg active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          Continue to Shopping Assistant
        </button>
        {!isFormValid && (
          <p className="text-xs text-slate-500 text-center mt-2">
            Please fill in all billing information to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default BillingInfo;
