import React from "react";

interface CategoryCardProps {
  title: string;
  totalNFT: number;
}

export default function CategoryCard({ title, totalNFT }: CategoryCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
      <div className="w-full h-32 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg mb-4"></div>
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Total NFT</span>
        <span className="font-bold">{totalNFT}</span>
      </div>
    </div>
  );
}
