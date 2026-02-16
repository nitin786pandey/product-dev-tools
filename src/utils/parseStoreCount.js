/**
 * Parses Elasticsearch aggregation output for time_buckets (current_month vs previous_month)
 * and returns Active, Churned, and New store counts.
 *
 * Expected structure: aggregations.time_buckets.buckets.{ current_month, previous_month }
 * each with unique_stores.buckets = [ { key: storeId, doc_count } ]
 *
 * - Active: stores in both current and previous month
 * - Churned: stores in previous month only
 * - New: stores in current month only
 */
export function parseStoreCount(elasticJson) {
  let data
  try {
    data = typeof elasticJson === 'string' ? JSON.parse(elasticJson) : elasticJson
  } catch {
    return { error: 'Invalid JSON' }
  }

  const buckets = data?.aggregations?.time_buckets?.buckets
  if (!buckets) {
    return { error: 'Missing aggregations.time_buckets.buckets' }
  }

  const current = buckets.current_month?.unique_stores?.buckets
  const previous = buckets.previous_month?.unique_stores?.buckets

  if (!Array.isArray(current) || !Array.isArray(previous)) {
    return { error: 'Missing current_month or previous_month unique_stores.buckets' }
  }

  const currentIds = new Set(current.map((b) => b.key))
  const previousIds = new Set(previous.map((b) => b.key))

  let activeCount = 0
  currentIds.forEach((id) => {
    if (previousIds.has(id)) activeCount++
  })
  const churnedCount = previousIds.size - activeCount
  const newCount = currentIds.size - activeCount

  return {
    activeCount,
    churnedCount,
    newCount,
    error: null,
  }
}
