import { supabase } from './supabase'

export const getAwards = async () => {
    const { data, error } = await supabase
        .from('awards')
        .select('id, name, award_id')
        .eq('active', true)
        .order('id', { ascending: true })

    if (error) {
        throw error
    }

    return data || []
}

export const getCandidates = async (awardId) => {
    const { data, error } = await supabase
        .from('candidates')
        .select('candidate_id, name, vote_count')
        .eq('award_id', awardId)
        .order('vote_count', { ascending: false })

    if (error) {
        throw error
    }

    return (data || []).map((item) => ({
        id: item.candidate_id,
        name: item.name,
        voteCount: item.vote_count,
    }))
}