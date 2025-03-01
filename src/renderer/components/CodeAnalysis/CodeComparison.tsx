import React from 'react';
import DiffViewer from 'react-diff-viewer-continued';

interface ComparisonProps {
  oldCode: string;
  newCode: string;
  fileName: string;
}

const CodeComparison = ({ oldCode, newCode, fileName }: ComparisonProps) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <h3 className="text-lg font-medium mb-4">Code Changes: {fileName}</h3>
    <DiffViewer
      oldValue={oldCode}
      newValue={newCode}
      splitView={true}
      useDarkTheme={false}
    />
  </div>
);

export default CodeComparison;