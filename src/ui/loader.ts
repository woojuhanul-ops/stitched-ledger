import { parseLedger } from "../index.js";
import type { LedgerTable } from "../index.js";

// The eight required column names, in canonical order.
const REQUIRED_COLUMNS = [
  "name", "type", "location", "role", "quantity", "unit", "hazard", "links",
] as const;

/**
 * Parse a CSV or TSV text into a LedgerTable.
 *
 * Throws Error with a specific "File rejected — …" message on any violation.
 * On success delegates final validation to parseLedger.
 */
export function ledgerFromDelimitedText(
  text: string,
  delimiter: string
): LedgerTable {
  // Split raw text into physical lines.
  const lines = text.split(/\r?\n/);

  // Parse every non-empty line as a delimited row, honouring CSV quoting.
  const rows: string[][] = [];
  for (const line of lines) {
    if (line.trim() === "") continue;
    rows.push(splitLine(line, delimiter));
  }

  if (rows.length === 0) {
    throw new Error("File rejected — no data rows");
  }

  // ── Header validation ───────────────────────────────────────────────────
  const headerFields = rows[0].map((f) => f.trim().toLowerCase());

  for (const col of REQUIRED_COLUMNS) {
    if (!headerFields.includes(col)) {
      throw new Error(`File rejected — missing column: ${col}`);
    }
  }

  // Build a column-index map (by the header names).
  const colIndex: Record<string, number> = {};
  for (let i = 0; i < headerFields.length; i++) {
    colIndex[headerFields[i]] = i;
  }

  const expectedFieldCount = headerFields.length;

  // ── Data-row validation and object construction ─────────────────────────
  const dataRows = rows.slice(1);

  if (dataRows.length === 0) {
    throw new Error("File rejected — no data rows");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records: Record<string, unknown>[] = [];

  for (let ri = 0; ri < dataRows.length; ri++) {
    const fields = dataRows[ri];
    const humanRow = ri + 2; // 1-based, counting the header as row 1

    if (fields.length !== expectedFieldCount) {
      throw new Error(
        `File rejected — row ${humanRow} has ${fields.length} fields, expected ${expectedFieldCount}`
      );
    }

    const get = (col: string): string => fields[colIndex[col]].trim();

    // quantity must be a finite number
    const quantityStr = get("quantity");
    const quantityNum = Number(quantityStr);
    if (!quantityStr || !isFinite(quantityNum) || isNaN(quantityNum)) {
      throw new Error(
        `File rejected — row ${humanRow} quantity is not a number`
      );
    }

    // links: split on ";", trim, drop empties
    const linksRaw = get("links");
    const links = linksRaw
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    records.push({
      name:     get("name"),
      type:     get("type"),
      location: get("location"),
      role:     get("role"),
      quantity: quantityNum,
      unit:     get("unit"),
      hazard:   get("hazard"),
      links,
    });
  }

  // ── Final validation via parseLedger ────────────────────────────────────
  // parseLedger expects a JSON array of row objects.
  let jsonText: string;
  try {
    jsonText = JSON.stringify(records);
  } catch (e) {
    throw new Error(
      `File rejected — could not serialise rows: ${(e as Error).message}`
    );
  }

  try {
    return parseLedger(jsonText);
  } catch (e) {
    throw new Error(`File rejected — ${(e as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// CSV / TSV line splitter (honours double-quote quoting per RFC 4180)
// ---------------------------------------------------------------------------

function splitLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // peek ahead: escaped quote?
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (line.slice(i, i + delimiter.length) === delimiter) {
        fields.push(current);
        current = "";
        i += delimiter.length;
      } else {
        current += ch;
        i++;
      }
    }
  }

  fields.push(current);
  return fields;
}
