'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Eye } from 'lucide-react'

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

export default function AdminNFTs() {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('all')
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchNFTs()
  }, [statusFilter])

  const fetchNFTs = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      const url = statusFilter === 'all' 
        ? '/api/nfts'
        : `/api/nfts?status=${statusFilter}`
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setNfts(data.nfts)
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (nftId: string, action: 'approve' | 'decline') => {
    setProcessing(true)
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
        fetchNFTs()
      } else {
        const data = await res.json()
        alert(data.message || 'Error updating NFT')
      }
    } catch (error) {
      console.error('Error toggling NFT:', error)
      alert('Error updating NFT')
    }
  }

  const openModal = (nft: NFT) => {
    setSelectedNFT(nft)
    setAdminNote('')
    setShowModal(true)
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">NFT Management</h1>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'declined'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && nfts.filter(n => n.status === 'pending').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {nfts.filter(n => n.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {nfts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No NFTs found with status: {statusFilter}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <div key={nft._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative">
                <img 
                  src={nft.artworkUrl} 
                  alt={nft.name}
                  className="w-full h-64 object-cover"
                />
                <button
                  onClick={() => openModal(nft)}
                  className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-100"
                >
                  <Eye size={20} className="text-gray-700" />
                </button>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 text-gray-900">{nft.name}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{nft.description}</p>
                
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Owner:</span>
                    <span className="text-gray-900 font-medium">{nft.owner.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="text-gray-900">{nft.category.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Floor Price:</span>
                    <span className="text-gray-900 font-medium">{nft.floorPrice} WETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mint Fee:</span>
                    <span className="text-gray-900 font-medium">{nft.mintFee} WETH</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    nft.status === 'approved' ? 'bg-green-100 text-green-800' :
                    nft.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {nft.status.charAt(0).toUpperCase() + nft.status.slice(1)}
                  </span>
                  {nft.status === 'approved' && (
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
                  )}
                </div>

                {nft.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(nft)}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => openModal(nft)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1"
                    >
                      <XCircle size={16} />
                      Decline
                    </button>
                  </div>
                )}

                {nft.adminNote && (
                  <p className="mt-2 text-xs text-gray-600 italic border-t pt-2">
                    Note: {nft.adminNote}
                  </p>
                )}
                
                {nft.processedBy && (
                  <p className="mt-1 text-xs text-gray-500">
                    Processed by: {nft.processedBy.name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">{selectedNFT.name}</h2>
            
            <img 
              src={selectedNFT.artworkUrl} 
              alt={selectedNFT.name}
              className="w-full h-96 object-cover rounded-lg mb-4"
            />

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900">{selectedNFT.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Owner</label>
                  <p className="text-gray-900">{selectedNFT.owner.name}</p>
                  <p className="text-sm text-gray-600">{selectedNFT.owner.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Category</label>
                  <p className="text-gray-900">{selectedNFT.category.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Floor Price</label>
                  <p className="text-gray-900 font-medium">{selectedNFT.floorPrice} WETH</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Mint Fee</label>
                  <p className="text-gray-900 font-medium">{selectedNFT.mintFee} WETH</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className={`inline-block px-3 py-1 text-sm rounded-full ${
                  selectedNFT.status === 'approved' ? 'bg-green-100 text-green-800' :
                  selectedNFT.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedNFT.status.charAt(0).toUpperCase() + selectedNFT.status.slice(1)}
                </p>
              </div>

              {selectedNFT.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Note (optional)
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add a note for the user..."
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedNFT(null)
                  setAdminNote('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedNFT.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleAction(selectedNFT._id, 'decline')}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Decline'}
                  </button>
                  <button
                    onClick={() => handleAction(selectedNFT._id, 'approve')}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Approve & Deduct Fee'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
