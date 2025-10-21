'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PriceDisplay from '@/components/PriceDisplay'
import PaymentModal from '@/components/PaymentModal'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

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
    avatar?: string
  }
  category: {
    _id: string
    name: string
    description?: string
  }
  createdAt: string
}

interface RelatedNFT {
  _id: string
  name: string
  artworkUrl: string
  floorPrice: number
  owner: {
    name: string
  }
}

export default function NFTDetailPage() {
  const router = useRouter()
  const params = useParams()
  const nftId = params?.id as string
  const { user } = useAuth()
  const [nft, setNft] = useState<NFT | null>(null)
  const [relatedNFTs, setRelatedNFTs] = useState<RelatedNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [userBalances, setUserBalances] = useState({ ETH: 0, WETH: 0 })
  const [ethToWethRate, setEthToWethRate] = useState(1)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [selectedPaymentCurrency, setSelectedPaymentCurrency] = useState<'ETH' | 'WETH' | null>(null)

  useEffect(() => {
    if (!nftId) return
    fetchNFT()
    if (user) {
      fetchUserBalances()
    }
    fetchExchangeRates()
  }, [nftId, user])

  const fetchNFT = async () => {
    try {
      const res = await fetch(`/api/nfts/${nftId}`)
      if (res.ok) {
        const data = await res.json()
        setNft(data.nft)
        
        // Fetch related NFTs from same category
        if (data.nft.category._id) {
          fetchRelatedNFTs(data.nft.category._id)
        }
      } else {
        setMessage({ type: 'error', text: 'NFT not found' })
      }
    } catch (error) {
      console.error('Error fetching NFT:', error)
      setMessage({ type: 'error', text: 'Error loading NFT' })
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedNFTs = async (categoryId: string) => {
    try {
      const res = await fetch(`/api/nfts/top?categoryId=${categoryId}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        setRelatedNFTs((data.nfts || []).filter((n: RelatedNFT) => n._id !== nftId))
      }
    } catch (error) {
      console.error('Error fetching related NFTs:', error)
    }
  }

  const fetchUserBalances = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      if (!token) {
        console.error('No token found for fetching balances')
        return
      }
      
      const res = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        console.log('User profile data:', data) // Debug log
        setUserBalances({
          ETH: data.user?.balances?.ETH || 0,
          WETH: data.user?.balances?.WETH || 0
        })
        console.log('Set balances:', {
          ETH: data.user?.balances?.ETH || 0,
          WETH: data.user?.balances?.WETH || 0
        })
      } else {
        console.error('Failed to fetch user profile:', res.status)
      }
    } catch (error) {
      console.error('Error fetching user balances:', error)
    }
  }

  const fetchExchangeRates = async () => {
    try {
      const res = await fetch('/api/exchange-rates')
      if (res.ok) {
        const data = await res.json()
        setEthToWethRate(data.exchangeRates?.ETH_TO_WETH || 1)
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error)
    }
  }

  const handleBuyClick = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please login to purchase' })
      setTimeout(() => router.push('/login'), 1500)
      return
    }
    
    // Refresh balances before showing modal
    await fetchUserBalances()
    await fetchExchangeRates()
    
    setShowPaymentModal(true)
  }

  const handlePurchase = async (paymentCurrency: 'ETH' | 'WETH') => {
    if (!user || !nft) return

    setPurchasing(true)
    setSelectedPaymentCurrency(paymentCurrency)
    setMessage({ type: '', text: '' }) // Clear any previous messages

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      const res = await fetch(`/api/nfts/${nftId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paymentCurrency })
      })

      const data = await res.json()

      // Debug logging
      console.log('Purchase API Response:', {
        status: res.status,
        ok: res.ok,
        statusText: res.statusText,
        data: data
      })

      if (res.ok) {
        console.log('✅ Purchase successful, showing success state')
        // Show success state in modal (don't set page message)
        setPurchasing(false) // Stop loading spinner
        setPurchaseSuccess(true) // Show success badge
        
        // Keep modal open for 3 seconds to show success, then close and redirect
        setTimeout(() => {
          setShowPaymentModal(false)
          setPurchaseSuccess(false)
          router.push('/dashboard')
        }, 3000)
      } else {
        console.log('❌ Purchase failed:', data.error)
        // Show error on page and in modal
        setMessage({ type: 'error', text: data.error || 'Failed to purchase NFT' })
        setPurchasing(false)
        setPurchaseSuccess(false)
      }
    } catch (error) {
      console.error('Purchase error (catch block):', error)
      setMessage({ type: 'error', text: 'Error purchasing NFT' })
      setPurchasing(false)
      setPurchaseSuccess(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh]">
          <p className="text-gray-500">Loading NFT...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (!nft) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">NFT Not Found</h1>
            <Link href="/" className="text-indigo-600 hover:text-indigo-700">
              Return to Marketplace
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const isOwner = user && nft.owner._id === user.id

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Artwork */}
          <div>
            <img
              src={nft.artworkUrl}
              alt={nft.name}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          {/* Right: Details */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{nft.name}</h1>

            {/* Category Badge */}
            <div className="mb-4">
              <Link 
                href={`/category/${nft.category._id}`}
                className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700 hover:bg-gray-200"
              >
                {nft.category.name}
              </Link>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description ({nft.category.name})</h3>
              <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                {nft.description || 'No description available.'}
              </p>
            </div>

            {/* Owner Info */}
            <div className="mb-6 border-t pt-6">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Owned by:</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {nft.owner.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{nft.owner.name}</p>
                  <Link 
                    href={`/profile/${nft.owner._id}`} 
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    Profile →
                  </Link>
                </div>
              </div>
            </div>

            {/* Floor Price */}
            <div className="mb-6 bg-gray-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Floor Price:</h3>
              <PriceDisplay amount={nft.floorPrice} currency="WETH" size="lg" />
            </div>

            {/* Message */}
            {message.text && (
              <div className={`mb-4 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            {/* Buy Button */}
            {isOwner ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 text-sm">You own this NFT</p>
              </div>
            ) : (
              <button
                onClick={handleBuyClick}
                disabled={purchasing}
                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {purchasing ? 'Processing...' : 'Buy'}
              </button>
            )}
          </div>
        </div>

        {/* More From Category */}
        {relatedNFTs.length > 0 && (
          <section className="mt-16 border-t pt-12">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">More From {nft.category.name}</h3>
              <Link
                href={`/category/${nft.category._id}`}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                view all
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {relatedNFTs.map((relatedNft) => (
                <Link
                  key={relatedNft._id}
                  href={`/nft/${relatedNft._id}`}
                  className="group cursor-pointer"
                >
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all">
                    <img
                      src={relatedNft.artworkUrl}
                      alt={relatedNft.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1 truncate">{relatedNft.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{relatedNft.owner.name}</p>
                      <PriceDisplay amount={relatedNft.floorPrice} currency="WETH" size="sm" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />

      {/* Payment Modal */}
      {nft && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            if (!purchasing) {
              setShowPaymentModal(false)
              setPurchaseSuccess(false)
            }
          }}
          nftPrice={nft.floorPrice}
          userBalances={userBalances}
          ethToWethRate={ethToWethRate}
          onConfirm={handlePurchase}
          loading={purchasing}
          success={purchaseSuccess}
          selectedCurrency={selectedPaymentCurrency}
        />
      )}
    </div>
  )
}
