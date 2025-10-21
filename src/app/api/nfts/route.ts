import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { dbConnect } from '@/utils/dbConnect'
import { NFT } from '@/models/NFT'
import { Category } from '@/models/Category'
import { User } from '@/models/User'
import { sendMail } from '@/utils/sendMail'
import { getNFTMintedEmailTemplate, getNFTApprovedEmailTemplate, getNFTRejectedEmailTemplate } from '@/utils/emailTemplates'
import mongoose from 'mongoose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Verify token and get user
function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return null
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
    return decoded
  } catch {
    return null
  }
}

// GET - Get user's NFTs or all NFTs (for admin)
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const query: Record<string, unknown> = {}

    // If user is not admin, only show their own NFTs
    if (decoded.role !== 'admin') {
      query.owner = decoded.userId
    } else if (userId) {
      // Admin can filter by specific user
      query.owner = userId
    }

    // Filter by status if provided
    if (status) {
      query.status = status
    }

    // Search functionality (admin only)
    if (search && decoded.role === 'admin') {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id')
      
      const userIds = users.map(u => u._id)
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { owner: { $in: userIds } }
      ]
    }

    // Get total count
    const totalItems = await NFT.countDocuments(query)
    const totalPages = Math.ceil(totalItems / limit)
    const skip = (page - 1) * limit

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const nfts = await NFT.find(query)
      .populate('owner', 'name email')
      .populate('category', 'name minFloorPrice mintFee')
      .populate('processedBy', 'name email')
      .sort(sort)
      .limit(limit)
      .skip(skip)

    return NextResponse.json({ 
      nfts,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit
      }
    })
  } catch (error) {
    console.error('Error fetching NFTs:', error)
    return NextResponse.json(
      { message: 'Error fetching NFTs' },
      { status: 500 }
    )
  }
}

// POST - Create new NFT (user submits for minting)
export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, categoryId, floorPrice, artworkUrl } = body

    // Validate required fields
    if (!name || !description || !categoryId || !floorPrice || !artworkUrl) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Get category to validate floor price and get mint fee
    const category = await Category.findById(categoryId)
    if (!category) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      )
    }

    if (!category.isActive) {
      return NextResponse.json(
        { message: 'This category is not available' },
        { status: 400 }
      )
    }

    // Validate floor price
    if (parseFloat(floorPrice) < category.minFloorPrice) {
      return NextResponse.json(
        { 
          message: `Floor price must be at least ${category.minFloorPrice} WETH for this category` 
        },
        { status: 400 }
      )
    }

    // Create NFT
    const nft = await NFT.create({
      owner: decoded.userId,
      name,
      description,
      category: categoryId,
      floorPrice: parseFloat(floorPrice),
      artworkUrl,
      mintFee: category.mintFee,
      status: 'pending',
      isActive: false
    })

    await nft.populate('category', 'name minFloorPrice mintFee')

    // Get user details for email
    const user = await User.findById(decoded.userId)
    if (user && user.email) {
      try {
        const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard`
        const emailHtml = getNFTMintedEmailTemplate(
          user.name || 'User',
          name,
          artworkUrl,
          dashboardLink
        )
        
        await sendMail({
          to: user.email,
          subject: '🎨 NFT Minted Successfully - Pending Approval',
          html: emailHtml
        })
        
        console.log(`✅ Sent NFT minted email to ${user.email}`)
      } catch (emailError) {
        console.error('Failed to send NFT minted email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(
      { 
        message: 'NFT submitted for approval', 
        nft 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating NFT:', error)
    return NextResponse.json(
      { message: 'Error creating NFT' },
      { status: 500 }
    )
  }
}

// PUT - Update NFT (toggle active status or approve/decline)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect()

    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, action, adminNote } = body

    if (!id) {
      return NextResponse.json(
        { message: 'NFT ID is required' },
        { status: 400 }
      )
    }

    const nft = await NFT.findById(id)
    if (!nft) {
      return NextResponse.json(
        { message: 'NFT not found' },
        { status: 404 }
      )
    }

    // Toggle active status (owner or admin can do this)
    if (action === 'toggle-active') {
      if (decoded.role !== 'admin' && nft.owner.toString() !== decoded.userId) {
        return NextResponse.json(
          { message: 'You can only toggle your own NFTs' },
          { status: 403 }
        )
      }

      if (nft.status !== 'approved') {
        return NextResponse.json(
          { message: 'Only approved NFTs can be activated/deactivated' },
          { status: 400 }
        )
      }

      nft.isActive = !nft.isActive
      await nft.save()

      return NextResponse.json({
        message: `NFT ${nft.isActive ? 'activated' : 'deactivated'} successfully`,
        nft
      })
    }

    // Approve or decline (admin only)
    if (action === 'approve' || action === 'decline') {
      if (decoded.role !== 'admin') {
        return NextResponse.json(
          { message: 'Only admins can approve/decline NFTs' },
          { status: 403 }
        )
      }

      if (nft.status !== 'pending') {
        return NextResponse.json(
          { message: 'Only pending NFTs can be approved/declined' },
          { status: 400 }
        )
      }

      if (action === 'approve') {
        // Deduct mint fee from user balance
        const user = await User.findById(nft.owner)
        if (!user) {
          return NextResponse.json(
            { message: 'User not found' },
            { status: 404 }
          )
        }

        if (user.balances.WETH < nft.mintFee) {
          return NextResponse.json(
            { message: 'User has insufficient balance to pay mint fee' },
            { status: 400 }
          )
        }

        user.balances.WETH -= nft.mintFee
        user.markModified('balances')
        await user.save()

        console.log(`✅ Deducted ${nft.mintFee} WETH mint fee from user ${user.email}`)

        nft.status = 'approved'
        nft.isActive = true

        // Send approval email
        if (user.email) {
          try {
            const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard`
            const emailHtml = getNFTApprovedEmailTemplate(
              user.name || 'User',
              nft.name,
              nft.artworkUrl,
              dashboardLink
            )
            
            await sendMail({
              to: user.email,
              subject: '✅ NFT Approved - Now Live on Opalineart!',
              html: emailHtml
            })
            
            console.log(`✅ Sent NFT approved email to ${user.email}`)
          } catch (emailError) {
            console.error('Failed to send NFT approved email:', emailError)
          }
        }
      } else {
        // Get user for rejection email
        const user = await User.findById(nft.owner)
        
        nft.status = 'declined'
        nft.isActive = false

        // Send rejection email
        if (user && user.email) {
          try {
            const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard`
            const emailHtml = getNFTRejectedEmailTemplate(
              user.name || 'User',
              nft.name,
              adminNote || 'Your NFT did not meet our community guidelines.',
              dashboardLink
            )
            
            await sendMail({
              to: user.email,
              subject: '📋 NFT Submission Review - Opalineart',
              html: emailHtml
            })
            
            console.log(`✅ Sent NFT rejected email to ${user.email}`)
          } catch (emailError) {
            console.error('Failed to send NFT rejected email:', emailError)
          }
        }
      }

      nft.adminNote = adminNote || ''
      nft.processedBy = new mongoose.Types.ObjectId(decoded.userId)
      nft.processedAt = new Date()
      await nft.save()

      return NextResponse.json({
        message: `NFT ${action}d successfully`,
        nft
      })
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating NFT:', error)
    return NextResponse.json(
      { message: 'Error updating NFT' },
      { status: 500 }
    )
  }
}
