import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]).filter(k => k !== 'timestamp'); // Keep raw headers mostly
  const csvRows = [];
  
  // Header row
  csvRows.push(['Time', ...headers].join(','));
  
  // Data rows
  for (const row of data) {
    const values = [
      new Date(row.timestamp || row.created_at).toISOString(),
      ...headers.map(header => row[header] ?? '')
    ];
    csvRows.push(values.join(','));
  }
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
