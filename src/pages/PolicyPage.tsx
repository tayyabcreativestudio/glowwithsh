import React, { useEffect, useState } from 'react';
import { Truck, RotateCcw, ShieldCheck, FileText, Sparkles, Building2 } from 'lucide-react';

interface PolicyPageProps {
  initialTab?: 'shipping' | 'refunds' | 'privacy' | 'terms' | 'disclaimer' | 'contact' | 'faq';
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ initialTab = 'shipping' }) => {
  const [activeTab, setActiveTab] = useState<'shipping' | 'refunds' | 'privacy' | 'terms' | 'disclaimer' | 'contact' | 'faq'>(
    initialTab
  );
  useEffect(() => setActiveTab(initialTab), [initialTab]);

  const tabs = [
    { id: 'faq', label: 'FAQs', icon: Sparkles },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'refunds', label: 'Refunds & Returns', icon: RotateCcw },
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'disclaimer', label: 'Skincare Disclaimer', icon: Sparkles },
    { id: 'contact', label: 'Seller & Grievance', icon: Building2 },
  ] as const;

  return (
    <div id="legal-policies-page" className="min-h-screen py-12 sm:py-20 bg-[#F8F5FF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-[11px] uppercase font-sans tracking-[0.25em] text-[#7C3AED] font-semibold bg-[#7C3AED]/10 px-3.5 py-1 rounded-full border border-[#7C3AED]/20 inline-block">
            CUSTOMER INFORMATION
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1630] font-normal">
            Customer Policies &amp; <span className="gradient-text">Statutory Details</span>
          </h1>
          <p className="text-xs text-[#6B5F82] font-sans">
            Shipping, returns, privacy and store contact information.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto gap-2 pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-full text-xs font-sans uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'glass-btn-primary shadow-sm font-semibold'
                    : 'glass-card text-[#1E1630] border border-[#DDD6F3] hover:border-[#7C3AED]/40'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Policy Content Body */}
        <div className="glass-card p-8 sm:p-12 rounded-3xl border border-[#DDD6F3] shadow-sm font-sans text-sm text-[#6B5F82] leading-relaxed space-y-6">
          {activeTab === 'faq' && <div className="space-y-5">
            <h2 className="font-serif text-2xl text-[#1E1630]">Frequently Asked Questions</h2>
            <div><h3 className="font-semibold text-[#1E1630]">How do I check my order?</h3><p>Use Track Order with your order ID and the phone number entered at checkout.</p></div>
            <div><h3 className="font-semibold text-[#1E1630]">Which payment methods are available?</h3><p>Checkout shows the currently enabled methods. Online payment is available only when the store has configured it.</p></div>
            <div><h3 className="font-semibold text-[#1E1630]">How much is delivery?</h3><p>Review the delivery charge and final total in checkout before placing your order.</p></div>
            <div><h3 className="font-semibold text-[#1E1630]">Where can I ask about a product or a return?</h3><p>Use the Contact page or the store’s listed support number. Include your order ID for order enquiries.</p></div>
          </div>}
          {/* SHIPPING POLICY */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1E1630]">Shipping &amp; Delivery Policy</h2>
                <p className="text-xs text-[#7C3AED] font-medium mt-1">Effective Date: 28 September 2026</p>
              </div>
              <p>
                At GlowWithSH, every order is treated as an individual skincare ritual. We prepare and inspect each small-batch formulation before courier handoff directly from our studio in Subhash Vihar, Delhi 110053.
              </p>
              
              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">1. Serviceable Locations</h3>
                <p>
                  We deliver across all serviceable 6-digit Indian postal PIN codes through verified express courier partners (Delhivery, BlueDart, DTDC, India Post). If your delivery address PIN code is found non-serviceable at dispatch time, our support team will reach out to arrange alternate postal delivery or issue an immediate 100% refund.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">2. Order Processing &amp; Dispatch</h3>
                <p>
                  Most orders are hand-packaged and prepared for dispatch within <strong>1–2 business days</strong> after successful order verification. Orders placed on Sundays or public holidays commence processing on the subsequent business day.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">3. Estimated Transit Timelines</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong className="text-[#1E1630]">Delhi NCR:</strong> 1 to 2 business days.</li>
                  <li><strong className="text-[#1E1630]">Metro Hubs (Mumbai, Bengaluru, Kolkata, Chennai, Hyderabad, Pune):</strong> 2 to 4 business days.</li>
                  <li><strong className="text-[#1E1630]">Tier 2 &amp; Tier 3 Cities:</strong> 3 to 6 business days.</li>
                  <li><strong className="text-[#1E1630]">Northeast &amp; Special Postal Zones:</strong> 5 to 8 business days.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">4. Shipping Charges &amp; Free Shipping Threshold</h3>
                <p>
                  We offer <strong className="text-[#7C3AED]">Complimentary Express Shipping</strong> on all domestic prepaid &amp; COD orders with a net subtotal of ₹999 or above. Orders below ₹999 incur a standard flat handling fee of ₹99.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">5. Tracking &amp; Delivery Updates</h3>
                <p>
                  Use Track Order with your order ID and checkout phone number. Courier details appear after the store adds them to your order. Contact support if you need a delivery update.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">6. Damaged or Tampered Parcels</h3>
                <p>
                  Please inspect the outer package upon arrival. If the parcel is visibly crushed, wet, leaking, or tampered with, please record an unboxing video or capture photographs prior to opening, and notify our customer care team within 48 hours at <strong className="text-[#7C3AED]">+91 7303490594</strong> or <strong className="text-[#7C3AED]">care@glowwithsh.com</strong>.
                </p>
              </div>
            </div>
          )}

          {/* RETURN & REFUND POLICY */}
          {activeTab === 'refunds' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1E1630]">Return, Refund &amp; Cancellation Policy</h2>
                <p className="text-xs text-[#7C3AED] font-medium mt-1">Effective Date: 28 September 2026</p>
              </div>
              <p>
                Contact support about damaged, incorrect or unsatisfactory items. Include your order ID and details so the store can review the issue and explain the available return or refund options.
              </p>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">1. Order Cancellation</h3>
                <p>
                  You may request order cancellation prior to dispatch. If your order has not been handed over to the courier, we will cancel the order immediately and issue a 100% refund. Once dispatched and assigned an active courier manifest, orders cannot be cancelled mid-transit.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">2. Damaged, Defective, or Incorrect Items</h3>
                <p>
                  If you receive a package with broken glass, leaking pump, missing items, or products differing from your order, notify us within <strong>48 hours</strong> of delivery with:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your Order Number (e.g. GWSH-...)</li>
                  <li>Clear photographs of the outer carton, shipping label, and product condition</li>
                  <li>A short unboxing video (strongly recommended for transit claims)</li>
                </ul>
                <p>
                  Upon verification, we will immediately initiate a complimentary express replacement or a full refund without requiring you to pay return courier costs.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">3. Refund Processing Timelines</h3>
                <p>
                  Once approved:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-[#1E1630]">Online Payments (Razorpay/UPI/Cards):</strong> Reversal is triggered via the payment gateway directly to your original payment account within 24–48 hours, reflecting in your bank statement within 5–7 business days.</li>
                  <li><strong className="text-[#1E1630]">Cash on Delivery (COD):</strong> For eligible COD refunds, our concierge will request your verified UPI VPA or bank NEFT details, disbursed within 3–4 business days.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">4. Non-Returnable Situations</h3>
                <p>
                  In accordance with consumer cosmetics standards, we cannot accept returns or issue refunds for:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Products opened, partially consumed, or unsealed without verified transit damage</li>
                  <li>Change of mind after shipment</li>
                  <li>Personal skin sensitivity without medical backing (we advise patch testing all active formulations prior to application)</li>
                  <li>Claims submitted later than 48 hours following delivered tracking status</li>
                </ul>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1E1630]">Privacy Policy</h2>
                <p className="text-xs text-[#7C3AED] font-medium mt-1">Effective Date: 28 September 2026 | DPDP Act Aligned</p>
              </div>
              <p>
                GlowWithSH respects your personal data. This policy details how we gather, store, and safeguard your information when you access our store, purchase formulations, or interact with our concierge.
              </p>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">1. Information We Collect</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Identity &amp; Contact:</strong> Full name, telephone/WhatsApp mobile number, email address.</li>
                  <li><strong>Delivery &amp; Fulfillment:</strong> House/flat number, street, city, state, and 6-digit postal PIN code.</li>
                  <li><strong>Transaction Details:</strong> Payment confirmation reference, payment method (UPI, card, net banking), and internal order IDs. (Note: We never record, process, or store raw credit/debit card numbers or CVV; all financial data is handled directly by RBI-licensed payment aggregators like Razorpay).</li>
                  <li><strong>Communications:</strong> Inquiries sent to our customer care or concierge, skin consultation notes voluntarily provided, and product reviews.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">2. Purpose of Processing</h3>
                <p>
                  Your information is processed strictly to:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Process, confirm, package, and dispatch your orders.</li>
                  <li>Maintain order and payment records.</li>
                  <li>Provide delivery tracking and customer support notifications.</li>
                  <li>Prevent fraud, abusive checkout attempts, and unauthorized payment activity.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">3. No Sale of Customer Data</h3>
                <p>
                  Order information is used for fulfilment, payment handling and customer support. Optional Google Analytics also receives visit and shopping-event information when you allow analytics.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">4. Data Retention &amp; Rights</h3>
                <p>
                  Transactional records are maintained for the statutory period required under Indian financial and commercial taxation laws. You have the right to request access to your data or request deletion of non-statutory records by contacting our Grievance Officer at <strong className="text-[#7C3AED]">grievance@glowwithsh.com</strong>.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">Optional Analytics</h3>
                <p>With your permission, Google Analytics measures page visits and shopping events, including product details, prices and order references. Our custom events exclude your name, phone number, email, address and payment credentials. Choose Allow analytics or Decline in Analytics preferences; you can change your choice using the button at the bottom of the page.</p>
                <p><a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline">Google Privacy Policy</a></p>
              </div>
            </div>
          )}

          {/* TERMS AND CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1E1630]">Terms &amp; Conditions</h2>
                <p className="text-xs text-[#7C3AED] font-medium mt-1">Effective Date: 28 September 2026</p>
              </div>
              <p>
                Welcome to GlowWithSH. By accessing our website, browsing our collections, or placing an order, you agree to comply with and be bound by the following terms and conditions.
              </p>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">1. Authenticity &amp; Product Representation</h3>
                <p>
                  All GlowWithSH products are formulated with natural botanical extracts, nourishing plant oils, and safe cosmetic actives. While we strive to display textures and shades accurately, slight natural variances may occur between batches due to cold-pressed botanical harvesting.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">2. Order Acceptance &amp; Price Integrity</h3>
                <p>
                  Order placement constitutes an offer to purchase. GlowWithSH reserves the right to decline or cancel orders with inaccurate pricing, suspected fraudulent activity, unauthorized coupon manipulation, or non-serviceable postal addresses. All prices are listed in Indian Rupees (INR) and are inclusive of applicable GST unless explicitly broken out.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">3. Intellectual Property</h3>
                <p>
                  All content included on this website—including brand logos, imagery, botanical formulas, packaging designs, text descriptions, and digital layouts—is the exclusive intellectual property of GlowWithSH Atelier Botanique and founder Shagufi Hussain. Unauthorized reproduction, modification, or commercial exploitation is strictly prohibited.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">4. Governing Law &amp; Jurisdiction</h3>
                <p>
                  These terms are governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with website usage or purchases shall be subject to the exclusive jurisdiction of the competent courts in New Delhi, India.
                </p>
              </div>
            </div>
          )}

          {/* SKINCARE DISCLAIMER */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1E1630]">Skincare &amp; Cosmetic Disclaimer</h2>
                <p className="text-xs text-[#7C3AED] font-medium mt-1">Effective Date: 28 September 2026</p>
              </div>
              <p>
                GlowWithSH develops artisanal cosmetic and skincare products designed for everyday beauty rituals and skin nourishment. We want all customers to enjoy safe and fulfilling results.
              </p>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">1. Cosmetic Use Only — Not Medical Advice</h3>
                <p>
                  Products and descriptions provided on this website are intended solely for personal cosmetic care. They are not pharmaceutical medications and are not intended to diagnose, treat, cure, or prevent any medical dermatological condition. For persistent skin conditions (e.g. severe cystic acne, eczema, rosacea, or dermatitis), consult a licensed dermatologist.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">2. Patch Testing Advisory</h3>
                <p>
                  Even gentle natural botanicals and cold-pressed essential oils can elicit individual reactions in sensitized skin. We strongly advise performing a patch test on a small area of the inner forearm or behind the ear 24 hours prior to full facial or bodily application.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#1E1630]">3. Individual Results Vary</h3>
                <p>
                  Skin biochemistry, lifestyle, humidity, climate, and consistency impact cosmetic efficacy. While our patrons report glowing results, individual experiences may vary. Customer testimonials and reviews represent personal feedback and are not guaranteed medical outcomes.
                </p>
              </div>
            </div>
          )}

          {/* SELLER & GRIEVANCE INFORMATION */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1E1630]">Seller Details &amp; Grievance Redressal</h2>
                <p className="text-xs text-[#7C3AED] font-medium mt-1">Mandatory Disclosure under Consumer Protection (E-Commerce) Rules, 2020</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-5 glass-surface rounded-2xl border border-[#DDD6F3] space-y-2">
                  <h4 className="font-serif text-base text-[#1E1630] font-semibold">Legal Entity &amp; Atelier</h4>
                  <p className="text-xs leading-relaxed">
                    <strong className="text-[#1E1630]">Legal Business Name:</strong> GlowWithSH Atelier Botanique<br />
                    <strong className="text-[#1E1630]">Founder &amp; Principal Formulator:</strong> Shagufi Hussain<br />
                    <strong className="text-[#1E1630]">Registered Atelier Address:</strong><br />
                    E Block street no 08, Pahadi mandir wali gali, Subhash Vihar, Delhi 110053, India<br />
                    <strong className="text-[#1E1630]">Tax details:</strong> Contact the store for its current registration and invoice information.
                  </p>
                </div>

                <div className="p-5 glass-surface rounded-2xl border border-[#DDD6F3] space-y-2">
                  <h4 className="font-serif text-base text-[#1E1630] font-semibold">Customer Care Concierge</h4>
                  <p className="text-xs leading-relaxed">
                    <strong className="text-[#1E1630]">Support Email:</strong> care@glowwithsh.com<br />
                    <strong className="text-[#1E1630]">WhatsApp / Phone:</strong> +91 7303490594<br />
                    <strong className="text-[#1E1630]">Operating Hours:</strong> Monday – Saturday: 10:00 AM – 7:00 PM IST<br />
                    <strong className="text-[#1E1630]">Response Time:</strong> Within 24 business hours
                  </p>
                </div>
              </div>

              <div className="p-5 glass-surface rounded-2xl border border-[#DDD6F3] space-y-3">
                <h4 className="font-serif text-base text-[#1E1630] font-semibold">Grievance Redressal Officer</h4>
                <p className="text-xs leading-relaxed">
                  In accordance with the Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020, the name and contact details of the Grievance Officer are provided below:
                </p>
                <div className="text-xs bg-[#7C3AED]/5 p-4 rounded-xl border border-[#7C3AED]/20 space-y-1">
                  <p><strong className="text-[#1E1630]">Name:</strong> Shagufi Hussain</p>
                  <p><strong className="text-[#1E1630]">Designation:</strong> Founder &amp; Grievance Redressal Officer</p>
                  <p><strong className="text-[#1E1630]">Email:</strong> grievance@glowwithsh.com</p>
                  <p><strong className="text-[#1E1630]">Office Address:</strong> E Block street no 08, Pahadi mandir wali gali, Subhash Vihar, Delhi 110053, India</p>
                  <p><strong className="text-[#1E1630]">Acknowledgment Timeline:</strong> Within 48 hours of grievance ticket receipt</p>
                  <p><strong className="text-[#1E1630]">Resolution Timeline:</strong> Within 30 days from date of receipt</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
