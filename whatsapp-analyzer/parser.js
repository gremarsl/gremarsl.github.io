/**
 * WhatsApp Chat Parser
 * Parses WhatsApp chat export files in the browser
 */

// Media message indicators
const MEDIA_INDICATORS = [
    'image omitted',
    'sticker omitted',
    'GIF omitted',
    'audio omitted',
    'video omitted',
    'Contact card omitted',
    'document omitted',
];

// Regex pattern for WhatsApp messages
// Handles optional LTR mark, date [DD.MM.YY, HH:MM:SS], sender, and message
const MESSAGE_PATTERN = /^\u200e?\[(\d{2}\.\d{2}\.\d{2}),\s(\d{2}:\d{2}:\d{2})\]\s([^:]+):\s(.*)$/;

/**
 * Check if message content indicates media
 */
function isMediaMessage(content) {
    const cleanContent = content.replace(/\u200e/g, '').trim();
    return MEDIA_INDICATORS.some(indicator => cleanContent.includes(indicator));
}

/**
 * Calculate character count for a message
 */
function calculateCharCount(content, isMedia) {
    if (isMedia) return 1; // Media messages count as 1 character
    return content.length;
}

/**
 * Parse a single line of WhatsApp chat
 */
function parseLine(line) {
    const match = line.match(MESSAGE_PATTERN);
    if (match) {
        return {
            date: match[1],
            time: match[2],
            sender: match[3],
            content: match[4]
        };
    }
    return null;
}

/**
 * Parse WhatsApp chat text and return messages
 */
function parseChat(text) {
    const lines = text.split('\n');
    const messages = [];
    let currentMessage = null;
    
    for (const line of lines) {
        const trimmedLine = line.trimEnd();
        const parsed = parseLine(trimmedLine);
        
        if (parsed) {
            // If we have a pending message, save it
            if (currentMessage) {
                messages.push(currentMessage);
            }
            
            const isMedia = isMediaMessage(parsed.content);
            const charCount = calculateCharCount(parsed.content, isMedia);
            
            currentMessage = {
                date: parsed.date,
                time: parsed.time,
                sender: parsed.sender,
                content: parsed.content,
                charCount: charCount,
                isMedia: isMedia
            };
        } else if (currentMessage && trimmedLine) {
            // Continuation line - append to current message
            currentMessage.content += '\n' + trimmedLine;
            if (!currentMessage.isMedia) {
                currentMessage.charCount = currentMessage.content.length;
            }
        }
    }
    
    // Don't forget the last message
    if (currentMessage) {
        messages.push(currentMessage);
    }
    
    return messages;
}

/**
 * Extract unique senders from messages
 */
function extractSenders(messages) {
    const senders = new Set();
    for (const msg of messages) {
        senders.add(msg.sender);
    }
    return Array.from(senders).sort();
}

/**
 * Filter messages to only include selected members
 */
function filterMessagesByMembers(messages, selectedMembers) {
    return messages.filter(msg => selectedMembers.includes(msg.sender));
}

/**
 * Calculate statistics from messages
 */
function calculateStats(messages, selectedMembers) {
    // Initialize member stats
    const memberStats = {};
    for (const member of selectedMembers) {
        memberStats[member] = {
            name: member,
            messageCount: 0,
            charCount: 0,
            mediaCount: 0
        };
    }
    
    // Group stats
    const groupStats = {
        totalMessages: 0,
        totalChars: 0,
        totalMedia: 0,
        firstMessageDate: null,
        lastMessageDate: null,
        messagesByDate: {},
        messagesByHour: {},
        messagesByWeekday: {}
    };
    
    // Initialize hours and weekdays
    for (let h = 0; h < 24; h++) {
        groupStats.messagesByHour[h] = 0;
    }
    for (let d = 0; d < 7; d++) {
        groupStats.messagesByWeekday[d] = 0;
    }
    
    // Messages over time per member
    const messagesOverTime = {};
    const messagesByHourPerMember = {};
    
    for (const member of selectedMembers) {
        messagesOverTime[member] = {};
        messagesByHourPerMember[member] = {};
        for (let h = 0; h < 24; h++) {
            messagesByHourPerMember[member][h] = 0;
        }
    }
    
    // Process messages
    for (const msg of messages) {
        if (!selectedMembers.includes(msg.sender)) continue;
        
        // Update member stats
        memberStats[msg.sender].messageCount++;
        memberStats[msg.sender].charCount += msg.charCount;
        if (msg.isMedia) {
            memberStats[msg.sender].mediaCount++;
        }
        
        // Update group stats
        groupStats.totalMessages++;
        groupStats.totalChars += msg.charCount;
        if (msg.isMedia) {
            groupStats.totalMedia++;
        }
        
        // Track date range
        if (!groupStats.firstMessageDate) {
            groupStats.firstMessageDate = msg.date;
        }
        groupStats.lastMessageDate = msg.date;
        
        // Messages by date
        if (!groupStats.messagesByDate[msg.date]) {
            groupStats.messagesByDate[msg.date] = 0;
        }
        groupStats.messagesByDate[msg.date]++;
        
        // Messages by hour
        const hour = parseInt(msg.time.split(':')[0]);
        groupStats.messagesByHour[hour]++;
        messagesByHourPerMember[msg.sender][hour]++;
        
        // Messages by weekday
        try {
            const [day, month, year] = msg.date.split('.');
            const date = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
            const weekday = date.getDay(); // 0 = Sunday
            // Convert to Monday = 0
            const adjustedWeekday = weekday === 0 ? 6 : weekday - 1;
            groupStats.messagesByWeekday[adjustedWeekday]++;
        } catch (e) {}
        
        // Messages over time (monthly)
        try {
            const [day, month, year] = msg.date.split('.');
            const period = `20${year}-${month}`;
            if (!messagesOverTime[msg.sender][period]) {
                messagesOverTime[msg.sender][period] = 0;
            }
            messagesOverTime[msg.sender][period]++;
        } catch (e) {}
    }
    
    // Calculate averages
    for (const member of selectedMembers) {
        const stats = memberStats[member];
        stats.avgCharsPerMessage = stats.messageCount > 0 
            ? stats.charCount / stats.messageCount 
            : 0;
    }
    
    groupStats.avgCharsPerMessage = groupStats.totalMessages > 0
        ? groupStats.totalChars / groupStats.totalMessages
        : 0;
    
    return {
        memberStats,
        groupStats,
        messagesOverTime,
        messagesByHourPerMember
    };
}

/**
 * Format date from DD.MM.YY to DD.MM.YYYY
 */
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const [day, month, year] = dateStr.split('.');
    return `${day}.${month}.20${year}`;
}

/**
 * Generate CSV export
 */
function generateCsvExport(memberStats, groupStats) {
    let csv = '=== MEMBER STATISTICS ===\n';
    csv += 'Name,Messages,Characters,Media,Avg Chars/Message\n';
    
    const sortedMembers = Object.values(memberStats)
        .sort((a, b) => b.messageCount - a.messageCount);
    
    for (const ms of sortedMembers) {
        csv += `${ms.name},${ms.messageCount},${ms.charCount},${ms.mediaCount},${ms.avgCharsPerMessage.toFixed(1)}\n`;
    }
    
    csv += '\n=== GROUP STATISTICS ===\n';
    csv += 'Metric,Value\n';
    csv += `Total Messages,${groupStats.totalMessages}\n`;
    csv += `Total Characters,${groupStats.totalChars}\n`;
    csv += `Total Media,${groupStats.totalMedia}\n`;
    csv += `Avg Chars/Message,${groupStats.avgCharsPerMessage.toFixed(1)}\n`;
    csv += `First Message,${formatDate(groupStats.firstMessageDate)}\n`;
    csv += `Last Message,${formatDate(groupStats.lastMessageDate)}\n`;
    
    return csv;
}

// Export functions for use in other modules
window.ChatParser = {
    parseChat,
    extractSenders,
    filterMessagesByMembers,
    calculateStats,
    formatDate,
    generateCsvExport
};
