import type { TranscriptRecord } from '../types';
import { matchToolCalls } from '../utils/toolMatching';

interface StatsSummaryProps {
  records: TranscriptRecord[];
}

interface TranscriptStats {
  totalCalls: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  byTool: Map<string, ToolStats>;
}

interface ToolStats {
  toolName: string;
  total: number;
  success: number;
  failure: number;
}

function StatsSummary({ records }: StatsSummaryProps) {
  // Calculate statistics from records
  const calculateStats = (): TranscriptStats => {
    const matchedCalls = matchToolCalls(records);

    const totalCalls = matchedCalls.length;
    let successCount = 0;
    let failureCount = 0;

    // Map to store per-tool statistics
    const byTool = new Map<string, ToolStats>();

    for (const match of matchedCalls) {
      const toolName = match.toolUse.name;

      // Determine if this call was successful
      // Success: has toolResult AND is_error is not true
      // Failure: has toolResult AND is_error is true OR no toolResult
      const isSuccess = match.toolResult !== null && match.toolResult.is_error !== true;
      const isFailure = match.toolResult === null || match.toolResult.is_error === true;

      if (isSuccess) {
        successCount++;
      }

      if (isFailure) {
        failureCount++;
      }

      // Update per-tool statistics
      if (!byTool.has(toolName)) {
        byTool.set(toolName, {
          toolName,
          total: 0,
          success: 0,
          failure: 0,
        });
      }

      const toolStats = byTool.get(toolName)!;
      toolStats.total++;

      if (isSuccess) {
        toolStats.success++;
      }

      if (isFailure) {
        toolStats.failure++;
      }
    }

    // Calculate success rate
    const successRate = totalCalls > 0 ? (successCount / totalCalls) * 100 : 0;

    return {
      totalCalls,
      successCount,
      failureCount,
      successRate,
      byTool,
    };
  };

  const stats = calculateStats();

  // Sort tools alphabetically for the table
  const sortedTools = Array.from(stats.byTool.values()).sort((a, b) =>
    a.toolName.localeCompare(b.toolName)
  );

  // Determine success rate color
  const getSuccessRateColor = () => {
    if (stats.successRate >= 80) {
      return 'text-green-600';
    } else if (stats.successRate >= 50) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls Card */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Calls</h3>
          <p className="text-3xl font-bold text-gray-900" data-testid="total-calls-value">{stats.totalCalls}</p>
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Success</h3>
          <p className="text-3xl font-bold text-green-600" data-testid="success-count-value">{stats.successCount}</p>
        </div>

        {/* Failure Card */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Failed</h3>
          <p className="text-3xl font-bold text-red-600" data-testid="failure-count-value">{stats.failureCount}</p>
        </div>

        {/* Success Rate Card */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Success Rate</h3>
          <p className={`text-3xl font-bold ${getSuccessRateColor()}`} data-testid="success-rate-value">
            {stats.successRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* By Tool Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Statistics by Tool</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Failed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTools.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No tool calls found
                  </td>
                </tr>
              ) : (
                sortedTools.map((toolStats) => (
                  <tr key={toolStats.toolName} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {toolStats.toolName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {toolStats.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {toolStats.success}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {toolStats.failure}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StatsSummary;
