const XLSX = require('xlsx')
const path = require('path')

try {
  const filePath = 'c:\\Presente-App\\Inscriptos.xlsx'
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet)
  
  if (data.length > 0) {
    console.log('HEADERS:', Object.keys(data[0]))
    console.log('FIRST ROW:', JSON.stringify(data[0], null, 2))
  } else {
    console.log('EL ARCHIVO ESTA VACIO')
  }
} catch (e) {
  console.error('ERROR AL LEER EXCEL:', e)
}
