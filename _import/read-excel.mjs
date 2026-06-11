import XLSX from 'xlsx'

const wb = XLSX.readFile('./_import/Gestionale Stampe.xlsx')

console.log('Fogli:', wb.SheetNames)
console.log('---')

for (const name of wb.SheetNames) {
  console.log(`\n=== FOGLIO: ${name} ===`)
  const ws = wb.Sheets[name]
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  data.slice(0, 30).forEach((row, i) => {
    if (row.some(c => c !== '')) console.log(`Riga ${i + 1}:`, row)
  })
}
