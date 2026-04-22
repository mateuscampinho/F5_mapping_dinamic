export default function LoadingSpinner({ visible }) {
  if (!visible) return null
  return (
    <div className="spinner-overlay">
      <div className="spinner" />
    </div>
  )
}
