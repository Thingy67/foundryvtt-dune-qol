const SYSTEM_ID = "dune";

const SETTING_CANDIDATES = Object.freeze({
  momentum: [
    "momentum",
    "momentumPool",
    "momentum-pool",
    "momentum_pool",
    "momentumPoolValue"
  ],
  threat: [
    "threat",
    "threatPool",
    "threat-pool",
    "threat_pool",
    "threatPoolValue"
  ]
});

const PROPERTY_CANDIDATES = Object.freeze({
  momentum: ["momentum", "momentumPool"],
  threat: ["threat", "threatPool"]
});

function normalizeKey(value) {
  return String(value).replaceAll(/[^a-z0-9]/gi, "").toLowerCase();
}

function numericValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  if (value && typeof value === "object") {
    if (typeof value.value === "number" && Number.isFinite(value.value)) return value.value;
    if (typeof value.current === "number" && Number.isFinite(value.current)) return value.current;
  }
  return null;
}

function registeredSystemSettings() {
  const registry = game.settings?.settings;
  if (!registry || typeof registry.entries !== "function") return [];

  return [...registry.entries()]
    .filter(([fullKey]) => String(fullKey).startsWith(`${SYSTEM_ID}.`))
    .map(([fullKey, definition]) => ({
      fullKey,
      key: String(fullKey).slice(SYSTEM_ID.length + 1),
      definition
    }));
}

function resolveSettingKey(pool) {
  const candidates = new Set(SETTING_CANDIDATES[pool].map(normalizeKey));
  const registered = registeredSystemSettings();

  for (const entry of registered) {
    if (!candidates.has(normalizeKey(entry.key))) continue;

    try {
      const current = game.settings.get(SYSTEM_ID, entry.key);
      if (numericValue(current) !== null) return entry.key;
    } catch {
      // Ignore incompatible registered settings and continue probing.
    }
  }

  return null;
}

function upstreamPools() {
  return game.dune?.pools ?? game.dune?.pool ?? null;
}

function readFromPoolObject(pool) {
  const pools = upstreamPools();
  if (!pools) return null;

  const specificGetter = `get${pool[0].toUpperCase()}${pool.slice(1)}`;
  if (typeof pools[specificGetter] === "function") {
    const value = numericValue(pools[specificGetter]());
    if (value !== null) return value;
  }

  if (typeof pools.getPool === "function") {
    const value = numericValue(pools.getPool(pool));
    if (value !== null) return value;
  }

  for (const property of PROPERTY_CANDIDATES[pool]) {
    const value = numericValue(pools[property]);
    if (value !== null) return value;
  }

  return null;
}

async function writeToPoolObject(pool, target, current) {
  const pools = upstreamPools();
  if (!pools) return false;

  const capitalized = `${pool[0].toUpperCase()}${pool.slice(1)}`;
  const specificSetter = `set${capitalized}`;
  if (typeof pools[specificSetter] === "function") {
    await pools[specificSetter](target);
    return true;
  }

  for (const methodName of ["setPoolValue", "setPool"]) {
    if (typeof pools[methodName] === "function") {
      await pools[methodName](pool, target);
      return true;
    }
  }

  const delta = target - current;
  const specificDeltaMethods = [
    `adjust${capitalized}`,
    `change${capitalized}`,
    `modify${capitalized}`
  ];
  for (const methodName of specificDeltaMethods) {
    if (typeof pools[methodName] === "function") {
      await pools[methodName](delta);
      return true;
    }
  }

  for (const methodName of ["adjustPool", "changePool", "modifyPool"]) {
    if (typeof pools[methodName] === "function") {
      await pools[methodName](pool, delta);
      return true;
    }
  }

  for (const property of PROPERTY_CANDIDATES[pool]) {
    const counter = pools[property];
    if (!counter || typeof counter !== "object") continue;

    for (const methodName of ["setValue", "setCurrent"]) {
      if (typeof counter[methodName] === "function") {
        await counter[methodName](target);
        return true;
      }
    }
  }

  return false;
}

export async function readDunePools() {
  const values = {};
  const sources = {};

  for (const pool of ["momentum", "threat"]) {
    const settingKey = resolveSettingKey(pool);
    if (settingKey) {
      values[pool] = numericValue(game.settings.get(SYSTEM_ID, settingKey));
      sources[pool] = `setting:${SYSTEM_ID}.${settingKey}`;
      continue;
    }

    const objectValue = readFromPoolObject(pool);
    if (objectValue !== null) {
      values[pool] = objectValue;
      sources[pool] = "game.dune.pools";
      continue;
    }

    throw new Error(`Unable to read the upstream ${pool} pool.`);
  }

  return {
    momentum: values.momentum,
    threat: values.threat,
    sources
  };
}

export async function writeDunePool(pool, targetValue) {
  if (!Object.hasOwn(SETTING_CANDIDATES, pool)) {
    throw new TypeError(`Unsupported Dune pool '${pool}'.`);
  }

  const target = Number(targetValue);
  if (!Number.isInteger(target) || target < 0) {
    throw new RangeError(`${pool} target must be a non-negative integer.`);
  }

  const settingKey = resolveSettingKey(pool);
  if (settingKey) {
    await game.settings.set(SYSTEM_ID, settingKey, target);
  } else {
    const current = readFromPoolObject(pool);
    if (current === null) {
      throw new Error(`Unable to read the upstream ${pool} pool before writing it.`);
    }

    const handled = await writeToPoolObject(pool, target, current);
    if (!handled) {
      throw new Error(`No supported upstream writer was found for the ${pool} pool.`);
    }
  }

  const updated = await readDunePools();
  if (updated[pool] !== target) {
    throw new Error(
      `The upstream ${pool} pool reported ${updated[pool]} after attempting to set ${target}.`
    );
  }

  return updated;
}

export function describeDunePoolApi() {
  const dune = game.dune ?? null;
  const pools = upstreamPools();
  return {
    systemVersion: game.system?.version ?? "unknown",
    settings: registeredSystemSettings().map((entry) => entry.fullKey),
    gameDunePresent: Boolean(dune),
    gameDuneProperties: objectProperties(dune),
    poolObjectPresent: Boolean(pools),
    poolObjectProperties: objectProperties(pools)
  };
}

function objectProperties(value) {
  if (!value || (typeof value !== "object" && typeof value !== "function")) return [];

  return [...new Set([
    ...Object.keys(value),
    ...Object.getOwnPropertyNames(Object.getPrototypeOf(value) ?? {})
  ])].sort();
}
