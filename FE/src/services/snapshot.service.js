import { supabase } from './supabase'

export const getTimeline = async (
    awardId,
    interval = '15m',
    cursor = null,
    limit = 10
) => {
    const { data, error } = await supabase.rpc(
        'get_vote_snapshots_page',
        {
            p_award_id: awardId,
            p_interval: interval,
            p_cursor: cursor,
            p_limit: limit,
        }
    )

    console.log('AWARD ID:', awardId)
    console.log('INTERVAL:', interval)
    console.log('SUPABASE SNAPSHOTS:', data)
    console.log('SUPABASE ERROR:', error)

    if (error) {
        throw error
    }

    return (data || []).map((item) => ({
        id: item.id,
        awardId: item.award_id,
        candidateId: item.candidate_id,
        voteCount: item.vote_count,
        snapshotTime: item.snapshot_time,
        bucketTime: item.bucket_time,
    }))
}