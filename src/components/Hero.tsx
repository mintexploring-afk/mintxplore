"use client";
import React from "react";
import Image from "next/image";

interface HeroProps {
  typed: string;
}

export default function Hero({ typed }: HeroProps) {
  // Column 1: Images 1-4 (scrolling down)
  const column1Images = [1, 2, 3, 4];
  // Column 2: Images 5-8 (scrolling up)
  const column2Images = [5, 6, 7, 8];
  // Column 3: Images 9-12 (scrolling down)
  const column3Images = [9, 10, 11, 12];

  return (
    <div className="relative w-full rounded-3xl border border-white/20 overflow-hidden flex flex-col sm:flex-row items-center justify-between min-h-[220px] sm:min-h-[260px] px-6 py-14 gap-8 mb-10">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero.jpg"
          alt="Hero Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <h2 className="text-4xl sm:text-6xl font-bold text-white text-center drop-shadow-lg">
          <span>{typed}</span>
          <span className="inline-block w-4 animate-pulse">|</span>
        </h2>
      </div>

      {/* Vertical Carousel */}
      <div className="relative z-10 flex gap-2 h-[180px] sm:h-[220px]">
        {/* First Column - Images 1-4 - Scrolling Down */}
        <div className="relative w-16 sm:w-20 overflow-hidden rounded-lg">
          <div className="animate-scroll-down space-y-2">
            {column1Images.map((num) => (
              <div key={`col1-${num}`} className="w-16 sm:w-20 h-20 sm:h-24 rounded-lg flex-shrink-0 hover:scale-105 transition-transform overflow-hidden">
                <Image
                  src={`/courosel${num}.png`}
                  alt={`Carousel ${num}`}
                  width={80}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {column1Images.map((num) => (
              <div key={`col1-dup-${num}`} className="w-16 sm:w-20 h-20 sm:h-24 rounded-lg flex-shrink-0 hover:scale-105 transition-transform overflow-hidden">
                <Image
                  src={`/courosel${num}.png`}
                  alt={`Carousel ${num}`}
                  width={80}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Second Column - Images 5-8 - Scrolling Up */}
        <div className="relative w-16 sm:w-20 overflow-hidden rounded-lg">
          <div className="animate-scroll-up space-y-2">
            {column2Images.map((num) => (
              <div key={`col2-${num}`} className="w-16 sm:w-20 h-20 sm:h-24 rounded-lg flex-shrink-0 hover:scale-105 transition-transform overflow-hidden">
                <Image
                  src={`/courosel${num}.png`}
                  alt={`Carousel ${num}`}
                  width={80}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {column2Images.map((num) => (
              <div key={`col2-dup-${num}`} className="w-16 sm:w-20 h-20 sm:h-24 rounded-lg flex-shrink-0 hover:scale-105 transition-transform overflow-hidden">
                <Image
                  src={`/courosel${num}.png`}
                  alt={`Carousel ${num}`}
                  width={80}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Third Column - Images 9-12 - Scrolling Down */}
        <div className="relative w-16 sm:w-20 overflow-hidden rounded-lg">
          <div className="animate-scroll-down-delayed space-y-2">
            {column3Images.map((num) => (
              <div key={`col3-${num}`} className="w-16 sm:w-20 h-20 sm:h-24 rounded-lg flex-shrink-0 hover:scale-105 transition-transform overflow-hidden">
                <Image
                  src={`/courosel${num}.png`}
                  alt={`Carousel ${num}`}
                  width={80}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {column3Images.map((num) => (
              <div key={`col3-dup-${num}`} className="w-16 sm:w-20 h-20 sm:h-24 rounded-lg flex-shrink-0 hover:scale-105 transition-transform overflow-hidden">
                <Image
                  src={`/courosel${num}.png`}
                  alt={`Carousel ${num}`}
                  width={80}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
