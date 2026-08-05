const prisma = require('../config/prisma')
const { fetchWeChoiceVotes } = require('./wechoice.service')

function getRounded5MinTime(date) {
    const ms = 1000 * 60 * 5
    return new Date(Math.floor(date.getTime() / ms) * ms)
}

async function updateSnapshot() {
    console.log('📥 Fetching WeChoice data...')

    const data = await fetchWeChoiceVotes()

    const now = getRounded5MinTime(new Date())

    // Kiểm tra đã có snapshot ở mốc thời gian này chưa
    const existed = await prisma.voteSnapshot.findFirst({
        where: {
            snapshotTime: now,
        },
    })

    if (existed) {
        console.log('⏭ Snapshot already exists, skip.')
        return []
    }

    for (const item of data) {
        await prisma.candidate.upsert({
            where: { id: item.id },
            update: {
                voteCount: item.voteCount,
            },
            create: {
                id: item.id,
                voteCount: item.voteCount,
            },
        })

        await prisma.voteSnapshot.create({
            data: {
                candidateId: item.id,
                voteCount: item.voteCount,
                snapshotTime: now,
            },
        })
    }

    console.log(`✅ Snapshot saved: ${data.length}`)

    return data
}

module.exports = {
    updateSnapshot,
}
