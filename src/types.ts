export type Screen = 'login' | 'swipe' | 'match' | 'messages' | 'chat' | 'profile' | 'settings'

export interface Profile {
  id: number
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
  id: number
  text: string
  from: 'me' | 'them'
  time: string
  createdAt?: string
}

export interface Conversation {
  profile: Profile
  messages: Message[]
  unread: number
  updatedAt?: string
}

export interface UserProfile {
  id: number
  name: string
  age: number
  job: string
  bio: string
  images: string[]
  tags: string[]
  stats: Array<{ label: string; value: string }>
}
