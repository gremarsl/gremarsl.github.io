/**
 * Main Application Logic
 * Handles file upload, user interaction, and chart rendering
 */

// State
let parsedMessages = [];
let allSenders = [];
let selectedMembers = [];

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const clearFile = document.getElementById('clearFile');
const membersSection = document.getElementById('membersSection');
const membersGrid = document.getElementById('membersGrid');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');

// Statistics elements
const totalMessages = document.getElementById('totalMessages');
const totalChars = document.getElementById('totalChars');
const totalMedia = document.getElementById('totalMedia');
const dateRange = document.getElementById('dateRange');

// Chart containers
const messagesChart = document.getElementById('messagesChart');
const charsChart = document.getElementById('charsChart');
const avgCharsChart = document.getElementById('avgCharsChart');
const timelineChart = document.getElementById('timelineChart');
const hourlyChart = document.getElementById('hourlyChart');
const weekdayChart = document.getElementById('weekdayChart');
const hourBarChart = document.getElementById('hourBarChart');

// Export buttons
const exportCsv = document.getElementById('exportCsv');
const exportSvg = document.getElementById('exportSvg');

// Current stats for export
let currentStats = null;

/**
 * Initialize event listeners
 */
function init() {
    // Upload area click
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    });
    
    // Clear file
    clearFile.addEventListener('click', resetState);
    
    // Analyze button
    analyzeBtn.addEventListener('click', runAnalysis);
    
    // Export buttons
    exportCsv.addEventListener('click', downloadCsv);
    exportSvg.addEventListener('click', downloadAllSvgs);
}

/**
 * Handle file selection
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

/**
 * Process uploaded file
 */
async function processFile(file) {
    if (!file.name.endsWith('.txt')) {
        alert('Bitte eine .txt Datei auswählen');
        return;
    }
    
    // Show file info
    fileName.textContent = file.name;
    fileInfo.hidden = false;
    uploadArea.hidden = true;
    
    // Read file
    const text = await file.text();
    
    // Parse chat
    parsedMessages = ChatParser.parseChat(text);
    allSenders = ChatParser.extractSenders(parsedMessages);
    
    // Show members section
    renderMemberSelection();
    membersSection.hidden = false;
    resultsSection.hidden = true;
}

/**
 * Render member selection checkboxes
 */
function renderMemberSelection() {
    membersGrid.innerHTML = '';
    
    // Filter out system senders (usually the group name or "You")
    const userSenders = allSenders.filter(s => {
        const lower = s.toLowerCase();
        return !lower.includes('messages and calls are end-to-end') &&
               !lower.includes('you created') &&
               !lower.includes('you were added');
    });
    
    for (const sender of userSenders) {
        const label = document.createElement('label');
        label.className = 'member-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = sender;
        checkbox.checked = true;
        
        const span = document.createElement('span');
        span.textContent = sender;
        
        // Count messages for this sender
        const count = parsedMessages.filter(m => m.sender === sender).length;
        const countSpan = document.createElement('span');
        countSpan.className = 'message-count';
        countSpan.textContent = `(${count.toLocaleString('de-DE')})`;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        label.appendChild(countSpan);
        membersGrid.appendChild(label);
    }
}

/**
 * Get selected members from checkboxes
 */
function getSelectedMembers() {
    const checkboxes = membersGrid.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * Run analysis with selected members
 */
async function runAnalysis() {
    selectedMembers = getSelectedMembers();
    
    if (selectedMembers.length === 0) {
        alert('Bitte mindestens ein Mitglied auswählen');
        return;
    }
    
    // Show loading
    loadingSection.hidden = false;
    resultsSection.hidden = true;
    
    // Give UI time to update
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Calculate stats
    const filteredMessages = ChatParser.filterMessagesByMembers(parsedMessages, selectedMembers);
    currentStats = ChatParser.calculateStats(filteredMessages, selectedMembers);
    
    // Render results
    renderResults(currentStats);
    
    // Hide loading, show results
    loadingSection.hidden = true;
    resultsSection.hidden = false;
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Render analysis results
 */
function renderResults(stats) {
    const { memberStats, groupStats, messagesOverTime, messagesByHourPerMember } = stats;
    
    // Format date range
    const dateRangeStr = `Zeitraum: ${ChatParser.formatDate(groupStats.firstMessageDate)} - ${ChatParser.formatDate(groupStats.lastMessageDate)}`;
    
    // Overview stats
    totalMessages.textContent = groupStats.totalMessages.toLocaleString('de-DE');
    totalChars.textContent = groupStats.totalChars.toLocaleString('de-DE');
    totalMedia.textContent = groupStats.totalMedia.toLocaleString('de-DE');
    dateRange.textContent = `${ChatParser.formatDate(groupStats.firstMessageDate)} - ${ChatParser.formatDate(groupStats.lastMessageDate)}`;
    
    // Prepare data for charts
    const memberArray = Object.values(memberStats);
    
    // Messages per person chart
    const messagesData = memberArray.map(m => ({ label: m.name, value: m.messageCount }));
    messagesChart.innerHTML = Charts.generateBarChart(messagesData, 'Nachrichten pro Person', {
        barColor: '#2196F3',
        dateRange: dateRangeStr
    });
    
    // Characters per person chart
    const charsData = memberArray.map(m => ({ label: m.name, value: m.charCount }));
    charsChart.innerHTML = Charts.generateBarChart(charsData, 'Zeichen pro Person', {
        barColor: '#4CAF50',
        dateRange: dateRangeStr
    });
    
    // Average chars per message chart
    const avgData = memberArray.map(m => ({ label: m.name, value: Math.round(m.avgCharsPerMessage) }));
    avgCharsChart.innerHTML = Charts.generateBarChart(avgData, 'Durchschnittliche Zeichen pro Nachricht', {
        barColor: '#FF9800',
        dateRange: dateRangeStr
    });
    
    // Timeline chart
    timelineChart.innerHTML = Charts.generateTimelineChart(
        messagesOverTime,
        selectedMembers,
        'Nachrichten im Zeitverlauf (monatlich)',
        { dateRange: dateRangeStr }
    );
    
    // Hourly activity chart
    hourlyChart.innerHTML = Charts.generateHourlyChart(
        messagesByHourPerMember,
        selectedMembers,
        'Aktivität nach Tageszeit (pro Person)',
        { dateRange: dateRangeStr }
    );
    
    // Weekday chart
    const weekdayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    const weekdayData = weekdayNames.map((name, i) => ({
        label: name,
        value: groupStats.messagesByWeekday[i] || 0
    }));
    weekdayChart.innerHTML = Charts.generateBarChart(weekdayData, 'Nachrichten nach Wochentag', {
        barColor: '#E91E63',
        dateRange: dateRangeStr,
        height: 400
    });
    
    // Hour bar chart
    const hourData = Array.from({length: 24}, (_, h) => ({
        label: `${h.toString().padStart(2, '0')}:00`,
        value: groupStats.messagesByHour[h] || 0
    }));
    hourBarChart.innerHTML = Charts.generateBarChart(hourData, 'Nachrichten nach Uhrzeit', {
        barColor: '#9C27B0',
        dateRange: dateRangeStr,
        height: 700
    });
}

/**
 * Reset application state
 */
function resetState() {
    parsedMessages = [];
    allSenders = [];
    selectedMembers = [];
    currentStats = null;
    
    fileInput.value = '';
    fileInfo.hidden = true;
    uploadArea.hidden = false;
    membersSection.hidden = true;
    loadingSection.hidden = true;
    resultsSection.hidden = true;
}

/**
 * Download CSV export
 */
function downloadCsv() {
    if (!currentStats) return;
    
    const csv = ChatParser.generateCsvExport(currentStats.memberStats, currentStats.groupStats);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'whatsapp_statistics.csv';
    link.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Download all SVGs as a zip (or individual files)
 */
function downloadAllSvgs() {
    const charts = [
        { id: 'messagesChart', name: 'messages_per_person.svg' },
        { id: 'charsChart', name: 'characters_per_person.svg' },
        { id: 'avgCharsChart', name: 'avg_chars_per_message.svg' },
        { id: 'timelineChart', name: 'messages_timeline.svg' },
        { id: 'hourlyChart', name: 'hourly_activity.svg' },
        { id: 'weekdayChart', name: 'messages_by_weekday.svg' },
        { id: 'hourBarChart', name: 'messages_by_hour.svg' },
    ];
    
    for (const chart of charts) {
        const container = document.getElementById(chart.id);
        const svg = container.querySelector('svg');
        if (svg) {
            const svgContent = svg.outerHTML;
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = chart.name;
            link.click();
            
            URL.revokeObjectURL(url);
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
