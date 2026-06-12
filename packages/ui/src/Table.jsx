import React from 'react';
import { Inbox } from 'lucide-react';

export const Table = ({
  columns,
  data,
  isLoading = false,
  loadingMessage = 'Loading data...',
  emptyTitle = 'No data found',
  emptyMessage = 'There is currently no data to display.',
  keyField = 'id',
}) => {
  return (
    <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-sm font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{loadingMessage}</span>
                  </div>
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-gray-50 p-4 rounded-full">
                      <Inbox size={40} className="text-gray-300" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-gray-500 font-bold text-lg tracking-tight">{emptyTitle}</p>
                      <p className="text-gray-400 text-sm max-w-xs text-center">{emptyMessage}</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={row[keyField] || rowIdx} className="transition-colors hover:bg-gray-50">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-6 py-4 text-gray-600 ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};