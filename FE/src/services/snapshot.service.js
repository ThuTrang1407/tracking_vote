import { supabase } from './supabase'

export const getTimeline = async (
    interval = '15m',
    cursor = null,
    limit = 10
) => {
    const { data, error } = await supabase.rpc(
        'get_vote_snapshots_page',
        {
            p_interval: interval,
            p_cursor: cursor,
            p_limit: limit,
        }
    )

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
        bucketTime: item.bucket_time,
    }))
}