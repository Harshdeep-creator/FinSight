export interface ParsedRow {
  [key: string]: string | number | null;
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  errorRows: number;
  warnings: string[];
}

function detectDelimiter(sample: string): string {
  const candidates = [',', ';', '\t', '|'];
  let best = ',';
  let bestCount = 0;
  for (const d of candidates) {
    const count = (sample.split('\n')[0] || '').split(d).length;
    if (count > bestCount) { bestCount = count; best = d; }
  }
  return best;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCSV(content: string): ParseResult {
  const warnings: string[] = [];
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error('File must contain a header row and at least one data row.');

  const delimiter = detectDelimiter(content);
  const headers = parseCSVLine(lines[0], delimiter).map(h => h.replace(/^"|"$/g, '').trim());

  const rows: ParsedRow[] = [];
  let errorRows = 0;

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i], delimiter);
      if (values.length !== headers.length) {
        if (values.length === 1 && values[0] === '') continue;
        errorRows++;
        continue;
      }
      const row: ParsedRow = {};
      headers.forEach((h, idx) => {
        const raw = values[idx]?.replace(/^"|"$/g, '').trim() ?? '';
        if (raw === '' || raw === 'NA' || raw === 'N/A' || raw === 'null') {
          row[h] = null;
        } else {
          const num = Number(raw.replace(/,/g, ''));
          row[h] = isNaN(num) ? raw : num;
        }
      });
      rows.push(row);
    } catch {
      errorRows++;
    }
  }

  if (errorRows > 0) warnings.push(`${errorRows} rows could not be parsed and were excluded.`);

  return { headers, rows, totalRows: lines.length - 1, errorRows, warnings };
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'UTF-8');
  });
}

export function detectRetailSchema(headers: string[]): boolean {
  const lower = headers.map(h => h.toLowerCase());
  const required = ['quantity', 'price'];
  return required.every(r => lower.some(h => h.includes(r)));
}

export function detectColumns(headers: string[]) {
  const lower = headers.map(h => h.toLowerCase());
  const find = (keywords: string[]) => headers.find((_, i) => keywords.some(k => lower[i].includes(k)));
  return {
    quantity: find(['quantity', 'qty', 'units']),
    price: find(['price', 'unitprice', 'unit_price', 'amount', 'value', 'cost']),
    date: find(['date', 'time', 'invoicedate', 'invoice_date', 'orderdate']),
    customer: find(['customer', 'customerid', 'client', 'account']),
    country: find(['country', 'region', 'location', 'territory']),
    invoice: find(['invoice', 'order', 'transaction', 'id']),
    product: find(['description', 'product', 'item', 'sku', 'name']),
    revenue: find(['revenue', 'sales', 'total', 'turnover']),
  };
}
