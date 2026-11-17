export interface LedgerRowData {
  name: string; type: string; location: string; role: string;
  quantity: number; unit: string; hazard: string; links: string[];
}

export interface LedgerRow {
  index: number;            // 1-based row number
  data: LedgerRowData;
}

export interface LedgerTable {
  columns: string[];        // ["name","type","location","role","quantity","unit","hazard","links"]
  rows: LedgerRow[];
}

const COLUMNS: string[] = ["name", "type", "location", "role", "quantity", "unit", "hazard", "links"];

export function parseLedger(jsonText: string): LedgerTable {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`parseLedger: invalid JSON — ${(e as Error).message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("parseLedger: root value must be a JSON array");
  }

  const rows: LedgerRow[] = parsed.map((item: unknown, i: number) => {
    const rowNum = i + 1; // 1-based

    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`parseLedger: row ${rowNum} is not an object`);
    }

    const obj = item as Record<string, unknown>;

    // Validate all required columns are present
    for (const col of COLUMNS) {
      if (!(col in obj)) {
        throw new Error(`parseLedger: row ${rowNum} is missing column "${col}"`);
      }
    }

    // Validate types for each field
    if (typeof obj["name"] !== "string") {
      throw new Error(`parseLedger: row ${rowNum} "name" must be a string`);
    }
    if (typeof obj["type"] !== "string") {
      throw new Error(`parseLedger: row ${rowNum} "type" must be a string`);
    }
    if (typeof obj["location"] !== "string") {
      throw new Error(`parseLedger: row ${rowNum} "location" must be a string`);
    }
    if (typeof obj["role"] !== "string") {
      throw new Error(`parseLedger: row ${rowNum} "role" must be a string`);
    }
    if (typeof obj["quantity"] !== "number" || !isFinite(obj["quantity"])) {
      throw new Error(`parseLedger: row ${rowNum} "quantity" must be a finite number`);
    }
    if (typeof obj["unit"] !== "string") {
      throw new Error(`parseLedger: row ${rowNum} "unit" must be a string`);
    }
    if (typeof obj["hazard"] !== "string") {
      throw new Error(`parseLedger: row ${rowNum} "hazard" must be a string`);
    }
    if (!Array.isArray(obj["links"])) {
      throw new Error(`parseLedger: row ${rowNum} "links" must be an array`);
    }
    for (let j = 0; j < (obj["links"] as unknown[]).length; j++) {
      if (typeof (obj["links"] as unknown[])[j] !== "string") {
        throw new Error(`parseLedger: row ${rowNum} "links[${j}]" must be a string`);
      }
    }

    const data: LedgerRowData = {
      name:     obj["name"] as string,
      type:     obj["type"] as string,
      location: obj["location"] as string,
      role:     obj["role"] as string,
      quantity: obj["quantity"] as number,
      unit:     obj["unit"] as string,
      hazard:   obj["hazard"] as string,
      links:    obj["links"] as string[],
    };

    return { index: rowNum, data };
  });

  return { columns: [...COLUMNS], rows };
}
