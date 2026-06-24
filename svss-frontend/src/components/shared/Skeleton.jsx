import './Skeleton.css'

/** Single skeleton line */
export function SkeletonLine({ width = '100%', height = 14, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 6, ...style }}
      aria-hidden="true"
    />
  )
}

/** Full-page skeleton for table rows */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="table-skeleton" aria-busy="true" aria-label="Loading data…">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="table-skeleton__row">
          {Array.from({ length: cols }).map((__, c) => (
            <SkeletonLine
              key={c}
              width={c === 0 ? '40%' : c === cols - 1 ? '20%' : '70%'}
              height={12}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
