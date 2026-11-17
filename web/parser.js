const COLUMNS = ["name", "type", "location", "role", "quantity", "unit", "hazard", "links"];
export function parseLedger(jsonText) {
    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    }
    catch (e) {
        throw new Error(`parseLedger: invalid JSON — ${e.message}`);
    }
    if (!Array.isArray(parsed)) {
        throw new Error("parseLedger: root value must be a JSON array");
    }
    const rows = parsed.map((item, i) => {
        const rowNum = i + 1; // 1-based
        if (item === null || typeof item !== "object" || Array.isArray(item)) {
            throw new Error(`parseLedger: row ${rowNum} is not an object`);
        }
        const obj = item;
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
        for (let j = 0; j < obj["links"].length; j++) {
            if (typeof obj["links"][j] !== "string") {
                throw new Error(`parseLedger: row ${rowNum} "links[${j}]" must be a string`);
            }
        }
        const data = {
            name: obj["name"],
            type: obj["type"],
            location: obj["location"],
            role: obj["role"],
            quantity: obj["quantity"],
            unit: obj["unit"],
            hazard: obj["hazard"],
            links: obj["links"],
        };
        return { index: rowNum, data };
    });
    return { columns: [...COLUMNS], rows };
}
