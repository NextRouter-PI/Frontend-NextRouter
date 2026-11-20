export function navigationItems(role) {
  const company = role === 'company'
  return [
    { to: '/', title: 'Home', icon: 'mdi-home' },
    { to: '/usuario', title: 'Usuário', icon: 'mdi-account' },
    { to: '/transporte', title: company ? 'Veículos' : 'Transporte', icon: company ? 'mdi-bus' : 'mdi-car' },
    { to: '/lista', title: company ? 'Rotas' : 'Lista', icon: company ? 'mdi-map-outline' : 'mdi-format-list-bulleted' },
    ...(company ? [
      { to: '/pontos-operacionais', title: 'Pontos', icon: 'mdi-map-marker-radius' },
      { to: '/usuarios', title: 'Usuários', icon: 'mdi-account-group' },
    ] : []),
    ...(['passenger', 'driver'].includes(role) ? [{ to: '/vinculos', title: 'Vínculo', icon: 'mdi-domain' }] : []),
  ]
}
