/**
 * Build Elasticsearch query for store count (Active/Churned/New) from current month.
 * Current month selection drives: main range = previous month start → next month start,
 * with filters for previous_month and current_month.
 */

const ENDPOINT = 'GET /manifest-events-prod-alias,events-prod-alias/_search'

function toISOStart(year, month, day = 1) {
  const d = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
  return d.toISOString().replace(/\.\d{3}Z$/, '.000Z')
}

function getPreviousMonth(year, month) {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

function getNextMonth(year, month) {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

/**
 * @param {{ year: number, month: number }} currentMonth - 1-based month (1 = January)
 * @returns {{ endpoint: string, body: object }} Query endpoint and body
 */
export function buildStoreCountQuery(currentMonth) {
  const { year, month } = currentMonth
  const prev = getPreviousMonth(year, month)
  const next = getNextMonth(year, month)

  const prevStart = toISOStart(prev.year, prev.month)
  const currStart = toISOStart(year, month)
  const nextStart = toISOStart(next.year, next.month)

  const body = {
    size: 0,
    query: {
      bool: {
        must: [
          { term: { 'eventName.keyword': 'checkoutCompleted' } },
          { term: { 'eventProperties.hasInteracted': true } },
          {
            range: {
              timestamp: {
                gte: prevStart,
                lt: nextStart,
              },
            },
          },
        ],
      },
    },
    aggs: {
      time_buckets: {
        filters: {
          filters: {
            previous_month: {
              range: {
                timestamp: {
                  gte: prevStart,
                  lt: currStart,
                },
              },
            },
            current_month: {
              range: {
                timestamp: {
                  gte: currStart,
                  lt: nextStart,
                },
              },
            },
          },
        },
        aggs: {
          unique_stores: {
            terms: {
              field: 'storeId.keyword',
              size: 10000,
            },
          },
        },
      },
    },
  }

  return { endpoint: ENDPOINT, body }
}

/**
 * @param {{ year: number, month: number }} currentMonth
 * @returns {string} Full copyable text: GET line + JSON body
 */
export function buildStoreCountQueryString(currentMonth) {
  const { endpoint, body } = buildStoreCountQuery(currentMonth)
  return `${endpoint}\n${JSON.stringify(body, null, 2)}`
}
