/**
 * SVG Chart Generation
 * Creates SVG charts for WhatsApp chat statistics
 */

// Colors for members
const COLORS = [
    "#2196F3",  // Blue
    "#4CAF50",  // Green
    "#FF9800",  // Orange
    "#E91E63",  // Pink
    "#9C27B0",  // Purple
    "#00BCD4",  // Cyan
    "#FF5722",  // Deep Orange
    "#795548",  // Brown
    "#607D8B",  // Blue Grey
    "#F44336",  // Red
];

/**
 * Generate horizontal bar chart SVG
 */
function generateBarChart(data, title, options = {}) {
    const {
        width = 800,
        height = 500,
        barColor = "#4CAF50",
        dateRange = ""
    } = options;
    
    if (!data || data.length === 0) return '';
    
    // Sort by value descending
    data = [...data].sort((a, b) => b.value - a.value);
    
    const marginLeft = 150;
    const marginRight = 100;
    const marginTop = 70;
    const marginBottom = 40;
    
    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;
    
    const maxValue = Math.max(...data.map(d => d.value));
    const barHeight = Math.min(35, chartHeight / data.length - 5);
    const barSpacing = chartHeight / data.length;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<style>
  .title { font: bold 20px sans-serif; }
  .subtitle { font: 12px sans-serif; fill: #666; }
  .label { font: 14px sans-serif; }
  .value { font: bold 12px sans-serif; fill: #333; }
  .bar { transition: opacity 0.2s; }
  .bar:hover { opacity: 0.8; }
</style>
<rect width="${width}" height="${height}" fill="white"/>
<text x="${width/2}" y="35" text-anchor="middle" class="title">${title}</text>`;
    
    if (dateRange) {
        svg += `\n<text x="${width/2}" y="55" text-anchor="middle" class="subtitle">${dateRange}</text>`;
    }
    
    for (let i = 0; i < data.length; i++) {
        const { label, value } = data[i];
        const y = marginTop + i * barSpacing + (barSpacing - barHeight) / 2;
        const barWidth = maxValue > 0 ? (value / maxValue) * chartWidth : 0;
        
        svg += `
<rect class="bar" x="${marginLeft}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${barColor}" rx="3"/>
<text x="${marginLeft - 10}" y="${y + barHeight/2 + 5}" text-anchor="end" class="label">${label}</text>
<text x="${marginLeft + barWidth + 10}" y="${y + barHeight/2 + 5}" class="value">${value.toLocaleString('de-DE')}</text>`;
    }
    
    svg += '\n</svg>';
    return svg;
}

/**
 * Generate line chart SVG for timeline data
 */
function generateTimelineChart(data, members, title, options = {}) {
    const {
        width = 1200,
        height = 600,
        dateRange = ""
    } = options;
    
    if (!data || Object.keys(data).length === 0) return '';
    
    // Get all time periods and sort them
    const allPeriods = new Set();
    for (const memberData of Object.values(data)) {
        Object.keys(memberData).forEach(p => allPeriods.add(p));
    }
    const sortedPeriods = Array.from(allPeriods).sort();
    
    if (sortedPeriods.length === 0) return '';
    
    const marginLeft = 80;
    const marginRight = 180;
    const marginTop = 80;
    const marginBottom = 80;
    
    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;
    
    // Calculate max value
    let maxValue = 0;
    for (const memberData of Object.values(data)) {
        for (const count of Object.values(memberData)) {
            maxValue = Math.max(maxValue, count);
        }
    }
    if (maxValue === 0) maxValue = 1;
    
    const xScale = sortedPeriods.length > 1 ? chartWidth / (sortedPeriods.length - 1) : chartWidth;
    const yScale = chartHeight / maxValue;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<style>
  .title { font: bold 20px sans-serif; }
  .subtitle { font: 12px sans-serif; fill: #666; }
  .axis-label { font: 12px sans-serif; fill: #666; }
  .legend-label { font: 12px sans-serif; }
  .grid-line { stroke: #e0e0e0; stroke-width: 1; }
  .line { fill: none; stroke-width: 2; }
  .line:hover { stroke-width: 3; }
</style>
<rect width="${width}" height="${height}" fill="white"/>
<text x="${width/2}" y="30" text-anchor="middle" class="title">${title}</text>`;
    
    if (dateRange) {
        svg += `\n<text x="${width/2}" y="50" text-anchor="middle" class="subtitle">${dateRange}</text>`;
    }
    
    // Grid lines
    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
        const y = marginTop + chartHeight - (i * chartHeight / numGridLines);
        const value = Math.round(i * maxValue / numGridLines);
        svg += `\n<line x1="${marginLeft}" y1="${y}" x2="${marginLeft + chartWidth}" y2="${y}" class="grid-line"/>`;
        svg += `\n<text x="${marginLeft - 10}" y="${y + 4}" text-anchor="end" class="axis-label">${value}</text>`;
    }
    
    // X-axis labels
    const numLabels = Math.min(12, sortedPeriods.length);
    const labelStep = Math.max(1, Math.floor(sortedPeriods.length / numLabels));
    
    for (let i = 0; i < sortedPeriods.length; i++) {
        if (i % labelStep === 0 || i === sortedPeriods.length - 1) {
            const x = marginLeft + i * xScale;
            const label = sortedPeriods[i].substring(2); // Show YY-MM
            svg += `\n<text x="${x}" y="${marginTop + chartHeight + 20}" text-anchor="middle" class="axis-label" transform="rotate(-45 ${x} ${marginTop + chartHeight + 20})">${label}</text>`;
        }
    }
    
    // Draw lines for each member
    const sortedMembers = members.sort();
    
    for (let idx = 0; idx < sortedMembers.length; idx++) {
        const member = sortedMembers[idx];
        const memberData = data[member] || {};
        const color = COLORS[idx % COLORS.length];
        
        const points = sortedPeriods.map((period, i) => {
            const x = marginLeft + i * xScale;
            const count = memberData[period] || 0;
            const y = marginTop + chartHeight - (count * yScale);
            return `${x},${y}`;
        });
        
        if (points.length > 0) {
            svg += `\n<path d="M${points.join(' L')}" class="line" stroke="${color}" data-member="${member}"/>`;
        }
    }
    
    // Legend
    const legendX = marginLeft + chartWidth + 20;
    let legendY = marginTop;
    
    for (let idx = 0; idx < sortedMembers.length; idx++) {
        const member = sortedMembers[idx];
        const color = COLORS[idx % COLORS.length];
        const y = legendY + idx * 22;
        
        svg += `\n<rect x="${legendX}" y="${y}" width="15" height="15" fill="${color}"/>`;
        svg += `\n<text x="${legendX + 20}" y="${y + 12}" class="legend-label">${member}</text>`;
    }
    
    svg += '\n</svg>';
    return svg;
}

/**
 * Generate hourly activity chart SVG
 */
function generateHourlyChart(data, members, title, options = {}) {
    const {
        width = 1200,
        height = 600,
        dateRange = ""
    } = options;
    
    if (!data || Object.keys(data).length === 0) return '';
    
    const hours = Array.from({length: 24}, (_, i) => i);
    
    const marginLeft = 80;
    const marginRight = 180;
    const marginTop = 80;
    const marginBottom = 60;
    
    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;
    
    // Calculate max value
    let maxValue = 0;
    for (const memberData of Object.values(data)) {
        for (const count of Object.values(memberData)) {
            maxValue = Math.max(maxValue, count);
        }
    }
    if (maxValue === 0) maxValue = 1;
    
    const xScale = chartWidth / 23;
    const yScale = chartHeight / maxValue;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<style>
  .title { font: bold 20px sans-serif; }
  .subtitle { font: 12px sans-serif; fill: #666; }
  .axis-label { font: 12px sans-serif; fill: #666; }
  .legend-label { font: 12px sans-serif; }
  .grid-line { stroke: #e0e0e0; stroke-width: 1; }
  .line { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
  .line:hover { stroke-width: 4; }
</style>
<rect width="${width}" height="${height}" fill="white"/>
<text x="${width/2}" y="30" text-anchor="middle" class="title">${title}</text>`;
    
    if (dateRange) {
        svg += `\n<text x="${width/2}" y="50" text-anchor="middle" class="subtitle">${dateRange}</text>`;
    }
    
    // Grid lines
    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
        const y = marginTop + chartHeight - (i * chartHeight / numGridLines);
        const value = Math.round(i * maxValue / numGridLines);
        svg += `\n<line x1="${marginLeft}" y1="${y}" x2="${marginLeft + chartWidth}" y2="${y}" class="grid-line"/>`;
        svg += `\n<text x="${marginLeft - 10}" y="${y + 4}" text-anchor="end" class="axis-label">${value}</text>`;
    }
    
    // X-axis labels (hours)
    for (const hour of hours) {
        const x = marginLeft + hour * xScale;
        svg += `\n<text x="${x}" y="${marginTop + chartHeight + 20}" text-anchor="middle" class="axis-label">${hour.toString().padStart(2, '0')}</text>`;
    }
    
    // X-axis title
    svg += `\n<text x="${marginLeft + chartWidth/2}" y="${marginTop + chartHeight + 45}" text-anchor="middle" class="axis-label" style="font-weight: bold;">Uhrzeit (Stunde)</text>`;
    
    // Draw lines for each member
    const sortedMembers = members.sort();
    
    for (let idx = 0; idx < sortedMembers.length; idx++) {
        const member = sortedMembers[idx];
        const memberData = data[member] || {};
        const color = COLORS[idx % COLORS.length];
        
        const points = hours.map(hour => {
            const x = marginLeft + hour * xScale;
            const count = memberData[hour] || 0;
            const y = marginTop + chartHeight - (count * yScale);
            return `${x},${y}`;
        });
        
        if (points.length > 0) {
            svg += `\n<path d="M${points.join(' L')}" class="line" stroke="${color}" data-member="${member}"/>`;
        }
    }
    
    // Legend
    const legendX = marginLeft + chartWidth + 20;
    let legendY = marginTop;
    
    for (let idx = 0; idx < sortedMembers.length; idx++) {
        const member = sortedMembers[idx];
        const color = COLORS[idx % COLORS.length];
        const y = legendY + idx * 22;
        
        svg += `\n<rect x="${legendX}" y="${y}" width="15" height="15" fill="${color}"/>`;
        svg += `\n<text x="${legendX + 20}" y="${y + 12}" class="legend-label">${member}</text>`;
    }
    
    svg += '\n</svg>';
    return svg;
}

// Export functions
window.Charts = {
    generateBarChart,
    generateTimelineChart,
    generateHourlyChart,
    COLORS
};
