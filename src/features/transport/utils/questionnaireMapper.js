import { formatHour, formatServiceSummary } from '@/utils/formatters'

function mapAuthorizedServices(services, direction) {
  const result = []
  for (const s of services) {
    if (s.direction !== direction) continue
    result.push(Object.assign({}, s, { targetTimeLabel: formatHour(s.target_time) }))
  }
  return result
}

function mapEligibilityParticipations(participations, eligibilityId, travelsMap) {
  const result = []
  for (const p of participations) {
    if (p.eligibility !== eligibilityId) continue
    const travel = travelsMap.get(p.travel) || null
    result.push(
      Object.assign({}, p, {
        travelData: travel,
        isPublished: Boolean(travel?.published_revision != null),
        isPublicationCurrent: Boolean(travel?.publication_current),
      }),
    )
  }
  return result
}

/**
 * Combina elegibilidades com dias, solicitações de mudança, participações e viagens ordenadas por data.
 */
export function buildEnrichedEligibilities({
  days,
  eligibilities,
  changeRequests,
  participations,
  travels,
}) {
  const daysMap = new Map(days.map((d) => [d.id, d]))
  const travelsMap = new Map(travels.map((t) => [t.id, t]))
  const items = []

  for (const elig of eligibilities) {
    const day = daysMap.get(elig.day) || { id: elig.day, date: 'Data não informada', window: 'unknown' }
    const services = Array.isArray(elig.authorized_services) ? elig.authorized_services : []
    const response = elig.response || null
    const requests = response ? changeRequests.filter((cr) => cr.response === response.id) : []

    items.push(
      Object.assign({}, elig, {
        dayData: day,
        outboundServices: mapAuthorizedServices(services, 'outbound'),
        returnServices: mapAuthorizedServices(services, 'return'),
        response,
        requests,
        participations: mapEligibilityParticipations(participations, elig.id, travelsMap),
      }),
    )
  }

  return items.toSorted((a, b) => String(a.dayData.date).localeCompare(String(b.dayData.date)))
}

/**
 * Formata o rótulo legível de um serviço autorizado dentro de uma elegibilidade.
 */
export function formatEligibilityServiceLabel(elig, serviceId) {
  if (!serviceId) return 'Não vou neste trecho'
  const all = [...(elig?.outboundServices || []), ...(elig?.returnServices || [])]
  const found = all.find((s) => s.id === serviceId)
  return found ? formatServiceSummary(found, { includeDirection: false }) : `Serviço #${serviceId}`
}
