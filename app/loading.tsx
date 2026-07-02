export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" aria-busy="true" aria-label="불러오는 중">
      <div className="h-8 w-8 rounded-full border-2 border-brand-grey/30 border-t-brand-deep animate-spin" />
    </div>
  )
}
