import { formatHour, formatWeekdays } from '@/utils/formatters'

export function buildEnrichedGroups({
  groups,
  points,
  services,
  vehicles,
  memberships,
  groupMemberships,
  policies,
  habitualRoutes,
}) {
  const pointsMap = new Map(points.map((p) => [p.id, p]))
  const vehiclesMap = new Map(vehicles.map((v) => [v.id, v]))
  const membershipsMap = new Map(memberships.map((m) => [m.id, m]))
  const policiesByGroup = new Map(policies.map((p) => [p.route_group, p]))

  return groups.map((group) => {
    const dest = pointsMap.get(group.destination)
    const groupServices = []
    for (const s of services) {
      if (s.route_group !== group.id) continue
      groupServices.push(
        Object.assign({}, s, {
          targetTimeLabel: formatHour(s.target_time),
          weekdaysLabel: formatWeekdays(s.weekdays),
          vehiclePlate: s.vehicle
            ? vehiclesMap.get(s.vehicle)?.plate || `Veículo #${s.vehicle}`
            : 'Sem veículo habitual',
          driverName: s.driver_membership
            ? membershipsMap.get(s.driver_membership)?.applicant_name || `Vínculo #${s.driver_membership}`
            : 'Sem motorista habitual',
          originName: s.origin ? pointsMap.get(s.origin)?.name || `Ponto #${s.origin}` : 'Garagem do veículo',
          destinationName: s.destination
            ? pointsMap.get(s.destination)?.name || `Ponto #${s.destination}`
            : dest?.name || `Ponto #${group.destination}`,
        }),
      )
    }

    const activeMembers = []
    for (const gm of groupMemberships) {
      if (gm.route_group !== group.id || gm.ended_at) continue
      const member = membershipsMap.get(gm.membership)
      const point = gm.transport_point ? pointsMap.get(gm.transport_point) : null
      activeMembers.push(
        Object.assign({}, gm, {
          applicantName: member?.applicant_name || `Vínculo #${gm.membership}`,
          passengerId: member?.passenger || null,
          pointName: point ? `${point.name} (${point.city}/${point.state})` : 'Sem ponto operacional',
        }),
      )
    }

    const groupRoutes = habitualRoutes.filter((r) => r.route_group === group.id)
    return {
      id: group.id,
      company: group.company,
      name: group.name,
      destinationId: group.destination,
      destinationName: dest ? `${dest.name} (${dest.city}/${dest.state})` : `Ponto #${group.destination}`,
      destinationCoords:
        dest && Number.isFinite(Number(dest.latitude)) && Number.isFinite(Number(dest.longitude))
          ? [Number(dest.latitude), Number(dest.longitude)]
          : null,
      policy: policiesByGroup.get(group.id) || null,
      services: groupServices,
      members: activeMembers,
      habitualRoutes: groupRoutes.filter((r) => r.kind === 'habitual'),
      sharedRoutes: groupRoutes.filter((r) => r.kind === 'shared'),
    }
  })
}
