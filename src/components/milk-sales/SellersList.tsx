'use client'

import React, { useState } from 'react'
import { Seller } from '@/lib/types'
import Link from 'next/link'
import AddEditSellerModal from './AddEditSellerModal'
import { deleteSeller } from '@/app/dashboard/milk-sales/actions'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'

interface SellersListProps {
  initialSellers: Seller[]
}

export default function SellersList({ initialSellers }: SellersListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editSeller, setEditSeller] = useState<Seller | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const { showToast } = useToast()

  const handleOpenAdd = () => {
    setEditSeller(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (seller: Seller) => {
    setEditSeller(seller)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    try {
      const res = await deleteSeller(deletingId)
      if (res?.error) {
        showToast('error', 'Failed to delete seller', typeof res.error === 'string' ? res.error : (res.error as Error)?.message || 'Failed to delete seller')
      } else {
        showToast('success', 'Seller deleted successfully')
      }
    } catch (err: any) {
      showToast('error', 'An error occurred while deleting', err.message || 'Unknown error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="sticky top-14 bg-white z-40 rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/milk-sales"
            className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Manage Sellers 👤</h1>
            <p className="text-xs text-gray-500">Milk buyers & collection centers</p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[var(--color-blue)] hover:bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition-all flex items-center space-x-1"
        >
          <span>+ Add Seller</span>
        </button>
      </div>

      {/* Sellers List */}
      {initialSellers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {initialSellers.map(seller => (
            <div key={seller.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base text-gray-900">{seller.name}</h3>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {seller.contact_number ? `📞 ${seller.contact_number}` : 'No contact details'}
                  </div>
                </div>
                <div className="bg-blue-50 text-[var(--color-blue)] font-bold text-xs px-2.5 py-1 rounded-full border border-blue-100">
                  Rs. {seller.rate_per_liter}/L
                </div>
              </div>

              <div className="flex justify-end items-center space-x-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleOpenEdit(seller)}
                  className="px-3 py-1.5 text-blue-600 border border-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(seller.id)}
                  disabled={deletingId === seller.id}
                  className="px-3 py-1.5 text-red-600 border border-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deletingId === seller.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm space-y-4 my-6">
          <div className="text-5xl">👤</div>
          <h3 className="text-lg font-bold text-gray-800">No Sellers Added Yet</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Add your milk buyers or collection centers to start tracking daily sales.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 bg-[var(--color-blue)] hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <span>+ Add New Seller</span>
          </button>
        </div>
      )}

      {/* Modal */}
      <AddEditSellerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editSeller={editSeller}
      />

      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Seller"
        message="Are you sure you want to delete this seller? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}
