'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PriceDisplay from '@/components/PriceDisplay'
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

interface NFT {
  _id: string
  name: string
  description?: string
  artworkUrl: string
  floorPrice: number
  owner: {
    _id: string
    name: string
    email: string
  }
  category: {
    _id: string
    name: string
  }
}

interface Category {
  _id: string
  name: string
  description?: string
  coverImage?: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function CategoryDetailPage() {
  const params = useParams()
  const categoryId = params.id as string

  const [category, setCategory] = useState<Category | null>(null)
  const [nfts, setNfts] = useState<NFT[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchCategory()
  }, [categoryId])

  useEffect(() => {
    fetchNFTs()
  }, [categoryId, searchQuery, sortBy, minPrice, maxPrice, currentPage])

  const fetchCategory = async () => {
    try {
      const res = await fetch('/api/categories/with-counts')
      if (res.ok) {
        const data = await res.json()
        const cat = data.categories.find((c: Category) => c._id === categoryId)
        setCategory(cat || null)
      }
    } catch (error) {
      console.error('Error fetching category:', error)
    }
  }

  const fetchNFTs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category: categoryId,
        page: currentPage.toString(),
        limit: '12',
        sort: sortBy
      })

      if (searchQuery) params.append('q', searchQuery)
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)

      const res = await fetch(`/api/nfts/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setNfts(data.nfts || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchNFTs()
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-8">
          <Link href="/categories" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
            ← Back to Categories
          </Link>
          
          {category && (
            <>
              {/* Category Banner */}
              {category.coverImage && (
                <div className="w-full h-48 rounded-lg overflow-hidden mb-6">
                  <img
                    src={category.coverImage}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-gray-600 text-lg">{category.description}</p>
              )}
            </>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearchSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search NFTs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>

              {/* Price Range */}
              <input
                type="number"
                step="0.01"
                placeholder="Min Price (WETH)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              
              <input
                type="number"
                step="0.01"
                placeholder="Max Price (WETH)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Results Info */}
            {pagination && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {nfts.length === 0 ? 0 : ((currentPage - 1) * 12) + 1} - {Math.min(currentPage * 12, pagination.total)} of {pagination.total} NFTs
                </span>
                {(searchQuery || minPrice || maxPrice) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setMinPrice('')
                      setMaxPrice('')
                      setCurrentPage(1)
                    }}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

        {/* NFTs Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading NFTs...</p>
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <Filter className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 text-lg">No NFTs found</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {nfts.map((nft) => (
                <Link
                  key={nft._id}
                  href={`/nft/${nft._id}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200">
                    {/* NFT Image */}
                    <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
                      <img
                        src={nft.artworkUrl}
                        alt={nft.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    {/* NFT Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 truncate group-hover:text-indigo-600 transition-colors">
                        {nft.name}
                      </h3>
                      
                      {nft.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {nft.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500">Creator</p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {nft.owner.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Floor Price</p>
                          <PriceDisplay amount={nft.floorPrice} currency="WETH" size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === pagination.totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 py-2">...</span>
                    }
                    return null
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
