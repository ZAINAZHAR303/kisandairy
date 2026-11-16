'use client'

import { Seller } from '@/lib/types'
import { BuyerLedger, BuyerSort, getDueLabel } from './milkSalesShared'

interface BuyersGridProps {
  filteredBuyers: Seller[]
  buyerLedgers: Map<string, BuyerLedger>
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: BuyerSort
  setSortBy: (sort: BuyerSort) => void
  setSelectedBuyer: (buyer: Seller | null) => void
  setIsBulkPriceModalOpen: (open: boolean) => void
  setEditSeller: (seller: Seller | null) => void
  setIsSellerModalOpen: (open: boolean) => void
  handleOpenAddPayment: (sellerId?: string) => void
  handleOpenAddSale: (sellerId?: string) => void
  handleOpenEditSeller: (seller: Seller) => void
}

/** Searchable, sortable grid of buyer cards with their outstanding balances. */
export default function BuyersGrid({
  filteredBuyers,
  buyerLedgers,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  setSelectedBuyer,
  setIsBulkPriceModalOpen,
  setEditSeller,
  setIsSellerModalOpen,
  handleOpenAddPayment,
  handleOpenAddSale,
  handleOpenEditSeller,
}: BuyersGridProps) {
  return (
    <div className="space-y-6">
      {/* Top Actions & Search Bar */}
      <div className="space-y-4">
        <div>
          <button
            onClick={() => setIsBulkPriceModalOpen(true)}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm transition-all flex items-center space-x-1.5"
          >
            <span>💰</span>
            <span>Bulk Price Update</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
            />
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <label className="text-xs font-semibold text-gray-400">Sort:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as BuyerSort)}
              className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            >
              <option value="outstanding">Sort: Outstanding</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Buyer Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredBuyers.map(seller => {
          const ledger = buyerLedgers.get(seller.id) || { totalSales: 0, totalPaid: 0, outstanding: 0 }
          const isDue = ledger.outstanding > 0

          return (
            <div
              key={seller.id}
              onClick={() => setSelectedBuyer(seller)}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer space-y-4 group relative"
            >
              {/* Top Row: Name & Outstanding */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 capitalize group-hover:text-emerald-700 transition-colors">
                    {seller.name}
                  </h3>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                      {seller.payment_terms || 'End of Month'}
                    </span>
                    {isDue && (
                      <span className="text-[10px] text-amber-700 font-semibold">{getDueLabel(seller.payment_terms)}</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Outstanding</div>
                  <div className={`text-lg font-black ${isDue ? 'text-red-600' : 'text-emerald-600'}`}>
                    PKR {ledger.outstanding.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Mid Row: Sales vs Paid */}
              <div className="text-xs text-gray-500 font-medium flex items-center space-x-3 pt-1 border-t border-gray-50">
                <span>Sales: <strong className="text-gray-800">PKR {ledger.totalSales.toLocaleString()}</strong></span>
                <span>Paid: <strong className="text-emerald-600">PKR {ledger.totalPaid.toLocaleString()}</strong></span>
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between pt-2 gap-2" onClick={e => e.stopPropagation()}>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenAddPayment(seller.id)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1"
                  >
                    <span>💰</span>
                    <span>Pay</span>
                  </button>

                  <button
                    onClick={() => handleOpenAddSale(seller.id)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 flex items-center space-x-1"
                  >
                    <span>🥛</span>
                    <span>Sale</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEditSeller(seller)}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleOpenEditSeller(seller)}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-200 flex items-center space-x-1"
                  >
                    <span>💰</span>
                    <span>Price</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Buyer Floating Action Button */}
      <button
        onClick={() => { setEditSeller(null); setIsSellerModalOpen(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all z-40"
        title="Add New Buyer"
      >
        <span className="text-3xl font-light leading-none mb-1">+</span>
      </button>
    </div>
  )
}
