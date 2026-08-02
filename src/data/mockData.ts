import type { Conversation, Profile } from '../types'

export const PROFILES: Profile[] = [
  {
    id: 1,
    name: 'Valentina',
    age: 26,
    bio: 'Arquitecta de día, cocinera italiana de noche 🍝 Amante de los museos, el jazz y los domingos lentos.',
    distance: '3 km',
    job: 'Arquitecta',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop&auto=format',
    ],
    tags: ['Jazz', 'Cocina', 'Viajes'],
  },
  {
    id: 2,
    name: 'Camila',
    age: 24,
    bio: 'Fotógrafa freelance. Si no estoy mirando por el visor, estoy en alguna librería perdida 📚',
    distance: '1 km',
    job: 'Fotógrafa',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=600&h=800&fit=crop&auto=format',
    ],
    tags: ['Fotografía', 'Libros', 'Café'],
  },
  {
    id: 3,
    name: 'Sofía',
    age: 28,
    bio: 'Doctora que cura y baila salsa los fines de semana 💃 Buscando alguien con quien compartir madrugadas de películas.',
    distance: '5 km',
    job: 'Médica',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop&auto=format',
    ],
    tags: ['Salsa', 'Cine', 'Senderismo'],
  },
  {
    id: 4,
    name: 'Isabella',
    age: 25,
    bio: 'Diseñadora UX con obsesión por las plantas 🌿 Colecciono viniles y hago yoga en la azotea.',
    distance: '2 km',
    job: 'Diseñadora UX',
    image: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop&auto=format',
    ],
    tags: ['Diseño', 'Plantas', 'Yoga'],
  },
  {
    id: 5,
    name: 'Daniela',
    age: 27,
    bio: 'Abogada de dia, guitarrista en noches de vino 🍷🎸 Amo los debates, el buen café y los viajes sin itinerario.',
    distance: '8 km',
    job: 'Abogada',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&auto=format',
    ],
    tags: ['Guitarra', 'Vino', 'Debates'],
  },
]

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    profile: PROFILES[0],
    unread: 2,
    messages: [
      { id: 1, text: 'Hola! Me encantó tu perfil 😊', from: 'them', time: '10:24' },
      { id: 2, text: 'Hola Valentina! Gracias 😄 Vi que eres arquitecta, ¿qué tipo de proyectos diseñas?', from: 'me', time: '10:26' },
      { id: 3, text: 'Mainly residencial, pero me encanta el diseño de interiores también ✨', from: 'them', time: '10:28' },
      { id: 4, text: '¿Tienes planes este finde?', from: 'them', time: '10:29' },
    ],
  },
  {
    profile: PROFILES[2],
    unread: 0,
    messages: [
      { id: 1, text: 'Match! 🎉', from: 'them', time: 'Ayer' },
      { id: 2, text: 'Hola Sofía! Qué bueno hacer match 😄', from: 'me', time: 'Ayer' },
    ],
  },
  {
    profile: PROFILES[1],
    unread: 1,
    messages: [
      { id: 1, text: 'Tus fotos son increíbles 📸', from: 'me', time: 'Lun' },
      { id: 2, text: 'Gracias!! Son de mi viaje a Lisboa el año pasado', from: 'them', time: 'Lun' },
    ],
  },
]
