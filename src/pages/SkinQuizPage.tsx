import React, { useState } from 'react';
import { Product } from '../types';
import { formatINR } from '../utils/format';
import { useCart } from '../context/CartContext';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  ShoppingBag,
  MessageSquare,
  ShieldCheck,
  Sun,
  Moon,
  Heart,
  Star,
  CheckCircle2,
} from 'lucide-react';

interface SkinQuizPageProps {
  allProducts: Product[];
  onNavigateToShop: () => void;
  onSelectProduct: (slug: string) => void;
}

interface QuizAnswers {
  skinType: string;
  concern: string;
  routineLength: string;
  lifestyle: string;
}

export const SkinQuizPage: React.FC<SkinQuizPageProps> = ({
  allProducts,
  onNavigateToShop,
  onSelectProduct,
}) => {
  const { addToCart } = useCart();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<QuizAnswers>({
    skinType: '',
    concern: '',
    routineLength: '',
    lifestyle: '',
  });
  const [isCalculated, setIsCalculated] = useState(false);
  const [bundleAdded, setBundleAdded] = useState(false);

  const totalSteps = 4;

  const skinTypeOptions = [
    {
      id: 'dry',
      label: 'Dry & Dehydrated',
      desc: 'Skin feels tight, parched, flaky, or lacks natural dewy glow',
      icon: '💧',
    },
    {
      id: 'oily',
      label: 'Oily & Blemish-Prone',
      desc: 'Excess shine, enlarged pores, prone to breakouts or blackheads',
      icon: '✨',
    },
    {
      id: 'combination',
      label: 'Combination T-Zone',
      desc: 'Oily forehead, nose, and chin, with drier or normal cheeks',
      icon: '🌿',
    },
    {
      id: 'sensitive',
      label: 'Sensitive & Reactive',
      desc: 'Prone to redness, stinging, allergies, or barrier irritation',
      icon: '🌸',
    },
    {
      id: 'normal',
      label: 'Normal & Balanced',
      desc: 'Generally comfortable skin looking to enhance vitality and luminosity',
      icon: '🤍',
    },
  ];

  const concernOptions = [
    {
      id: 'pigmentation',
      label: 'Hyperpigmentation & Dark Circles',
      desc: 'Uneven patches, stubborn tan, melasma, and tired eye contours',
      icon: '☀️',
    },
    {
      id: 'bridal',
      label: 'Bridal Luminescence & Glow',
      desc: 'Special occasion radiance, ceremonial preparation, instant dewy veil',
      icon: '👑',
    },
    {
      id: 'acne',
      label: 'Pores, Texture & Clarification',
      desc: 'Uneven surface texture, post-breakout marks, clogged pores',
      icon: '🍃',
    },
    {
      id: 'hydration',
      label: 'Deep Hydration & Barrier Healing',
      desc: 'Quenching moisture loss, replenishing botanical lipids',
      icon: '🌊',
    },
    {
      id: 'antiaging',
      label: 'Firmness & Youthful Elasticity',
      desc: 'Fine lines, dullness, loss of suppleness, mature skin care',
      icon: '⭐',
    },
  ];

  const routineOptions = [
    {
      id: 'minimal',
      label: 'Minimalist (2-Step Regimen)',
      desc: 'Quick 2-minute daily cleanse and hydrate ritual for busy lifestyles',
      time: '2 mins morning & night',
    },
    {
      id: 'balanced',
      label: 'Balanced (3-Step Daily Glow)',
      desc: 'Cleanse, concentrated treatment serum, and sealing barrier cream',
      time: '4 mins morning & night',
    },
    {
      id: 'deluxe',
      label: 'Deluxe Ceremonial (Full Routine)',
      desc: 'Complete multi-layered botanical care for maximum transformation',
      time: '6 mins ritual immersion',
    },
  ];

  const lifestyleOptions = [
    {
      id: 'urban',
      label: 'Urban Sun & Pollution Exposure',
      desc: 'Daily commute, traffic exposure, ultraviolet stress',
    },
    {
      id: 'ac',
      label: 'Indoor Air-Conditioned Environment',
      desc: 'Prolonged screen time and dry artificial air conditioning',
    },
    {
      id: 'wedding',
      label: 'Upcoming Milestone / Wedding Season',
      desc: 'Preparing for festivities, celebrations, photography ready',
    },
    {
      id: 'natural',
      label: 'Gentle Pure Botanical Devotee',
      desc: 'Prioritizing time-tested traditional formulations crafted without harsh chemicals',
    },
  ];

  const handleSelectOption = (field: keyof QuizAnswers, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    } else {
      setIsCalculated(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setStep(1);
    setAnswers({
      skinType: '',
      concern: '',
      routineLength: '',
      lifestyle: '',
    });
    setIsCalculated(false);
    setBundleAdded(false);
  };

  // Algorithmic product recommendation based on answers
  const getRecommendedProducts = (): { amProducts: Product[]; pmProducts: Product[]; allRecs: Product[] } => {
    let recs: Product[] = [];

    // Helper finding product by slug or id
    const findProd = (idOrSlug: string) =>
      allProducts.find((p) => p.id === idOrSlug || p.slug.includes(idOrSlug));

    // Base face wash
    const facewash = findProd('prod-1') || allProducts[0];

    // Targeted serum / elixir
    let serum = findProd('prod-11') || findProd('rice') || allProducts[1]; // Korean rice serum

    // Targeted cream
    let cream = findProd('prod-3') || findProd('bridal') || allProducts[2]; // Bridal magical cream

    // Supplemental formula based on concern
    let supplement = findProd('prod-7') || allProducts[3]; // Bridal soap or kit

    if (answers.concern === 'pigmentation') {
      const combo = findProd('prod-2');
      if (combo) recs.push(combo);
      recs.push(facewash, serum);
    } else if (answers.concern === 'bridal') {
      const bridalCream = findProd('prod-3') || cream;
      const bridalSoap = findProd('prod-7') || supplement;
      recs.push(facewash, serum, bridalCream, bridalSoap);
    } else if (answers.concern === 'acne') {
      recs.push(facewash, serum);
      if (cream) recs.push(cream);
    } else {
      recs.push(facewash, serum, cream);
    }

    // Filter duplicates
    const unique = Array.from(new Set(recs.filter(Boolean)));

    // Routine length filter
    const maxItems = answers.routineLength === 'minimal' ? 2 : answers.routineLength === 'balanced' ? 3 : 4;
    const finalRecs = unique.slice(0, maxItems);

    return {
      amProducts: finalRecs.slice(0, 2),
      pmProducts: finalRecs,
      allRecs: finalRecs,
    };
  };

  const recommendations = getRecommendedProducts();

  const bundleTotal = recommendations.allRecs.reduce((acc, p) => acc + p.price, 0);
  const bundleDiscount = Math.round(bundleTotal * 0.1); // 10% bundle discount
  const bundleFinalPrice = Math.max(0, bundleTotal - bundleDiscount);

  const handleAddBundleToCart = () => {
    recommendations.allRecs.forEach((p) => {
      addToCart(p, 1);
    });
    setBundleAdded(true);
    setTimeout(() => setBundleAdded(false), 3000);
  };

  return (
    <div className="min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {!isCalculated ? (
          /* Quiz Steps View */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#A78BFA]/15 text-[#7C3AED] text-[11px] font-sans font-semibold tracking-widest uppercase">
                <Sparkles size={13} />
                <span>Bespoke Skincare Consultant • 60 Seconds</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1630]">
                Find Your Personal Glow Ritual
              </h1>
              <p className="text-sm font-sans text-[#6B5F82] max-w-lg mx-auto leading-relaxed">
                Formulated by Shagufi Hussain. Answer 4 quick questions to receive your tailored morning and evening botanical skincare prescription.
              </p>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="flex justify-between text-xs font-sans text-[#6B5F82]">
                <span className="font-medium text-[#7C3AED]">Step {step} of {totalSteps}</span>
                <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
              </div>
              <div className="w-full h-2 bg-[#DDD6F3] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] transition-all duration-500 rounded-full"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Questions Container Card */}
            <div className="glass-card p-6 sm:p-10 rounded-3xl shadow-sm border border-[#DDD6F3] space-y-6">
              {/* Step 1: Skin Type */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="border-b border-[#DDD6F3] pb-4">
                    <span className="text-xs uppercase font-sans tracking-wider text-[#A78BFA] font-semibold">
                      Question 1
                    </span>
                    <h2 className="font-serif text-2xl text-[#1E1630] mt-1">
                      How does your skin feel throughout the day?
                    </h2>
                    <p className="text-xs font-sans text-[#6B5F82] mt-0.5">
                      Select the condition that best reflects your bare skin a few hours after cleansing.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {skinTypeOptions.map((opt) => {
                      const isSelected = answers.skinType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption('skinType', opt.id)}
                          className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3.5 ${
                            isSelected
                              ? 'bg-white border-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-md'
                              : 'bg-white/60 hover:bg-white border-[#DDD6F3]'
                          }`}
                        >
                          <span className="text-2xl shrink-0 mt-0.5">{opt.icon}</span>
                          <div className="space-y-1">
                            <h3 className="font-serif text-base font-semibold text-[#1E1630]">
                              {opt.label}
                            </h3>
                            <p className="text-xs font-sans text-[#6B5F82] leading-relaxed">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Skin Goal */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="border-b border-[#DDD6F3] pb-4">
                    <span className="text-xs uppercase font-sans tracking-wider text-[#A78BFA] font-semibold">
                      Question 2
                    </span>
                    <h2 className="font-serif text-2xl text-[#1E1630] mt-1">
                      What is your foremost skincare priority right now?
                    </h2>
                    <p className="text-xs font-sans text-[#6B5F82] mt-0.5">
                      We will calibrate your botanical active concentrates around this goal.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {concernOptions.map((opt) => {
                      const isSelected = answers.concern === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption('concern', opt.id)}
                          className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3.5 ${
                            isSelected
                              ? 'bg-white border-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-md'
                              : 'bg-white/60 hover:bg-white border-[#DDD6F3]'
                          }`}
                        >
                          <span className="text-2xl shrink-0 mt-0.5">{opt.icon}</span>
                          <div className="space-y-1">
                            <h3 className="font-serif text-base font-semibold text-[#1E1630]">
                              {opt.label}
                            </h3>
                            <p className="text-xs font-sans text-[#6B5F82] leading-relaxed">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Routine Length */}
              {step === 3 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="border-b border-[#DDD6F3] pb-4">
                    <span className="text-xs uppercase font-sans tracking-wider text-[#A78BFA] font-semibold">
                      Question 3
                    </span>
                    <h2 className="font-serif text-2xl text-[#1E1630] mt-1">
                      How much time do you enjoy dedicating to your daily ritual?
                    </h2>
                    <p className="text-xs font-sans text-[#6B5F82] mt-0.5">
                      From effortless 2-minute steps to ceremonial multi-layer luxury.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    {routineOptions.map((opt) => {
                      const isSelected = answers.routineLength === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption('routineLength', opt.id)}
                          className={`p-4 sm:p-5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-white border-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-md'
                              : 'bg-white/60 hover:bg-white border-[#DDD6F3]'
                          }`}
                        >
                          <div className="space-y-1 max-w-md">
                            <h3 className="font-serif text-base font-semibold text-[#1E1630]">
                              {opt.label}
                            </h3>
                            <p className="text-xs font-sans text-[#6B5F82] leading-relaxed">
                              {opt.desc}
                            </p>
                          </div>
                          <span className="text-xs font-sans font-semibold text-[#7C3AED] bg-[#F8F5FF] px-3 py-1.5 rounded-full border border-[#DDD6F3] shrink-0">
                            {opt.time}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 4: Lifestyle Factors */}
              {step === 4 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="border-b border-[#DDD6F3] pb-4">
                    <span className="text-xs uppercase font-sans tracking-wider text-[#A78BFA] font-semibold">
                      Question 4
                    </span>
                    <h2 className="font-serif text-2xl text-[#1E1630] mt-1">
                      What environmental exposure shapes your daily life?
                    </h2>
                    <p className="text-xs font-sans text-[#6B5F82] mt-0.5">
                      Helps us recommend proper antioxidant defense and moisture barrier seals.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {lifestyleOptions.map((opt) => {
                      const isSelected = answers.lifestyle === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption('lifestyle', opt.id)}
                          className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3.5 ${
                            isSelected
                              ? 'bg-white border-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-md'
                              : 'bg-white/60 hover:bg-white border-[#DDD6F3]'
                          }`}
                        >
                          <div className="space-y-1">
                            <h3 className="font-serif text-base font-semibold text-[#1E1630]">
                              {opt.label}
                            </h3>
                            <p className="text-xs font-sans text-[#6B5F82] leading-relaxed">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-[#DDD6F3]">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-5 py-2.5 text-xs font-sans font-medium text-[#6B5F82] hover:text-[#1E1630] flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Previous Question</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !answers.skinType) ||
                    (step === 2 && !answers.concern) ||
                    (step === 3 && !answers.routineLength) ||
                    (step === 4 && !answers.lifestyle)
                  }
                  className="px-7 py-3 glass-btn-primary text-white text-xs uppercase font-sans font-semibold tracking-wider rounded-xl flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span>{step === totalSteps ? 'Generate My Ritual' : 'Continue'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Calculated Results View */
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* Success Hero Badge */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-sans font-semibold tracking-widest uppercase border border-emerald-200">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Ritual Formulated Successfully</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1630]">
                Your Custom Glow Ritual
              </h1>
              <p className="text-sm font-sans text-[#6B5F82] max-w-lg mx-auto leading-relaxed">
                Based on your profile for{' '}
                <strong className="text-[#1E1630] capitalize">{answers.skinType} skin</strong> with a focus on{' '}
                <strong className="text-[#1E1630] capitalize">{answers.concern}</strong>.
              </p>
            </div>

            {/* Morning & Evening Ritual Steps Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Morning Routine Card */}
              <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-sm border border-[#DDD6F3] space-y-4">
                <div className="flex items-center justify-between border-b border-[#DDD6F3] pb-3">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Sun size={18} />
                    <h3 className="font-serif text-xl text-[#1E1630]">Morning Radiance (AM)</h3>
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-[#7C3AED] bg-[#F8F5FF] px-2.5 py-1 rounded-full border border-[#DDD6F3]">
                    Purify &amp; Protect
                  </span>
                </div>
                <div className="space-y-3 text-xs font-sans">
                  <div className="p-3.5 bg-white/80 rounded-2xl border border-[#DDD6F3] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-[#7C3AED]">Step 1: Cleanse</span>
                    <p className="font-medium text-[#1E1630]">Golden Facewash Cleanse (60s)</p>
                    <p className="text-[#6B5F82] text-[11px]">
                      Gently purify overnight cellular oils without stripping moisture veil.
                    </p>
                  </div>
                  <div className="p-3.5 bg-white/80 rounded-2xl border border-[#DDD6F3] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-[#7C3AED]">Step 2: Treat</span>
                    <p className="font-medium text-[#1E1630]">Botanical Elixir / Rice Serum</p>
                    <p className="text-[#6B5F82] text-[11px]">
                      Press 3 drops into damp skin for immediate cellular hydration and antioxidant barrier.
                    </p>
                  </div>
                  <div className="p-3.5 bg-white/80 rounded-2xl border border-[#DDD6F3] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-[#7C3AED]">Step 3: Seal</span>
                    <p className="font-medium text-[#1E1630]">Protective Glow Moisture Seal</p>
                    <p className="text-[#6B5F82] text-[11px]">
                      Seal in hydration and shield against urban pollution and sun exposure.
                    </p>
                  </div>
                </div>
              </div>

              {/* Evening Routine Card */}
              <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-sm border border-[#DDD6F3] space-y-4">
                <div className="flex items-center justify-between border-b border-[#DDD6F3] pb-3">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Moon size={18} />
                    <h3 className="font-serif text-xl text-[#1E1630]">Night Restoration (PM)</h3>
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-[#7C3AED] bg-[#F8F5FF] px-2.5 py-1 rounded-full border border-[#DDD6F3]">
                    Deep Repair
                  </span>
                </div>
                <div className="space-y-3 text-xs font-sans">
                  <div className="p-3.5 bg-white/80 rounded-2xl border border-[#DDD6F3] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-[#7C3AED]">Step 1: Clarify</span>
                    <p className="font-medium text-[#1E1630]">Warm Botanical Wash</p>
                    <p className="text-[#6B5F82] text-[11px]">
                      Melt away environmental makeup and pollutants accumulated throughout the day.
                    </p>
                  </div>
                  <div className="p-3.5 bg-white/80 rounded-2xl border border-[#DDD6F3] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-[#7C3AED]">Step 2: Intensive Treatment</span>
                    <p className="font-medium text-[#1E1630]">Cellular Renewal Serum</p>
                    <p className="text-[#6B5F82] text-[11px]">
                      Targets melanin balance, fades stubborn pigmentation marks during sleep.
                    </p>
                  </div>
                  <div className="p-3.5 bg-white/80 rounded-2xl border border-[#DDD6F3] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-[#7C3AED]">Step 3: Velvety Lock</span>
                    <p className="font-medium text-[#1E1630]">Bridal Glow Magical Cream</p>
                    <p className="text-[#6B5F82] text-[11px]">
                      Rich, buttery texture to nourish collagen and awaken with radiant glass skin.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Products Showcase & Bundle CTA */}
            <div className="glass-card p-6 sm:p-10 rounded-3xl shadow-sm border border-[#DDD6F3] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDD6F3] pb-6">
                <div>
                  <span className="text-xs uppercase font-sans tracking-widest text-[#A78BFA] font-semibold">
                    Curated Formulas
                  </span>
                  <h3 className="font-serif text-2xl text-[#1E1630] mt-1">
                    Your Complete Prescribed Ritual Bag
                  </h3>
                  <p className="text-xs font-sans text-[#6B5F82] mt-0.5">
                    Specially matched for optimal compatibility when layered sequentially.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 bg-[#F8F5FF] border border-[#DDD6F3] px-4 py-2 rounded-2xl">
                  <span className="text-xs font-sans text-[#6B5F82]">Bundle Offer:</span>
                  <span className="text-xs font-sans font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    SAVE 10%
                  </span>
                </div>
              </div>

              {/* Product Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recommendations.allRecs.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => onSelectProduct(prod.slug)}
                    className="group bg-white p-4 rounded-2xl border border-[#DDD6F3] hover:border-[#7C3AED] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="aspect-square rounded-xl overflow-hidden bg-[#FAF7F3]">
                        <img
                          src={prod.primaryImage}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-sans tracking-wider text-[#A78BFA] font-semibold">
                          {prod.categoryName}
                        </span>
                        <h4 className="font-serif text-sm font-semibold text-[#1E1630] line-clamp-1 mt-0.5">
                          {prod.name}
                        </h4>
                        <p className="text-xs font-sans text-[#6B5F82] line-clamp-2 mt-1">
                          {prod.shortDescription}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#DDD6F3] text-xs font-sans">
                      <span className="font-serif text-base font-semibold text-[#1E1630]">
                        {formatINR(prod.price)}
                      </span>
                      <span className="text-[11px] text-[#7C3AED] group-hover:underline font-medium">
                        View Details →
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bundle Pricing & One-Click Add to Bag */}
              <div className="p-6 bg-gradient-to-br from-[#F8F5FF] to-[#EDE8F5] rounded-2xl border border-[#DDD6F3] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs uppercase font-sans tracking-wider text-[#7C3AED] font-semibold">
                    Complete Ritual Bundle Price
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-serif font-bold text-[#1E1630]">
                      {formatINR(bundleFinalPrice)}
                    </span>
                    <span className="text-sm font-sans line-through text-[#6B5F82]">
                      {formatINR(bundleTotal)}
                    </span>
                    <span className="text-xs font-sans font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      You Save {formatINR(bundleDiscount)}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-[#6B5F82]">
                    Includes complimentary express courier delivery across India.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleAddBundleToCart}
                    className="w-full sm:w-auto px-7 py-3.5 glass-btn-primary text-white text-xs uppercase font-sans font-semibold tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                  >
                    {bundleAdded ? (
                      <>
                        <Check size={15} />
                        <span>Ritual Added to Bag!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={15} />
                        <span>Add Complete Ritual to Bag</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://wa.me/917303490594?text=${encodeURIComponent(
                      `Hello Shagufi! I took your Skin Quiz for ${answers.skinType} skin with concern "${answers.concern}". Can you review my recommended ritual?`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-[#F8F5FF] text-[#1E1630] border border-[#DDD6F3] rounded-xl text-xs font-sans font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <MessageSquare size={14} className="text-[#7C3AED]" />
                    <span>Discuss with Shagufi</span>
                  </a>
                </div>
              </div>

              {bundleAdded && (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-sans font-medium flex items-center gap-2 justify-center animate-in fade-in">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>The entire ritual has been added to your bag. Click the shopping bag at the top right to checkout!</span>
                </div>
              )}
            </div>

            {/* Restart or Return Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 bg-white hover:bg-[#F8F5FF] text-[#6B5F82] border border-[#DDD6F3] rounded-xl text-xs font-sans font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw size={14} />
                <span>Retake Consultation</span>
              </button>

              <button
                type="button"
                onClick={onNavigateToShop}
                className="px-6 py-2.5 glass-btn-secondary text-[#1E1630] rounded-xl text-xs font-sans font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>Browse Full Boutique</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
