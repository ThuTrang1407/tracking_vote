import { useEffect, useMemo, useState } from 'react'
import { getTimeline } from '../services/snapshot.service'
import { getAwards, getCandidates } from '../services/candidate.service'

export default function GaiconDashboard() {
    const [awards, setAwards] = useState([])
    const [selectedAward, setSelectedAward] = useState('')

    const [candidates, setCandidates] = useState([])
    const [liveCandidates, setLiveCandidates] = useState([])
    const [snapshots, setSnapshots] = useState([])

    const [interval, setInterval] = useState('15m')

    const [page, setPage] = useState(1)
    const [cursorStack, setCursorStack] = useState([null])
    const [nextCursor, setNextCursor] = useState(null)

    const [loading, setLoading] = useState(false)
    const [loadingAwards, setLoadingAwards] = useState(true)

    // =========================
    // LOAD AWARDS
    // =========================

    useEffect(() => {
        const loadAwards = async () => {
            try {
                setLoadingAwards(true)

                const data = await getAwards()

                setAwards(Array.isArray(data) ? data : [])

                if (data?.length > 0) {
                    setSelectedAward(data[0].award_id)
                }
            } catch (err) {
                console.error('AWARDS ERROR:', err)
                setAwards([])
            } finally {
                setLoadingAwards(false)
            }
        }

        loadAwards()
    }, [])

    // =========================
    // LOAD CANDIDATES
    // =========================

    const loadCandidates = async () => {
        if (!selectedAward) return

        try {
            const data = await getCandidates(selectedAward)

            const safeData = Array.isArray(data) ? data : []

            setCandidates(safeData)
            setLiveCandidates(safeData)
        } catch (err) {
            console.error('CANDIDATES ERROR:', err)
            setCandidates([])
            setLiveCandidates([])
        }
    }

    // =========================
    // LOAD LIVE
    // =========================

    const loadLive = async () => {
        if (!selectedAward) return

        try {
            const data = await getCandidates(selectedAward)

            setLiveCandidates(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error('LIVE ERROR:', err)
        }
    }

    // =========================
    // LOAD TIMELINE
    // =========================

    const loadTimeline = async (currentCursor = null) => {
        if (!selectedAward) return

        try {
            setLoading(true)

            const data = await getTimeline(selectedAward, interval, currentCursor, 10)

            const safeSnapshots = Array.isArray(data) ? data : []

            setSnapshots(safeSnapshots)

            if (safeSnapshots.length > 0) {
                const oldestSnapshot = safeSnapshots[safeSnapshots.length - 1]

                setNextCursor(oldestSnapshot.bucketTime)
            } else {
                setNextCursor(null)
            }
        } catch (err) {
            console.error('TIMELINE ERROR:', err)

            setSnapshots([])
            setNextCursor(null)
        } finally {
            setLoading(false)
        }
    }

    // =========================
    // WHEN AWARD / INTERVAL CHANGES
    // =========================

    useEffect(() => {
        if (!selectedAward) return

        setPage(1)
        setCursorStack([null])
        setNextCursor(null)

        loadCandidates()
        loadTimeline(null)
    }, [selectedAward, interval])

    // =========================
    // LIVE REFRESH EVERY 30 SEC
    // =========================

    useEffect(() => {
        if (!selectedAward) return

        loadLive()

        const timer = setInterval(() => {
            loadLive()
        }, 30 * 1000)

        return () => clearInterval(timer)
    }, [selectedAward])

    // =========================
    // FORMAT TIME
    // =========================

    const formatDateTime = (time) => {
        const date = new Date(time)

        return {
            date: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,

            time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
        }
    }

    // =========================
    // ALL CANDIDATES
    // =========================

    const allCandidates = useMemo(() => {
        const candidateMap = new Map()

        candidates.forEach((candidate) => {
            candidateMap.set(candidate.id, {
                id: candidate.id,
                name: candidate.name || `Candidate ${candidate.id}`,
            })
        })

        snapshots.forEach((snapshot) => {
            if (!candidateMap.has(snapshot.candidateId)) {
                candidateMap.set(snapshot.candidateId, {
                    id: snapshot.candidateId,
                    name: `Candidate ${snapshot.candidateId}`,
                })
            }
        })

        return Array.from(candidateMap.values()).sort((a, b) => a.id - b.id)
    }, [candidates, snapshots])

    // =========================
    // COLUMNS
    // =========================

    const columns = useMemo(() => {
        return [...new Set(snapshots.map((snapshot) => snapshot.bucketTime))]
    }, [snapshots])

    // =========================
    // TABLE DATA
    // =========================

    const tableData = useMemo(() => {
        const map = {}

        snapshots.forEach((snapshot) => {
            const candidateId = snapshot.candidateId
            const time = snapshot.bucketTime

            if (!map[candidateId]) {
                map[candidateId] = {}
            }

            map[candidateId][time] = snapshot.voteCount
        })

        return map
    }, [snapshots])

    // =========================
    // LIVE MAP
    // =========================

    const liveMap = useMemo(() => {
        const map = {}

        liveCandidates.forEach((candidate) => {
            map[candidate.id] = candidate.voteCount
        })

        return map
    }, [liveCandidates])

    // =========================
    // NEXT
    // =========================

    const handleNext = async () => {
        if (!nextCursor || loading) return

        const newPage = page + 1

        setCursorStack((prev) => [...prev, nextCursor])

        setPage(newPage)

        await loadTimeline(nextCursor)
    }

    // =========================
    // PREVIOUS
    // =========================

    const handlePrevious = async () => {
        if (page <= 1 || loading) return

        const previousPage = page - 1

        const previousCursor = cursorStack[previousPage - 1]

        setPage(previousPage)

        setCursorStack((prev) => prev.slice(0, previousPage))

        await loadTimeline(previousCursor)
    }

    // =========================
    // CURRENT AWARD
    // =========================

    const currentAward = awards.find((award) => award.award_id === selectedAward)

    return (
        <div className="gaicon-dashboard">
            <h1>📊 GAICON DASHBOARD</h1>

            {/* =========================
                FILTER BAR
            ========================= */}

            <div
                style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    marginBottom: '20px',
                }}
            >
                {/* AWARD */}

                <label>
                    Hạng mục:{' '}
                    <select value={selectedAward} onChange={(e) => setSelectedAward(e.target.value)} disabled={loadingAwards}>
                        {awards.map((award) => (
                            <option key={award.award_id} value={award.award_id}>
                                {award.name}
                            </option>
                        ))}
                    </select>
                </label>

                {/* INTERVAL */}

                <label>
                    Interval:{' '}
                    <select value={interval} onChange={(e) => setInterval(e.target.value)}>
                        <option value="15m">15m</option>
                        <option value="1h">1h</option>
                        <option value="6h">6h</option>
                        <option value="1d">1d</option>
                    </select>
                </label>
            </div>

            {currentAward && (
                <div style={{ marginBottom: '10px' }}>
                    <strong>{currentAward.name}</strong>
                </div>
            )}

            {/* =========================
                TABLE
            ========================= */}

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div
                    style={{
                        overflowX: 'auto',
                    }}
                >
                    <table>
                        <thead>
                            <tr>
                                <th>Candidate</th>

                                <th>Live</th>

                                {columns.map((column) => {
                                    const formatted = formatDateTime(column)

                                    return (
                                        <th key={column}>
                                            <div>{formatted.date}</div>
                                            <div>{formatted.time}</div>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>

                        <tbody>
                            {allCandidates.map((candidate) => (
                                <tr key={candidate.id}>
                                    <td>{candidate.name}</td>

                                    <td>{liveMap[candidate.id]?.toLocaleString() ?? '-'}</td>

                                    {columns.map((column, index) => {
                                        const current = tableData[candidate.id]?.[column]

                                        const previousColumn = columns[index + 1]

                                        const previous = previousColumn ? tableData[candidate.id]?.[previousColumn] : null

                                        let change = '-'

                                        if (current != null && previous != null) {
                                            change = current - previous
                                        }

                                        return (
                                            <td key={column}>
                                                <div>{current == null ? '-' : current.toLocaleString()}</div>

                                                {change !== '-' && (
                                                    <div style={{ fontSize: '12px' }}>
                                                        {change > 0 ? '+' : ''}
                                                        {change.toLocaleString()}
                                                    </div>
                                                )}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* =========================
                PAGINATION
            ========================= */}

            <div
                style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    marginTop: '20px',
                }}
            >
                <button onClick={handlePrevious} disabled={page <= 1 || loading}>
                    Previous
                </button>

                <span>Page {page}</span>

                <button onClick={handleNext} disabled={!nextCursor || loading}>
                    Next
                </button>
            </div>
        </div>
    )
}
