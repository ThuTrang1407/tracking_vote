import { useEffect, useMemo, useState } from 'react'
import { getTimeline } from '../services/snapshot.service'
import { getCandidates } from '../services/candidate.service'

export default function GaiconDashboard() {
    const [candidates, setCandidates] = useState([])
    const [snapshots, setSnapshots] = useState([])
    const [interval, setInterval] = useState('15m')

    // =========================
    // LOAD DATA
    // =========================
    useEffect(() => {
        loadData()
    }, [interval])

    const loadData = async () => {
        try {
            const [candRes, snapRes] = await Promise.all([getCandidates(), getTimeline(interval)])

            setCandidates(Array.isArray(candRes) ? candRes : [])

            const safeSnapshots = Array.isArray(snapRes) ? snapRes : snapRes?.data ? snapRes.data : []

            setSnapshots(safeSnapshots)
        } catch (err) {
            console.error('LOAD ERROR:', err)
            setCandidates([])
            setSnapshots([])
        }
    }

    // =========================
    // FORMAT TIME
    // =========================
    const formatDateTime = (t) => {
        const d = new Date(t)

        return {
            date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,

            time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
        }
    }

    // =========================
    // FILTER SNAPSHOTS
    // 15m: chỉ hôm nay + 10 snapshot gần nhất
    // =========================
    const filteredSnapshots = useMemo(() => {
        if (interval !== '15m') {
            return snapshots
        }

        const today = new Date()

        // Chỉ lấy snapshot của hôm nay
        const todaySnapshots = snapshots.filter((s) => {
            const d = new Date(s.snapshotTime)

            return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
        })

        // Lấy 10 mốc thời gian gần nhất
        const latestTimes = [...new Set(todaySnapshots.map((s) => s.snapshotTime))].sort((a, b) => new Date(a) - new Date(b)).slice(-10)

        // Giữ lại tất cả candidate thuộc 10 mốc đó
        return todaySnapshots.filter((s) => latestTimes.includes(s.snapshotTime))
    }, [snapshots, interval])

    // =========================
    // ALL UNIQUE CANDIDATES (từ cả candidates + snapshots)
    // =========================
    const allCandidates = useMemo(() => {
        const candidateMap = new Map()

        // Thêm candidates từ API (có tên)
        candidates.forEach((c) => {
            candidateMap.set(c.id, {
                id: c.id,
                name: c.name || `Candidate ${c.id}`,
            })
        })

        // Thêm tất cả candidateId từ snapshots (nếu chưa có)
        filteredSnapshots.forEach((snap) => {
            if (!candidateMap.has(snap.candidateId)) {
                candidateMap.set(snap.candidateId, {
                    id: snap.candidateId,
                    name: `Candidate ${snap.candidateId}`,
                })
            }
        })

        return Array.from(candidateMap.values()).sort((a, b) => a.id - b.id)
    }, [candidates, filteredSnapshots])

    // =========================
    // COLUMNS (TIME)
    // =========================
    const columns = useMemo(() => {
        return [...new Set(filteredSnapshots.map((s) => formatTime(s.snapshotTime)))]
    }, [filteredSnapshots])

    // =========================
    // PIVOT DATA
    // =========================
    const tableData = useMemo(() => {
        const map = {}

        filteredSnapshots.forEach((snap) => {
            const time = formatTime(snap.snapshotTime)
            const candidateId = snap.candidateId

            if (!map[candidateId]) {
                map[candidateId] = {}
            }

            map[candidateId][time] = snap.voteCount
        })

        return map
    }, [filteredSnapshots])

    // =========================
    // RENDER
    // =========================
    return (
        <div
            style={{
                // padding: '0 20px',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #050505 0%, #111111 65%, #2a1145 100%)',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <h2>DASHBOARD</h2>

            <div
                style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 20,
                    flexWrap: 'wrap',
                }}
            >
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

            <table
                border="1"
                cellPadding="8"
                style={{
                    width: '100%',
                    marginTop: 20,
                    borderCollapse: 'collapse',
                    textAlign: 'center',
                }}
            >
                <thead>
                    <tr>
                        <th>Candidate</th>
                        {columns.map((t) => {
                            const { date, time } = formatDateTime(t)

                            return (
                                <th key={t}>
                                    <div
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {time}
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 11,
                                            opacity: 0.7,
                                            marginTop: 3,
                                        }}
                                    >
                                        {date}
                                    </div>
                                </th>
                            )
                        })}
                    </tr>
                </thead>

                <tbody>
                    {allCandidates.map((c) => (
                        <tr key={c.id}>
                            <td style={{ fontWeight: 'bold' }}>{c.name}</td>

                            {columns.map((time, index) => {
                                const value = tableData[c.id]?.[time]

                                let gap = null

                                if (index > 0) {
                                    const prevTime = columns[index - 1]
                                    const prevValue = tableData[c.id]?.[prevTime]

                                    if (value !== undefined && prevValue !== undefined) {
                                        gap = value - prevValue
                                    }
                                }

                                return (
                                    <td key={time}>
                                        {value !== undefined ? (
                                            <>
                                                <div
                                                    style={{
                                                        fontWeight: 'bold',
                                                        fontSize: 15,
                                                    }}
                                                >
                                                    {value.toLocaleString()}
                                                </div>

                                                {gap !== null && (
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            color: gap >= 0 ? 'green' : 'red',
                                                        }}
                                                    >
                                                        {gap >= 0 ? '+' : ''}
                                                        {gap.toLocaleString()}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <footer
                style={{
                    marginTop: 'auto',
                    background: '#000',
                    color: '#fff',
                    textAlign: 'center',
                    padding: '20px 0',
                }}
            >
                <div
                    style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                    }}
                >
                    For DongAnhQuynh 🐺
                </div>

                <div
                    style={{
                        marginTop: 6,
                        fontSize: 14,
                        opacity: 0.8,
                    }}
                >
                    From Wolfies 💜
                </div>
            </footer>
        </div>
    )
}
