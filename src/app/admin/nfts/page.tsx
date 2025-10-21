'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react'
import DataTable, { Column, PaginationData } from '@/components/DataTable'
import Image from 'next/image'

interface NFT {
  _id: string
  name: string
  description: string
  artworkUrl: string
  floorPrice: number
  mintFee: number
  status: 'pending' | 'approved' | 'declined'
  isActive: boolean
  owner: {
    _id: string
    name: string
    email: string
  }
  category: {
    _id: string
    name: string
    minFloorPrice: number
    mintFee: number
  }
  createdAt: string
  adminNote?: string
  processedBy?: {
    name: string
    email: string
  }
  processedAt?: string
}

interface NFTsResponse {
  nfts: NFT[]
  pagination: PaginationData
}

interface TabState {
  data: NFT[]
  loading: boolean
  searchQuery: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  pagination: PaginationData
}

export default function AdminNFTs() {
  const { getToken } = useAuth()
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending')
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [processing, setProcessing] = useState(false)

  const [tabStates, setTabStates] = useState<Record<string, TabState>>({
    all: {
      data: [],
      loading: true,
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
    },
    pending: {
      data: [],
      loading: true,
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
    },
    approved: {
      data: [],
      loading: true,
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
    },
    declined: {
      data: [],
      loading: true,
      searchQuery: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
    }
  })

  useEffect(() => {
    fetchNFTs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, tabStates[activeFilter].searchQuery, tabStates[activeFilter].sortBy, tabStates[activeFilter].sortOrder, tabStates[activeFilter].pagination.currentPage])

  const fetchNFTs = async () => {
    const currentState = tabStates[activeFilter]
    
    setTabStates(prev => ({
      ...prev,
      [activeFilter]: { ...prev[activeFilter], loading: true }
    }))

    try {
      const token = getToken()
      const params = new URLSearchParams({
        page: currentState.pagination.currentPage.toString(),
        limit: currentState.pagination.itemsPerPage.toString(),
        search: currentState.searchQuery,
        sortBy: currentState.sortBy,
        sortOrder: currentState.sortOrder
      })

      if (activeFilter !== 'all') {
        params.append('status', activeFilter)
      }

      const res = await fetch(`/api/nfts?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data: NFTsResponse = await res.json()
        setTabStates(prev => ({
          ...prev,
          [activeFilter]: {
            ...prev[activeFilter],
            data: data.nfts,
            pagination: data.pagination,
            loading: false
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error)
      setTabStates(prev => ({
        ...prev,
        [activeFilter]: { ...prev[activeFilter], loading: false }
      }))
    }
  }

  const handleAction = async (nftId: string, action: 'approve' | 'decline') => {
    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch('/api/nfts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: nftId,
          action,
          adminNote
        })
      })

      const data = await res.json()

      if (res.ok) {
        alert(data.message)
        setShowModal(false)
        setSelectedNFT(null)
        setAdminNote('')
        fetchNFTs()
      } else {
        alert(data.message || `Error ${action}ing NFT`)
      }
    } catch (error) {
      console.error(`Error ${action}ing NFT:`, error)
      alert(`Error ${action}ing NFT`)
    } finally {
      setProcessing(false)
    }
  }

  const handlePageChange = (page: number) => {
    setTabStates(prev => ({
      ...prev,
      [activeFilter]: {
        ...prev[activeFilter],
        pagination: { ...prev[activeFilter].pagination, currentPage: page }
      }
    }))
  }

  const handleSearch = (query: string) => {
    setTabStates(prev => ({
      ...prev,
      [activeFilter]: {
        ...prev[activeFilter],
        searchQuery: query,
        pagination: { ...prev[activeFilter].pagination, currentPage: 1 }
      }
    }))
  }

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setTabStates(prev => ({
      ...prev,
      [activeFilter]: {
        ...prev[activeFilter],
        sortBy: key,
        sortOrder: order,
        pagination: { ...prev[activeFilter].pagination, currentPage: 1 }
      }
    }))
  }

  const currentState = tabStates[activeFilter]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'declined':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} className="text-green-600" />
      case 'declined':
        return <XCircle size={16} className="text-red-600" />
      default:
        return <Clock size={16} className="text-yellow-600" />
    }
  }

  const columns: Column<NFT>[] = [
    {
      key: 'artworkUrl',
      label: 'Artwork',
      render: (nft) => (
        <div className="w-16 h-16 relative rounded-lg overflow-hidden">
          <img src={nft.artworkUrl} alt={nft.name} className="object-cover w-full h-full" />
        </div>
      )
    },
    {
      key: 'name',
      label: 'NFT',
      sortable: true,
      render: (nft) => (
        <div>
          <p className="font-medium text-gray-900">{nft.name}</p>
          <p className="text-sm text-gray-500 truncate max-w-xs">{nft.description}</p>
        </div>
      )
    },
    {
      key: 'owner.name',
      label: 'Owner',
      sortable: true,
      render: (nft) => (
        <div>
          <p className="font-medium text-gray-900">{nft.owner.name}</p>
          <p className="text-sm text-gray-500">{nft.owner.email}</p>
        </div>
      )
    },
    {
      key: 'category.name',
      label: 'Category',
      sortable: true,
      render: (nft) => (
        <span className="text-sm text-gray-700">{nft.category.name}</span>
      )
    },
    {
      key: 'floorPrice',
      label: 'Price',
      sortable: true,
      render: (nft) => (
        <div>
          <p className="font-semibold text-gray-900">{nft.floorPrice} WETH</p>
          <p className="text-xs text-gray-500">Fee: {nft.mintFee} WETH</p>
        </div>
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
            {nft.status}
          </span>
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
      key: 'actions',
      label: 'Actions',
      render: (nft) => (
        <button
          onClick={() => {
            setSelectedNFT(nft)
            setAdminNote(nft.adminNote || '')
            setShowModal(true)
          }}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Eye size={16} />
          View
        </button>
      )
    }
  ]

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">NFTs Management</h1>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          {(['all', 'pending', 'approved', 'declined'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`flex-1 py-3 px-4 font-medium transition-colors relative ${
                activeFilter === tab
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeFilter === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={currentState.data}
        loading={currentState.loading}
        pagination={currentState.pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onSort={handleSort}
        searchQuery={currentState.searchQuery}
        sortBy={currentState.sortBy}
        sortOrder={currentState.sortOrder}
        searchPlaceholder="Search by NFT name, owner, or description..."
        emptyMessage="No NFTs found"
      />

      {/* View/Process Modal */}
      {showModal && selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">NFT Details</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedNFT.artworkUrl}
                    alt={selectedNFT.name}
                    className="w-full rounded-lg"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-xl font-bold text-gray-900">{selectedNFT.name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="text-gray-700">{selectedNFT.description}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Owner</label>
                    <p className="text-gray-900">{selectedNFT.owner.name}</p>
                    <p className="text-sm text-gray-500">{selectedNFT.owner.email}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <p className="text-gray-900">{selectedNFT.category.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Floor Price</label>
                      <p className="text-lg font-bold text-gray-900">{selectedNFT.floorPrice} WETH</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Mint Fee</label>
                      <p className="text-lg font-bold text-gray-900">{selectedNFT.mintFee} WETH</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(selectedNFT.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedNFT.status)}`}>
                        {selectedNFT.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Submitted</label>
                    <p className="text-gray-900">{new Date(selectedNFT.createdAt).toLocaleString()}</p>
                  </div>

                  {selectedNFT.processedBy && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Processed By</label>
                        <p className="text-gray-900">{selectedNFT.processedBy.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Processed At</label>
                        <p className="text-gray-900">{selectedNFT.processedAt ? new Date(selectedNFT.processedAt).toLocaleString() : 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700">Admin Note</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add admin note..."
                  rows={3}
                  disabled={selectedNFT.status !== 'pending'}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                />
              </div>

              <div className="flex gap-3 mt-6">
                {selectedNFT.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(selectedNFT._id, 'approve')}
                      disabled={processing}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(selectedNFT._id, 'decline')}
                      disabled={processing}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Decline'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedNFT(null)
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
