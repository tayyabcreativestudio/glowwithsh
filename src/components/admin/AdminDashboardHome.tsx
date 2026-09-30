import React from 'react';
import { Product, Order } from '../../types';
import { formatINR, formatDate } from '../../utils/format';
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface AdminDashboardHomeProps {
  products: Product[];
  orders: Order[];
  onNavigateTab: (tab: string) => void;
  onEditProduct: (product: Product) => void;
}

export const AdminDashboardHome: React.FC<AdminDashboardHomeProps> = ({
  products,
  orders,
  onNavigateTab,
  onEditProduct,
}) => {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.orderStatus !== 'Cancelled' ? o.grandTotal : 0), 0);
  const totalOrdersCount = orders.length;
  const publishedProductsCount = products.filter((p) => p.status === 'published').length;

  const lowStockProducts = products.filter(
    (p) => p.trackInventory && p.stockQuantity <= p.lowStockThreshold
  );

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7DED7] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#665D58]">
            <span className="text-xs uppercase font-sans tracking-wider font-semibold">
              Gross Orders Value
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="font-sans text-2xl sm:text-3xl font-bold text-[#241E1C]">
            {formatINR(totalRevenue)}
          </div>
          <p className="text-[11px] text-[#665D58] font-sans">
            From {totalOrdersCount} verified atelier orders
          </p>
        </div>

        {/* Orders */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7DED7] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#665D58]">
            <span className="text-xs uppercase font-sans tracking-wider font-semibold">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FAF7F3] text-[#241E1C] flex items-center justify-center border border-[#E7DED7]">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="font-sans text-2xl sm:text-3xl font-bold text-[#241E1C]">
            {totalOrdersCount}
          </div>
          <p className="text-[11px] text-[#665D58] font-sans">
            {orders.filter((o) => o.orderStatus === 'New').length} awaiting atelier dispatch
          </p>
        </div>

        {/* Products */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7DED7] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#665D58]">
            <span className="text-xs uppercase font-sans tracking-wider font-semibold">
              Active Catalog
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FAF7F3] text-[#C4A36A] flex items-center justify-center border border-[#E7DED7]">
              <Package size={16} />
            </div>
          </div>
          <div className="font-sans text-2xl sm:text-3xl font-bold text-[#241E1C]">
            {publishedProductsCount} / {products.length}
          </div>
          <p className="text-[11px] text-[#665D58] font-sans">
            Formulations in active publication
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7DED7] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#665D58]">
            <span className="text-xs uppercase font-sans tracking-wider font-semibold">
              Stock Warnings
            </span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              lowStockProducts.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className={`font-sans text-2xl sm:text-3xl font-bold ${
            lowStockProducts.length > 0 ? 'text-amber-800' : 'text-[#241E1C]'
          }`}>
            {lowStockProducts.length}
          </div>
          <p className="text-[11px] text-[#665D58] font-sans">
            {lowStockProducts.length > 0 ? 'SKUs need formulation restock' : 'All stock levels optimal'}
          </p>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="bg-[#1E1917] text-[#FAF7F3] p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-[#3E3430]">
        <div>
          <h3 className="font-serif text-xl font-medium">Atelier Quick Actions</h3>
          <p className="text-xs text-[#FAF7F3]/70 font-sans mt-0.5">
            Manage your daily beauty catalog and dispatch operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigateTab('products')}
            className="px-4 py-2 bg-[#C4A36A] text-[#1E1917] rounded-md text-xs uppercase font-sans font-semibold tracking-wider hover:bg-white transition-colors cursor-pointer"
          >
            Add New Formulation
          </button>
          <button
            onClick={() => onNavigateTab('orders')}
            className="px-4 py-2 bg-[#2B2321] text-[#FAF7F3] rounded-md text-xs uppercase font-sans font-semibold tracking-wider hover:bg-[#3E3430] transition-colors cursor-pointer border border-[#3E3430]"
          >
            Manage Orders ({orders.length})
          </button>
          <button
            onClick={() => onNavigateTab('cms-homepage')}
            className="px-4 py-2 bg-[#2B2321] text-[#FAF7F3] rounded-md text-xs uppercase font-sans font-semibold tracking-wider hover:bg-[#3E3430] transition-colors cursor-pointer border border-[#3E3430]"
          >
            Edit Homepage CMS
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Orders & Inventory Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders List */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E7DED7] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7DED7] pb-4">
            <h3 className="font-serif text-xl text-[#241E1C]">Recent Customer Orders</h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs uppercase tracking-wider font-sans font-semibold text-[#B98D80] hover:text-[#241E1C] inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs font-sans text-[#665D58] py-8 text-center">
              No orders placed yet.
            </p>
          ) : (
            <div className="divide-y divide-[#E7DED7]">
              {recentOrders.map((o) => (
                <div key={o.id} className="py-3 flex items-center justify-between text-xs font-sans">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#241E1C] font-mono">{o.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                        o.orderStatus === 'New' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {o.orderStatus}
                      </span>
                    </div>
                    <p className="text-[#665D58] mt-0.5">
                      {o.customerName} • {o.items.length} {o.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-[#241E1C]">
                      {formatINR(o.grandTotal)}
                    </span>
                    <span className="block text-[10px] text-[#665D58]">
                      {formatDate(o.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E7DED7] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7DED7] pb-4">
            <h3 className="font-serif text-xl text-[#241E1C]">Inventory Watch</h3>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs uppercase tracking-wider font-sans font-semibold text-[#B98D80] hover:text-[#241E1C] inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Stocks</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-10 text-center text-xs font-sans text-emerald-800 space-y-1">
              <p className="font-semibold">✓ Inventory Healthy</p>
              <p className="text-[#665D58]">All formulation stock quantities exceed low-stock thresholds.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onEditProduct(p)}
                  className="p-3 bg-[#FAF7F3] rounded-lg border border-[#E7DED7] flex items-center justify-between cursor-pointer hover:border-[#C4A36A] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.primaryImage}
                      alt={p.name}
                      className="w-10 h-12 object-cover rounded border border-[#E7DED7]"
                    />
                    <div>
                      <p className="font-serif text-sm text-[#241E1C] font-medium leading-tight">
                        {p.name}
                      </p>
                      <span className="text-[11px] font-sans text-[#665D58]">
                        SKU: {p.sku}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-sans font-bold rounded">
                      {p.stockQuantity} Left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
