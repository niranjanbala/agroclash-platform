// Mock Clan Service Implementation

import { ClanService } from '../interfaces'
import { Clan, User, Location } from '../../types'
import { generateId } from '../../utils'

interface ClanMember {
  id: string
  user_id: string
  clan_id: string
  role: 'leader' | 'admin' | 'member'
  joined_at: string
  contribution_xp: number
}

interface ClanInvite {
  id: string
  clan_id: string
  inviter_id: string
  invitee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export class MockClanService implements ClanService {
  private mockClans: Clan[] = []
  private mockMembers: ClanMember[] = []
  private mockInvites: ClanInvite[] = []
  private mockUsers: User[] = []

  constructor() {
    this.generateMockData()
  }

  async createClan(name: string, description: string, leaderId: string): Promise<Clan> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check if user is already in a clan
    const existingMembership = this.mockMembers.find(m => m.user_id === leaderId)
    if (existingMembership) {
      throw new Error('User is already a member of a clan')
    }

    // Check if clan name already exists
    const existingClan = this.mockClans.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (existingClan) {
      throw new Error('Clan name already exists')
    }

    const newClan: Clan = {
      id: generateId(),
      name,
      description,
      leader_id: leaderId,
      member_count: 1,
      total_xp: 0,
      created_at: new Date().toISOString()
    }

    // Add clan
    this.mockClans.push(newClan)

    // Add leader as member
    const leaderMembership: ClanMember = {
      id: generateId(),
      user_id: leaderId,
      clan_id: newClan.id,
      role: 'leader',
      joined_at: new Date().toISOString(),
      contribution_xp: 0
    }

    this.mockMembers.push(leaderMembership)

    return newClan
  }

  async joinClan(userId: string, clanId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))

    // Check if user is already in a clan
    const existingMembership = this.mockMembers.find(m => m.user_id === userId)
    if (existingMembership) {
      throw new Error('User is already a member of a clan')
    }

    // Check if clan exists
    const clan = this.mockClans.find(c => c.id === clanId)
    if (!clan) {
      throw new Error('Clan not found')
    }

    // Check clan capacity (max 50 members)
    if (clan.member_count >= 50) {
      throw new Error('Clan is at maximum capacity')
    }

    // Add member
    const newMembership: ClanMember = {
      id: generateId(),
      user_id: userId,
      clan_id: clanId,
      role: 'member',
      joined_at: new Date().toISOString(),
      contribution_xp: 0
    }

    this.mockMembers.push(newMembership)

    // Update clan member count
    clan.member_count += 1

    // Award XP for joining clan
    // This would typically be handled by the XP service
    console.log(`User ${userId} joined clan ${clan.name} and earned 30 XP`)
  }

  async leaveClan(userId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))

    const membership = this.mockMembers.find(m => m.user_id === userId)
    if (!membership) {
      throw new Error('User is not a member of any clan')
    }

    const clan = this.mockClans.find(c => c.id === membership.clan_id)
    if (!clan) {
      throw new Error('Clan not found')
    }

    // Check if user is the leader
    if (membership.role === 'leader') {
      // If there are other members, promote one to leader
      const otherMembers = this.mockMembers.filter(m => 
        m.clan_id === membership.clan_id && m.user_id !== userId
      )

      if (otherMembers.length > 0) {
        // Promote the member with highest contribution XP to leader
        const newLeader = otherMembers.reduce((prev, current) => 
          prev.contribution_xp > current.contribution_xp ? prev : current
        )
        newLeader.role = 'leader'
        clan.leader_id = newLeader.user_id
      } else {
        // If no other members, delete the clan
        const clanIndex = this.mockClans.findIndex(c => c.id === clan.id)
        if (clanIndex > -1) {
          this.mockClans.splice(clanIndex, 1)
        }
      }
    }

    // Remove membership
    const membershipIndex = this.mockMembers.findIndex(m => m.id === membership.id)
    if (membershipIndex > -1) {
      this.mockMembers.splice(membershipIndex, 1)
      clan.member_count -= 1
    }
  }

  async getClanMembers(clanId: string): Promise<User[]> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const clanMembers = this.mockMembers.filter(m => m.clan_id === clanId)
    
    // Return mock users for clan members
    return clanMembers.map(member => {
      const user = this.mockUsers.find(u => u.id === member.user_id)
      if (user) {
        return {
          ...user,
          // Add clan-specific data
          clan_role: member.role,
          clan_contribution_xp: member.contribution_xp,
          clan_joined_at: member.joined_at
        } as User & { clan_role: string; clan_contribution_xp: number; clan_joined_at: string }
      }

      // Generate mock user if not found
      return {
        id: member.user_id,
        email: `user${member.user_id}@example.com`,
        name: `User ${member.user_id.slice(-4)}`,
        xp: Math.floor(Math.random() * 5000),
        level: Math.floor(Math.random() * 20) + 1,
        clan_id: clanId,
        created_at: member.joined_at,
        updated_at: member.joined_at,
        clan_role: member.role,
        clan_contribution_xp: member.contribution_xp,
        clan_joined_at: member.joined_at
      } as User & { clan_role: string; clan_contribution_xp: number; clan_joined_at: string }
    }).sort((a, b) => {
      // Sort by role (leader first, then by XP)
      if (a.clan_role === 'leader') return -1
      if (b.clan_role === 'leader') return 1
      return b.xp - a.xp
    })
  }

  async getClanLeaderboard(clanId: string): Promise<User[]> {
    const members = await this.getClanMembers(clanId)
    
    // Sort by contribution XP (highest first)
    return members.sort((a, b) => {
      const aContrib = (a as any).clan_contribution_xp || 0
      const bContrib = (b as any).clan_contribution_xp || 0
      return bContrib - aContrib
    })
  }

  async searchClans(query: string, location?: Location): Promise<Clan[]> {
    await new Promise(resolve => setTimeout(resolve, 400))

    let filteredClans = [...this.mockClans]

    // Filter by name or description
    if (query.trim()) {
      const searchTerm = query.toLowerCase()
      filteredClans = filteredClans.filter(clan => 
        clan.name.toLowerCase().includes(searchTerm) ||
        (clan.description && clan.description.toLowerCase().includes(searchTerm))
      )
    }

    // Sort by member count and total XP
    filteredClans.sort((a, b) => {
      const scoreA = a.member_count * 100 + a.total_xp / 100
      const scoreB = b.member_count * 100 + b.total_xp / 100
      return scoreB - scoreA
    })

    return filteredClans.slice(0, 20) // Return top 20 results
  }

  // Additional methods for clan management
  async getClanById(clanId: string): Promise<Clan | null> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return this.mockClans.find(c => c.id === clanId) || null
  }

  async getUserClan(userId: string): Promise<Clan | null> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const membership = this.mockMembers.find(m => m.user_id === userId)
    if (!membership) return null
    
    return this.mockClans.find(c => c.id === membership.clan_id) || null
  }

  async inviteUser(clanId: string, inviterId: string, inviteeId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))

    // Check if inviter is admin or leader
    const inviterMembership = this.mockMembers.find(m => 
      m.user_id === inviterId && m.clan_id === clanId
    )
    
    if (!inviterMembership || (inviterMembership.role !== 'leader' && inviterMembership.role !== 'admin')) {
      throw new Error('Only clan leaders and admins can invite members')
    }

    // Check if invitee is already in a clan
    const inviteeMembership = this.mockMembers.find(m => m.user_id === inviteeId)
    if (inviteeMembership) {
      throw new Error('User is already a member of a clan')
    }

    // Check if invite already exists
    const existingInvite = this.mockInvites.find(i => 
      i.clan_id === clanId && i.invitee_id === inviteeId && i.status === 'pending'
    )
    if (existingInvite) {
      throw new Error('Invite already sent to this user')
    }

    // Create invite
    const newInvite: ClanInvite = {
      id: generateId(),
      clan_id: clanId,
      inviter_id: inviterId,
      invitee_id: inviteeId,
      status: 'pending',
      created_at: new Date().toISOString()
    }

    this.mockInvites.push(newInvite)
  }

  async getUserInvites(userId: string): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const userInvites = this.mockInvites.filter(i => 
      i.invitee_id === userId && i.status === 'pending'
    )

    return userInvites.map(invite => {
      const clan = this.mockClans.find(c => c.id === invite.clan_id)
      const inviter = this.mockUsers.find(u => u.id === invite.inviter_id)
      
      return {
        ...invite,
        clan,
        inviter
      }
    })
  }

  async respondToInvite(inviteId: string, accept: boolean): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))

    const invite = this.mockInvites.find(i => i.id === inviteId)
    if (!invite || invite.status !== 'pending') {
      throw new Error('Invite not found or already responded to')
    }

    invite.status = accept ? 'accepted' : 'declined'

    if (accept) {
      await this.joinClan(invite.invitee_id, invite.clan_id)
    }
  }

  async updateClanXP(clanId: string, xpToAdd: number): Promise<void> {
    const clan = this.mockClans.find(c => c.id === clanId)
    if (clan) {
      clan.total_xp += xpToAdd
    }
  }

  async updateMemberContribution(userId: string, xpToAdd: number): Promise<void> {
    const membership = this.mockMembers.find(m => m.user_id === userId)
    if (membership) {
      membership.contribution_xp += xpToAdd
    }
  }

  private generateMockData(): void {
    // Generate mock clans
    const clanNames = [
      'Green Thumbs United',
      'Harvest Heroes',
      'Crop Crusaders',
      'Farm Force',
      'Agricultural Alliance',
      'Seed Squad',
      'Farming Fellowship',
      'Garden Guardians',
      'Soil Soldiers',
      'Plant Pioneers'
    ]

    const descriptions = [
      'A community of passionate farmers helping each other grow',
      'Dedicated to sustainable farming practices and knowledge sharing',
      'Experienced farmers mentoring newcomers to agriculture',
      'Focus on organic farming and environmental stewardship',
      'Innovative farming techniques and technology adoption',
      'Supporting local food systems and community gardens',
      'Specialized in crop rotation and soil health',
      'Promoting biodiversity and regenerative agriculture',
      'Weather-resistant farming strategies and tips',
      'Marketplace experts and trading specialists'
    ]

    for (let i = 0; i < 8; i++) {
      const leaderId = `leader-${i + 1}`
      const clan: Clan = {
        id: `clan-${i + 1}`,
        name: clanNames[i],
        description: descriptions[i],
        leader_id: leaderId,
        member_count: Math.floor(Math.random() * 30) + 5, // 5-35 members
        total_xp: Math.floor(Math.random() * 50000) + 10000, // 10k-60k XP
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      }

      this.mockClans.push(clan)

      // Add leader membership
      this.mockMembers.push({
        id: `member-leader-${i + 1}`,
        user_id: leaderId,
        clan_id: clan.id,
        role: 'leader',
        joined_at: clan.created_at,
        contribution_xp: Math.floor(Math.random() * 5000) + 1000
      })

      // Add some regular members
      const memberCount = Math.min(clan.member_count - 1, 10) // Limit for mock data
      for (let j = 0; j < memberCount; j++) {
        this.mockMembers.push({
          id: `member-${i + 1}-${j + 1}`,
          user_id: `user-${i + 1}-${j + 1}`,
          clan_id: clan.id,
          role: j === 0 && memberCount > 3 ? 'admin' : 'member',
          joined_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
          contribution_xp: Math.floor(Math.random() * 3000)
        })
      }
    }

    // Generate some mock users
    for (let i = 0; i < 50; i++) {
      this.mockUsers.push({
        id: `user-${i + 1}`,
        email: `user${i + 1}@example.com`,
        name: `Farmer ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`,
        xp: Math.floor(Math.random() * 10000),
        level: Math.floor(Math.random() * 25) + 1,
        clan_id: i < 30 ? `clan-${Math.floor(i / 4) + 1}` : undefined,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }
}