/**
 * Excel Importer Service
 * Handles parsing of season-based Excel files
 *
 * Structure:
 * - Monthly tabs (Xullo, Agosto, ...) → ALL EXPENSES
 * - One "Ingresos" tab → ALL INCOME, grouped by month vertically:
 *     2 empty rows → month name row (e.g. "XULLO") → 2 empty rows →
 *     header row (data, concepto, base, ive, total, cobrado) →
 *     data rows → TOTAL row → repeat for next month
 * - "Extraescolares" tab → SKIP (manual entry)
 */

import * as XLSX from 'xlsx'
import { UNCATEGORIZED_CATEGORY_ID } from 'src/types'
import { logger } from 'src/utils/logger'

// === TYPES ===

export interface ParsedMonth {
  monthName: string
  calendarMonth: number // 1-12
  calendarYear: number
  type: 'income' | 'expense'
  sourceSheet: string
  rows: ParsedRow[]
  enabled: boolean
}

export interface ParsedRow {
  rowNumber: number
  date: string
  concepto: string
  amount: number       // Importe total
  base: number | null  // Base imponible
  taxRate: number | null // Tipo IVA/IVE (%)
  taxAmount: number | null // Importe IVA/IVE
  paymentMethod: string  // Forma de cobro/pago
  paidDate: string       // Fecha real de cobro/pago
  dueDate: string        // Fecha de vencimiento
  reference: string      // Referencia
  invoiceNumber: string  // Nº factura
  notes: string          // Notas
  // Mapping - assigned by user in step 3
  type: 'income' | 'expense'
  categoryId: string | null
  teamId: string | null
  projectId: string | null
}

export interface SeasonConfig {
  startYear: number
  endYear: number
}

export interface ColumnMapping {
  // Core fields
  date: string | null           // Fecha de la transacción
  concepto: string | null       // Concepto / descripción
  amount: string | null         // Importe total
  // Tax breakdown
  base: string | null           // Base imponible
  taxRate: string | null        // Porcentaje IVA/IVE
  taxAmount: string | null      // Importe IVA/IVE
  // Payment
  paymentMethod: string | null  // Forma de cobro/pago
  paidDate: string | null       // Fecha real de cobro/pago
  dueDate: string | null        // Fecha de vencimiento
  // Reference
  reference: string | null      // Referencia
  invoiceNumber: string | null  // Nº factura
  notes: string | null          // Notas
}

/** Backward-compatible helper to create a default empty mapping */
export function createEmptyMapping(): ColumnMapping {
  return {
    date: null, concepto: null, amount: null,
    base: null, taxRate: null, taxAmount: null,
    paymentMethod: null, paidDate: null, dueDate: null,
    reference: null, invoiceNumber: null, notes: null
  }
}

export interface ConceptoGroup {
  concepto: string
  count: number
  totalAmount: number
  avgAmount: number
  type: 'income' | 'expense'
  categoryId: string | null
  teamId: string | null
  projectId: string | null
  sampleRows: ParsedRow[]
}

export interface ImportValidation {
  totalRows: number
  validRows: number
  unmappedConceptos: string[]
  errors: ImportError[]
}

export interface ImportError {
  source: string
  row: number
  field: string
  message: string
}

export interface SheetAnalysis {
  name: string
  detectedAs: 'expense_month' | 'income' | 'skip' | 'unknown'
  monthName?: string
  rowCount: number
}

export interface SheetPreview {
  sheetName: string
  headers: string[]
  sampleRows: string[][]
}

// === MONTH DETECTION ===

const MONTH_MAP: Record<string, number> = {
  // Galician
  'xaneiro': 1, 'febreiro': 2, 'marzo': 3, 'abril': 4,
  'maio': 5, 'xuño': 6, 'xullo': 7, 'agosto': 8,
  'setembro': 9, 'outubro': 10, 'novembro': 11, 'decembro': 12,
  // Spanish
  'enero': 1, 'febrero': 2, 'mayo': 5, 'junio': 6,
  'julio': 7, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12,
  // Short
  'xan': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'mai': 5,
  'xuñ': 6, 'xul': 7, 'ago': 8, 'set': 9, 'sep': 9,
  'out': 10, 'oct': 10, 'nov': 11, 'dec': 12, 'dic': 12,
  'ene': 1, 'jun': 6, 'jul': 7
}

const INCOME_TAB_NAMES = ['ingresos', 'ingresos', 'income', 'cobros']
const SKIP_TAB_NAMES = ['extraescolares', 'extra', 'resumen', 'total', 'totales', 'summary', 'grafico', 'chart', 'hoja']

const PAYMENT_METHOD_MAP: Record<string, string> = {
  'transferencia': 'bank_transfer', 'transfer': 'bank_transfer', 'transf': 'bank_transfer',
  'banco': 'bank_transfer', 'efectivo': 'cash', 'metalico': 'cash', 'metálico': 'cash',
  'tarjeta': 'card', 'tarx': 'card', 'cheque': 'check',
  'domiciliacion': 'direct_debit', 'domiciliación': 'direct_debit', 'recibo': 'direct_debit',
  'bizum': 'other', 'paypal': 'other'
}

// === MAIN CLASS ===

export class ExcelImporter {
  private workbook: XLSX.WorkBook | null = null
  private sheetAnalysis: SheetAnalysis[] = []
  private parsedMonths: ParsedMonth[] = []
  private seasonConfig: SeasonConfig = { startYear: 2024, endYear: 2025 }
  private expenseColumnMapping: ColumnMapping = createEmptyMapping()
  private incomeColumnMapping: ColumnMapping = createEmptyMapping()
  private conceptoGroups: ConceptoGroup[] = []

  // =====================
  // STEP 1: Parse file
  // =====================

  async parseFile(file: File): Promise<SheetAnalysis[]> {
    const buffer = await file.arrayBuffer()
    this.workbook = XLSX.read(buffer, { type: 'array', cellDates: true, dateNF: 'dd/mm/yyyy' })

    this.sheetAnalysis = this.workbook.SheetNames.map(name => this.analyzeSheet(name))
    this.autoDetectSeason()
    this.autoDetectExpenseColumns()
    this.autoDetectIncomeColumns()

    return this.sheetAnalysis
  }

  private analyzeSheet(name: string): SheetAnalysis {
    const norm = this.normalize(name)
    logger.log('[ExcelImporter] analyzeSheet:', { name, norm })

    // Check if income tab
    if (INCOME_TAB_NAMES.some(n => norm.includes(n))) {
      logger.log('[ExcelImporter] → detected as INCOME')
      return { name, detectedAs: 'income', rowCount: this.countDataRows(name) }
    }

    // Check if skip tab
    if (SKIP_TAB_NAMES.some(n => norm.includes(n))) {
      logger.log('[ExcelImporter] → detected as SKIP')
      return { name, detectedAs: 'skip', rowCount: 0 }
    }

    // Check if month name
    const month = this.detectMonth(norm)
    logger.log('[ExcelImporter] → detectMonth result:', month)
    if (month !== null) {
      logger.log('[ExcelImporter] → detected as EXPENSE_MONTH')
      return {
        name,
        detectedAs: 'expense_month',
        monthName: name,
        rowCount: this.countDataRows(name)
      }
    }

    logger.log('[ExcelImporter] → detected as UNKNOWN')
    return { name, detectedAs: 'unknown', rowCount: this.countDataRows(name) }
  }

  private countDataRows(sheetName: string): number {
    if (!this.workbook) return 0
    const sheet = this.workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet, { raw: false })
    return data.length
  }

  private autoDetectSeason() {
    // Look at expense month tabs to figure out the season
    const monthTabs = this.sheetAnalysis.filter(s => s.detectedAs === 'expense_month')
    for (const tab of monthTabs) {
      const month = this.detectMonth(this.normalize(tab.name))
      if (month !== null) {
        // Try 4-digit year first
        const year4Match = tab.name.match(/(\d{4})/)
        if (year4Match) {
          const year = parseInt(year4Match[1])
          if (month >= 7) {
            this.seasonConfig = { startYear: year, endYear: year + 1 }
          } else {
            this.seasonConfig = { startYear: year - 1, endYear: year }
          }
          return
        }

        // Try 2-digit year in format MM-YY or MM/YY
        const year2Match = tab.name.match(/\d{1,2}[-/](\d{2})$/)
        if (year2Match) {
          const year = 2000 + parseInt(year2Match[1])
          if (month >= 7) {
            this.seasonConfig = { startYear: year, endYear: year + 1 }
          } else {
            this.seasonConfig = { startYear: year - 1, endYear: year }
          }
          return
        }
      }
    }
    // Default: current season
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    if (currentMonth >= 7) {
      this.seasonConfig = { startYear: now.getFullYear(), endYear: now.getFullYear() + 1 }
    } else {
      this.seasonConfig = { startYear: now.getFullYear() - 1, endYear: now.getFullYear() }
    }
  }

  private autoDetectExpenseColumns() {
    if (!this.workbook) return
    // Find first expense month tab and read its headers
    const expenseTab = this.sheetAnalysis.find(s => s.detectedAs === 'expense_month')
    if (!expenseTab) return

    const sheet = this.workbook.Sheets[expenseTab.name]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false })

    // Strategy 1: Find header row with mostly non-numeric text cells
    for (const row of rows) {
      const arr = row as unknown[]
      const nonEmpty = arr.filter(v => v != null && String(v).trim().length > 0)
      if (nonEmpty.length >= 3) {
        const textCount = nonEmpty.filter(v => {
          const s = String(v).trim()
          return isNaN(Number(s)) && !this.looksLikeDate(s)
        }).length
        if (textCount >= 2) {
          const headers = arr.map(v => v != null ? String(v).trim() : '')
          this.mapColumns(headers)
          logger.log('[ExcelImporter] Auto-detected headers:', headers.filter(h => h))
          return
        }
      }
    }

    // Strategy 2: Find row with known keywords
    for (const row of rows) {
      const arr = row as unknown[]
      const joined = arr.map(v => String(v || '').toLowerCase()).join(' ')
      if (joined.includes('concepto') || joined.includes('importe') || joined.includes('base') || joined.includes('data') || joined.includes('fecha')) {
        const headers = arr.map(v => v != null ? String(v).trim() : '')
        this.mapColumns(headers)
        logger.log('[ExcelImporter] Auto-detected headers (keyword match):', headers.filter(h => h))
        return
      }
    }

    logger.warn('[ExcelImporter] Could not auto-detect expense columns. First 5 rows:', rows.slice(0, 5))
  }

  private autoDetectIncomeColumns() {
    if (!this.workbook) return
    const incomeTab = this.sheetAnalysis.find(s => s.detectedAs === 'income')
    if (!incomeTab) return

    const sheet = this.workbook.Sheets[incomeTab.name]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false })

    for (const row of rows) {
      const arr = row as unknown[]
      const nonEmpty = arr.filter(v => v != null && String(v).trim().length > 0)
      if (nonEmpty.length >= 3) {
        const textCount = nonEmpty.filter(v => {
          const s = String(v).trim()
          return isNaN(Number(s)) && !this.looksLikeDate(s)
        }).length
        if (textCount >= 2) {
          const headers = arr.map(v => v != null ? String(v).trim() : '')
          this.mapColumns(headers, this.incomeColumnMapping)
          logger.log('[ExcelImporter] Auto-detected income headers:', headers.filter(h => h))
          return
        }
      }
    }

    // Fallback: keyword match
    for (const row of rows) {
      const arr = row as unknown[]
      const joined = arr.map(v => String(v || '').toLowerCase()).join(' ')
      if (joined.includes('concepto') || joined.includes('total') || joined.includes('base') || joined.includes('data') || joined.includes('fecha')) {
        const headers = arr.map(v => v != null ? String(v).trim() : '')
        this.mapColumns(headers, this.incomeColumnMapping)
        logger.log('[ExcelImporter] Auto-detected income headers (keyword):', headers.filter(h => h))
        return
      }
    }
  }

  private mapColumns(headers: string[], target: ColumnMapping = this.expenseColumnMapping) {
    for (let i = 0; i < headers.length; i++) {
      const h = this.normalize(headers[i])
      const original = headers[i]
      if (!original) continue

      // Date
      if (!target.date && (h.includes('data') || h === 'fecha' || h === 'date')) {
        target.date = original
      }
      // Description
      else if (!target.concepto && (h.includes('concepto') || h.includes('descripcion') || h.includes('detalle'))) {
        target.concepto = original
      }
      // Base amount
      else if (!target.base && (h === 'base' || h.includes('base imponible') || h.includes('base imp'))) {
        target.base = original
      }
      // Tax rate
      else if (!target.taxRate && (h.includes('tipo iva') || h.includes('tipo ive') || h.includes('% iva') || h.includes('% ive'))) {
        target.taxRate = original
      }
      // Tax amount (IVA/IVE)
      else if (!target.taxAmount && (h.includes('ive') || h.includes('iva')) && !h.includes('tipo') && !h.includes('%')) {
        target.taxAmount = original
      }
      // Total amount
      else if (!target.amount && (h.includes('importe') || h === 'total' || h.includes('import'))) {
        target.amount = original
      }
      // Paid date — prioritize "pagado" or "cobrado" as date
      else if (!target.paidDate && (h.includes('pagado') || h.includes('cobrado') || h.includes('fecha pago') || h.includes('fecha cobro'))) {
        target.paidDate = original
      }
      // Payment method — "forma de cobro", "f. cobro", "forma pago"
      else if (!target.paymentMethod && (h.includes('forma') || h.includes('f.') || h.includes('metodo') || h.includes('método'))) {
        target.paymentMethod = original
      }
      // Due date
      else if (!target.dueDate && (h.includes('vencimiento') || h.includes('vto'))) {
        target.dueDate = original
      }
      // Reference
      else if (!target.reference && (h.includes('referencia') || h.includes('ref'))) {
        target.reference = original
      }
      // Invoice number
      else if (!target.invoiceNumber && (h.includes('factura') || h.includes('nº') || h.includes('numero'))) {
        target.invoiceNumber = original
      }
      // Notes
      else if (!target.notes && (h.includes('nota') || h.includes('observ') || h.includes('comentario'))) {
        target.notes = original
      }
    }
  }

  // =====================
  // STEP 2: Process sheets
  // =====================

  processSheets(): ParsedMonth[] {
    if (!this.workbook) return []
    this.parsedMonths = []

    const expenseMonthTabs = this.sheetAnalysis.filter(a => a.detectedAs === 'expense_month')
    const incomeTabs = this.sheetAnalysis.filter(a => a.detectedAs === 'income')
    logger.log('[ExcelImporter] processSheets - Found expense_month tabs:', expenseMonthTabs.map(t => t.name))
    logger.log('[ExcelImporter] processSheets - Found income tabs:', incomeTabs.map(t => t.name))

    // Process expense month tabs
    for (const analysis of this.sheetAnalysis) {
      if (analysis.detectedAs === 'expense_month') {
        this.processExpenseMonthTab(analysis.name)
      }
    }

    // Process income tab
    for (const analysis of this.sheetAnalysis) {
      if (analysis.detectedAs === 'income') {
        this.processIncomeTab(analysis.name)
      }
    }

    // Sort by season order (Jul=0, Aug=1, ..., Jun=11), expenses first within same month
    const seasonOrder = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]
    this.parsedMonths.sort((a, b) => {
      const orderA = seasonOrder.indexOf(a.calendarMonth)
      const orderB = seasonOrder.indexOf(b.calendarMonth)
      if (orderA !== orderB) return orderA - orderB
      // expenses before income within same month
      return a.type === 'expense' ? -1 : 1
    })

    this.buildConceptoGroups()
    return this.parsedMonths
  }

  private processExpenseMonthTab(sheetName: string) {
    if (!this.workbook) return
    logger.log('[ExcelImporter] processExpenseMonthTab:', sheetName)

    const month = this.detectMonth(this.normalize(sheetName))
    logger.log('[ExcelImporter] processExpenseMonthTab - detected month:', month)
    if (month === null) return

    // Try to extract year from the sheet name (e.g. "04-23" → 2023, "07-2022" → 2022)
    let calendarYear = month >= 7 ? this.seasonConfig.startYear : this.seasonConfig.endYear
    const year2Match = sheetName.match(/[-/](\d{2})$/)
    const year4Match = sheetName.match(/(\d{4})/)
    if (year4Match) {
      calendarYear = parseInt(year4Match[1])
    } else if (year2Match) {
      calendarYear = 2000 + parseInt(year2Match[1])
    }

    const sheet = this.workbook.Sheets[sheetName]
    // Read as array of arrays to handle non-standard header positions
    // Use raw: true to get actual cell values (numbers as numbers, not formatted strings)
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true })

    // Find header row - look for row containing our expected header keywords
    let headerRowIdx = -1
    const headerMapping: ColumnMapping = createEmptyMapping()

    for (let ri = 0; ri < Math.min(rawRows.length, 10); ri++) {
      const cells = (rawRows[ri] as unknown[]).map(v => v != null ? String(v).trim() : '')
      const normalized = cells.map(c => this.normalize(c))
      
      // Check if this row contains header keywords
      const hasConcepto = normalized.some(n => n.includes('concepto') || n.includes('descripcion'))
      const hasAmount = normalized.some(n => n.includes('importe') || n === 'total')
      
      if (hasConcepto || hasAmount) {
        headerRowIdx = ri
        // Build column index mapping
        for (let ci = 0; ci < cells.length; ci++) {
          const h = normalized[ci]
          if (!h) continue
          
          if (h.includes('data') || h === 'fecha' || h === 'date') headerMapping.date = String(ci)
          else if (h.includes('concepto') || h.includes('descripcion')) headerMapping.concepto = String(ci)
          else if (h === 'base' || h.includes('base imponible')) headerMapping.base = String(ci)
          else if (h.includes('tipo iva') || h.includes('tipo ive') || h.includes('% iva')) headerMapping.taxRate = String(ci)
          else if ((h.includes('ive') || h.includes('iva')) && !h.includes('tipo') && !h.includes('%')) headerMapping.taxAmount = String(ci)
          else if (h.includes('importe') || h === 'total') headerMapping.amount = String(ci)
          else if (h.includes('pagado') || h.includes('cobrado') || h.includes('fecha pago')) headerMapping.paidDate = String(ci)
          else if (h.includes('forma') || h.includes('f.') || h.includes('metodo')) headerMapping.paymentMethod = String(ci)
        }
        logger.log('[ExcelImporter] Found header row at index:', ri, 'mapping:', headerMapping)
        break
      }
    }

    if (headerRowIdx === -1) {
      logger.warn('[ExcelImporter] Could not find header row in sheet:', sheetName)
      return
    }

    const rows: ParsedRow[] = []

    // Process data rows (starting after header)
    for (let ri = headerRowIdx + 1; ri < rawRows.length; ri++) {
      // Keep raw values to preserve numbers
      const rawCells = rawRows[ri] as unknown[]
      const row = this.extractRowFromArrayRaw(rawCells, ri + 1, headerMapping, month, calendarYear)
      if (row) {
        row.type = 'expense'
        rows.push(row)
      }
    }

    logger.log('[ExcelImporter] processExpenseMonthTab - valid rows extracted:', rows.length)

    if (rows.length > 0) {
      this.parsedMonths.push({
        monthName: sheetName,
        calendarMonth: month,
        calendarYear,
        type: 'expense',
        sourceSheet: sheetName,
        rows,
        enabled: true
      })
    }
  }

  private processIncomeTab(sheetName: string) {
    if (!this.workbook) return

    const sheet = this.workbook.Sheets[sheetName]
    // Read as array of arrays to parse section by section
    // Use raw: true to get actual cell values (numbers as numbers)
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true })

    let currentMonth: number | null = null
    let currentYear: number | null = null
    let currentMonthName = ''
    let headers: string[] = []
    let headerMapping: ColumnMapping = createEmptyMapping()
    let dataRows: ParsedRow[] = []
    let rowIdx = 0

    for (const rawRow of rawRows) {
      rowIdx++
      const rawCells = rawRow as unknown[]
      const cells = rawCells.map(v => v != null ? String(v).trim() : '')
      const nonEmpty = cells.filter(c => c.length > 0)

      // Skip empty rows
      if (nonEmpty.length === 0) continue

      // Check if this is a month title row (single non-empty cell with a month name)
      if (nonEmpty.length === 1 || (nonEmpty.length <= 2 && !headers.length)) {
        const firstNonEmpty = nonEmpty[0]
        const norm = this.normalize(firstNonEmpty)

        // Check for TOTAL row → save current month and reset
        if (norm.startsWith('total')) {
          if (currentMonth !== null && dataRows.length > 0 && currentYear !== null) {
            this.parsedMonths.push({
              monthName: `${currentMonthName} (Ingresos)`,
              calendarMonth: currentMonth,
              calendarYear: currentYear,
              type: 'income',
              sourceSheet: sheetName,
              rows: [...dataRows],
              enabled: true
            })
          }
          dataRows = []
          continue
        }

        // Check for month name
        const detected = this.detectMonth(norm)
        if (detected !== null) {
          // Save previous month if exists
          if (currentMonth !== null && dataRows.length > 0 && currentYear !== null) {
            this.parsedMonths.push({
              monthName: `${currentMonthName} (Ingresos)`,
              calendarMonth: currentMonth,
              calendarYear: currentYear,
              type: 'income',
              sourceSheet: sheetName,
              rows: [...dataRows],
              enabled: true
            })
          }

          currentMonth = detected
          currentYear = detected >= 7 ? this.seasonConfig.startYear : this.seasonConfig.endYear
          currentMonthName = firstNonEmpty
          headers = []
          dataRows = []
          continue
        }
      }

      // Check if this is a header row (multiple text cells, looks like column names)
      if (nonEmpty.length >= 3 && currentMonth !== null) {
        const looksLikeHeader = nonEmpty.some(c => {
          const n = this.normalize(c)
          return n.includes('concepto') || n.includes('data') || n.includes('base') ||
                 n.includes('total') || n.includes('importe') || n.includes('cobrado')
        })

        if (looksLikeHeader) {
          headers = cells
          headerMapping = createEmptyMapping()
          // Map headers for this section using column indices
          for (let ci = 0; ci < cells.length; ci++) {
            if (!cells[ci]) continue
            const h = this.normalize(cells[ci])
            if (h.includes('data') || h.includes('fecha')) headerMapping.date = String(ci)
            else if (h.includes('concepto') || h.includes('descripcion')) headerMapping.concepto = String(ci)
            else if (h === 'base' || h.includes('base')) headerMapping.base = String(ci)
            else if (h.includes('tipo iva') || h.includes('tipo ive') || h.includes('% iva') || h.includes('% ive')) headerMapping.taxRate = String(ci)
            else if (h.includes('ive') || h.includes('iva')) headerMapping.taxAmount = String(ci)
            else if (h.includes('total') || h.includes('importe')) headerMapping.amount = String(ci)
            else if ((h.includes('cobrado') || h.includes('pagado') || h.includes('fecha pago') || h.includes('fecha cobro')) && !headerMapping.paidDate) headerMapping.paidDate = String(ci)
            else if (h.includes('forma') || h.includes('f.') || h.includes('metodo')) headerMapping.paymentMethod = String(ci)
            else if (h.includes('referencia') || h.includes('ref')) headerMapping.reference = String(ci)
            else if (h.includes('factura') || h.includes('nº')) headerMapping.invoiceNumber = String(ci)
            else if (h.includes('nota') || h.includes('observ')) headerMapping.notes = String(ci)
          }
          continue
        }
      }

      // Data row - if we have headers and a current month
      if (currentMonth !== null && headers.length > 0 && currentYear !== null) {
        const row = this.extractRowFromArrayRaw(rawCells, rowIdx, headerMapping, currentMonth, currentYear)
        if (row) {
          row.type = 'income'
          dataRows.push(row)
        }
      }
    }

    // Save last month if not yet saved
    if (currentMonth !== null && dataRows.length > 0 && currentYear !== null) {
      this.parsedMonths.push({
        monthName: `${currentMonthName} (Ingresos)`,
        calendarMonth: currentMonth,
        calendarYear: currentYear,
        type: 'income',
        sourceSheet: sheetName,
        rows: [...dataRows],
        enabled: true
      })
    }
  }

  /**
   * Extract a row from key-value record (expense tabs)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private extractRow(raw: Record<string, unknown>, rowNum: number, mapping: ColumnMapping, type: 'income' | 'expense', month: number, year: number): ParsedRow | null {
    const concepto = mapping.concepto ? String(raw[mapping.concepto] || '').trim() : ''
    if (!concepto) return null

    // Skip total rows
    if (this.normalize(concepto).startsWith('total')) return null

    const amountStr = mapping.amount ? String(raw[mapping.amount] || '0') : '0'
    const amount = this.parseNumber(amountStr)
    if (amount === 0) return null

    return {
      rowNumber: rowNum,
      date: mapping.date ? String(raw[mapping.date] || '') : '',
      concepto,
      amount: Math.abs(amount),
      base: mapping.base ? this.parseNumber(String(raw[mapping.base] || '')) || null : null,
      taxRate: mapping.taxRate ? this.parseNumber(String(raw[mapping.taxRate] || '')) || null : null,
      taxAmount: mapping.taxAmount ? this.parseNumber(String(raw[mapping.taxAmount] || '')) || null : null,
      paymentMethod: mapping.paymentMethod ? String(raw[mapping.paymentMethod] || '') : '',
      paidDate: mapping.paidDate ? String(raw[mapping.paidDate] || '') : '',
      dueDate: mapping.dueDate ? String(raw[mapping.dueDate] || '') : '',
      reference: mapping.reference ? String(raw[mapping.reference] || '') : '',
      invoiceNumber: mapping.invoiceNumber ? String(raw[mapping.invoiceNumber] || '') : '',
      notes: mapping.notes ? String(raw[mapping.notes] || '') : '',
      type,
      categoryId: null,
      teamId: null,
      projectId: null
    }
  }

  /**
   * Extract a row from array of cells (income tab)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private extractRowFromArray(cells: string[], rowNum: number, mapping: ColumnMapping, month: number, year: number): ParsedRow | null {
    const conceptoIdx = mapping.concepto ? parseInt(mapping.concepto) : -1
    const amountIdx = mapping.amount ? parseInt(mapping.amount) : -1

    if (conceptoIdx < 0 || amountIdx < 0) return null

    const concepto = (cells[conceptoIdx] || '').trim()
    if (!concepto) return null
    if (this.normalize(concepto).startsWith('total')) return null

    const rawAmountValue = cells[amountIdx]
    logger.log('[ExcelImporter] extractRowFromArray - raw amount value:', rawAmountValue, 'type:', typeof rawAmountValue)
    const amount = this.parseNumber(rawAmountValue)
    logger.log('[ExcelImporter] extractRowFromArray - parsed amount:', amount)
    if (amount === 0) return null

    const getIdx = (val: string | null) => val ? parseInt(val) : -1
    const getStr = (idx: number) => idx >= 0 ? String(cells[idx] || '') : ''
    const getNum = (idx: number) => idx >= 0 ? this.parseNumber(cells[idx]) || null : null

    return {
      rowNumber: rowNum,
      date: getStr(getIdx(mapping.date)),
      concepto,
      amount: Math.abs(amount),
      base: getNum(getIdx(mapping.base)),
      taxRate: getNum(getIdx(mapping.taxRate)),
      taxAmount: getNum(getIdx(mapping.taxAmount)),
      paymentMethod: getStr(getIdx(mapping.paymentMethod)),
      paidDate: getStr(getIdx(mapping.paidDate)),
      dueDate: getStr(getIdx(mapping.dueDate)),
      reference: getStr(getIdx(mapping.reference)),
      invoiceNumber: getStr(getIdx(mapping.invoiceNumber)),
      notes: getStr(getIdx(mapping.notes)),
      type: 'income',
      categoryId: null,
      teamId: null,
      projectId: null
    }
  }

  /**
   * Extract a row from raw array of cells (preserving numbers)
   * Used for expense tabs where we need accurate numeric values
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private extractRowFromArrayRaw(rawCells: unknown[], rowNum: number, mapping: ColumnMapping, month: number, year: number): ParsedRow | null {
    const conceptoIdx = mapping.concepto ? parseInt(mapping.concepto) : -1
    const amountIdx = mapping.amount ? parseInt(mapping.amount) : -1

    if (conceptoIdx < 0 || amountIdx < 0) return null

    const rawConcepto = rawCells[conceptoIdx]
    const concepto = rawConcepto != null ? String(rawConcepto).trim() : ''
    if (!concepto) return null
    if (this.normalize(concepto).startsWith('total')) return null

    const rawAmountValue = rawCells[amountIdx]
    logger.log('[ExcelImporter] extractRowFromArrayRaw - concepto:', concepto, 'raw amount:', rawAmountValue, 'type:', typeof rawAmountValue)
    const amount = this.parseNumber(rawAmountValue as string | number | null)
    logger.log('[ExcelImporter] extractRowFromArrayRaw - parsed amount:', amount)
    if (amount === 0) return null

    const getIdx = (val: string | null) => val ? parseInt(val) : -1
    const getStr = (idx: number) => idx >= 0 && rawCells[idx] != null ? String(rawCells[idx]).trim() : ''
    const getNum = (idx: number) => idx >= 0 ? this.parseNumber(rawCells[idx] as string | number | null) || null : null

    return {
      rowNumber: rowNum,
      date: getStr(getIdx(mapping.date)),
      concepto,
      amount: Math.abs(amount),
      base: getNum(getIdx(mapping.base)),
      taxRate: getNum(getIdx(mapping.taxRate)),
      taxAmount: getNum(getIdx(mapping.taxAmount)),
      paymentMethod: getStr(getIdx(mapping.paymentMethod)),
      paidDate: getStr(getIdx(mapping.paidDate)),
      dueDate: getStr(getIdx(mapping.dueDate)),
      reference: getStr(getIdx(mapping.reference)),
      invoiceNumber: getStr(getIdx(mapping.invoiceNumber)),
      notes: getStr(getIdx(mapping.notes)),
      type: 'expense',
      categoryId: null,
      teamId: null,
      projectId: null
    }
  }

  // =====================
  // STEP 3: Concepto grouping
  // =====================

  private buildConceptoGroups() {
    const groupMap = new Map<string, ConceptoGroup>()

    for (const pm of this.parsedMonths) {
      if (!pm.enabled) continue
      for (const row of pm.rows) {
        const key = `${row.type}::${row.concepto.toLowerCase().trim()}`

        if (!groupMap.has(key)) {
          groupMap.set(key, {
            concepto: row.concepto,
            count: 0,
            totalAmount: 0,
            avgAmount: 0,
            type: row.type,
            categoryId: null,
            teamId: null,
            projectId: null,
            sampleRows: []
          })
        }

        const group = groupMap.get(key)!
        group.count++
        group.totalAmount += row.amount
        group.avgAmount = group.totalAmount / group.count
        if (group.sampleRows.length < 3) group.sampleRows.push(row)
      }
    }

    this.conceptoGroups = Array.from(groupMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
  }

  applyConceptoMappings() {
    const mappingByKey = new Map<string, ConceptoGroup>()
    for (const group of this.conceptoGroups) {
      mappingByKey.set(`${group.type}::${group.concepto.toLowerCase().trim()}`, group)
    }

    for (const pm of this.parsedMonths) {
      for (const row of pm.rows) {
        const key = `${row.type}::${row.concepto.toLowerCase().trim()}`
        const group = mappingByKey.get(key)
        if (group) {
          row.categoryId = group.categoryId
          row.teamId = group.teamId
          row.projectId = group.projectId
        }
      }
    }
  }

  // =====================
  // STEP 4: Validate & Export
  // =====================

  validate(): ImportValidation {
    const errors: ImportError[] = []
    let totalRows = 0
    let validRows = 0
    const unmappedConceptos: string[] = []

    for (const pm of this.parsedMonths) {
      if (!pm.enabled) continue
      for (const row of pm.rows) {
        totalRows++
        validRows++ // All rows are valid — uncategorized will use fallback
        if (!row.categoryId) {
          if (!unmappedConceptos.includes(row.concepto)) {
            unmappedConceptos.push(row.concepto)
          }
          errors.push({
            source: pm.monthName,
            row: row.rowNumber,
            field: 'categoryId',
            message: `"${row.concepto}" sin categoría — se importará como "Sin categorizar"`
          })
        }
      }
    }

    return { totalRows, validRows, unmappedConceptos, errors }
  }

  getTransactionsToImport(): Array<{
    type: 'income' | 'expense'
    amount: number
    description: string
    categoryId: string
    categoryName: string
    season: string
    date: Date
    paidDate: Date | null
    paymentMethod: string
    baseAmount: number | null
    taxAmount: number | null
    teamId: string | null
    projectId: string | null
  }> {
    const season = `${this.seasonConfig.startYear}/${String(this.seasonConfig.endYear).slice(-2)}`

    const results: Array<{
      type: 'income' | 'expense'
      amount: number
      description: string
      categoryId: string
      categoryName: string
      season: string
      date: Date
      paidDate: Date | null
      paymentMethod: string
      baseAmount: number | null
      taxAmount: number | null
      teamId: string | null
      projectId: string | null
    }> = []

    for (const pm of this.parsedMonths) {
      if (!pm.enabled) continue
      for (const row of pm.rows) {
        const date = this.parseDateValue(row.date, pm.calendarMonth, pm.calendarYear)

        // Paid date: use the explicit paidDate field, or fall back to paymentMethod if it looks like a date
        const paidDate = row.paidDate && this.looksLikeDate(row.paidDate)
          ? this.parseDateValue(row.paidDate, pm.calendarMonth, pm.calendarYear)
          : undefined

        // Payment method: from the paymentMethod field
        const paymentMethod = row.paymentMethod
          ? this.mapPaymentMethod(row.paymentMethod)
          : 'bank_transfer'

        // Use uncategorized fallback if no category assigned
        const categoryId = row.categoryId || (
          row.type === 'income'
            ? `${UNCATEGORIZED_CATEGORY_ID}_income`
            : UNCATEGORIZED_CATEGORY_ID
        )

        results.push({
          type: row.type,
          amount: row.amount,
          description: row.concepto,
          categoryId,
          categoryName: row.categoryId ? '' : 'Sin categorizar',
          season,
          date,
          paidDate: paidDate || null,
          paymentMethod,
          baseAmount: row.base || null,
          taxAmount: row.taxAmount || null,
          teamId: row.teamId || null,
          projectId: row.projectId || null
        })
      }
    }

    return results
  }

  // =====================
  // HELPERS
  // =====================

  private normalize(str: string | undefined | null): string {
    if (!str) return ''
    return String(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  }

  private detectMonth(normalized: string): number | null {
    // Strategy 1: Named months (Galician, Spanish, short forms)
    for (const [name, num] of Object.entries(MONTH_MAP)) {
      const normName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (normalized.includes(normName)) return num
    }

    // Strategy 2: Numeric formats: "MM-YY", "MM-YYYY", "MM/YY", "MM/YYYY"
    const numericMatch = normalized.match(/^(\d{1,2})[-/](\d{2,4})$/)
    if (numericMatch) {
      const month = parseInt(numericMatch[1])
      if (month >= 1 && month <= 12) return month
    }

    // Strategy 3: Just a number 1-12
    const justNumber = normalized.match(/^(\d{1,2})$/)
    if (justNumber) {
      const month = parseInt(justNumber[1])
      if (month >= 1 && month <= 12) return month
    }

    return null
  }

  private parseNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined || value === '') return 0
    
    // If it's already a number, return it directly
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : value
    }
    
    const str = String(value).trim()
    if (!str || str === 'undefined') return 0
    
    // Remove currency symbols and whitespace
    let cleaned = str.replace(/[€$£\s]/g, '')
    
    // Detect European format: has comma as decimal separator
    // European: 1.500,00 or 1500,00 (dot = thousands, comma = decimal)
    // American: 1,500.00 or 1500.00 (comma = thousands, dot = decimal)
    
    const hasComma = cleaned.includes(',')
    const hasDot = cleaned.includes('.')
    
    if (hasComma && hasDot) {
      // Both present - determine which is decimal separator
      const lastComma = cleaned.lastIndexOf(',')
      const lastDot = cleaned.lastIndexOf('.')
      
      if (lastComma > lastDot) {
        // European: 1.500,00 → comma is decimal
        cleaned = cleaned.replace(/\./g, '').replace(',', '.')
      } else {
        // American: 1,500.00 → dot is decimal
        cleaned = cleaned.replace(/,/g, '')
      }
    } else if (hasComma) {
      // Only comma: could be European decimal (1500,00) or American thousands (1,500)
      // Check if comma has exactly 2 digits after (European decimal) or 3 (American thousands)
      const afterComma = cleaned.split(',')[1]
      if (afterComma && (afterComma.length === 1 || afterComma.length === 2)) {
        // European decimal: 1500,00 or 1500,5
        cleaned = cleaned.replace(',', '.')
      } else {
        // American thousands: 1,500 → remove comma
        cleaned = cleaned.replace(/,/g, '')
      }
    }
    // If only dot, it's already in correct format for parseFloat
    
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }

  private looksLikeDate(value: string): boolean {
    if (!value) return false
    return /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(value.trim()) ||
           /\d{4}-\d{2}-\d{2}/.test(value.trim())
  }

  private parseDateValue(value: string, fallbackMonth: number, fallbackYear: number): Date {
    if (!value) return new Date(fallbackYear, fallbackMonth - 1, 1)

    // ISO
    let match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))

    // European dd/mm/yyyy
    match = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/)
    if (match) {
      const day = parseInt(match[1])
      const month = parseInt(match[2])
      let year = parseInt(match[3])
      if (year < 100) year += 2000
      return new Date(year, month - 1, day)
    }

    const parsed = Date.parse(value)
    if (!isNaN(parsed)) return new Date(parsed)

    return new Date(fallbackYear, fallbackMonth - 1, 1)
  }

  private mapPaymentMethod(value: string): string {
    if (!value) return 'bank_transfer'
    const norm = this.normalize(value)
    for (const [key, method] of Object.entries(PAYMENT_METHOD_MAP)) {
      if (norm.includes(this.normalize(key))) return method
    }
    return 'other'
  }

  // =====================
  // PUBLIC GETTERS/SETTERS
  // =====================

  getSheetAnalysis(): SheetAnalysis[] { return this.sheetAnalysis }

  setSheetType(index: number, type: SheetAnalysis['detectedAs']) {
    if (this.sheetAnalysis[index]) this.sheetAnalysis[index].detectedAs = type
  }

  getSeasonConfig(): SeasonConfig { return { ...this.seasonConfig } }
  setSeasonConfig(config: SeasonConfig) { this.seasonConfig = { ...config } }

  getColumnMapping(): ColumnMapping { return { ...this.expenseColumnMapping } }
  getIncomeColumnMapping(): ColumnMapping { return { ...this.incomeColumnMapping } }
  setColumnMapping(mapping: ColumnMapping) { this.expenseColumnMapping = { ...mapping } }
  setIncomeColumnMapping(mapping: ColumnMapping) { this.incomeColumnMapping = { ...mapping } }

  getParsedMonths(): ParsedMonth[] { return this.parsedMonths }

  getConceptoGroups(): ConceptoGroup[] { return this.conceptoGroups }

  setConceptoGroup(index: number, updates: Partial<ConceptoGroup>) {
    if (this.conceptoGroups[index]) Object.assign(this.conceptoGroups[index], updates)
  }

  toggleMonth(index: number, enabled: boolean) {
    if (this.parsedMonths[index]) {
      this.parsedMonths[index].enabled = enabled
      this.buildConceptoGroups()
    }
  }

  getTotalRows(): number {
    return this.parsedMonths.filter(m => m.enabled).reduce((sum, m) => sum + m.rows.length, 0)
  }

  getExpenseHeaders(): string[] {
    if (!this.workbook) return []
    const expenseTab = this.sheetAnalysis.find(s => s.detectedAs === 'expense_month')
    if (!expenseTab) return []
    const sheet = this.workbook.Sheets[expenseTab.name]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false })

    // Strategy 1: Find a row where most cells are non-numeric text
    for (const row of rows) {
      const arr = row as unknown[]
      const nonEmpty = arr.filter(v => v != null && String(v).trim().length > 0)
      if (nonEmpty.length >= 3) {
        const textCount = nonEmpty.filter(v => {
          const s = String(v).trim()
          return isNaN(Number(s)) && !this.looksLikeDate(s)
        }).length
        if (textCount >= 2) {
          return arr.map(v => v != null ? String(v).trim() : '').filter(h => h.length > 0)
        }
      }
    }

    // Strategy 2: Find a row that contains known keywords
    for (const row of rows) {
      const arr = row as unknown[]
      const joined = arr.map(v => String(v || '').toLowerCase()).join(' ')
      if (joined.includes('concepto') || joined.includes('importe') || joined.includes('base') || joined.includes('data') || joined.includes('fecha')) {
        return arr.map(v => v != null ? String(v).trim() : '').filter(h => h.length > 0)
      }
    }

    // Strategy 3: Fallback to auto-detected column names
    return this.mappingToHeaders(this.expenseColumnMapping)
  }

  getIncomeHeaders(): string[] {
    if (!this.workbook) return []
    const incomeTab = this.sheetAnalysis.find(s => s.detectedAs === 'income')
    if (!incomeTab) return []
    const sheet = this.workbook.Sheets[incomeTab.name]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false })

    for (const row of rows) {
      const arr = row as unknown[]
      const nonEmpty = arr.filter(v => v != null && String(v).trim().length > 0)
      if (nonEmpty.length >= 3) {
        const textCount = nonEmpty.filter(v => {
          const s = String(v).trim()
          return isNaN(Number(s)) && !this.looksLikeDate(s)
        }).length
        if (textCount >= 2) {
          return arr.map(v => v != null ? String(v).trim() : '').filter(h => h.length > 0)
        }
      }
    }

    for (const row of rows) {
      const arr = row as unknown[]
      const joined = arr.map(v => String(v || '').toLowerCase()).join(' ')
      if (joined.includes('concepto') || joined.includes('total') || joined.includes('base') || joined.includes('data') || joined.includes('fecha')) {
        return arr.map(v => v != null ? String(v).trim() : '').filter(h => h.length > 0)
      }
    }

    return this.mappingToHeaders(this.incomeColumnMapping)
  }

  /** Extract non-null header names from a mapping */
  private mappingToHeaders(mapping: ColumnMapping): string[] {
    const headers: string[] = []
    for (const val of Object.values(mapping)) {
      if (val) headers.push(val)
    }
    return headers
  }

  /**
   * Get a preview of the first rows of an expense tab for debugging
   */
  getSheetPreview(sheetName?: string): SheetPreview | null {
    if (!this.workbook) return null

    const name = sheetName || this.sheetAnalysis.find(s => s.detectedAs === 'expense_month')?.name
    if (!name) return null

    const sheet = this.workbook.Sheets[name]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false })

    // Find the header row and sample data rows
    let headers: string[] = []
    const sampleRows: string[][] = []
    let foundHeader = false

    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const arr = (rows[i] as unknown[]).map(v => v != null ? String(v).trim() : '')
      const nonEmpty = arr.filter(c => c.length > 0)

      if (!foundHeader && nonEmpty.length >= 3) {
        // Check if this is the header row
        const hasKeyword = nonEmpty.some(c => {
          const n = c.toLowerCase()
          return n.includes('concepto') || n.includes('data') || n.includes('base') ||
                 n.includes('importe') || n.includes('total') || n.includes('fecha')
        })
        if (hasKeyword) {
          headers = arr.filter(h => h.length > 0)
          foundHeader = true
          continue
        }
      }

      if (foundHeader && nonEmpty.length > 0) {
        sampleRows.push(arr.filter(c => c.length > 0))
        if (sampleRows.length >= 5) break
      } else if (!foundHeader) {
        // Show pre-header rows too (for debugging)
        if (nonEmpty.length > 0) {
          sampleRows.push(arr.filter(c => c.length > 0))
        }
      }
    }

    return { sheetName: name, headers, sampleRows }
  }
}
