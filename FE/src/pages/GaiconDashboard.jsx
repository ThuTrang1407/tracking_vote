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
    const formatTime = (t) => {
        const d = new Date(t)

        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const hour = String(d.getHours()).padStart(2, '0')
        const minute = String(d.getMinutes()).padStart(2, '0')

        return `${day}/${month} ${hour}:${minute}`
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
        <div style={{ padding: 20 }}>
            <h2>📊 DASHBOARD</h2>

            <select value={interval} onChange={(e) => setInterval(e.target.value)}>
                <option value="15m">15 phút</option>
                <option value="1h">1 giờ</option>
                <option value="6h">6 giờ</option>
                <option value="1d">1 ngày</option>
            </select>

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
                        {columns.map((t) => (
                            <th key={t}>{t}</th>
                        ))}
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
        </div>
    )
}
