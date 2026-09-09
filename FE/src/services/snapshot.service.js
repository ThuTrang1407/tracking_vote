import { supabase } from './supabase'

export const getTimeline = async () => {
    const { data, error } = await supabase
        .from('vote_snapshots')
        .select('id, candidate_id, vote_count, snapshot_time')
        .order('snapshot_time', { ascending: false })

    console.log('SUPABASE SNAPSHOTS:', data)
    console.log('SUPABASE ERROR:', error)

    if (error) {
        throw error
    }

    return (data || []).map((item) => ({
        id: item.id,
        candidateId: item.candidate_id,
        voteCount: item.vote_count,
        snapshotTime: item.snapshot_time,
    }))
}