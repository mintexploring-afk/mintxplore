import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { User } from '@/models/User';
import { NFT } from '@/models/NFT';
import { Deposit } from '@/models/Deposit';
import { Withdrawal } from '@/models/Withdrawal';
import { Transaction } from '@/models/Transaction';
import { Category } from '@/models/Category';
import { NewsletterSubscription } from '@/models/NewsletterSubscription';
import { verifyToken } from '@/utils/auth';

// GET detailed platform statistics with time filtering (admin only)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const admin = await User.findById(decoded.userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get time frame from query params
    const { searchParams } = new URL(req.url);
    const startDate = new Date(searchParams.get('startDate') || 0);
    const endDate = new Date(searchParams.get('endDate') || Date.now());

    console.log('📊 Fetching detailed stats:', { startDate, endDate });

    // Build time filter
    const timeFilter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // ===== USERS ANALYTICS =====
    const allUsers = await User.find();
    const newUsers = await User.find(timeFilter);
    const activeUsers = await User.find({
      ...timeFilter,
      lastLogin: { $gte: startDate }
    });

    const totalWETH = allUsers.reduce((sum, u) => sum + (u.balances?.WETH || 0), 0);
    const totalETH = allUsers.reduce((sum, u) => sum + (u.balances?.ETH || 0), 0);

    const topHolders = allUsers
      .map(u => ({
        name: u.name || u.username || 'Unknown',
        balance: (u.balances?.WETH || 0) + (u.balances?.ETH || 0)
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);

    const usersStats = {
      total: allUsers.length,
      new: newUsers.length,
      active: activeUsers.length,
      emailVerified: allUsers.filter(u => u.isEmailVerified).length,
      byRole: {
        admin: allUsers.filter(u => u.role === 'admin').length,
        user: allUsers.filter(u => u.role === 'user').length,
      },
      avgBalanceWETH: allUsers.length > 0 ? totalWETH / allUsers.length : 0,
      avgBalanceETH: allUsers.length > 0 ? totalETH / allUsers.length : 0,
      topHolders,
    };

    // ===== NFT ANALYTICS =====
    const allNFTs = await NFT.find();
    const newNFTs = await NFT.find(timeFilter);
    
    const nftsByCategory = await NFT.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
      { $project: { name: { $arrayElemAt: ['$categoryInfo.name', 0] }, count: 1 } }
    ]);

    const nftsStats = {
      total: allNFTs.length,
      pending: allNFTs.filter(n => n.status === 'pending').length,
      approved: allNFTs.filter(n => n.status === 'approved').length,
      declined: allNFTs.filter(n => n.status === 'declined').length,
      active: allNFTs.filter(n => n.isActive).length,
      avgFloorPrice: allNFTs.length > 0 
        ? allNFTs.reduce((sum, n) => sum + (n.floorPrice || 0), 0) / allNFTs.length 
        : 0,
      totalMintFees: allNFTs.reduce((sum, n) => sum + (n.mintFee || 0), 0),
      byCategory: nftsByCategory.map(c => ({ name: c.name || 'Unknown', count: c.count })),
      recentlyMinted: newNFTs.length,
    };

    // ===== DEPOSITS ANALYTICS =====
    const allDeposits = await Deposit.find();
    const timeFilteredDeposits = await Deposit.find(timeFilter);

    const depositsByStatus = {
      pending: allDeposits.filter(d => d.status === 'pending').length,
      completed: allDeposits.filter(d => d.status === 'approved').length,
      rejected: allDeposits.filter(d => d.status === 'declined').length,
    };

    const depositsByNetwork = allDeposits.reduce(
      (acc: Record<string, number>, d) => {
        acc[d.network] = (acc[d.network] || 0) + d.amount;
        return acc;
      },
      {}
    );

    const depositsStats = {
      total: timeFilteredDeposits.length,
      pending: depositsByStatus.pending,
      completed: depositsByStatus.completed,
      rejected: depositsByStatus.rejected,
      totalAmount: timeFilteredDeposits.reduce((sum, d) => sum + d.amount, 0),
      avgAmount: timeFilteredDeposits.length > 0 
        ? timeFilteredDeposits.reduce((sum, d) => sum + d.amount, 0) / timeFilteredDeposits.length 
        : 0,
      byCurrency: depositsByNetwork,
    };

    // ===== WITHDRAWALS ANALYTICS =====
    const allWithdrawals = await Withdrawal.find();
    const timeFilteredWithdrawals = await Withdrawal.find(timeFilter);

    const withdrawalsByStatus = {
      pending: allWithdrawals.filter(w => w.status === 'pending').length,
      completed: allWithdrawals.filter(w => w.status === 'approved').length,
      rejected: allWithdrawals.filter(w => w.status === 'declined').length,
    };

    const withdrawalsByNetwork = allWithdrawals.reduce(
      (acc: Record<string, number>, w) => {
        acc[w.network] = (acc[w.network] || 0) + w.amount;
        return acc;
      },
      {}
    );

    const withdrawalsStats = {
      total: timeFilteredWithdrawals.length,
      pending: withdrawalsByStatus.pending,
      completed: withdrawalsByStatus.completed,
      rejected: withdrawalsByStatus.rejected,
      totalAmount: timeFilteredWithdrawals.reduce((sum, w) => sum + w.amount, 0),
      avgAmount: timeFilteredWithdrawals.length > 0 
        ? timeFilteredWithdrawals.reduce((sum, w) => sum + w.amount, 0) / timeFilteredWithdrawals.length 
        : 0,
      byCurrency: withdrawalsByNetwork,
    };

    // ===== TRANSACTIONS ANALYTICS =====
    // ===== TRANSACTIONS ANALYTICS =====
    const timeFilteredTransactions = await Transaction.find(timeFilter);
    const transactionsByType = timeFilteredTransactions.reduce(
      (acc: Record<string, number>, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      },
      {}
    );

    const transactionsByStatus = timeFilteredTransactions.reduce(
      (acc: Record<string, number>, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      },
      {}
    );

    const transactionsStats = {
      total: timeFilteredTransactions.length,
      byType: transactionsByType,
      byStatus: transactionsByStatus,
      totalVolume: timeFilteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
    };

    // ===== NEWSLETTER ANALYTICS =====
    const allSubscriptions = await NewsletterSubscription.find();
    const newSubscriptions = await NewsletterSubscription.find(timeFilter);

    const activeSubscribers = allSubscriptions.filter(s => s.status === 'active').length;
    const inactiveSubscribers = allSubscriptions.filter(s => s.status === 'inactive').length;

    const newsletterStats = {
      totalSubscribers: allSubscriptions.length,
      activeSubscribers,
      inactiveSubscribers,
      subscriptionRate: allUsers.length > 0 ? (activeSubscribers / allUsers.length) * 100 : 0,
      recentSubscriptions: newSubscriptions.length,
    };

    // ===== CATEGORIES ANALYTICS =====
    const allCategories = await Category.find();

    const categoriesStats = {
      total: allCategories.length,
      active: allCategories.filter(c => c.isActive).length,
      inactive: allCategories.filter(c => !c.isActive).length,
      avgMinFloorPrice: allCategories.length > 0 
        ? allCategories.reduce((sum, c) => sum + (c.minFloorPrice || 0), 0) / allCategories.length 
        : 0,
      avgMintFee: allCategories.length > 0 
        ? allCategories.reduce((sum, c) => sum + (c.mintFee || 0), 0) / allCategories.length 
        : 0,
    };

    // ===== FINANCIAL SUMMARY =====
    const completedDepositsAmount = allDeposits
      .filter(d => d.status === 'approved')
      .reduce((sum, d) => sum + d.amount, 0);

    const completedWithdrawalsAmount = allWithdrawals
      .filter(w => w.status === 'approved')
      .reduce((sum, w) => sum + w.amount, 0);

    const pendingDepositsAmount = allDeposits
      .filter(d => d.status === 'pending')
      .reduce((sum, d) => sum + d.amount, 0);

    const pendingWithdrawalsAmount = allWithdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0);

    const financialStats = {
      netFlow: completedDepositsAmount - completedWithdrawalsAmount,
      platformBalance: {
        WETH: totalWETH,
        ETH: totalETH,
      },
      totalRevenue: nftsStats.totalMintFees, // Mint fees as revenue
      pendingValue: pendingDepositsAmount + pendingWithdrawalsAmount,
    };

    // ===== COMPARISON (if time range allows) =====
    // Calculate previous period for comparison
    const timeSpan = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - timeSpan);
    const prevEndDate = startDate;

    const prevTimeFilter = {
      createdAt: { $gte: prevStartDate, $lte: prevEndDate }
    };

    const prevUsers = await User.find(prevTimeFilter);
    const prevNFTs = await NFT.find(prevTimeFilter);
    const prevDeposits = await Deposit.find(prevTimeFilter);
    const prevWithdrawals = await Withdrawal.find(prevTimeFilter);

    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const comparison = {
      users: calculatePercentageChange(newUsers.length, prevUsers.length),
      nfts: calculatePercentageChange(newNFTs.length, prevNFTs.length),
      deposits: calculatePercentageChange(timeFilteredDeposits.length, prevDeposits.length),
      withdrawals: calculatePercentageChange(timeFilteredWithdrawals.length, prevWithdrawals.length),
    };

    const detailedStats = {
      users: usersStats,
      nfts: nftsStats,
      deposits: depositsStats,
      withdrawals: withdrawalsStats,
      transactions: transactionsStats,
      newsletter: newsletterStats,
      categories: categoriesStats,
      financial: financialStats,
      comparison,
    };

    console.log('✅ Detailed stats compiled successfully');

    return NextResponse.json(detailedStats);
  } catch (error: unknown) {
    console.error('Error fetching detailed stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detailed statistics' },
      { status: 500 }
    );
  }
}
