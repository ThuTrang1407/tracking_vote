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
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #050505 0%, #111111 65%, #2a1145 100%)',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
            }}
        >
            {/* HEADER */}
            <div
                style={{
                    marginBottom: 25,
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: 28,
                        fontWeight: 800,
                        letterSpacing: 1,
                    }}
                >
                    DASHBOARD
                </h2>
            </div>

            {/* FILTERS */}
            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginBottom: 25,
                }}
            >
                {/* AWARD */}
                <select
                    value={selectedAward}
                    onChange={(e) => setSelectedAward(e.target.value)}
                    disabled={loadingAwards}
                    style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #6b21a8',
                        background: '#18111f',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                    }}
                >
                    {awards.map((award) => (
                        <option key={award.award_id} value={award.award_id}>
                            {award.name}
                        </option>
                    ))}
                </select>

                {/* INTERVAL BUTTONS */}
                {[
                    { value: '15m', label: '15 phút' },
                    { value: '1h', label: '1 giờ' },
                    { value: '6h', label: '6 giờ' },
                    { value: '1d', label: '1 ngày' },
                ].map((item) => (
                    <button
                        key={item.value}
                        onClick={() => setInterval(item.value)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: 10,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: 14,
                            color: '#fff',

                            background: interval === item.value ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' : 'linear-gradient(135deg, #c084fc 0%, #d8b4fe 100%)',

                            boxShadow: interval === item.value ? '0 4px 12px rgba(124,58,237,.45)' : '0 2px 8px rgba(168,85,247,.25)',

                            transition: 'all .25s ease',
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* TABLE */}
            {loading ? (
                <div
                    style={{
                        padding: 40,
                        textAlign: 'center',
                        color: '#c084fc',
                    }}
                >
                    Loading...
                </div>
            ) : (
                <div
                    style={{
                        overflowX: 'auto',
                        borderRadius: 14,
                        border: '1px solid #3b2454',
                        background: 'rgba(15, 10, 20, 0.75)',
                        boxShadow: '0 8px 30px rgba(0,0,0,.35)',
                    }}
                >
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            textAlign: 'center',
                            minWidth: 900,
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background: 'linear-gradient(135deg, #24103a 0%, #3b1760 100%)',
                                }}
                            >
                                <th
                                    style={{
                                        padding: '14px 18px',
                                        textAlign: 'left',
                                        position: 'sticky',
                                        left: 0,
                                        background: '#24103a',
                                        zIndex: 2,
                                        minWidth: 180,
                                        borderBottom: '1px solid #5b2a7d',
                                    }}
                                >
                                    Candidate
                                </th>

                                <th
                                    style={{
                                        padding: '14px 18px',
                                        minWidth: 110,
                                        borderBottom: '1px solid #5b2a7d',
                                    }}
                                >
                                    Live
                                </th>

                                {columns.map((column) => {
                                    const formatted = formatDateTime(column)

                                    return (
                                        <th
                                            key={column}
                                            style={{
                                                padding: '10px 14px',
                                                minWidth: 100,
                                                borderBottom: '1px solid #5b2a7d',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 15,
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {formatted.time}
                                            </div>

                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    opacity: 0.65,
                                                    marginTop: 3,
                                                }}
                                            >
                                                {formatted.date}
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>

                        <tbody>
                            {allCandidates.map((candidate, rowIndex) => (
                                <tr
                                    key={candidate.id}
                                    style={{
                                        background: rowIndex % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(124,58,237,0.06)',
                                    }}
                                >
                                    {/* CANDIDATE */}
                                    <td
                                        style={{
                                            padding: '14px 18px',
                                            textAlign: 'left',
                                            fontWeight: 700,
                                            position: 'sticky',
                                            left: 0,
                                            background: '#120d18',
                                            zIndex: 1,
                                            borderBottom: '1px solid #2c2035',
                                        }}
                                    >
                                        {candidate.name}
                                    </td>

                                    {/* LIVE */}
                                    <td
                                        style={{
                                            padding: '10px 14px',
                                            fontWeight: 800,
                                            color: '#d8b4fe',
                                            borderBottom: '1px solid #2c2035',
                                        }}
                                    >
                                        {liveMap[candidate.id]?.toLocaleString() ?? '-'}
                                    </td>

                                    {/* SNAPSHOTS */}
                                    {columns.map((column, index) => {
                                        const current = tableData[candidate.id]?.[column]

                                        const previousColumn = columns[index + 1]

                                        const previous = previousColumn ? tableData[candidate.id]?.[previousColumn] : null

                                        let change = '-'

                                        if (current != null && previous != null) {
                                            change = current - previous
                                        }

                                        return (
                                            <td
                                                key={column}
                                                style={{
                                                    padding: '10px 14px',
                                                    borderBottom: '1px solid #2c2035',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: 800,
                                                        fontSize: 14,
                                                    }}
                                                >
                                                    {current == null ? '-' : current.toLocaleString()}
                                                </div>

                                                {change !== '-' && (
                                                    <div
                                                        style={{
                                                            marginTop: 4,
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            color: change > 0 ? '#4ade80' : change < 0 ? '#f87171' : '#9ca3af',
                                                        }}
                                                    >
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

            {/* PAGINATION */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 15,
                    marginTop: 25,
                }}
            >
                <button
                    onClick={handlePrevious}
                    disabled={page <= 1 || loading}
                    style={{
                        padding: '9px 18px',
                        borderRadius: 9,
                        border: '1px solid #6b21a8',
                        background: page <= 1 || loading ? '#241c29' : '#3b1760',
                        color: page <= 1 || loading ? '#777' : '#fff',
                        cursor: page <= 1 || loading ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                    }}
                >
                    ← Previous
                </button>

                <span
                    style={{
                        fontWeight: 700,
                        color: '#d8b4fe',
                    }}
                >
                    Page {page}
                </span>

                <button
                    onClick={handleNext}
                    disabled={!nextCursor || loading}
                    style={{
                        padding: '9px 18px',
                        borderRadius: 9,
                        border: '1px solid #6b21a8',
                        background: !nextCursor || loading ? '#241c29' : '#3b1760',
                        color: !nextCursor || loading ? '#777' : '#fff',
                        cursor: !nextCursor || loading ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                    }}
                >
                    Next →
                </button>
            </div>

            {/* FOOTER */}
            <footer
                style={{
                    width: '100%',
                    padding: '18px 30px',
                    marginTop: '30px',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    background: 'rgba(42, 17, 69, 0.35)',
                    borderTop: '1px solid rgba(168, 85, 247, 0.18)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                }}
            >
                <div
                    style={{
                        fontSize: '14px',
                        fontWeight: 600,
                    }}
                >
                    For DongAnhQuynh 🐺
                </div>

                <div
                    style={{
                        marginTop: '4px',
                        fontSize: '13px',
                        opacity: 0.65,
                    }}
                >
                    From Wolfies 💜
                </div>
            </footer>
        </div>
    )
}
