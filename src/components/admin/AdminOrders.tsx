import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { formatINR, formatDate } from '../../utils/format';
import { InvoiceModal } from '../common/InvoiceModal';
import {
  Search,
  Filter,
  Eye,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  MessageSquare,
  FileText,
  MapPin,
  Calendar,
} from 'lucide-react';

interface AdminOrdersProps {
  orders: Order[];
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    note?: string,
    trackingData?: {
      trackingNumber?: string;
      courierPartner?: string;
      courierTrackingUrl?: string;
      estimatedDeliveryDate?: string;
      dispatchDate?: string;
      currentLocation?: string;
    }
  ) => Promise<void>;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, onUpdateOrderStatus }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('New');
  const [statusNote, setStatusNote] = useState('');
  const [courierPartner, setCourierPartner] = useState('Delhivery');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [courierTrackingUrl, setCourierTrackingUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const statuses: OrderStatus[] = [
    'New',
    'Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Returned',
    'Refunded',
  ];

  const courierOptions = [
    'Delhivery',
    'Blue Dart',
    'DTDC',
    'India Post (Speed Post)',
    'Shadowfax',
    'Shiprocket Express',
    'Delhi Courier Direct',
  ];

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.orderStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
        (o.courierPartner && o.courierPartner.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenOrder = (o: Order) => {
    setSelectedOrder(o);
    setNewStatus(o.orderStatus);
    setStatusNote('');
    setCourierPartner(o.courierPartner || 'Delhivery');
    setTrackingNumber(o.trackingNumber || '');
    setEstimatedDeliveryDate(o.estimatedDeliveryDate || '');
    setCurrentLocation(o.currentLocation || '');
    setCourierTrackingUrl(o.courierTrackingUrl || '');
  };

  const handleSaveStatus = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const trackingData = {
        trackingNumber: trackingNumber.trim() || undefined,
        courierPartner: courierPartner.trim() || undefined,
        courierTrackingUrl: courierTrackingUrl.trim() || undefined,
        estimatedDeliveryDate: estimatedDeliveryDate || undefined,
        currentLocation: currentLocation.trim() || undefined,
      };

      await onUpdateOrderStatus(selectedOrder.id, newStatus, statusNote, trackingData);

      setSelectedOrder({
        ...selectedOrder,
        orderStatus: newStatus,
        ...trackingData,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  // Helper to construct WhatsApp update message to customer
  const getWhatsAppTrackingUrl = (order: Order) => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const storefrontOrigin = isLocal
      ? `http://${window.location.hostname}:5173`
      : 'https://www.glowwithsh.com';
    const trackingLink = `${storefrontOrigin}/track-order?orderId=${encodeURIComponent(order.id)}`;
    const msg = encodeURIComponent(
      `Hello ${order.customerName}!\n\n` +
      `Your GlowWithSH order *${order.id}* status is: *${order.orderStatus.toUpperCase()}*.\n` +
      (order.courierPartner ? `Carrier: ${order.courierPartner}\n` : '') +
      (order.trackingNumber ? `AWB Tracking: ${order.trackingNumber}\n` : '') +
      (order.estimatedDeliveryDate ? `Estimated Delivery: ${formatDate(order.estimatedDeliveryDate)}\n` : '') +
      `\nTrack your live shipment progress here:\n${trackingLink}\n\n` +
      `Thank you for trusting GlowWithSH by Shagufi Hussain!`
    );
    const cleanPhone = order.phone.replace(/\D/g, '').slice(-10);
    return `https://wa.me/91${cleanPhone}?text=${msg}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#241E1C]">
            Orders &amp; Fulfillment ({orders.length})
          </h2>
          <p className="text-xs font-sans text-[#665D58] mt-0.5">
            Track customer orders, manage dispatch pipelines, and log courier tracking notes.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#665D58]" />
          <input
            type="text"
            placeholder="Search order ID, phone, city, AWB..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs font-sans bg-white border border-[#E7DED7] rounded-lg focus:outline-hidden focus:border-[#241E1C]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
            statusFilter === 'all'
              ? 'bg-[#241E1C] text-[#FAF7F3] font-semibold'
              : 'bg-white text-[#241E1C] border border-[#E7DED7] hover:bg-[#FAF7F3]'
          }`}
        >
          All Orders ({orders.length})
        </button>
        {statuses.map((st) => {
          const count = orders.filter((o) => o.orderStatus === st).length;
          return (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer shrink-0 capitalize ${
                statusFilter === st
                  ? 'bg-[#241E1C] text-[#FAF7F3] font-semibold'
                  : 'bg-white text-[#241E1C] border border-[#E7DED7] hover:bg-[#FAF7F3]'
              }`}
            >
              {st} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#E7DED7] shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <ShoppingBag size={24} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800">
              {search || statusFilter !== 'all' ? 'No orders match your filter' : 'No orders yet'}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'Try resetting the status filter or search query.'
                : 'When customers place orders from your online storefront or WhatsApp concierge, they will appear here.'}
            </p>
            {(search || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-[#241E1C] text-[#FAF7F3] rounded text-xs uppercase font-sans font-semibold hover:bg-[#C4A36A] hover:text-[#241E1C] transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#FAF7F3] border-b border-[#E7DED7] text-[10px] uppercase font-semibold text-[#665D58] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Order ID</th>
                  <th className="px-4 py-3.5">Customer &amp; Phone</th>
                  <th className="px-4 py-3.5">City &amp; PIN</th>
                  <th className="px-4 py-3.5">Courier &amp; AWB</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Pipeline Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DED7]">
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => handleOpenOrder(o)}
                    className="hover:bg-[#FAF7F3]/70 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3.5 font-mono font-medium text-[#241E1C]">
                      <span>{o.id}</span>
                      <span className="block text-[10px] text-[#665D58] font-sans">
                        {formatDate(o.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-[#241E1C] block">{o.customerName}</span>
                      <span className="text-[#665D58] text-[11px]">{o.phone}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[#665D58]">
                      <span>{o.city}</span>
                      <span className="block text-[10px] text-zinc-400">{o.pincode}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {o.trackingNumber ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#7C3AED] text-[11px]">
                            {o.courierPartner || 'Courier'}
                          </span>
                          <span className="font-mono text-[10px] text-[#241E1C]">
                            {o.trackingNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[#665D58]">
                      {o.items.length} {o.items.length === 1 ? 'formula' : 'formulas'}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#241E1C]">
                      {formatINR(o.grandTotal)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                          o.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {o.paymentMethod === 'online_ready' ? 'Online' : o.paymentMethod.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          o.orderStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.orderStatus === 'Shipped'
                            ? 'bg-sky-100 text-sky-800'
                            : o.orderStatus === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <ChevronRight size={16} className="text-[#665D58] inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail & Tracking Management Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E7DED7] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E7DED7] pb-4">
              <div>
                <span className="text-[10px] uppercase font-sans tracking-widest text-[#B98D80] font-semibold">
                  Order Management &amp; Courier Logistics
                </span>
                <h3 className="font-mono text-xl sm:text-2xl text-[#241E1C] font-bold">
                  {selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-xs text-[#665D58] hover:text-[#241E1C] p-2 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-6">
              {/* Pipeline Status & Logistics Control Section */}
              <div className="bg-[#FAF7F3] p-5 rounded-2xl border border-[#E7DED7] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-bold text-[#241E1C] uppercase tracking-wider">
                    Pipeline &amp; Dispatch Logistics
                  </span>
                  <span className="text-[11px] font-mono text-[#665D58]">
                    Ordered: {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Status Dropdown */}
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-[#665D58] block mb-1">
                      Order Status:
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                      className="w-full px-3 py-2 text-xs font-sans bg-white border border-[#E7DED7] rounded-lg"
                    >
                      {statuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Courier Partner Selection */}
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-[#665D58] block mb-1">
                      Carrier Partner:
                    </label>
                    <select
                      value={courierPartner}
                      onChange={(e) => setCourierPartner(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-sans bg-white border border-[#E7DED7] rounded-lg"
                    >
                      {courierOptions.map((cp) => (
                        <option key={cp} value={cp}>
                          {cp}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Waybill / AWB */}
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-[#665D58] block mb-1">
                      Air Waybill / AWB Tracking Number:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DL849201948IN"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E7DED7] rounded-lg"
                    />
                  </div>

                  {/* Estimated Delivery Date */}
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-[#665D58] block mb-1">
                      Estimated Arrival Date:
                    </label>
                    <input
                      type="date"
                      value={estimatedDeliveryDate}
                      onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-sans bg-white border border-[#E7DED7] rounded-lg"
                    />
                  </div>

                  {/* Current Location Checkpoint */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-semibold text-[#665D58] block mb-1">
                      Current Transit Location / Hub:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Delhi Air Cargo Hub — In Transit to Mumbai"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-sans bg-white border border-[#E7DED7] rounded-lg"
                    />
                  </div>

                  {/* Status Note */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-semibold text-[#665D58] block mb-1">
                      Checkpoint Log Note (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Quality sealed & handed to Delhivery executive"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-sans bg-white border border-[#E7DED7] rounded-lg"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleSaveStatus}
                    disabled={updating}
                    className="px-5 py-2.5 bg-[#241E1C] text-[#FAF7F3] rounded-xl text-xs uppercase font-sans font-semibold hover:bg-[#C4A36A] hover:text-[#241E1C] transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Truck size={14} />
                    <span>{updating ? 'Saving Changes...' : 'Save Status & Tracking'}</span>
                  </button>

                  {/* 1-Click WhatsApp Tracking Link to Customer */}
                  <a
                    href={getWhatsAppTrackingUrl(selectedOrder)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-sans font-semibold hover:bg-emerald-800 transition-colors flex items-center gap-2"
                  >
                    <MessageSquare size={14} />
                    <span>Send Tracking to Customer on WhatsApp</span>
                  </a>

                  {/* View Customer Invoice */}
                  <button
                    onClick={() => setIsInvoiceOpen(true)}
                    className="px-4 py-2.5 bg-white text-[#241E1C] border border-[#E7DED7] rounded-xl text-xs font-sans font-medium hover:bg-[#FAF7F3] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText size={14} />
                    <span>Preview Invoice</span>
                  </button>
                </div>
              </div>

              {/* Customer & Address Details */}
              <div className="space-y-3 py-3 border-b border-[#E7DED7] text-xs font-sans">
                <h4 className="font-serif text-lg text-[#241E1C]">Customer &amp; Delivery Destination</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Recipient:</strong> {selectedOrder.customerName}</p>
                    <p><strong>Mobile Phone:</strong> {selectedOrder.phone}</p>
                    {selectedOrder.email && <p><strong>Email:</strong> {selectedOrder.email}</p>}
                  </div>
                  <div>
                    <p className="leading-relaxed">
                      <strong>Delivery Address:</strong><br />
                      {selectedOrder.address}<br />
                      {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}
                    </p>
                  </div>
                </div>
                {selectedOrder.deliveryNotes && (
                  <p className="bg-[#FAF7F3] p-2.5 rounded-lg border border-[#E7DED7] text-amber-900">
                    <strong>Customer Instructions:</strong> {selectedOrder.deliveryNotes}
                  </p>
                )}
              </div>

              {/* Items List */}
              <div className="py-2 space-y-3 text-xs font-sans">
                <h4 className="font-serif text-lg text-[#241E1C]">Ordered Formulas</h4>
                <div className="space-y-2 divide-y divide-[#E7DED7]">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {it.image && (
                          <img
                            src={it.image}
                            alt={it.name}
                            className="w-10 h-12 object-cover rounded-lg border border-[#E7DED7]"
                          />
                        )}
                        <div>
                          <p className="font-serif text-sm font-medium text-[#241E1C]">{it.name}</p>
                          <span className="text-[#665D58]">Qty: {it.quantity} • SKU: {it.sku}</span>
                        </div>
                      </div>
                      <span className="font-semibold text-sm text-[#241E1C]">
                        {formatINR(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-[#E7DED7] flex justify-between text-sm font-semibold">
                  <span>Grand Total</span>
                  <span>{formatINR(selectedOrder.grandTotal)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 border border-[#E7DED7] text-xs uppercase font-sans font-semibold rounded-xl text-[#665D58] hover:bg-[#FAF7F3] cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* Invoice Modal Preview */}
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
