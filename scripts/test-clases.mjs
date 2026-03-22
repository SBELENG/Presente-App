const date = new Date('2026-03-22T01:29:29.000Z')
const offset = 180
const adjusted = new Date(date.getTime() - (offset * 60 * 1000))
console.log(adjusted.toISOString().split('T')[0])
