const tzDate = new Date()
const offset = tzDate.getTimezoneOffset()
const today = new Date(tzDate.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]

console.log('Local Time:', new Date().toString())
console.log('Offset (min):', offset)
console.log('Today Calculated:', today)
console.log('Desired ISO:', new Date().toISOString().split('T')[0])
