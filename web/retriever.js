// ---------------------------------------------------------------------------
// Item matching helpers
// ---------------------------------------------------------------------------
/**
 * Find all table names that appear as exact case-sensitive substrings of the
 * question. When multiple names match, prefer the longest name (to avoid
 * short names shadowing longer ones that contain them).
 *
 * Returns the single best matching LedgerRow, or null if zero rows match.
 * Returns "AMBIGUOUS" when two or more distinct rows both match via names of
 * the same maximum length (a true tie that cannot be broken by length).
 */
function findItem(table, question) {
    // Collect every row whose name is a substring of the question.
    const matches = table.rows.filter((r) => question.includes(r.data.name));
    if (matches.length === 0)
        return null;
    if (matches.length === 1)
        return matches[0];
    // Multiple rows matched — keep only those with the longest name.
    const maxLen = Math.max(...matches.map((r) => r.data.name.length));
    const best = matches.filter((r) => r.data.name.length === maxLen);
    if (best.length === 1)
        return best[0];
    // Two or more rows with equally long names both substring-match: ambiguous.
    return "AMBIGUOUS";
}
/**
 * Variant of findItem for a known substring of the question.
 * Used when the template parsing has already isolated the name string.
 * We still apply longest-name disambiguation across all table rows.
 */
function findItemByName(table, nameFragment) {
    const matches = table.rows.filter((r) => nameFragment.includes(r.data.name));
    if (matches.length === 0)
        return null;
    if (matches.length === 1)
        return matches[0];
    const maxLen = Math.max(...matches.map((r) => r.data.name.length));
    const best = matches.filter((r) => r.data.name.length === maxLen);
    if (best.length === 1)
        return best[0];
    return "AMBIGUOUS";
}
// ---------------------------------------------------------------------------
// Template matchers
// ---------------------------------------------------------------------------
// T1: "Where is <Name> located?"
function matchT1(table, q) {
    const m = /^Where is (.+) located\?$/.exec(q);
    if (!m)
        return null;
    const row = findItemByName(table, m[1]);
    if (!row || row === "AMBIGUOUS")
        return null;
    return {
        answer: row.data.location,
        evidence: [{ row: row.index, col: "location" }],
    };
}
// T2: "What is the role of <Name>?"
function matchT2(table, q) {
    const m = /^What is the role of (.+)\?$/.exec(q);
    if (!m)
        return null;
    const row = findItemByName(table, m[1]);
    if (!row || row === "AMBIGUOUS")
        return null;
    return {
        answer: row.data.role,
        evidence: [{ row: row.index, col: "role" }],
    };
}
// T3: "What is the quantity of <Name>?"
function matchT3(table, q) {
    const m = /^What is the quantity of (.+)\?$/.exec(q);
    if (!m)
        return null;
    const row = findItemByName(table, m[1]);
    if (!row || row === "AMBIGUOUS")
        return null;
    return {
        answer: `${row.data.quantity} ${row.data.unit}`,
        evidence: [{ row: row.index, col: "quantity" }],
    };
}
// T4: "What is the hazard class of <Name>?"
function matchT4(table, q) {
    const m = /^What is the hazard class of (.+)\?$/.exec(q);
    if (!m)
        return null;
    const row = findItemByName(table, m[1]);
    if (!row || row === "AMBIGUOUS")
        return null;
    return {
        answer: row.data.hazard,
        evidence: [{ row: row.index, col: "hazard" }],
    };
}
// T5: "What is <Name> connected to?"
function matchT5(table, q) {
    const m = /^What is (.+) connected to\?$/.exec(q);
    if (!m)
        return null;
    const row = findItemByName(table, m[1]);
    if (!row || row === "AMBIGUOUS")
        return null;
    return {
        answer: row.data.links.join(", "),
        evidence: [{ row: row.index, col: "links" }],
    };
}
// T6: "How many items are located in <Location>?"
function matchT6(table, q) {
    const m = /^How many items are located in (.+)\?$/.exec(q);
    if (!m)
        return null;
    const location = m[1];
    const matched = table.rows.filter((r) => r.data.location === location);
    if (matched.length === 0)
        return null;
    return {
        answer: String(matched.length),
        evidence: matched.map((r) => ({ row: r.index, col: "location" })),
    };
}
// T7: "How many items are of type <Type>?"
function matchT7(table, q) {
    const m = /^How many items are of type (.+)\?$/.exec(q);
    if (!m)
        return null;
    const type = m[1];
    const matched = table.rows.filter((r) => r.data.type === type);
    if (matched.length === 0)
        return null;
    return {
        answer: String(matched.length),
        evidence: matched.map((r) => ({ row: r.index, col: "type" })),
    };
}
// T8: "Which has the greater quantity, <NameA> or <NameB>?"
function matchT8(table, q) {
    const m = /^Which has the greater quantity, (.+) or (.+)\?$/.exec(q);
    if (!m)
        return null;
    const candidateA = m[1];
    const candidateB = m[2];
    const rowA = findItemByName(table, candidateA);
    const rowB = findItemByName(table, candidateB);
    if (!rowA || rowA === "AMBIGUOUS")
        return null;
    if (!rowB || rowB === "AMBIGUOUS")
        return null;
    if (rowA.data.quantity === rowB.data.quantity)
        return null; // tied
    const winner = rowA.data.quantity > rowB.data.quantity ? rowA : rowB;
    return {
        answer: winner.data.name,
        evidence: [
            { row: rowA.index, col: "quantity" },
            { row: rowB.index, col: "quantity" },
        ],
    };
}
// T9: `Which item has the role "<Role>"?`
function matchT9(table, q) {
    const m = /^Which item has the role "(.+)"\?$/.exec(q);
    if (!m)
        return null;
    const role = m[1];
    const matched = table.rows.filter((r) => r.data.role === role);
    if (matched.length !== 1)
        return null; // zero or more-than-one → null
    const row = matched[0];
    return {
        answer: row.data.name,
        evidence: [{ row: row.index, col: "role" }],
    };
}
// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export function retrieve(table, question) {
    return (matchT1(table, question) ??
        matchT2(table, question) ??
        matchT3(table, question) ??
        matchT4(table, question) ??
        matchT5(table, question) ??
        matchT6(table, question) ??
        matchT7(table, question) ??
        matchT8(table, question) ??
        matchT9(table, question) ??
        null);
}
