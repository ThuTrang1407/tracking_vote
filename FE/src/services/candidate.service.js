import { supabase } from './supabase'

export const getCandidates = async () => {
    const { data, error } = await supabase
        .from('candidates')
        .select('*')

    console.log('SUPABASE CANDIDATES:', data)
    console.log('SUPABASE CANDIDATES ERROR:', error)

    if (error) {
        throw error
    }

    return (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        voteCount: item.vote_count,
    }))
}