/**
 * Excel XML Spreadsheet (.xls) & CSV Exporter Utility
 * Generates formatted native spreadsheets compatible with Microsoft Excel, 
 * Google Sheets, Apple Numbers, and LibreOffice Calc.
 * 
 * Features:
 * - Bold styled header row with brand accent theme
 * - Automatic column width calculation based on maximum cell content length
 * - Clean borders and alternating row styling
 * - Preserves numbers and currency without loss of precision
 * - Text protection for SKUs and Barcodes
 */

function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Export data to formatted Excel Spreadsheet
 * @param {Object} options
 * @param {string} options.filename - Output filename without extension
 * @param {string} options.sheetName - Name of worksheet tab
 * @param {Array<{header: string, key: string, isText?: boolean, isCurrency?: boolean}>} options.columns - Column definitions
 * @param {Array<Object>} options.data - Array of row objects
 * @param {string} [options.storeName] - Store name to include in worksheet title
 * @param {Object} [options.totals] - Optional totals summary row
 */
export function exportToExcel({
  filename = 'Report',
  sheetName = 'Report',
  columns,
  data = [],
  storeName = 'ZENTARA Retail',
  totals = null
}) {
  if (!data || data.length === 0) {
    throw new Error('No data available to export.');
  }

  // Auto-generate columns if not explicitly passed
  const cols = columns && columns.length > 0 
    ? columns 
    : Object.keys(data[0]).map(key => ({
        header: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        key
      }));

  // 1. Calculate dynamic column widths based on longest content
  const colWidths = cols.map(col => {
    let maxCharLength = (col.header || '').length;

    data.forEach(row => {
      const val = row[col.key];
      const strVal = val !== null && val !== undefined ? String(val) : '';
      if (strVal.length > maxCharLength) {
        maxCharLength = strVal.length;
      }
    });

    if (totals && totals[col.key]) {
      const totalStr = String(totals[col.key]);
      if (totalStr.length > maxCharLength) maxCharLength = totalStr.length;
    }

    // Point width estimate: ~7.5 - 8.5 pt per character + padding
    const calculatedWidth = Math.max(maxCharLength * 8.2 + 26, 75);
    return Math.min(Math.max(calculatedWidth, 75), 320);
  });

  const cleanSheetName = escapeXml(sheetName.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));

  // 2. Build XML Spreadsheet
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
  xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';

  // Excel Styles Definition
  xml += ' <Styles>\n';
  
  // Normal/Default
  xml += '  <Style ss:ID="Default" ss:Name="Normal">\n';
  xml += '   <Alignment ss:Vertical="Center"/>\n';
  xml += '   <Font ss:FontName="Segoe UI, Calibri, sans-serif" ss:Size="10" ss:Color="#1C1917"/>\n';
  xml += '  </Style>\n';

  // Document Title Style
  xml += '  <Style ss:ID="DocTitle">\n';
  xml += '   <Alignment ss:Vertical="Center"/>\n';
  xml += '   <Font ss:FontName="Segoe UI, Calibri, sans-serif" ss:Size="14" ss:Bold="1" ss:Color="#7C2D12"/>\n';
  xml += '  </Style>\n';

  // Subtitle / Metadata Style
  xml += '  <Style ss:ID="DocMeta">\n';
  xml += '   <Alignment ss:Vertical="Center"/>\n';
  xml += '   <Font ss:FontName="Segoe UI, Calibri, sans-serif" ss:Size="9" ss:Italic="1" ss:Color="#78716C"/>\n';
  xml += '  </Style>\n';

  // Table Header Row: Bold, White on Warm Terracotta Accent, Centered with Borders
  xml += '  <Style ss:ID="HeaderRow">\n';
  xml += '   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>\n';
  xml += '   <Font ss:FontName="Segoe UI, Calibri, sans-serif" ss:Size="10.5" ss:Bold="1" ss:Color="#FFFFFF"/>\n';
  xml += '   <Interior ss:Color="#852D12" ss:Pattern="Solid"/>\n';
  xml += '   <Borders>\n';
  xml += '    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#431407"/>\n';
  xml += '    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#9A3412"/>\n';
  xml += '    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#9A3412"/>\n';
  xml += '    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#9A3412"/>\n';
  xml += '   </Borders>\n';
  xml += '  </Style>\n';

  // Alternating Data Cells
  xml += '  <Style ss:ID="DataLeft">\n';
  xml += '   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>\n';
  xml += '   <Font ss:FontName="Segoe UI, Calibri, sans-serif" ss:Size="9.5" ss:Color="#1C1917"/>\n';
  xml += '   <Borders>\n';
  xml += '    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E5E4"/>\n';
  xml += '    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E5E4"/>\n';
  xml += '   </Borders>\n';
  xml += '  </Style>\n';

  xml += '  <Style ss:ID="DataCenter">\n';
  xml += '   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xml += '   <Font ss:FontName="Segoe UI, Calibri, sans-serif" ss:Size="9.5" ss:Color="#1C1917"/>\n';
  xml += '   <Borders>\n';
  xml += '    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E5E4"/>\n';
  xml += '    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E5E4"/>\n';
  xml += '   </Borders>\n';
  xml += '  </Style>\n';

  xml += '  <Style ss:ID="DataRight">\n';
  xml += '   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>\n';
  xml += '   <Font ss:FontName="Segoe UI, Calibri, sans-serif" ss:Size="9.5" ss:Color="#1C1917"/>\n';
  xml += '   <Borders>\n';
  xml += '    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E5E4"/>\n';
  xml += '    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E5E4"/>\n';
  xml += '   </Borders>\n';
  xml += '  </Style>\n';

  // Currency Style
  xml += '  <Style ss:ID="CurrencyCell">\n';
  xml += '   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>\n';
  xml += '   <Font ss:FontName="Segoe UI, Calibri, sans-serif" ss:Size="9.5" ss:Color="#1C1917"/>\n';
  xml += '   <NumberFormat ss:Format="#,##0.00"/>\n';
  xml += '   <Borders>\n';
  xml += '    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E5E4"/>\n';
  xml += '    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E5E4"/>\n';
  xml += '   </Borders>\n';
  xml += '  </Style>\n';

  // Totals Row Style (Bold with Top & Double Bottom Border)
  xml += '  <Style ss:ID="TotalsRow">\n';
  xml += '   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>\n';
  xml += '   <Font ss:FontName="Segoe UI, Calibri, sans-serif" ss:Size="10" ss:Bold="1" ss:Color="#1C1917"/>\n';
  xml += '   <Interior ss:Color="#F5F5F4" ss:Pattern="Solid"/>\n';
  xml += '   <Borders>\n';
  xml += '    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#78716C"/>\n';
  xml += '    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#44403C"/>\n';
  xml += '   </Borders>\n';
  xml += '  </Style>\n';

  xml += '  <Style ss:ID="TotalsRowLabel">\n';
  xml += '   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>\n';
  xml += '   <Font ss:FontName="Segoe UI, Calibri, sans-serif" ss:Size="10" ss:Bold="1" ss:Color="#1C1917"/>\n';
  xml += '   <Interior ss:Color="#F5F5F4" ss:Pattern="Solid"/>\n';
  xml += '   <Borders>\n';
  xml += '    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#78716C"/>\n';
  xml += '    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#44403C"/>\n';
  xml += '   </Borders>\n';
  xml += '  </Style>\n';

  xml += ' </Styles>\n';

  // Worksheet
  xml += ` <Worksheet ss:Name="${cleanSheetName}">\n`;
  xml += '  <Table>\n';

  // Column Specifications with Auto-Calculated Widths
  colWidths.forEach(w => {
    xml += `   <Column ss:Width="${w.toFixed(1)}" ss:AutoFitWidth="1"/>\n`;
  });

  // Top Title Row
  xml += '   <Row ss:Height="24">\n';
  xml += `    <Cell ss:StyleID="DocTitle"><Data ss:Type="String">${escapeXml(storeName.toUpperCase())} — ${escapeXml(sheetName)}</Data></Cell>\n`;
  xml += '   </Row>\n';

  // Metadata Row: Generated timestamp
  const nowStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  xml += '   <Row ss:Height="18">\n';
  xml += `    <Cell ss:StyleID="DocMeta"><Data ss:Type="String">Generated on: ${escapeXml(nowStr)} | Total Records: ${data.length}</Data></Cell>\n`;
  xml += '   </Row>\n';

  // Blank spacer row
  xml += '   <Row ss:Height="8"/>\n';

  // 3. TABLE HEADER ROW (BOLD, COLORED, PROPER PADDING)
  xml += '   <Row ss:Height="26">\n';
  cols.forEach(col => {
    xml += `    <Cell ss:StyleID="HeaderRow"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>\n`;
  });
  xml += '   </Row>\n';

  // 4. DATA ROWS
  data.forEach(row => {
    xml += '   <Row ss:Height="21">\n';
    cols.forEach(col => {
      const rawVal = row[col.key];

      if (rawVal === null || rawVal === undefined) {
        xml += '    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">-</Data></Cell>\n';
        return;
      }

      const isNumeric = typeof rawVal === 'number' && !col.isText;
      const isBoolean = typeof rawVal === 'boolean';

      if (isNumeric) {
        const style = col.isCurrency ? 'CurrencyCell' : 'DataRight';
        xml += `    <Cell ss:StyleID="${style}"><Data ss:Type="Number">${rawVal}</Data></Cell>\n`;
      } else if (isBoolean) {
        xml += `    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${rawVal ? 'Yes' : 'No'}</Data></Cell>\n`;
      } else {
        // String / Barcode / SKU / Date
        const strVal = String(rawVal);
        // Center dates, status, or short codes
        const isShortOrDate = /^\d{4}-\d{2}-\d{2}/.test(strVal) || strVal.length <= 8;
        const style = isShortOrDate ? 'DataCenter' : 'DataLeft';
        xml += `    <Cell ss:StyleID="${style}"><Data ss:Type="String">${escapeXml(strVal)}</Data></Cell>\n`;
      }
    });
    xml += '   </Row>\n';
  });

  // 5. OPTIONAL TOTALS ROW
  if (totals && typeof totals === 'object') {
    xml += '   <Row ss:Height="24">\n';
    cols.forEach((col, idx) => {
      if (idx === 0) {
        xml += `    <Cell ss:StyleID="TotalsRowLabel"><Data ss:Type="String">TOTALS / SUMMARY</Data></Cell>\n`;
      } else if (totals[col.key] !== undefined) {
        const totVal = totals[col.key];
        const isNum = typeof totVal === 'number' && !col.isText;
        if (isNum) {
          xml += `    <Cell ss:StyleID="TotalsRow"><Data ss:Type="Number">${totVal}</Data></Cell>\n`;
        } else {
          xml += `    <Cell ss:StyleID="TotalsRow"><Data ss:Type="String">${escapeXml(String(totVal))}</Data></Cell>\n`;
        }
      } else {
        xml += `    <Cell ss:StyleID="TotalsRow"><Data ss:Type="String"></Data></Cell>\n`;
      }
    });
    xml += '   </Row>\n';
  }

  xml += '  </Table>\n';
  xml += ' </Worksheet>\n';
  xml += '</Workbook>';

  // 6. Download as .xls File
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const dateStr = new Date().toISOString().slice(0, 10);
  const fullFilename = `${filename}_${dateStr}.xls`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', fullFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  return fullFilename;
}
