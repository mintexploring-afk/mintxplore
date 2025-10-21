"use client";
import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About Opalineart</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              Opalineart is dedicated to democratizing the world of digital art and NFTs. We believe that everyone should have 
              the opportunity to create, own, and trade unique digital assets. Our platform bridges the gap between creators 
              and collectors, providing a seamless and secure environment for NFT transactions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What We Do</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Opalineart is a comprehensive NFT marketplace platform that empowers users to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Create NFTs:</strong> Mint your digital artwork, music, videos, and other creative works as NFTs</li>
              <li><strong>Browse & Discover:</strong> Explore a diverse collection of NFTs across multiple categories</li>
              <li><strong>Trade Securely:</strong> Buy and sell NFTs with confidence on our secure platform</li>
              <li><strong>Manage Assets:</strong> Track your NFT portfolio and transaction history</li>
              <li><strong>Connect with Community:</strong> Join a vibrant community of creators and collectors</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Choose Opalineart</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">User-Friendly</h3>
                <p className="text-gray-700">
                  Our intuitive interface makes it easy for both beginners and experienced users to navigate the NFT space.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure & Reliable</h3>
                <p className="text-gray-700">
                  Built on robust blockchain technology with enterprise-grade security to protect your assets.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Low Fees</h3>
                <p className="text-gray-700">
                  Competitive transaction fees ensure you keep more of your earnings when buying or selling NFTs.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">24/7 Support</h3>
                <p className="text-gray-700">
                  Our dedicated support team is always available to assist you with any questions or concerns.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              We envision a future where digital ownership is accessible to everyone, where creators are fairly compensated 
              for their work, and where the NFT ecosystem continues to grow and evolve. Opalineart is committed to being 
              at the forefront of this revolution, continuously improving our platform to meet the needs of our community.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Values</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">🎨 Creativity First</h3>
                <p className="text-gray-700">
                  We celebrate and support the creative spirit of our community.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">🔒 Security & Trust</h3>
                <p className="text-gray-700">
                  Your security and trust are our top priorities.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">🌍 Community-Driven</h3>
                <p className="text-gray-700">
                  We listen to our community and evolve based on their feedback.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">💡 Innovation</h3>
                <p className="text-gray-700">
                  We continuously explore new technologies to enhance your experience.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get In Touch</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We&apos;d love to hear from you! Whether you have questions, feedback, or just want to say hello, feel free to reach out:
            </p>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>General Inquiries:</strong>{' '}
                <a href="mailto:hello@opalineart.com" className="text-blue-600 hover:underline">
                  hello@opalineart.com
                </a>
              </p>
              <p>
                <strong>Support:</strong>{' '}
                <a href="mailto:support@opalineart.com" className="text-blue-600 hover:underline">
                  support@opalineart.com
                </a>
              </p>
              <p>
                <strong>Partnership:</strong>{' '}
                <a href="mailto:partnerships@opalineart.com" className="text-blue-600 hover:underline">
                  partnerships@opalineart.com
                </a>
              </p>
            </div>
          </section>

          <div className="pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-700 text-lg font-medium">
              Join us on our journey to revolutionize digital ownership.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
