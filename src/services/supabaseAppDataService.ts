import { supabase } from '../lib/supabase'
import type { AppDataService } from './appDataService'
import { INITIAL_CONVERSATIONS } from '../data/mockData'

export const supabaseAppDataService: AppDataService = {
  async getProfiles() {
    const { data: { session } } = await supabase.auth.getSession()
    
    let query = supabase.from('Profiles').select('*, Photos(*)')
    if (session) {
      query = query.neq('user_id', session.user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching profiles:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map((p: any) => {
      // Calculate age from birthdate
      let age = 25
      if (p.birthdate) {
        const diff = Date.now() - new Date(p.birthdate).getTime()
        age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
      }

      // Sort photos by sort_order
      const photos = p.Photos ? p.Photos.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) : []
      const images = photos.map((img: any) => img.photo_url)
      
      return {
        id: p.id,
        name: p.name || 'Usuario',
        age: age,
        bio: p.bio || '',
        distance: '5 km', // Placeholder, not in DB
        job: '', // Placeholder, not in DB
        image: images.length > 0 ? images[0] : 'https://via.placeholder.com/600x700?text=Sin+Foto',
        images: images,
        tags: [],
      }
    })
  },

  async getConversations() {
    // We are still returning mocked conversations for now
    // until we implement the Match/Messages queries
    return INITIAL_CONVERSATIONS
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        throw new Error('Not logged in')
    }

    const { data, error } = await supabase
      .from('Profiles')
      .select('*, Photos(*)')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
        return {
            id: user.id,
            name: user.email?.split('@')[0] || 'Usuario',
            age: 25,
            job: '',
            bio: '¡Bienvenido! Pronto podrás editar tu perfil.',
            images: [],
            tags: [],
            stats: [{ label: 'Likes', value: '0' }, { label: 'Matches', value: '0' }, { label: 'Visitas', value: '0' }]
        }
    }

    const photos = data.Photos ? data.Photos.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) : []
    const images = photos.map((img: any) => img.photo_url)

    let age = 25
    if (data.birthdate) {
        const diff = Date.now() - new Date(data.birthdate).getTime()
        age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
    }

    return {
      id: data.id,
      name: data.name || '',
      age,
      job: '',
      bio: data.bio || '',
      images,
      tags: [],
      stats: [{ label: 'Likes', value: '0' }, { label: 'Matches', value: '0' }, { label: 'Visitas', value: '0' }],
    }
  },
}
