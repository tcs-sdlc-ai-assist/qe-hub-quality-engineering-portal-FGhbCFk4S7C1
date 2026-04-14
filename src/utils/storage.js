import { MOCK_DSR_DATA } from '../data/mockDSR.js'
import { MOCK_SHOWSTOPPER_DEFECTS, MOCK_DEFERRED_DEFECTS } from '../data/mockDefects.js'
import { MOCK_READINESS_DATA } from '../data/mockReadiness.js'
import {
  MOCK_MONTHLY_SNAPSHOT,
  MOCK_DEFECT_TRENDS,
  MOCK_SEVERITY_DISTRIBUTION,
  MOCK_ENV_DEFECTS,
  MOCK_RCA_DATA,
} from '../data/mockTrends.js'
import { MOCK_USERS } from '../data/mockUsers.js'

const STORAGE_PREFIX = 'qe_hub_'

function prefixKey(key) {
  return `${STORAGE_PREFIX}${key}`
}

export function getItem(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(prefixKey(key))
    if (raw === null) {
      return defaultValue
    }
    return JSON.parse(raw)
  } catch (err) {
    console.error(`[storage] Error reading key "${key}":`, err)
    return defaultValue
  }
}

export function setItem(key, value) {
  try {
    const serialized = JSON.stringify(value)
    localStorage.setItem(prefixKey(key), serialized)
    return true
  } catch (err) {
    console.error(`[storage] Error writing key "${key}":`, err)
    return false
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(prefixKey(key))
    return true
  } catch (err) {
    console.error(`[storage] Error removing key "${key}":`, err)
    return false
  }
}

const SEED_MAP = {
  dsr_data: MOCK_DSR_DATA,
  showstopper_defects: MOCK_SHOWSTOPPER_DEFECTS,
  deferred_defects: MOCK_DEFERRED_DEFECTS,
  readiness_data: MOCK_READINESS_DATA,
  monthly_snapshot: MOCK_MONTHLY_SNAPSHOT,
  defect_trends: MOCK_DEFECT_TRENDS,
  severity_distribution: MOCK_SEVERITY_DISTRIBUTION,
  env_defects: MOCK_ENV_DEFECTS,
  rca_data: MOCK_RCA_DATA,
  users: MOCK_USERS,
}

export function initializeData(force = false) {
  Object.entries(SEED_MAP).forEach(([key, data]) => {
    const existing = localStorage.getItem(prefixKey(key))
    if (force || existing === null) {
      setItem(key, data)
    }
  })
}