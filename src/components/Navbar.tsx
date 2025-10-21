"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, User, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const [isSticky, setIsSticky] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    router.push('/');
  };

  const handleDashboard = () => {
    setShowDropdown(false);
    if (user?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 px-6 py-4 flex items-center justify-between
        ${isSticky ? "bg-white shadow" : "bg-transparent"}
      `}
      style={{ backdropFilter: !isSticky ? "blur(2px)" : undefined }}
    >
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 border-2 ${isSticky ? "border-indigo-900" : "border-white"}`} style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}></div>
          <h1 className={`text-xl font-bold ${isSticky ? "text-indigo-900" : "text-white"}`}>Opalineart</h1>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className={`p-2 rounded-lg transition-colors ${isSticky ? "hover:bg-indigo-100" : "hover:bg-indigo-800"}`}>
          <Search size={20} className={isSticky ? "text-indigo-900" : "text-white"} />
        </button>
        {isAuthenticated && user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                ${isSticky ? "bg-indigo-50 hover:bg-indigo-100" : "bg-white hover:bg-gray-100"}
              `}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className={`font-medium ${isSticky ? "text-indigo-900" : "text-indigo-900"}`}>{user.name}</span>
              <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''} ${isSticky ? "text-indigo-900" : "text-indigo-900"}`} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {user.role === 'admin' && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={handleDashboard}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-semibold
            ${isSticky ? "bg-indigo-50 text-indigo-900 hover:bg-indigo-100" : "bg-white text-indigo-900 hover:bg-gray-100"}
          `}>
            <User size={20} className={isSticky ? "text-indigo-900" : "text-indigo-900"} />
            <span>Login</span>
          </Link>
        )}
      </div>
    </header>
  );
}
