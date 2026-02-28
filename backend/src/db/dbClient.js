const convertQuestionPlaceholdersToPostgres = (sql) => {
  let out = '';
  let index = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inSingleQuote) {
      out += ch;
      if (ch === "'" && next === "'") {
        out += next;
        i += 1;
      } else if (ch === "'") {
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      out += ch;
      if (ch === '"' && next === '"') {
        out += next;
        i += 1;
      } else if (ch === '"') {
        inDoubleQuote = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      out += ch;
      continue;
    }

    if (ch === '"') {
      inDoubleQuote = true;
      out += ch;
      continue;
    }

    if (ch === '?') {
      index += 1;
      out += `$${index}`;
      continue;
    }

    out += ch;
  }

  return out;
};

const shouldAppendReturningId = (sql) => (
  /^\s*insert\b/i.test(sql)
  && !/\breturning\b/i.test(sql)
);

const buildPgText = (sql, withAutoReturningId = false) => {
  const converted = convertQuestionPlaceholdersToPostgres(sql);
  if (!withAutoReturningId || !shouldAppendReturningId(converted)) return converted;
  return `${converted.trimEnd()} RETURNING id`;
};

export const createDbClient = (db) => ({
  async get(sql, params = []) {
    const result = await db.query(buildPgText(sql, false), params);
    return result?.rows?.[0] || null;
  },

  async all(sql, params = []) {
    const result = await db.query(buildPgText(sql, false), params);
    return result?.rows || [];
  },

  async run(sql, params = []) {
    const text = buildPgText(sql, true);
    const result = await db.query(text, params);
    const firstRow = result?.rows?.[0] || null;
    return {
      lastID: Number(firstRow?.id || 0),
      changes: Number(result?.rowCount || 0)
    };
  }
});
