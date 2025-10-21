'use client'

import { useState, useEffect } from 'react'
import DataTable, { Column, PaginationData } from '@/components/DataTable'
import { Upload, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react'
import Image from 'next/image'

interface Category {
  _id: string
  name: string
  description: string
  minFloorPrice: number
  mintFee: number
}

interface NFT {
  _id: string
  name: string
  description: string
  artworkUrl: string
  floorPrice: number
  status: 'pending' | 'approved' | 'declined'
  isActive: boolean
  category: {
    name: string
    mintFee: number
  }
  createdAt: string
  adminNote?: string
}

export default function MintNFT() {
  const [categories, setCategories] = useState<Category[]>([])
  const [myNFTs, setMyNFTs] = useState<NFT[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [loadingNFTs, setLoadingNFTs] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState<'mint' | 'my-nfts'>('mint')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  })
  const [selectedArtwork, setSelectedArtwork] = useState<{ url: string; name: string } | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    floorPrice: '',
    artworkUrl: ''
  })

  useEffect(() => {
    fetchCategories()
    if (activeTab === 'my-nfts') {
      fetchMyNFTs()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery, sortBy, sortOrder, pagination.currentPage])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const fetchMyNFTs = async () => {
    try {
      setLoadingNFTs(true)
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: searchQuery,
        sortBy,
        sortOrder
      })

      const res = await fetch(`/api/nfts?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMyNFTs(data.nfts || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error)
    } finally {
      setLoadingNFTs(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' })
      return
    }

    setUploadingImage(true)
    setMessage({ type: '', text: '' })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        setFormData(prev => ({ ...prev, artworkUrl: data.url }))
        setMessage({ type: 'success', text: 'Artwork uploaded successfully!' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Error uploading artwork' })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setMessage({ type: 'error', text: 'Error uploading artwork' })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      const res = await fetch('/api/nfts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          categoryId: formData.categoryId,
          floorPrice: formData.floorPrice,
          artworkUrl: formData.artworkUrl
        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'NFT submitted for approval!' })
        setFormData({
          name: '',
          description: '',
          categoryId: '',
          floorPrice: '',
          artworkUrl: ''
        })
        fetchMyNFTs()
        setTimeout(() => setActiveTab('my-nfts'), 2000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Error submitting NFT' })
      }
    } catch (error) {
      console.error('Error submitting NFT:', error)
      setMessage({ type: 'error', text: 'Error submitting NFT' })
    } finally {
      setLoading(false)
    }
  }

  const toggleNFTActive = async (nftId: string) => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      const res = await fetch('/api/nfts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: nftId,
          action: 'toggle-active'
        })
      })

      if (res.ok) {
        fetchMyNFTs()
        setMessage({ type: 'success', text: 'NFT status updated!' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.message || 'Error updating NFT' })
      }
    } catch (error) {
      console.error('Error toggling NFT:', error)
      setMessage({ type: 'error', text: 'Error updating NFT' })
    }
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key)
    setSortOrder(order)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'declined':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={18} />
      case 'approved':
        return <CheckCircle className="text-green-500" size={18} />
      case 'declined':
        return <XCircle className="text-red-500" size={18} />
      default:
        return null
    }
  }

  const columns: Column<NFT>[] = [
    {
      key: 'artworkUrl',
      label: 'Artwork',
      render: (nft) => (
        <button
          onClick={() => setSelectedArtwork({ url: nft.artworkUrl, name: nft.name })}
          className="hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Image 
            src={nft.artworkUrl} 
            alt={nft.name}
            width={80}
            height={80}
            className="w-20 h-20 object-cover rounded-lg"
          />
        </button>
      )
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (nft) => (
        <div>
          <p className="font-semibold text-gray-900">{nft.name}</p>
          <p className="text-xs text-gray-500">{nft.category.name}</p>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (nft) => (
        <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">{nft.description}</p>
      )
    },
    {
      key: 'floorPrice',
      label: 'Floor Price',
      sortable: true,
      render: (nft) => (
        <span className="font-semibold text-gray-900">{nft.floorPrice} WETH</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (nft) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(nft.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(nft.status)}`}>
            {nft.status.charAt(0).toUpperCase() + nft.status.slice(1)}
          </span>
        </div>
      )
    },
    {
      key: 'isActive',
      label: 'Marketplace',
      render: (nft) => (
        <div>
          {nft.status === 'approved' ? (
            <button
              onClick={() => toggleNFTActive(nft._id)}
              className={`px-3 py-1 text-xs rounded-full font-medium ${
                nft.isActive
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {nft.isActive ? 'Active' : 'Inactive'}
            </button>
          ) : (
            <span className="text-xs text-gray-500">N/A</span>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (nft) => (
        <span className="text-sm text-gray-500">
          {new Date(nft.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'adminNote',
      label: 'Notes',
      render: (nft) => (
        nft.adminNote ? (
          <p className="text-xs text-gray-600 italic max-w-xs line-clamp-2">{nft.adminNote}</p>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )
      )
    }
  ]

  const selectedCategory = categories?.find(c => c._id === formData.categoryId)

  if (pageLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">NFT Minting</h1>

        {/* Tabs */}
        <div className="mb-6 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('mint')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'mint'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mint New NFT
            </button>
            <button
              onClick={() => setActiveTab('my-nfts')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'my-nfts'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My NFTs ({myNFTs.length})
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        {activeTab === 'mint' ? (
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Artwork Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Artwork *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                  {formData.artworkUrl ? (
                    <div className="space-y-4">
                      <Image 
                        src={formData.artworkUrl} 
                        alt="Artwork preview"
                        width={400}
                        height={400}
                        className="max-h-64 mx-auto rounded-lg object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, artworkUrl: '' }))}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {uploadingImage ? 'Uploading...' : 'Click to upload your artwork'}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                        id="artwork-upload"
                      />
                      <label
                        htmlFor="artwork-upload"
                        className="mt-2 inline-block cursor-pointer text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        Choose file
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* NFT Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NFT Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Cosmic Dreams #1"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe your NFT..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, floorPrice: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories?.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name} (Min: {cat.minFloorPrice} WETH, Fee: {cat.mintFee} WETH)
                    </option>
                  ))}
                </select>
              </div>

              {/* Floor Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor Price (WETH) *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.floorPrice}
                  onChange={(e) => setFormData({ ...formData, floorPrice: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={selectedCategory ? `Min: ${selectedCategory.minFloorPrice}` : '0.01'}
                  min={selectedCategory?.minFloorPrice || 0}
                />
                {selectedCategory && (
                  <p className="mt-1 text-sm text-gray-500">
                    Minimum floor price for this category: {selectedCategory.minFloorPrice} WETH
                  </p>
                )}
              </div>

              {/* Mint Fee Info */}
              {selectedCategory && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-sm text-indigo-900">
                    <span className="font-medium">Mint Fee:</span> {selectedCategory.mintFee} WETH
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">
                    This fee will be deducted from your balance upon approval
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || uploadingImage || !formData.artworkUrl}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <DataTable
              columns={columns}
              data={myNFTs}
              loading={loadingNFTs}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              onSort={handleSort}
              emptyMessage="You haven't minted any NFTs yet."
            />
          </div>
        )}

      {/* Artwork Modal */}
      {selectedArtwork && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedArtwork(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{selectedArtwork.name}</h3>
              <button
                onClick={() => setSelectedArtwork(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-50">
              <Image 
                src={selectedArtwork.url} 
                alt={selectedArtwork.name}
                width={1200}
                height={1200}
                className="max-w-full max-h-[calc(90vh-100px)] w-auto h-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
