import { supabase } from '../lib/supabase'
import type { AppDataService } from './appDataService'

export const supabaseAppDataService: AppDataService & { cleanupExpiredInteractions?: (profileId: string) => Promise<void> } = {
  async cleanupExpiredInteractions(myProfileId: string) {
    const { data: myEvents } = await supabase
      .from('ProfileEvents')
      .select('event_id')
      .eq('profile_id', myProfileId);
    
    let validPartnerIds = new Set<string>();
    if (myEvents && myEvents.length > 0) {
      const eventIds = myEvents.map((e: any) => e.event_id);
      
      const { data: activeEvents } = await supabase
         .from('Events')
         .select('id, end_datetime, status')
         .in('id', eventIds);

      if (activeEvents && activeEvents.length > 0) {
         const activeEventIds = activeEvents
            .filter((ev: any) => {
               if (ev.status === 'suspendido') return false;
               if (ev.end_datetime && new Date(ev.end_datetime).getTime() <= Date.now()) return false;
               return true;
            })
            .map((ev: any) => ev.id);

         if (activeEventIds.length > 0) {
            const { data: partnerEvents } = await supabase
              .from('ProfileEvents')
              .select('profile_id')
              .in('event_id', activeEventIds);
            
            if (partnerEvents) {
              partnerEvents.forEach((pe: any) => validPartnerIds.add(String(pe.profile_id)));
            }
         }
      }
    }

    // Swipes
    const { data: swipes } = await supabase
      .from('Swipes')
      .select('id, swiper_id, swiped_on_id')
      .or(`swiper_id.eq.${myProfileId},swiped_on_id.eq.${myProfileId}`);

    const swipeIdsToDelete: number[] = [];
    if (swipes) {
      for (const swipe of swipes) {
        const partnerId = String(swipe.swiper_id === myProfileId ? swipe.swiped_on_id : swipe.swiper_id);
        if (!validPartnerIds.has(partnerId)) {
          swipeIdsToDelete.push(swipe.id);
        }
      }
    }

    if (swipeIdsToDelete.length > 0) {
      for(let i=0; i<swipeIdsToDelete.length; i+=100) {
         await supabase.from('Swipes').delete().in('id', swipeIdsToDelete.slice(i, i+100));
      }
    }

    // Matches
    const { data: matches } = await supabase
      .from('Matches')
      .select('id, profile1_id, profile2_id')
      .or(`profile1_id.eq.${myProfileId},profile2_id.eq.${myProfileId}`);

    const matchIdsToDelete: number[] = [];
    if (matches) {
      for (const match of matches) {
        const partnerId = String(match.profile1_id === myProfileId ? match.profile2_id : match.profile1_id);
        if (!validPartnerIds.has(partnerId)) {
          matchIdsToDelete.push(match.id);
        }
      }
    }

    if (matchIdsToDelete.length > 0) {
      for(let i=0; i<matchIdsToDelete.length; i+=100) {
         const chunk = matchIdsToDelete.slice(i, i+100);
         await supabase.from('Messages').delete().in('match_id', chunk);
         await supabase.from('Matches').delete().in('id', chunk);
      }
    }
  },

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
    
    let filteredData = data;
    
    if (session) {
       const { data: myProfile } = await supabase.from('Profiles').select('id').eq('user_id', session.user.id).maybeSingle()
       if (myProfile) {
          if (this.cleanupExpiredInteractions) {
             await this.cleanupExpiredInteractions(myProfile.id);
          }

          // EVENT VISIBILITY LOGIC: Filter by shared active events
          const { data: myEvents } = await supabase
            .from('ProfileEvents')
            .select('event_id')
            .eq('profile_id', myProfile.id);
          
          let validPartnerIds = new Set<string>();
          if (myEvents && myEvents.length > 0) {
            const eventIds = myEvents.map((e: any) => e.event_id);
            
            // Validate which of these events are active
            const { data: activeEvents } = await supabase
               .from('Events')
               .select('id, end_datetime, status')
               .in('id', eventIds);

            if (activeEvents && activeEvents.length > 0) {
               const activeEventIds = activeEvents
                  .filter((ev: any) => {
                     if (ev.status === 'suspendido') return false;
                     if (ev.end_datetime && new Date(ev.end_datetime).getTime() <= Date.now()) return false;
                     return true;
                  })
                  .map((ev: any) => ev.id);
               
               if (activeEventIds.length > 0) {
                 const { data: partnerEvents } = await supabase
                   .from('ProfileEvents')
                   .select('profile_id')
                   .in('event_id', activeEventIds);
                 
                 if (partnerEvents) {
                   partnerEvents.forEach((pe: any) => validPartnerIds.add(String(pe.profile_id)));
                 }
               }
            }
          }

          // Only keep profiles that share an active event
          filteredData = filteredData.filter(p => validPartnerIds.has(String(p.id)));

          // Also remove profiles we already swiped on
          const { data: swipedData } = await supabase.from('Swipes').select('swiped_on_id').eq('swiper_id', myProfile.id)
          if (swipedData && swipedData.length > 0) {
             const swipedIds = new Set(swipedData.map(s => s.swiped_on_id))
             filteredData = filteredData.filter(p => !swipedIds.has(p.id))
          }
       }
    }

    return filteredData.map((p: any) => {
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
        image: images.length > 0 ? images[0] : 'https://placehold.co/600x700?text=Sin+Foto',
        images: images,
        tags: p.tags || [],
      }
    })
  },

  async getConversations() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: myProfile } = await supabase.from('Profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!myProfile) return []

    if (this.cleanupExpiredInteractions) {
       await this.cleanupExpiredInteractions(myProfile.id);
    }

    // Fetch Matches for this user
    const { data: matches, error: matchesError } = await supabase
      .from('Matches')
      .select('*, user1:Profiles!Matches_profile1_id_fkey(*, Photos(*)), user2:Profiles!Matches_profile2_id_fkey(*, Photos(*)), Messages(*)')
      .or(`profile1_id.eq.${myProfile.id},profile2_id.eq.${myProfile.id}`)
      .order('created_at', { ascending: false })

    if (matchesError || !matches) {
      console.error('Error fetching matches:', matchesError)
      return []
    }

    const conversations = []
    for (const match of matches) {
      const isUser1 = match.profile1_id === myProfile.id
      const otherProfileData = isUser1 ? match.user2 : match.user1

      if (!otherProfileData) continue

      let age = 25
      if (otherProfileData.birthdate) {
        const diff = Date.now() - new Date(otherProfileData.birthdate).getTime()
        age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
      }

      const photos = otherProfileData.Photos ? otherProfileData.Photos.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) : []
      const images = photos.map((img: any) => img.photo_url)

      const profile: any = {
        id: otherProfileData.id,
        name: otherProfileData.name || 'Usuario',
        age,
        bio: otherProfileData.bio || '',
        distance: 'Cerca',
        job: '',
        image: images.length > 0 ? images[0] : 'https://placehold.co/600x700?text=Sin+Foto',
        images,
        tags: otherProfileData.tags || [],
      }
      
      const rawMessages = match.Messages || []
      rawMessages.sort((a: any, b: any) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())

      const messages: any[] = rawMessages.map((msg: any) => ({
        id: msg.id,
        text: msg.content,
        from: msg.sender_id === myProfile.id ? 'me' : 'them',
        time: new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: msg.sent_at
      }))

      conversations.push({
        id: match.id,
        profile,
        messages,
        unread: 0 
      })
    }
    return conversations
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
            stats: [{ label: 'Likes', value: '0' }, { label: 'Matches', value: '0' }]
        }
    }

    const photos = data.Photos ? data.Photos.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) : []
    const images = photos.map((img: any) => img.photo_url)

    let age = 25
    if (data.birthdate) {
        const diff = Date.now() - new Date(data.birthdate).getTime()
        age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
    }

    const { count: likesCount } = await supabase.from('Swipes')
      .select('*', { count: 'exact', head: true })
      .eq('swiped_on_id', data.id)
      .eq('swipe_type', 'like');

    const { count: matchesCount } = await supabase.from('Matches')
      .select('*', { count: 'exact', head: true })
      .or(`profile1_id.eq.${data.id},profile2_id.eq.${data.id}`);

    return {
      id: data.id,
      name: data.name || '',
      age,
      birthdate: data.birthdate || undefined,
      gender: data.gender || undefined,
      job: '',
      bio: data.bio || '',
      images,
      tags: data.tags || [],
      stats: [
        { label: 'Likes', value: String(likesCount || 0) }, 
        { label: 'Matches', value: String(matchesCount || 0) }
      ],
    }
  },

  async getMyEvents() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: myProfile } = await supabase.from('Profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!myProfile) return []

    // Asumimos una tabla "ProfileEvents" o similar. 
    // Usaremos "ProfileEvents" (profile_id, event_id) y "Events" (id, name, code)
    const { data: events, error } = await supabase
      .from('ProfileEvents')
      .select('event_id, Events(*)')
      .eq('profile_id', myProfile.id)

    if (error || !events) {
       console.error("Error fetching events:", error)
       return []
    }
    
    return events.map((e: any) => e.Events).filter(Boolean)
  },

  async joinEvent(code: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not logged in' }

    const { data: myProfile } = await supabase.from('Profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!myProfile) return { success: false, error: 'No profile' }

    // Buscar el evento
    const { data: event, error: eventErr } = await supabase.from('Events').select('*').eq('code', code).maybeSingle()
    
    if (eventErr || !event) {
       return { success: false, error: 'Código de evento no válido o evento inexistente' }
    }

    if (event.is_suspended) {
       return { success: false, error: 'Este evento se encuentra suspendido actualmente.' }
    }

    if (event.end_datetime && new Date(event.end_datetime).getTime() <= Date.now()) {
       return { success: false, error: 'Este evento ya ha finalizado.' }
    }

    // Insertar en la tabla de relación
    const { error: insertErr } = await supabase.from('ProfileEvents').insert({
       profile_id: myProfile.id,
       event_id: event.id
    })

    if (insertErr) {
       // Si ya está unido, suele dar error de unicidad. Lo ignoramos o avisamos.
       if (insertErr.code === '23505') {
          return { success: false, error: 'Ya estás en este evento' }
       }
       return { success: false, error: 'Error al unirte al evento: ' + insertErr.message }
    }

    return { success: true }
  },

  async recordSwipe(targetId, action) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { matchId: null }

    // Use our own profile ID to swipe
    const { data: myProfile } = await supabase.from('Profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!myProfile) return { matchId: null }

    const { error, data } = await supabase.from('Swipes').insert({
      id: crypto.randomUUID(),
      swiper_id: myProfile.id,
      swiped_on_id: targetId,
      swipe_type: action
    }).select()

    if (error || !data || data.length === 0) {
      console.error('Error saving swipe:', error)
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: error?.message || 'Fallo silencioso por RLS. Añade permisos a Swipes.' } }))
      return { matchId: null }
    }

    if (action === 'like') {
      const { data: match } = await supabase.from('Swipes')
        .select('*')
        .eq('swiper_id', targetId)
        .eq('swiped_on_id', myProfile.id)
        .eq('swipe_type', 'like')
        .maybeSingle()

      if (match) {
        // Create match
        const { error: matchError, data: matchData } = await supabase.from('Matches').insert({
          id: crypto.randomUUID(),
          profile1_id: myProfile.id,
          profile2_id: targetId,
        }).select()
        if (matchError || !matchData || matchData.length === 0) {
          console.error("Error creating match", matchError)
          window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: matchError?.message || 'Fallo silencioso RLS en Matches' } }))
          return { matchId: null }
        }
        return { matchId: matchData[0].id }
      }
    }
    return { matchId: null }
  },
  
  async sendMessage(matchId: string, text: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: myProfile } = await supabase.from('Profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!myProfile) return false
    
    const { error, data } = await supabase.from('Messages').insert({
       id: crypto.randomUUID(),
       match_id: matchId,
       sender_id: myProfile.id,
       content: text
    }).select()
    
    if (error || !data || data.length === 0) {
       console.error("Error sending message:", error)
       window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: error?.message || 'Fallo silencioso RLS en Messages' } }))
       return false
    }
    return true
  },

  async updateProfile(data) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Ensure profile exists
    let { data: myProfile, error: fetchErr } = await supabase.from('Profiles').select('*').eq('user_id', user.id).maybeSingle()
    
    if (fetchErr) {
      console.error("Error fetching profile:", fetchErr)
    }

    if (!myProfile) {
      const newProfile = {
        id: crypto.randomUUID(),
        user_id: user.id,
        name: data.name || '',
        bio: data.bio || '',
        gender: data.gender || 'other',
        birthdate: data.birthdate || null,
        tags: data.tags || []
      }
      const { error: insertErr, data: inserted } = await supabase.from('Profiles').insert(newProfile).select()
      if (insertErr) {
        console.error('Error insertando perfil:', insertErr)
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error de Perfil', body: insertErr.message } }))
        return false
      }
      if (!inserted || inserted.length === 0) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'Fallo al crear perfil por permisos RLS' } }))
        return false
      }
      return true
    }

    const updateData: any = {}
    if (data.bio !== undefined) updateData.bio = data.bio
    if (data.name !== undefined) updateData.name = data.name
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.birthdate !== undefined) updateData.birthdate = data.birthdate
    if (data.tags !== undefined) updateData.tags = data.tags

    const { error: updateErr, data: updated } = await supabase
      .from('Profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()

    if (updateErr) {
      console.error('Error updating profile:', updateErr)
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: updateErr.message } }))
      return false
    }
    
    if (!updated || updated.length === 0) {
      console.error('Update falló silenciosamente, probable bloqueo RLS')
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error RLS', body: 'Tus datos no se guardaron debido a políticas de seguridad en Supabase.' } }))
      return false
    }
    
    return true
  },

  async uploadPhoto(file: File) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    let { data: myProfile } = await supabase.from('Profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!myProfile) {
      const newProfile = {
        id: crypto.randomUUID(),
        user_id: user.id,
        name: '',
        bio: '',
        gender: 'other'
      }
      const { error: createError, data: inserted } = await supabase.from('Profiles').insert(newProfile).select()
      if (createError) {
        console.error('Error creando tu perfil base: ' + createError.message)
        throw new Error('Error de Perfil: ' + createError.message)
      }
      if (!inserted || inserted.length === 0) {
        throw new Error('Error de Perfil: Fallo silencioso al insertar por políticas de seguridad (RLS).')
      }
      myProfile = { id: inserted[0].id }
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
  },

  async deletePhoto(photoUrl: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Delete record from DB
    const { error: dbError } = await supabase.from('Photos').delete().eq('photo_url', photoUrl)
    if (dbError) {
      console.error('Error deleting photo from DB:', dbError)
      return false
    }

    // Try deleting from storage
    const urlParts = photoUrl.split('/public/photos/')
    if (urlParts.length === 2) {
      const path = urlParts[1]
      await supabase.storage.from('photos').remove([path])
    }
    
    return true
  }
}
