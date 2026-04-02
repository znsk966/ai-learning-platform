import React from 'react';

const fileIcons = {
  '.py': '🐍',
  '.ipynb': '📓',
  '.pdf': '📄',
  '.zip': '📦',
  '.csv': '📊',
  '.json': '📋',
  '.txt': '📝',
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileDownloadList = ({ files }) => {
  if (!files || files.length === 0) return null;

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Downloadable Files
      </h3>
      <div className="space-y-2">
        {files.map((file) => (
          <a
            key={file.id}
            href={file.download_url}
            download={file.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center min-w-0">
              <span className="text-2xl mr-3 flex-shrink-0">
                {fileIcons[file.file_type] || '📁'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">
                  {file.file_name}
                </p>
                {file.description && (
                  <p className="text-xs text-gray-500 truncate">{file.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center ml-4 flex-shrink-0">
              {file.file_size > 0 && (
                <span className="text-xs text-gray-400 mr-3">{formatFileSize(file.file_size)}</span>
              )}
              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default FileDownloadList;
