const STATUS_MESSAGES = {
  401: 'Autenticação falhou. Verifique as credenciais do BIG-IP.',
  404: 'Virtual Server não encontrado. Verifique o nome e a partição.',
  503: 'Não foi possível alcançar o BIG-IP. Verifique o hostname/IP e a conectividade.',
  502: 'O BIG-IP retornou um erro inesperado. Verifique as permissões de acesso à API.',
}

export default function ErrorBanner({ error }) {
  if (!error) return null
  const friendly = STATUS_MESSAGES[error.status] || 'Erro ao processar a requisição.'
  const detail = error.message !== friendly ? error.message : null

  return (
    <div className="error-banner">
      <strong>{friendly}</strong>
      {detail && <span style={{ fontSize: 12, color: '#fca5a5', opacity: 0.8 }}>{detail}</span>}
    </div>
  )
}
