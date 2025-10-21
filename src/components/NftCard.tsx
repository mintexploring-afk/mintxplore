import React from "react";

interface NftCardProps {
  title: string;
  creator: string;
  floor: string;
  usd: string;
  imageUrl?: string;
}

export default function NftCard({ title, creator, floor, usd, imageUrl }: NftCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
      <div className="w-full h-32 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="object-cover w-full h-full rounded-lg" />
        ) : null}
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600 mb-3">{creator}</p>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500">Floor Price</p>
          <p className="font-bold text-gray-900">{floor}</p>
          <p className="text-xs text-gray-500">USDT</p>
        </div>
        <p className="text-sm text-gray-600">{usd}</p>
      </div>
    </div>
  );
}
