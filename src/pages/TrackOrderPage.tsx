import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/format';
import { useCart } from '../context/CartContext';
import { InvoiceModal } from '../components/common/InvoiceModal';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  FileText,
  MessageSquare,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PhoneCall,
} from 'lucide-react';

interface TrackOrderPageProps {
  initialOrderId?: string;
  onNavigateToShop: () => void;
  onSelectProduct?: (slug: string) => void;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({
  initialOrderId,
  onNavigateToShop,
  onSelectProduct,
}) => {
  const { addToCart } = useCart();
  const [searchInput, setSearchInput] = useState(initialOrderId || '');
  const [identityInput, setIdentityInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [reorderedAlert, setReorderedAlert] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Perform search requiring dual verification
  const performSearch = async (orderIdTerm?: string, contactTerm?: string) => {
    const cleanId = (orderIdTerm !== undefined ? orderIdTerm : searchInput).trim();
    const cleanContact = (contactTerm !== undefined ? contactTerm : identityInput).trim();
    if (!cleanId || !cleanContact) {
      setError('Please provide both your Order ID and the phone number or email used during checkout.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isEmail = cleanContact.includes('@');
      const res = await api.trackOrder({
        orderId: cleanId,
        phone: isEmail ? undefined : cleanContact,
        email: isEmail ? cleanContact : undefined,
      });
      if (res.orders && res.orders.length > 0) {
        setOrders(res.orders);
        setSelectedOrder(res.orders[0]);
      } else {
        setError('No shipment found for the provided details. Please verify your order number and phone/email.');
        setOrders([]);
        setSelectedOrder(null);
      }
    } catch (err: any) {
      setError(err.message || 'No shipment found matching this inquiry.');
      setOrders([]);
      setSelectedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load check
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderParam = urlParams.get('orderId') || urlParams.get('order') || initialOrderId;
    const phoneParam = urlParams.get('phone') || '';
    const emailParam = urlParams.get('email') || '';
    if (orderParam) {
      setSearchInput(orderParam);
      if (phoneParam || emailParam) {
        setIdentityInput(phoneParam || emailParam);
        performSearch(orderParam, phoneParam || emailParam);
      }
    }
  }, [initialOrderId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const copyToClipboard = (text: string, type: 'awb' | 'order') => {
    navigator.clipboard.writeText(text);
    if (type === 'awb') {
      setCopiedAwb(true);
      setTimeout(() => setCopiedAwb(false), 2000);
    } else {
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  const handleReorder = () => {
    if (!selectedOrder) return;
    // Add all items in selectedOrder to cart
    for (const item of selectedOrder.items) {
      addToCart(
        {
          id: item.productId,
          sku: item.sku,
          name: item.name,
          slug: item.productId,
          price: item.price,
          stockQuantity: 99,
          lowStockThreshold: 5,
          trackInventory: false,
          allowBackorders: true,
          status: 'published',
          featured: false,
          bestSeller: false,
          newProduct: false,
          limitedEdition: false,
          visible: true,
          primaryImage: item.image,
          mediaGallery: [item.image],
          shortDescription: item.name,
          description: '',
          benefits: [],
          ingredients: [],
          howToUse: '',
          skinType: 'All',
          productType: 'Skincare',
          size: '',
          categoryId: '',
          categoryName: '',
          createdAt: '',
          updatedAt: '',
          sortOrder: 0,
        },
        item.quantity
      );
    }
    setReorderedAlert(true);
    setTimeout(() => setReorderedAlert(false), 3000);
  };

  // Determine active milestone index (0 to 4)
  const getMilestoneIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'New':
      case 'Confirmed':
        return 0; // Order Confirmed
      case 'Processing':
      case 'Packed':
        return 1; // Handcrafted & Packed
      case 'Shipped':
        return 2; // Dispatched & In Transit
      case 'Delivered':
        return 4; // Delivered
      case 'Cancelled':
      case 'Returned':
      case 'Refunded':
        return -1;
      default:
        return 0;
    }
  };

  const milestones = [
    { title: 'Order Confirmed', description: 'Order registered & verified at atelier' },
    { title: 'Handcrafted & Packed', description: 'Formulations inspected & sealed' },
    { title: 'Dispatched with Courier', description: 'Handed to express logistics partner' },
    { title: 'Out for Delivery', description: 'Arriving at your local postal hub' },
    { title: 'Delivered', description: 'Safely delivered to your doorstep' },
  ];

  const activeMilestoneIndex = selectedOrder ? getMilestoneIndex(selectedOrder.orderStatus) : 0;

  return (
    <div className="min-h-screen py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#A78BFA]/15 text-[#7C3AED] text-[11px] font-sans font-semibold tracking-widest uppercase">
            <Truck size={13} />
            <span>Live Shipment Radar • Atelier Logistics</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1630]">
            Track Your Ritual Shipment
          </h1>
          <p className="text-sm font-sans text-[#6B5F82] max-w-xl mx-auto leading-relaxed">
            Follow your handcrafted GlowWithSH skincare formulas from our Delhi atelier to your home with live courier tracking updates.
          </p>
        </div>

        {/* Search Radar Box */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-sm border border-[#DDD6F3] space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7C3AED]"
              />
              <input
                type="text"
                placeholder="Order ID (e.g. ORD-20260929-1234)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white text-xs sm:text-sm font-sans text-[#1E1630] rounded-2xl border border-[#DDD6F3] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all placeholder:text-[#6B5F82]/60"
              />
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Phone or email used at checkout"
                value={identityInput}
                onChange={(e) => setIdentityInput(e.target.value)}
                className="w-full px-4 py-3.5 bg-white text-xs sm:text-sm font-sans text-[#1E1630] rounded-2xl border border-[#DDD6F3] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all placeholder:text-[#6B5F82]/60"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3.5 glass-btn-primary text-white text-xs uppercase font-sans font-semibold tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Tracking...</span>
                </>
              ) : (
                <>
                  <Package size={15} />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </form>

          {/* Real Shipping Info & Concierge Assistance */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-sans text-[#6B5F82]">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#7C3AED]" />
              <span>Official dispatch status and courier AWB tracking once assigned by our atelier</span>
            </div>
            <a
              href="https://wa.me/917303490594?text=Hello%20Shagufi!%20I%20need%20help%20checking%20my%20GlowWithSH%20order."
              target="_blank"
              rel="noreferrer"
              className="text-[#7C3AED] hover:text-[#5B21B6] transition-colors font-medium flex items-center gap-1"
            >
              <PhoneCall size={12} />
              <span>Concierge Help (+91 7303490594)</span>
            </a>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-sans flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{error}</p>
                <p className="text-amber-800">
                  Tip: Use the order ID shown on the confirmation page and the 10-digit mobile number entered during checkout.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Multi-Order Tabs Selector (If multiple orders found for phone number) */}
        {orders.length > 1 && (
          <div className="space-y-3">
            <span className="text-xs uppercase font-sans tracking-wider font-semibold text-[#6B5F82] block">
              Multiple Orders Found ({orders.length}) — Select to Inspect:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {orders.map((o) => {
                const isSelected = selectedOrder?.id === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-md'
                        : 'bg-white/60 hover:bg-white border-[#DDD6F3]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#1E1630]">
                      <span>{o.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-sans font-semibold ${
                          o.orderStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.orderStatus === 'Shipped'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {o.orderStatus}
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-sans text-[#6B5F82] space-y-0.5">
                      <p>{formatDate(o.createdAt)}</p>
                      <p className="font-medium text-[#1E1630]">
                        {formatINR(o.grandTotal)} • {o.items.length} {o.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Initial Clean Welcome State (Before any search is submitted) */}
        {!selectedOrder && !loading && !error && orders.length === 0 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="glass-card p-8 sm:p-10 rounded-3xl shadow-sm border border-[#DDD6F3] text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-[#A78BFA]/15 text-[#7C3AED] flex items-center justify-center mx-auto shadow-inner">
                <Package size={32} />
              </div>
              <div className="max-w-lg mx-auto space-y-2">
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1630]">
                  Live Atelier Shipment Radar
                </h2>
                <p className="text-xs sm:text-sm font-sans text-[#6B5F82] leading-relaxed">
                  Track your handcrafted GlowWithSH skincare formulas in real time as they are prepared, quality inspected, and dispatched from our Delhi studio to your doorstep.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
                <div className="p-5 rounded-2xl bg-white/70 border border-[#DDD6F3] space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-[#A78BFA]/20 text-[#7C3AED] flex items-center justify-center text-xs font-bold font-mono">
                    1
                  </div>
                  <h3 className="font-serif text-base text-[#1E1630]">Order ID Lookup</h3>
                  <p className="text-[11px] font-sans text-[#6B5F82] leading-relaxed">
                    Enter the Order ID (e.g. <span className="font-mono text-[#7C3AED]">ORD-2026...</span>) received on your checkout screen, WhatsApp receipt, or confirmation email.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/70 border border-[#DDD6F3] space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-[#A78BFA]/20 text-[#7C3AED] flex items-center justify-center text-xs font-bold font-mono">
                    2
                  </div>
                  <h3 className="font-serif text-base text-[#1E1630]">Mobile Phone</h3>
                  <p className="text-[11px] font-sans text-[#6B5F82] leading-relaxed">
                    Don't have your Order ID? Enter the 10-digit Indian phone number you provided during checkout to retrieve all your shipments instantly.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/70 border border-[#DDD6F3] space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-[#A78BFA]/20 text-[#7C3AED] flex items-center justify-center text-xs font-bold font-mono">
                    3
                  </div>
                  <h3 className="font-serif text-base text-[#1E1630]">Real Carrier Tracking</h3>
                  <p className="text-[11px] font-sans text-[#6B5F82] leading-relaxed">
                    Follow real Delhivery, Blue Dart &amp; DTDC air express transit updates, expected arrival dates, and view or print your official GST tax invoice.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://wa.me/917303490594?text=Hello%20Shagufi!%20I%20need%20assistance%20tracking%20my%20GlowWithSH%20order."
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-xl bg-white hover:bg-[#F8F5FF] text-[#1E1630] border border-[#DDD6F3] text-xs font-sans font-medium flex items-center gap-2 transition-colors shadow-xs"
                >
                  <MessageSquare size={15} className="text-emerald-600" />
                  <span>WhatsApp Concierge (+91 7303490594)</span>
                </a>
                <button
                  onClick={onNavigateToShop}
                  className="px-6 py-3 rounded-xl glass-btn-primary text-white text-xs uppercase font-sans font-semibold tracking-wider flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Explore Skincare Catalog</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Order Tracking Detail */}
        {selectedOrder && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Status Header Card */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-sm border border-[#DDD6F3] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDD6F3] pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase font-sans tracking-widest text-[#A78BFA] font-semibold">
                      Live Shipment Tracker
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-ping" />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <h2 className="font-mono text-xl sm:text-2xl font-bold text-[#1E1630]">
                      {selectedOrder.id}
                    </h2>
                    <button
                      onClick={() => copyToClipboard(selectedOrder.id, 'order')}
                      className="p-1.5 text-[#6B5F82] hover:text-[#7C3AED] hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Copy Order ID"
                    >
                      {copiedOrderId ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                    {copiedOrderId && (
                      <span className="text-[10px] text-emerald-700 font-sans font-semibold">Copied!</span>
                    )}
                  </div>
                  <p className="text-xs font-sans text-[#6B5F82] mt-1">
                    Ordered by <strong>{selectedOrder.customerName}</strong> on {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>

                {/* Right side: Estimated Delivery Date Badge */}
                <div className="flex flex-col sm:items-end">
                  <span className="text-[10px] uppercase font-sans tracking-wider text-[#6B5F82]">
                    Expected Arrival
                  </span>
                  <div className="inline-flex items-center gap-2 text-sm sm:text-base font-serif font-semibold text-[#1E1630] mt-0.5">
                    <Clock size={16} className="text-[#7C3AED]" />
                    <span>
                      {selectedOrder.estimatedDeliveryDate
                        ? formatDate(selectedOrder.estimatedDeliveryDate)
                        : selectedOrder.orderStatus === 'Delivered'
                        ? 'Successfully Delivered'
                        : '2–4 Business Days'}
                    </span>
                  </div>
                  <span className="text-[10px] font-sans text-emerald-700 font-medium">
                    Complimentary Express Air Courier
                  </span>
                </div>
              </div>

              {/* Progress Milestones Stepper */}
              <div className="py-4">
                <div className="relative">
                  {/* Background Track Line */}
                  <div className="absolute top-5 left-6 right-6 h-1 bg-[#DDD6F3] -z-0 hidden md:block" />
                  {/* Active Progress Bar */}
                  <div
                    className="absolute top-5 left-6 h-1 bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] transition-all duration-700 -z-0 hidden md:block"
                    style={{
                      width: `${(Math.max(0, activeMilestoneIndex) / (milestones.length - 1)) * 92}%`,
                    }}
                  />

                  {/* Milestones Nodes */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-2">
                    {milestones.map((m, index) => {
                      const isCompleted = index <= activeMilestoneIndex;
                      const isCurrent = index === activeMilestoneIndex;

                      return (
                        <div
                          key={index}
                          className="flex md:flex-col items-center md:text-center gap-4 md:gap-2.5 z-10"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                              isCurrent
                                ? 'bg-[#7C3AED] text-white border-white shadow-lg ring-4 ring-[#7C3AED]/25 scale-110'
                                : isCompleted
                                ? 'bg-emerald-600 text-white border-white shadow-sm'
                                : 'bg-white text-[#6B5F82] border-[#DDD6F3]'
                            }`}
                          >
                            {isCompleted && !isCurrent ? (
                              <CheckCircle2 size={18} />
                            ) : index === 0 ? (
                              <Package size={17} />
                            ) : index === 1 ? (
                              <Sparkles size={17} />
                            ) : index === 2 ? (
                              <Truck size={17} />
                            ) : index === 3 ? (
                              <MapPin size={17} />
                            ) : (
                              <ShieldCheck size={18} />
                            )}
                          </div>
                          <div>
                            <h4
                              className={`text-xs font-sans font-semibold ${
                                isCurrent
                                  ? 'text-[#7C3AED]'
                                  : isCompleted
                                  ? 'text-[#1E1630]'
                                  : 'text-[#6B5F82]'
                              }`}
                            >
                              {m.title}
                            </h4>
                            <p className="text-[11px] font-sans text-[#6B5F82] leading-tight mt-0.5 max-w-[150px] md:mx-auto">
                              {m.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Courier Partner & Waybill Highlight Box */}
              {(selectedOrder.courierPartner || selectedOrder.trackingNumber || selectedOrder.currentLocation) && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FAF8FF] to-[#F1EAFF] border border-[#DDD6F3] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                  {/* Courier Partner */}
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#7C3AED] tracking-wider block">
                      Logistics Partner
                    </span>
                    <p className="text-sm font-serif font-bold text-[#1E1630] mt-0.5">
                      {selectedOrder.courierPartner || 'Delhi Express Direct'}
                    </p>
                    <p className="text-[11px] text-[#6B5F82]">Insured Surface/Air Transit</p>
                  </div>

                  {/* Waybill / AWB */}
                  {selectedOrder.trackingNumber && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#7C3AED] tracking-wider block">
                        Waybill / AWB Tracking Number
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-sm font-bold text-[#1E1630]">
                          {selectedOrder.trackingNumber}
                        </span>
                        <button
                          onClick={() => copyToClipboard(selectedOrder.trackingNumber!, 'awb')}
                          className="text-[#6B5F82] hover:text-[#7C3AED] p-1 cursor-pointer transition-colors"
                          title="Copy Waybill Number"
                        >
                          {copiedAwb ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                      {selectedOrder.courierTrackingUrl && (
                        <a
                          href={selectedOrder.courierTrackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#7C3AED] hover:underline font-medium mt-0.5"
                        >
                          <span>Track on Carrier Website</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Current Transit Location */}
                  {selectedOrder.currentLocation && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#7C3AED] tracking-wider block">
                        Latest Transit Checkpoint
                      </span>
                      <p className="text-xs font-medium text-[#1E1630] mt-0.5 flex items-start gap-1">
                        <MapPin size={13} className="text-[#7C3AED] shrink-0 mt-0.5" />
                        <span>{selectedOrder.currentLocation}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Two-Column Breakdown: Timeline & Order Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Full Chronological Status Logs (7 Cols) */}
              <div className="lg:col-span-7 glass-card p-6 sm:p-8 rounded-3xl shadow-sm border border-[#DDD6F3] space-y-6">
                <div className="flex items-center justify-between border-b border-[#DDD6F3] pb-4">
                  <h3 className="font-serif text-xl text-[#1E1630] flex items-center gap-2">
                    <Clock size={18} className="text-[#7C3AED]" />
                    <span>Shipment History &amp; Milestones</span>
                  </h3>
                  <span className="text-xs font-sans text-[#6B5F82]">
                    {selectedOrder.statusHistory.length} checkpoints recorded
                  </span>
                </div>

                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#DDD6F3]">
                  {selectedOrder.statusHistory
                    .slice()
                    .reverse()
                    .map((item, idx) => (
                      <div key={idx} className="relative flex items-start gap-4 text-xs font-sans">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 z-10 ${
                            idx === 0
                              ? 'bg-[#7C3AED] text-white border-white shadow-md ring-2 ring-[#7C3AED]/20'
                              : 'bg-white text-[#6B5F82] border-[#DDD6F3]'
                          }`}
                        >
                          <CheckCircle2 size={13} />
                        </div>
                        <div className="flex-1 bg-[#F8F5FF] p-3.5 rounded-2xl border border-[#DDD6F3]/70 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-[#1E1630] capitalize">
                              {item.status}
                            </span>
                            <span className="text-[11px] text-[#6B5F82] font-mono">
                              {new Date(item.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              • {formatDate(item.timestamp)}
                            </span>
                          </div>
                          {item.note && (
                            <p className="text-xs text-[#6B5F82] leading-relaxed pt-0.5">
                              {item.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Right Column: Ordered Formulas & Quick Actions (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Formulas List */}
                <div className="glass-card p-6 sm:p-7 rounded-3xl shadow-sm border border-[#DDD6F3] space-y-5">
                  <div className="flex items-center justify-between border-b border-[#DDD6F3] pb-3">
                    <h3 className="font-serif text-lg text-[#1E1630]">
                      Ordered Formulas ({selectedOrder.items.length})
                    </h3>
                  </div>

                  <div className="space-y-3 divide-y divide-[#DDD6F3]">
                    {selectedOrder.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs font-sans"
                      >
                        <div className="flex items-center gap-3">
                          {it.image && (
                            <img
                              src={it.image}
                              alt={it.name}
                              className="w-12 h-14 object-cover rounded-xl border border-[#DDD6F3]"
                            />
                          )}
                          <div>
                            <h4 className="font-serif text-xs font-medium text-[#1E1630] leading-snug">
                              {it.name}
                            </h4>
                            <span className="text-[#6B5F82] text-[11px]">
                              Qty: {it.quantity} • SKU: {it.sku}
                            </span>
                          </div>
                        </div>
                        <span className="font-semibold text-xs text-[#1E1630]">
                          {formatINR(it.price * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Financial Total */}
                  <div className="pt-3 border-t border-[#DDD6F3] space-y-1 text-xs font-sans text-[#6B5F82]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatINR(selectedOrder.subtotal)}</span>
                    </div>
                    {((selectedOrder.discountAmount ?? selectedOrder.discount) > 0) && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</span>
                        <span>-{formatINR(selectedOrder.discountAmount ?? selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Express Shipping</span>
                      <span>{selectedOrder.deliveryFee === 0 ? 'Complimentary' : formatINR(selectedOrder.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between font-serif text-base font-semibold text-[#1E1630] pt-2 border-t border-[#DDD6F3]">
                      <span>Grand Total</span>
                      <span className="font-sans font-bold">{formatINR(selectedOrder.grandTotal)}</span>
                    </div>
                  </div>

                  {/* Destination Address */}
                  <div className="pt-3 border-t border-[#DDD6F3] text-xs font-sans">
                    <span className="font-semibold text-[#1E1630] block mb-1">
                      Delivery Destination:
                    </span>
                    <p className="text-[#6B5F82] leading-relaxed">
                      {selectedOrder.customerName}<br />
                      {selectedOrder.address}<br />
                      {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}<br />
                      Phone: {selectedOrder.phone}
                    </p>
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="glass-card p-6 rounded-3xl shadow-sm border border-[#DDD6F3] space-y-3 text-xs font-sans">
                  <h4 className="font-serif text-sm font-semibold text-[#1E1630] mb-2">
                    Order Documents &amp; Assistance
                  </h4>

                  {/* Print Invoice Button */}
                  <button
                    onClick={() => setIsInvoiceOpen(true)}
                    className="w-full py-3 px-4 bg-white hover:bg-[#F8F5FF] text-[#1E1630] border border-[#DDD6F3] rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={15} className="text-[#7C3AED]" />
                      <span>View &amp; Print Tax Invoice</span>
                    </span>
                    <ArrowRight size={14} className="text-[#6B5F82]" />
                  </button>

                  {/* Reorder Button */}
                  <button
                    onClick={handleReorder}
                    className="w-full py-3 px-4 bg-white hover:bg-[#F8F5FF] text-[#1E1630] border border-[#DDD6F3] rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag size={15} className="text-[#7C3AED]" />
                      <span>Add Formulas to Cart (Reorder)</span>
                    </span>
                    <ArrowRight size={14} className="text-[#6B5F82]" />
                  </button>

                  {reorderedAlert && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] font-medium flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>Items added to cart! Click the bag icon to checkout.</span>
                    </div>
                  )}

                  {/* Concierge Support via WhatsApp */}
                  <a
                    href={`https://wa.me/917303490594?text=${encodeURIComponent(
                      `Hello Shagufi! I am checking on my GlowWithSH order ${selectedOrder.id}. Customer: ${selectedOrder.customerName}. Please assist with delivery status!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 glass-btn-primary text-white rounded-xl font-semibold flex items-center justify-between shadow-xs transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare size={15} />
                      <span>WhatsApp Atelier Support</span>
                    </span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </div>

            {/* Return to Boutique Button */}
            <div className="text-center pt-4">
              <button
                onClick={onNavigateToShop}
                className="px-8 py-3.5 glass-btn-secondary text-[#1E1630] rounded-xl text-xs uppercase tracking-widest font-sans font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Continue Exploring Atelier Catalog</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Shipment FAQ Accordion */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-sm border border-[#DDD6F3] space-y-4">
          <h3 className="font-serif text-xl text-[#1E1630]">
            Frequently Asked Shipping Inquiries
          </h3>
          <div className="space-y-2 text-xs font-sans divide-y divide-[#DDD6F3]">
            {[
              {
                q: 'How long does shipment delivery take across India?',
                a: 'Standard deliveries arrive within 2–5 business days via air express courier partners (Delhivery, Blue Dart, DTDC). Metro destinations frequently arrive within 48 hours of dispatch.',
              },
              {
                q: 'Can I change my delivery address or contact number after placing?',
                a: 'If your order status is "New" or "Confirmed", you can update the destination address immediately by connecting with our WhatsApp Concierge at +91 7303490594 with your Order ID.',
              },
              {
                q: 'How are the skincare formulas packaged for transit?',
                a: 'Every formula is individually inspected at our Delhi atelier, nestled in biodegradable cushioning, and sealed with tamper-evident tape to ensure absolute freshness and integrity upon arrival.',
              },
              {
                q: 'What if I was unavailable during courier delivery?',
                a: 'Our courier partners attempt delivery up to 3 times and will reach out to you via SMS/call before arriving. You can also coordinate delivery time directly using the carrier tracking link.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="pt-3 first:pt-0">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left py-2 font-medium text-[#1E1630] hover:text-[#7C3AED] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && (
                    <p className="text-[#6B5F82] leading-relaxed pb-2 text-[11px] animate-in fade-in">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      {selectedOrder && (
        <InvoiceModal
          order={selectedOrder}
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}
    </div>
  );
};
