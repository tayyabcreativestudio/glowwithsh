import React, { useEffect, useRef, useState } from 'react';
import { Order, SiteSettings } from '../../types';
import { formatINR, formatDate } from '../../utils/format';
import { Printer, X, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface InvoiceModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [siteSettings, setSiteSettings] = useState<Partial<SiteSettings>>({});

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/site-settings')
      .then((response) => (response.ok ? response.json() : null))
      .then((settings) => settings && setSiteSettings(settings))
      .catch(() => undefined);
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-${order.id.replace('ORD-', '')}`;
  const invoiceDate = formatDate(order.createdAt);

  // Authoritative GST calculation & breakdown
  const isDelhi = order.taxSummary
    ? !order.taxSummary.isInterstate
    : (order.state?.trim().toLowerCase() === 'delhi' || order.city?.trim().toLowerCase() === 'delhi');

  const discountVal = order.discountAmount ?? order.discount ?? 0;
  const netSubtotal = Math.max(0, order.subtotal - discountVal);

  const taxableAmount = order.taxSummary?.taxableAmount ?? Math.round(netSubtotal / 1.18);
  const totalTax = order.taxSummary
    ? (order.taxSummary.cgst + order.taxSummary.sgst + order.taxSummary.igst)
    : Math.max(0, netSubtotal - taxableAmount);

  const cgst = isDelhi ? (order.taxSummary?.cgst ?? Math.round(totalTax / 2)) : 0;
  const sgst = isDelhi ? (order.taxSummary?.sgst ?? (totalTax - cgst)) : 0;
  const igst = !isDelhi ? (order.taxSummary?.igst ?? totalTax) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:h-auto">
      <div className="relative w-full max-w-3xl my-8 bg-white rounded-3xl shadow-2xl border border-[#DDD6F3] overflow-hidden print:border-none print:shadow-none print:rounded-none print:m-0 print:w-full">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F8F5FF] border-b border-[#DDD6F3] print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
            <span className="text-xs uppercase font-sans tracking-widest font-semibold text-[#1E1630]">
              Official GST Tax Invoice &amp; Packaging Slip
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-sans font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#6B5F82] hover:text-[#1E1630] rounded-lg hover:bg-white transition-colors cursor-pointer"
              aria-label="Close invoice"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={invoiceRef} className="p-8 sm:p-12 space-y-8 bg-white text-[#1E1630] print:p-6 print:text-black">
          {/* Header & Atelier Details */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-[#DDD6F3] pb-8">
            <div>
              <div className="flex flex-col">
                <span className="font-serif text-3xl tracking-widest font-medium text-[#1E1630] print:text-black">
                  GLOW<span className="font-light italic text-[#7C3AED] print:text-black">with</span>SH
                </span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-[#7C3AED] font-semibold mt-0.5 font-sans print:text-black">
                  ATELIER BOTANIQUE • BY SHAGUFI HUSSAIN
                </span>
              </div>
              <div className="text-xs font-sans text-[#6B5F82] print:text-zinc-600 mt-3 leading-relaxed max-w-sm space-y-1">
                <p><strong>Legal Entity:</strong> {siteSettings.legalBusinessName || 'GlowWithSH Atelier Botanique'}</p>
                <p><strong>Registered Atelier:</strong> E Block street no 08, Pahadi mandir wali gali, Subhash Vihar, Delhi 110053, India</p>
                <p><strong>GSTIN:</strong> {siteSettings.gstin || 'Not configured'}</p>
                <p><strong>Support:</strong> care@glowwithsh.com | WhatsApp: +91 7303490594</p>
              </div>
            </div>

            <div className="text-left sm:text-right font-sans">
              <span className="inline-block px-3 py-1 bg-[#F8F5FF] print:bg-zinc-100 border border-[#DDD6F3] rounded-lg text-xs font-mono font-semibold text-[#7C3AED] print:text-black mb-2">
                TAX INVOICE (RULE 46 OF CGST RULES)
              </span>
              <p className="text-xs text-[#6B5F82] print:text-zinc-600">
                Invoice No: <strong className="font-mono text-[#1E1630] print:text-black">{invoiceNumber}</strong>
              </p>
              <p className="text-xs text-[#6B5F82] print:text-zinc-600">
                Invoice Date: <strong className="text-[#1E1630] print:text-black">{invoiceDate}</strong>
              </p>
              <p className="text-xs text-[#6B5F82] print:text-zinc-600">
                Order Ref: <strong className="font-mono text-[#1E1630] print:text-black">{order.id}</strong>
              </p>
              <p className="text-xs text-[#6B5F82] print:text-zinc-600">
                Place of Supply: <strong className="text-[#1E1630] print:text-black">{order.state || 'Delhi'} ({isDelhi ? 'Intra-State 07' : 'Inter-State'})</strong>
              </p>
            </div>
          </div>

          {/* Customer & Shipping Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans border-b border-[#DDD6F3] pb-6">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#7C3AED] print:text-black block">
                Billed &amp; Shipped To:
              </span>
              <p className="text-sm font-serif font-semibold text-[#1E1630] print:text-black">
                {order.customerName}
              </p>
              <p className="text-[#6B5F82] print:text-zinc-600 leading-relaxed">
                {order.address}
                <br />
                {order.city}, {order.state} - {order.pincode}
                <br />
                Mobile: {order.phone}
                {order.email && <><br />Email: {order.email}</>}
              </p>
            </div>

            <div className="space-y-1.5 sm:text-right">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#7C3AED] print:text-black block">
                Fulfillment &amp; Payment Details:
              </span>
              <p className="text-xs text-[#6B5F82] print:text-zinc-600">
                Payment Method:{' '}
                <strong className="uppercase text-[#1E1630] print:text-black">
                  {order.paymentMethod === 'online_ready'
                    ? 'Online Payment (Razorpay UPI/Cards)'
                    : order.paymentMethod === 'whatsapp'
                    ? 'WhatsApp Concierge'
                    : 'Cash on Delivery (COD)'}
                </strong>
              </p>
              <p className="text-xs text-[#6B5F82] print:text-zinc-600">
                Payment Status:{' '}
                <strong className="uppercase text-[#1E1630] print:text-black">
                  {order.paymentStatus === 'paid' ? 'Verified / Paid' : order.paymentStatus}
                </strong>
                {order.paymentId ? ` • Ref: ${order.paymentId}` : ''}
              </p>
              {order.courierPartner && (
                <p className="text-xs text-[#6B5F82] print:text-zinc-600">
                  Carrier Partner: <strong className="text-[#1E1630] print:text-black">{order.courierPartner}</strong>
                </p>
              )}
              {order.trackingNumber && (
                <p className="text-xs text-[#6B5F82] print:text-zinc-600">
                  AWB Tracking: <strong className="font-mono text-[#1E1630] print:text-black">{order.trackingNumber}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table with HSN and GST */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b-2 border-[#1E1630] text-[10px] uppercase tracking-wider text-[#1E1630] print:text-black">
                  <th className="py-2.5">#</th>
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">HSN</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Taxable Val</th>
                  <th className="py-2.5 text-right">GST Rate</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD6F3]">
                {order.items.map((item, index) => {
                  const lineTotal = item.price * item.quantity;
                  const itemTaxable = Math.round(lineTotal / 1.18);
                  return (
                    <tr key={index} className="text-[#1E1630] print:text-black">
                      <td className="py-3 text-[#6B5F82] print:text-zinc-600">{index + 1}</td>
                      <td className="py-3 font-medium">
                        <span>{item.name}</span>
                        <span className="block text-[10px] font-mono text-[#6B5F82] print:text-zinc-500">{item.sku}</span>
                      </td>
                      <td className="py-3 text-center font-mono text-[11px] text-[#6B5F82] print:text-zinc-600">
                        3304
                      </td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right">{formatINR(item.price)}</td>
                      <td className="py-3 text-right font-mono">{formatINR(itemTaxable)}</td>
                      <td className="py-3 text-right">18%</td>
                      <td className="py-3 text-right font-semibold">
                        {formatINR(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation & Statutory GST Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-[#DDD6F3] pt-6 text-xs font-sans">
            <div className="space-y-3 max-w-sm text-[#6B5F82] print:text-zinc-600">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck size={15} />
                <span>100% Genuine Handcrafted Botanical Care (Delhi Atelier)</span>
              </div>
              
              {/* GST Tax Summary Box */}
              <div className="p-3 bg-[#F8F5FF] print:bg-zinc-50 border border-[#DDD6F3] rounded-xl space-y-1.5 font-mono text-[11px]">
                <p className="font-sans font-semibold text-[#1E1630] print:text-black uppercase text-[10px] tracking-wider">
                  Tax Breakdown ({isDelhi ? 'Intra-State Delhi: CGST 9% + SGST 9%' : 'Inter-State: IGST 18%'})
                </p>
                <div className="flex justify-between">
                  <span>Taxable Value:</span>
                  <span>{formatINR(taxableAmount)}</span>
                </div>
                {isDelhi ? (
                  <>
                    <div className="flex justify-between">
                      <span>CGST (9%):</span>
                      <span>{formatINR(cgst)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST (9%):</span>
                      <span>{formatINR(sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span>IGST (18%):</span>
                    <span>{formatINR(igst)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-[#DDD6F3] font-semibold text-[#1E1630] print:text-black">
                  <span>Total Tax Assessed:</span>
                  <span>{formatINR(totalTax)}</span>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-[#6B5F82] print:text-zinc-600">
                <span>Subtotal (Gross):</span>
                <span className="text-[#1E1630] print:text-black font-medium">{formatINR(order.subtotal)}</span>
              </div>
              {discountVal > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                  <span>-{formatINR(discountVal)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6B5F82] print:text-zinc-600">
                <span>Express Shipping:</span>
                <span>{order.deliveryFee === 0 ? 'Complimentary' : formatINR(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-base font-serif font-semibold text-[#1E1630] print:text-black pt-3 border-t-2 border-[#1E1630]">
                <span>Total Amount:</span>
                <span className="font-sans font-bold text-lg text-[#7C3AED] print:text-black">
                  {formatINR(order.grandTotal)}
                </span>
              </div>
              <p className="text-[10px] text-right text-[#6B5F82] print:text-zinc-500 italic">
                (Inclusive of all applicable Indian taxes)
              </p>
            </div>
          </div>

          {/* Footer Seal */}
          <div className="pt-6 border-t border-[#DDD6F3] flex flex-col sm:flex-row items-center justify-between text-[11px] font-sans text-[#6B5F82] print:text-zinc-600 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#7C3AED]" />
              <span>Computer generated authentic tax invoice • No signature required</span>
            </div>
            <div className="text-right">
              <span className="font-serif italic text-xs text-[#1E1630] print:text-black">
                Shagufi Hussain
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-[#6B5F82]">
                Authorized Signatory • GlowWithSH
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
