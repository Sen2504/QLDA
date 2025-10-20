/**
 * Loading Skeleton Component - Hiển thị placeholder khi đang load
 */

export function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="overflow-x-auto animate-pulse">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="text-xs uppercase bg-gray-100 text-gray-600">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-2">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-t">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-5 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="h-8 w-20 bg-gray-300 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ type = 'table', ...props }) {
  switch (type) {
    case 'table':
      return <TableSkeleton {...props} />;
    case 'card':
      return <CardSkeleton {...props} />;
    case 'list':
      return <ListSkeleton {...props} />;
    default:
      return <TableSkeleton {...props} />;
  }
}
