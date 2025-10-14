
"use client";
import React, { useState } from "react";
import { Search, User, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function MintxploreMarketplace() {
  const [activeTab, setActiveTab] = useState("All");
  const [showChat, setShowChat] = useState(true);

  const categories = [
    "All",
    "Arts",
    "Gaming",
    "Membership",
    "PFPS",
    "Photography",
    "Exhibition",
  ];

  const exhibitions = [
    { title: "Infinite Horizons", totalNFT: 75 },
    { title: "Decentralized D...", totalNFT: 6 },
    { title: "Canvas Chronic...", totalNFT: 6 },
    { title: "Harmony in Co...", totalNFT: 9 },
    { title: "Timeless maste..", totalNFT: 12 },
  ];

  const pfpsItems = [
    { title: "Mystical Maya", creator: "hannareka", floor: "9 ETH", usd: "$35791" },
    { title: "Pixelated Paladin", creator: "Winkell", floor: "7.5 ETH", usd: "$29826" },
    { title: "The future", creator: "Becky", floor: "4 ETH", usd: "$15907" },
    { title: "Snoop dog", creator: "artbysconnor", floor: "4 ETH", usd: "$15907" },
    { title: "Florin justin", creator: "Florin justin", floor: "3 ETH", usd: "$11930" },
  ];

  const gamingItems = [
    { title: "Mystical Maya", creator: "hannareka", floor: "1 ETH", usd: "$3977" },
    { title: "Pixelated Paladin", creator: "Winkell", floor: "1 ETH", usd: "$3977" },
    { title: "The future", creator: "Becky", floor: "5 ETH", usd: "$19884" },
    { title: "Snoop dog", creator: "artbysconnor", floor: "1 ETH", usd: "$3977" },
    { title: "Peace of mind", creator: "Victor Gabriel", floor: "2 ETH", usd: "$7954" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-white" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}></div>
            <h1 className="text-xl font-bold">Mintxplore</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-indigo-800 rounded-lg">
            <Search size={20} />
          </button>
          <button className="flex items-center gap-2 bg-white text-indigo-900 px-4 py-2 rounded-lg hover:bg-gray-100">
            <User size={20} />
            <span>Waishak</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white py-32 px-6 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40 z-10"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-20">
          <div className="flex items-center justify-between gap-12">
            {/* Left Side - Text Content */}
            <div className="flex-1">
              {/* Category Tabs */}
              <div className="flex gap-4 mb-12 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-6 py-2 rounded-full transition-all ${
                      activeTab === cat
                        ? "bg-white text-gray-900"
                        : "bg-white/10 backdrop-blur-sm hover:bg-white/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {/* Hero Text with Translucent Background */}
              <div className="inline-block bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20">
                <h2 className="text-6xl font-bold mb-4">Welcome to the</h2>
                <h2 className="text-6xl font-bold mb-4">best nft platform in</h2>
                <h2 className="text-6xl font-bold">the world</h2>
              </div>
            </div>
            {/* Right Side - Vertical Scrolling Slider */}
            <div className="flex gap-4 h-[500px]">
              {/* First Column - Scrolling Down */}
              <div className="relative w-40 overflow-hidden">
                <div className="animate-scroll-down space-y-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-40 h-52 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex-shrink-0 hover:scale-105 transition-transform"></div>
                  ))}
                </div>
              </div>
              {/* Second Column - Scrolling Up */}
              <div className="relative w-40 overflow-hidden">
                <div className="animate-scroll-up space-y-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-40 h-52 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex-shrink-0 hover:scale-105 transition-transform"></div>
                  ))}
                </div>
              </div>
              {/* Third Column - Scrolling Down */}
              <div className="relative w-40 overflow-hidden">
                <div className="animate-scroll-down-delayed space-y-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-40 h-52 bg-gradient-to-br from-pink-600 to-rose-600 rounded-xl flex-shrink-0 hover:scale-105 transition-transform"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exhibition Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold text-gray-900">Exhibition</h3>
          <button className="text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-300 rounded-lg">
            view all
          </button>
        </div>
        <div className="grid grid-cols-5 gap-6">
          {exhibitions.map((item, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="w-full h-48 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg mb-4"></div>
              <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total NFT</span>
                <span className="font-bold">{item.totalNFT}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PFPS Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-gray-50">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold text-gray-900">PFPS</h3>
          <div className="flex gap-2">
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100">
              <ChevronLeft size={20} />
            </button>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-6">
          {pfpsItems.map((item, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="w-full h-48 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg mb-4"></div>
              <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{item.creator}</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Floor Price</p>
                  <p className="font-bold text-gray-900">{item.floor}</p>
                  <p className="text-xs text-gray-500">USDT</p>
                </div>
                <p className="text-sm text-gray-600">{item.usd}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gaming Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold text-gray-900">Gaming</h3>
          <button className="text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-300 rounded-lg">
            view all
          </button>
        </div>
        <div className="grid grid-cols-5 gap-6">
          {gamingItems.map((item, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="w-full h-48 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg mb-4"></div>
              <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{item.creator}</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Floor Price</p>
                  <p className="font-bold text-gray-900">{item.floor}</p>
                  <p className="text-xs text-gray-500">USDT</p>
                </div>
                <p className="text-sm text-gray-600">{item.usd}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Membership Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-gray-50">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold text-gray-900">Membership</h3>
          <button className="text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-300 rounded-lg">
            view all
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-600 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-12">
          <div>
            <h4 className="font-bold text-lg mb-4">Categories</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">Arts</a></li>
              <li><a href="#" className="hover:underline">Gaming</a></li>
              <li><a href="#" className="hover:underline">PFPS</a></li>
              <li><a href="#" className="hover:underline">Membership</a></li>
              <li><a href="#" className="hover:underline">Photography</a></li>
              <li><a href="#" className="hover:underline">Exhibition</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">Privacy Policy</a></li>
              <li><a href="#" className="hover:underline">Terms of service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Account</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">Account Overview</a></li>
              <li><a href="#" className="hover:underline">Mint Nft</a></li>
              <li><a href="#" className="hover:underline">Transaction</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Stay in touch</h4>
            <p className="text-sm mb-4">Don&apos;t miss anything. Stay in touch with us and get real time update.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email Address"
                className="flex-1 px-4 py-2 rounded-lg text-gray-900"
              />
              <button className="bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300">
                Submit
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-blue-500 text-sm">
          <p>© Copyright 2024 mintxplore. All rights reserved.</p>
        </div>
      </footer>

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
