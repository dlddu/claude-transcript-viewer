import { useMemo } from 'react';
import { calculateTranscriptStats } from '../utils/statsCalculation';
import type { TranscriptRecord } from '../types';

interface StatsSummaryProps {
  records: TranscriptRecord[];
}

function StatsSummary({ records }: StatsSummaryProps) {
  // Memoize stats calculation to avoid recalculating on every render
  const stats = useMemo(() => calculateTranscriptStats(records), [records]);

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      {/* Heading */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Tool Usage Statistics</h2>

      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Calls Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" aria-label="Total tool calls">
          <div className="text-sm font-medium text-blue-700 mb-1">Total Calls</div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalCalls}</div>
        </div>

        {/* Success Count Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4" aria-label="Successful tool calls">
          <div className="text-sm font-medium text-green-700 mb-1">Success</div>
          <div className="text-2xl font-bold text-green-900">{stats.successCount}</div>
        </div>

        {/* Failure Count Card */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" aria-label="Failed tool calls">
          <div className="text-sm font-medium text-red-700 mb-1">Failures</div>
          <div className="text-2xl font-bold text-red-900">{stats.failureCount}</div>
        </div>
      </div>

      {/* Success Rate Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6" aria-label="Success rate">
        <div className="text-sm font-medium text-gray-700 mb-1">Success Rate</div>
        <div className="text-2xl font-bold text-gray-900">{stats.successRate.toFixed(2)}%</div>
      </div>

      {/* Tool Breakdown Table */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Tool Breakdown</h3>
        {stats.byTool.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No tools used</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    Tool Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    Calls
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                    Errors
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.byTool.map((tool) => (
                  <tr key={tool.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                      {tool.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                      {tool.count}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                      {tool.errors}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsSummary;
