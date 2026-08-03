import { INITIAL_CONVERSATIONS, PROFILES } from '../data/mockData'
import type { Conversation, Profile, UserProfile } from '../types'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export interface AppDataService {
  getProfiles: () => Promise<Profile[]>
  getConversations: () => Promise<Conversation[]>
  getCurrentUser: () => Promise<UserProfile>
  recordSwipe?: (targetId: string | number, action: 'like' | 'pass') => Promise<boolean>
  updateProfile?: (data: Partial<UserProfile>) => Promise<boolean>
  uploadPhoto?: (file: File) => Promise<string | false>
  deletePhoto?: (photoUrl: string) => Promise<boolean>
  sendMessage?: (matchId: string, text: string) => Promise<boolean>
  getMyEvents?: () => Promise<any[]>
  joinEvent?: (code: string) => Promise<{success: boolean; error?: string}>
}

export interface AppDataSnapshot {
  profiles: Profile[]
  conversations: Conversation[]
  currentUser: UserProfile
}

const currentUser: UserProfile = {
  id: 101,
  name: 'Alejandro',
  age: 28,
  job: 'Ingeniero de software',
  bio: 'Apasionado por la tecnología, el café y los viajes ☕🌍 Buscando a alguien con quien explorar el mundo.',
  images: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=700&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=700&fit=crop&auto=format',
  ],
  tags: ['Tecnología', 'Viajes', 'Café', 'Senderismo'],
  stats: [{ label: 'Likes', value: '142' }, { label: 'Matches', value: '23' }, { label: 'Visitas', value: '891' }],
}

export const mockAppDataService: AppDataService = {
  async getProfiles() {
    await wait(500)
    return PROFILES
  },
  async getConversations() {
    await wait(450)
    return INITIAL_CONVERSATIONS
  },
  async getCurrentUser() {
    await wait(300)
    return currentUser
  },
  async recordSwipe(_targetId, action) {
    await wait(300)
    return action === 'like' && Math.random() > 0.4
  },
  async updateProfile(data) {
    await wait(500)
    Object.assign(currentUser, data)
    return true
  },
  async sendMessage(_matchId, _text) {
    await wait(300)
    return true
  }
}

export async function loadAppData(service: AppDataService = mockAppDataService): Promise<AppDataSnapshot> {
  const [profiles, conversations, currentUserData] = await Promise.all([
    service.getProfiles(),
    service.getConversations(),
    service.getCurrentUser(),
  ])

  return {
    profiles,
    conversations,
    currentUser: currentUserData,
  }
}
