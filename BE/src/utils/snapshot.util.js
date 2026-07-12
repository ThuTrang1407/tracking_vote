function getBucketKey(date, interval) {
  const d = new Date(date);

  switch (interval) {
    case "1h":
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;

    case "6h": {
      const bucket = Math.floor(d.getHours() / 6);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${bucket}`;
    }

    case "1d":
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    default: // 15m
      const minuteBucket = Math.floor(d.getMinutes() / 15);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${minuteBucket}`;
  }
}

function groupByInterval(data, interval) {
  const map = {};

  for (const item of data) {
    const key = getBucketKey(item.snapshotTime, interval);

    // ⚡ quan trọng: luôn giữ snapshot CUỐI CÙNG
    if (
      !map[key] ||
      new Date(item.snapshotTime) >
        new Date(map[key].snapshotTime)
    ) {
      map[key] = item;
    }
  }

  return map;
}

module.exports = {
  getBucketKey,
  groupByInterval,
};