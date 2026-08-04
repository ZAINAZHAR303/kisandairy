'use client'

import React, { useState } from 'react'
import { Animal } from '@/lib/types'
import AnimalCard from './AnimalCard'
import AddEditAnimalModal from './AddEditAnimalModal'
import { deleteAnimal } from '@/app/dashboard/animals/actions'

interface AnimalsListProps {
  initialAnimals: Animal[]
}

type TypeFilter = 'All' | 'cow' | 'buffalo'

export default function AnimalsList({ initialAnimals }: AnimalsListProps) {
  const [filter, setFilter] = useState<TypeFilter>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Counts for filter chips
  const countAll = initialAnimals.length
  const countCows = initialAnimals.filter(a => a.type === 'cow' || !a.type).length
  const countBuffaloes = initialAnimals.filter(a => a.type === 'buffalo').length

  const filteredAnimals = initialAnimals.filter(animal => {
    const matchesFilter = 
      filter === 'All' || 
      (filter === 'cow' && (animal.type === 'cow' || !animal.type)) ||
      (filter === 'buffalo' && animal.type === 'buffalo')

    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      !searchQuery || 
      animal.name?.toLowerCase().includes(searchLower) ||
      animal.tag_number?.toLowerCase().includes(searchLower) ||
      animal.breed?.toLowerCase().includes(searchLower)

    return matchesFilter && matchesSearch
  })

  const handleOpenAdd = () => {
    setEditAnimal(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (animal: Animal) => {
    setEditAnimal(animal)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This will also delete all insemination records associated with this animal.`)) {
      setIsDeleting(id)
      try {
        await deleteAnimal(id)
      } catch (err) {
        alert('Failed to delete animal')
      } finally {
        setIsDeleting(null)
      }
    }
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="sticky top-14 bg-white z-40 rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-800">My Animals 🐮</h1>
            <span className="bg-blue-100 text-[var(--color-blue)] text-xs font-bold px-2 py-0.5 rounded-full">
              {filteredAnimals.length}
            </span>
          </div>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-blue-50 text-[var(--color-blue)]' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Search Animals"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Sliding Search Bar */}
        {showSearch && (
          <div className="relative animate-fade-in">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, tag number, or breed..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:bg-white transition-all"
              autoFocus
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-xs text-gray-400 hover:text-gray-600 bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Filter Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto hide-scrollbar pt-1">
          <button
            onClick={() => setFilter('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1 ${
              filter === 'All' ? 'bg-[var(--color-blue)] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>All Animals</span>
            <span className="text-[10px] opacity-80 font-normal">({countAll})</span>
          </button>

          <button
            onClick={() => setFilter('cow')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1 ${
              filter === 'cow' ? 'bg-[var(--color-blue)] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>🐮 Cows</span>
            <span className="text-[10px] opacity-80 font-normal">({countCows})</span>
          </button>

          <button
            onClick={() => setFilter('buffalo')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1 ${
              filter === 'buffalo' ? 'bg-[var(--color-blue)] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>🦬 Buffaloes</span>
            <span className="text-[10px] opacity-80 font-normal">({countBuffaloes})</span>
          </button>
        </div>
      </div>

      {/* Animal Cards Grid */}
      {filteredAnimals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnimals.map(animal => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm space-y-4 my-6">
          <div className="text-5xl animate-bounce">🐮</div>
          <h3 className="text-lg font-bold text-gray-800">No Animals Found</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            {searchQuery || filter !== 'All' 
              ? 'No animals match your search or filter criteria.' 
              : 'You have not added any cows or buffaloes to your farm yet.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 bg-[var(--color-blue)] hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <span>+ Add New Animal</span>
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[var(--color-blue)] hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-40"
        title="Add Animal"
      >
        <span className="text-3xl font-light leading-none mb-1">+</span>
      </button>

      {/* Add / Edit Modal */}
      <AddEditAnimalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editAnimal={editAnimal}
      />
    </div>
  )
}
