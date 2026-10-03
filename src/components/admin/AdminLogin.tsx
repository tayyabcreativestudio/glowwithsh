import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { BrandMark } from '../common/BrandMark';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.adminLogin(username, password);
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid administrator credentials. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1E1917] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 sm:p-10 shadow-2xl border border-[#3E3430] space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <BrandMark className="w-12 h-12 mx-auto mb-3" />
          <span className="font-serif text-2xl tracking-widest text-[#241E1C]">
            GLOW<span className="font-light italic text-[#C4A36A]">with</span>SH
          </span>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#665D58] font-sans">
            Atelier Management Portal
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-800 rounded text-xs font-sans border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-sans text-[#241E1C] font-semibold mb-1">
              Username
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#665D58]" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded-md focus:outline-none focus:border-[#C4A36A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans text-[#241E1C] font-semibold mb-1">
              Security Key / Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#665D58]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs font-sans bg-[#FAF7F3] border border-[#E7DED7] rounded-md focus:outline-none focus:border-[#C4A36A]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#241E1C] text-[#FAF7F3] rounded text-xs uppercase font-sans font-semibold tracking-widest hover:bg-[#C4A36A] hover:text-[#241E1C] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Access Atelier Console'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="pt-2 text-center">
          <button
            onClick={onCancel}
            className="text-xs font-sans text-[#665D58] hover:text-[#241E1C] underline cursor-pointer"
          >
            Return to Customer Storefront
          </button>
        </div>
      </div>
    </div>
  );
};
