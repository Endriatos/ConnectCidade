/**
 * Modo de atuação inicial para usuários ADMIN (apenas no primeiro login).
 * Mobile/tablet → cidadão; desktop → painel admin.
 * A troca manual no menu continua disponível depois.
 */
export function modoInicialAdminPorUserAgent() {
  if (navigator.userAgentData?.mobile != null) {
    return navigator.userAgentData.mobile ? 'CIDADAO' : 'ADMIN'
  }

  const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  return mobile ? 'CIDADAO' : 'ADMIN'
}

export function destinoInicialAdmin(modo) {
  return modo === 'CIDADAO' ? '/home' : '/admin/mapa'
}
