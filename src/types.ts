export type Screen = 'login' | 'swipe' | 'match' | 'messages' | 'chat' | 'profile' | 'edit_profile' | 'onboarding'

export interface Profile {
  id: string | number
  name: string
  age: number
  bio: string
  distance: string
  job: string
  image: string
  images: string[]
  tags: string[]
  externalId?: string
  createdAt?: string
}

export interface Message {
  id: string | number
  text: string
  from: 'me' | 'them'
  time: string
  createdAt?: string
}

export interface Conversation {
  id?: string // Match ID
  profile: Profile
  messages: Message[]
  unread: number
  updatedAt?: string
  blockedByMe?: boolean
  blockedByThem?: boolean
}

export interface UserProfile {
  id: string | number
  name: string
  age: number
  job: string
  bio: string
  images: string[]
  tags: string[]
  gender?: string
  birthdate?: string
  stats?: Array<{ label: string; value: string }>
}
