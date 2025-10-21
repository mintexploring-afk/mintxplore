'use client';
import React from 'react';
import NextImage from 'next/image';
import { 
  User, 
  LogOut, 
  LayoutDashboard, 
  Download, 
  Upload, 
  Receipt, 
  Users, 
  Settings as SettingsIcon, 
  UserCog,
  BarChart3,
  Layers,
  Sparkles,
  Image,
  Store,
  DollarSign,
  Mail
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardSidebar({ isAdmin = false }: {
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const adminMenuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', route: '/admin/dashboard' },
    { icon: <Download size={20} />, label: 'Deposits', route: '/admin/deposits' },
    { icon: <Upload size={20} />, label: 'Withdrawals', route: '/admin/withdrawals' },
    { icon: <Receipt size={20} />, label: 'Transactions', route: '/admin/transactions' },
    { icon: <Users size={20} />, label: 'Users', route: '/admin/users' },
    { icon: <Image size={20} />, label: 'NFT Management', route: '/admin/nfts' },
    { icon: <Layers size={20} />, label: 'Categories', route: '/admin/categories' },
    { icon: <DollarSign size={20} />, label: 'Exchange Rates', route: '/admin/exchange-rates' },
    { icon: <Mail size={20} />, label: 'Newsletter', route: '/admin/newsletter' },
    { icon: <SettingsIcon size={20} />, label: 'Settings', route: '/admin/settings' },
    { icon: <User size={20} />, label: 'Profile', route: '/edit-profile' },
    { icon: <BarChart3 size={20} />, label: 'Reports/Stats', route: '/admin/reports' },
  ];

  const userMenuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', route: '/dashboard' },
    { icon: <Store size={20} />, label: 'Marketplace', route: '/' },
    { icon: <Sparkles size={20} />, label: 'Mint NFT', route: '/dashboard/mint' },
    { icon: <Download size={20} />, label: 'Deposit', route: '/dashboard/deposit' },
    { icon: <Upload size={20} />, label: 'Withdraw', route: '/dashboard/withdraw' },
    { icon: <Receipt size={20} />, label: 'Transactions', route: '/dashboard/transactions' },
    { icon: <UserCog size={20} />, label: 'Edit Profile', route: '/edit-profile' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const handleMenuClick = (item: { label: string; route: string | null }) => {
    if (item.route) {
      router.push(item.route);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Check if the current route matches the menu item
  const isActive = (route: string | null) => {
    if (!route) return false;
    // Never highlight marketplace (it redirects to landing page)
    if (route === '/') return false;
    // Exact match for dashboard pages
    if (route === '/dashboard' || route === '/admin/dashboard') {
      return pathname === route;
    }
    // For other routes, check if pathname starts with the route
    return pathname.startsWith(route);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-8">
        <NextImage 
          src="/logo.png" 
          alt="Opalineart Logo" 
          width={48} 
          height={48}
          className="w-12 h-12"
        />
        <h2 className="text-xl font-bold text-indigo-600">Opalineart</h2>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleMenuClick(item)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.route)
                ? 'bg-indigo-50 text-indigo-600 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <button 
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 mt-8 text-red-600 hover:bg-red-50 rounded-lg transition-all"
      >
        <LogOut size={20} />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
