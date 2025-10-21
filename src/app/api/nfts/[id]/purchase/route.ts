import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbConnect } from '@/utils/dbConnect';
import { NFT } from '@/models/NFT';
import { User } from '@/models/User';
import { Settings } from '@/models/Settings';
import { Transaction } from '@/models/Transaction';
import { sendMail } from '@/utils/sendMail';
import { getNFTSoldEmailTemplate, getNFTPurchasedEmailTemplate } from '@/utils/emailTemplates';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST - Purchase NFT
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Verify user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get payment currency from request body
    const body = await request.json();
    const paymentCurrency = body.paymentCurrency || 'WETH'; // Default to WETH

    const buyer = await User.findById(decoded.userId);
    if (!buyer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get NFT
    const nft = await NFT.findById(id).populate('owner');
    if (!nft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 });
    }

    if (nft.status !== 'approved' || !nft.isActive) {
      return NextResponse.json({ error: 'NFT not available for purchase' }, { status: 400 });
    }

    // Check if buyer is not the owner
    if (nft.owner._id.toString() === decoded.userId) {
      return NextResponse.json({ error: 'You cannot buy your own NFT' }, { status: 400 });
    }

    // Get exchange rate for ETH to WETH conversion
    const settings = await Settings.findOne();
    const ethToWethRate = settings?.exchangeRates?.ETH_TO_WETH || 1;

    // Calculate required amount based on payment currency
    let requiredAmount = nft.floorPrice; // NFT price is in WETH
    let buyerCurrency: 'ETH' | 'WETH' = 'WETH';
    
    if (paymentCurrency === 'ETH') {
      buyerCurrency = 'ETH';
      requiredAmount = nft.floorPrice / ethToWethRate; // Convert WETH price to ETH
    }

    // Check buyer balance
    const buyerBalance = buyer.balances[buyerCurrency] || 0;
    if (buyerBalance < requiredAmount) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        required: requiredAmount,
        available: buyerBalance,
        currency: buyerCurrency
      }, { status: 400 });
    }

    const seller = await User.findById(nft.owner._id);
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Process transaction
    // Deduct from buyer (in their chosen currency)
    buyer.balances[buyerCurrency] = (buyer.balances[buyerCurrency] || 0) - requiredAmount;
    buyer.markModified('balances');
    await buyer.save();

    // Credit seller (always in WETH, the NFT's listing currency)
    seller.balances.WETH = (seller.balances.WETH || 0) + nft.floorPrice;
    seller.markModified('balances');
    await seller.save();

    // Update NFT ownership
    const previousOwner = nft.owner._id;
    nft.owner = new mongoose.Types.ObjectId(decoded.userId);
    await nft.save();

    // Log transaction for buyer (negative)
    await Transaction.create({
      user: buyer._id,
      type: 'nft-purchase',
      amount: -requiredAmount,
      currency: buyerCurrency,
      status: 'completed',
      note: `Purchased NFT: ${nft.name} (Paid in ${buyerCurrency})`,
      metadata: {
        nftId: nft._id,
        nftName: nft.name,
        sellerId: previousOwner,
        paymentCurrency: buyerCurrency,
        nftPrice: nft.floorPrice,
        conversionRate: paymentCurrency === 'ETH' ? ethToWethRate : 1
      }
    });

    // Log transaction for seller (positive, always in WETH)
    await Transaction.create({
      user: previousOwner,
      type: 'nft-sale',
      amount: nft.floorPrice,
      currency: 'WETH',
      status: 'completed',
      note: `Sold NFT: ${nft.name} (Received in WETH)`,
      metadata: {
        nftId: nft._id,
        nftName: nft.name,
        buyerId: buyer._id,
        buyerPaidIn: buyerCurrency,
        buyerPaidAmount: requiredAmount
      }
    });

    console.log(`✅ NFT Purchase: ${buyer.email} bought "${nft.name}" from ${seller.email} for ${requiredAmount} ${buyerCurrency} (${nft.floorPrice} WETH equivalent)`);

    // Send email notifications
    const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard`;

    // Send email to seller
    if (seller.email) {
      try {
        const emailHtml = getNFTSoldEmailTemplate(
          seller.name || 'User',
          buyer.name || 'User',
          nft.name,
          nft.artworkUrl,
          nft.floorPrice,
          'WETH',
          dashboardLink
        );
        
        await sendMail({
          to: seller.email,
          subject: '🎉 NFT Sold - Congratulations!',
          html: emailHtml
        });
        
        console.log(`✅ Sent NFT sold email to seller ${seller.email}`);
      } catch (emailError) {
        console.error('Failed to send NFT sold email:', emailError);
      }
    }

    // Send email to buyer
    if (buyer.email) {
      try {
        const emailHtml = getNFTPurchasedEmailTemplate(
          buyer.name || 'User',
          seller.name || 'User',
          nft.name,
          nft.artworkUrl,
          requiredAmount,
          buyerCurrency,
          dashboardLink
        );
        
        await sendMail({
          to: buyer.email,
          subject: '🎨 NFT Purchase Successful!',
          html: emailHtml
        });
        
        console.log(`✅ Sent NFT purchased email to buyer ${buyer.email}`);
      } catch (emailError) {
        console.error('Failed to send NFT purchased email:', emailError);
      }
    }

    return NextResponse.json({
      message: 'NFT purchased successfully!',
      transaction: {
        nftId: nft._id,
        nftName: nft.name,
        price: nft.floorPrice,
        paidAmount: requiredAmount,
        paidCurrency: buyerCurrency,
        seller: seller.name,
        buyer: buyer.name
      }
    });
  } catch (error: unknown) {
    console.error('Error purchasing NFT:', error);
    return NextResponse.json(
      { error: 'Failed to purchase NFT' },
      { status: 500 }
    );
  }
}
