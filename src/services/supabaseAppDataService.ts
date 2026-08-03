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
        tags: p.tags || [],
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
            name: '',
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
      tags: data.tags || [],
      stats: [{ label: 'Likes', value: '0' }, { label: 'Matches', value: '0' }, { label: 'Visitas', value: '0' }],
    }
  },

  async recordSwipe(targetId, action) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Use our own profile ID to swipe
    const { data: myProfile } = await supabase.from('Profiles').select('id').eq('user_id', user.id).single()
    if (!myProfile) return false

    const { error } = await supabase.from('Swipes').insert({
      swiper_id: myProfile.id,
      swiped_id: targetId,
      action: action,
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error('Error saving swipe:', error)
      return false
    }

    if (action === 'like') {
      const { data: match } = await supabase.from('Swipes')
        .select('*')
        .eq('swiper_id', targetId)
        .eq('swiped_id', myProfile.id)
        .eq('action', 'like')
        .maybeSingle()

      if (match) return true
    }
    return false
  },

  async updateProfile(data) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Ensure profile exists
    let { data: myProfile } = await supabase.from('Profiles').select('id').eq('user_id', user.id).single()
    if (!myProfile) {
      const newProfile = {
        id: crypto.randomUUID(),
        user_id: user.id,
        name: '',
        bio: '',
        gender: 'other'
      }
      await supabase.from('Profiles').insert(newProfile)
    }

    const updateData: any = {}
    if (data.bio !== undefined) updateData.bio = data.bio
    if (data.name !== undefined) updateData.name = data.name
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.birthdate !== undefined) updateData.birthdate = data.birthdate
    if (data.tags !== undefined) updateData.tags = data.tags

    const { error } = await supabase
      .from('Profiles')
      .update(updateData)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating profile:', error)
      return false
    }
    return true
  },

  async uploadPhoto(file: File) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    let { data: myProfile } = await supabase.from('Profiles').select('id').eq('user_id', user.id).single()
    if (!myProfile) {
      const newProfile = {
        id: crypto.randomUUID(),
        user_id: user.id,
        name: '',
        bio: '',
        gender: 'other'
      }
      const { error: createError } = await supabase.from('Profiles').insert(newProfile)
      if (createError) {
        console.error('Error creando tu perfil base: ' + createError.message)
        throw new Error('Error de Perfil: ' + createError.message)
      }
      myProfile = { id: newProfile.id }
    }

    const ext = file.name.split('.').pop()
    const filename = `${myProfile.id}/${Math.random().toString(36).substring(2)}.${ext}`

    const { error: uploadError } = await supabase.storage.from('photos').upload(filename, file)
    if (uploadError) {
      console.error('Error uploading:', uploadError)
      throw new Error('Error de Storage: ' + uploadError.message)
    }

    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filename)

    const { count } = await supabase.from('Photos').select('*', { count: 'exact', head: true }).eq('profile_id', myProfile.id)
    const sortOrder = count ? count + 1 : 1

    const { error: insertError } = await supabase.from('Photos').insert({
      id: crypto.randomUUID(), // Por si el ID no se autogenera en BD
      profile_id: myProfile.id,
      photo_url: publicUrl,
      sort_order: sortOrder,
      is_main: sortOrder === 1
    })

    if (insertError) {
      console.error('Error saving photo record:', insertError)
      throw new Error('Error en tabla Photos: ' + insertError.message)
    }

    return publicUrl
  }
}
