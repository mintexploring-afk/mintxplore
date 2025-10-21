
"use client";
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import PriceDisplay from "@/components/PriceDisplay";

interface Category {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  nftCount: number;
}

interface NFT {
  _id: string;
  name: string;
  artworkUrl: string;
  floorPrice: number;
  owner: {
    name: string;
  };
  category: {
    _id: string;
    name: string;
  };
}

export default function MintxploreMarketplace() {
  const [activeTab, setActiveTab] = useState("All");
  const [showChat, setShowChat] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupedNFTs, setGroupedNFTs] = useState<Record<string, NFT[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchTopNFTs();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories/with-counts');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopNFTs = async () => {
    try {
      const res = await fetch('/api/nfts/top?limit=10');
      if (res.ok) {
        const data = await res.json();
        setGroupedNFTs(data.groupedNFTs || {});
      }
    } catch (error) {
      console.error('Error fetching top NFTs:', error);
    }
  };

  // Typing animation for hero text
  const heroSentences = [
    "Welcome to the best NFT platform in the world.",
    "Discover, mint, and collect unique digital assets.",
    "Join exclusive exhibitions and communities.",
    "Empowering creators and collectors globally.",
    "Your NFT journey starts here!"
  ];
  const [typed, setTyped] = useState("");
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = heroSentences[sentenceIdx];
    let timeout: NodeJS.Timeout;
    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => {
        setTyped(current.slice(0, charIdx + 1));
        setCharIdx(charIdx + 1);
      }, 60);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), 1200);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => {
        setTyped(current.slice(0, charIdx - 1));
        setCharIdx(charIdx - 1);
      }, 30);
    } else if (deleting && charIdx === 0) {
      timeout = setTimeout(() => {
        setDeleting(false);
        setSentenceIdx((sentenceIdx + 1) % heroSentences.length);
      }, 400);
    }
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, sentenceIdx]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white pt-32 px-6 overflow-hidden -mt-20">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40 z-10"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-20">
          {/* Category Tabs above hero box */}
          <div className="flex gap-4 mb-8 flex-wrap">
            <button
              onClick={() => setActiveTab("All")}
              className={`px-6 py-2 rounded-full transition-all ${
                activeTab === "All"
                  ? "bg-white text-gray-900"
                  : "bg-white/10 backdrop-blur-sm hover:bg-white/20"
              }`}
            >
              All
            </button>
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat._id}
                onClick={() => setActiveTab(cat.name)}
                className={`px-6 py-2 rounded-full transition-all ${
                  activeTab === cat.name
                    ? "bg-white text-gray-900"
                    : "bg-white/10 backdrop-blur-sm hover:bg-white/20"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <Hero typed={typed} />
        </div>
      </section>

      {/* Exhibition Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold text-gray-900">Exhibition</h3>
          <Link href="/categories" className="text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-300 rounded-lg">
            view all
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-12">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No categories available</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.slice(0, 10).map((category) => (
              <Link
                key={category._id}
                href={`/category/${category._id}`}
                className="group cursor-pointer"
              >
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all">
                  <div className="relative w-full h-40 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
                    {category.coverImage ? (
                      <img
                        src={category.coverImage}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-4xl font-bold text-indigo-300">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-1 truncate">{category.name}</h4>
                    <p className="text-sm text-gray-600">{category.nftCount} NFT{category.nftCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Category Sections with Top NFTs */}
      {categories.slice(0, 3).map((category) => {
        const nfts = groupedNFTs[category._id] || [];
        if (nfts.length === 0) return null;

        return (
          <section key={category._id} className="max-w-7xl mx-auto px-6 py-16 odd:bg-gray-50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-gray-900">{category.name}</h3>
              <div className="flex gap-2">
                <Link
                  href={`/category/${category._id}`}
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  view all
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {nfts.map((nft) => (
                <Link
                  key={nft._id}
                  href={`/nft/${nft._id}`}
                  className="group cursor-pointer"
                >
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all">
                    <img
                      src={nft.artworkUrl}
                      alt={nft.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1 truncate">{nft.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{nft.owner.name}</p>
                      <PriceDisplay amount={nft.floorPrice} currency="WETH" size="md" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* Footer */}
      <Footer />

      {/* Chat Widget */}
      {showChat && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-700">welcome how can we help you ...</p>
            <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <button className="fixed bottom-6 right-6 bg-gray-900 text-white p-4 rounded-full shadow-lg hover:bg-gray-800">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 12h8M8 8h8M8 16h5M12 22a10 10 0 110-20 10 10 0 010 20z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
