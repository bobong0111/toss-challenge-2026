// Korean search helper supporting initial consonant (chosung), syllable, and prefix matching
function matchKorean(target, query) {
    if (!query) return true;
    const t = target.toLowerCase();
    const q = query.toLowerCase();
    
    const CHOSUNG = [
        'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 
        'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ];
    
    function isStandaloneChosung(c) {
        const code = c.charCodeAt(0);
        return code >= 0x3131 && code <= 0x314E;
    }
    
    function getCharChosung(c) {
        const code = c.charCodeAt(0);
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const chosungIndex = Math.floor((code - 0xAC00) / 28 / 21);
            return CHOSUNG[chosungIndex];
        }
        return c;
    }
    
    function isMatchAt(start) {
        for (let i = 0; i < q.length; i++) {
            const tChar = t[start + i];
            const qChar = q[i];
            
            if (isStandaloneChosung(qChar)) {
                if (getCharChosung(tChar) !== qChar) {
                    return false;
                }
            } else {
                if (tChar !== qChar) {
                    return false;
                }
            }
        }
        return true;
    }
    
    const maxStart = t.length - q.length;
    for (let start = 0; start <= maxStart; start++) {
        if (isMatchAt(start)) {
            return true;
        }
    }
    return false;
}

// Check if slot falls within collaboration days and hours settings
function isWithinCollab(dayIdx, slotIdx) {
    const startDay = localStorage.getItem('toss_collab_days_start') || '월';
    const endDay = localStorage.getItem('toss_collab_days_end') || '금';
    const startHour = parseInt(localStorage.getItem('toss_collab_hours_start') || '9');
    const endHour = parseInt(localStorage.getItem('toss_collab_hours_end') || '18');

    const DAYS_MAP = { '월': 0, '화': 1, '수': 2, '목': 3, '금': 4, '토': 5, '일': 6 };
    const startDayIdx = DAYS_MAP[startDay] !== undefined ? DAYS_MAP[startDay] : 0;
    const endDayIdx = DAYS_MAP[endDay] !== undefined ? DAYS_MAP[endDay] : 4;

    // Check day range
    if (dayIdx < startDayIdx || dayIdx > endDayIdx) {
        return false;
    }

    // Check slot/hour range
    const slot = SLOTS[slotIdx];
    if (slot) {
        if (slot.startHour < startHour || slot.startHour >= endHour) {
            return false;
        }
    }
    return true;
}
function getInternalDayIdx(visualDayIdx) {
    if (visualDayIdx === 0) return 6;
    return visualDayIdx - 1;
}

function getVisualDayIdx(internalDayIdx) {
    if (internalDayIdx === 6) return 0;
    return internalDayIdx + 1;
}

function getDayName(internalDayIdx) {
    return DAYS[getVisualDayIdx(internalDayIdx)];
}

function showWeekendConfirmPopup(onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'vote-preview-overlay';
    overlay.style.zIndex = '5000';
    
    const modal = document.createElement('div');
    modal.className = 'vote-preview-modal';
    modal.style.maxWidth = '320px';
    modal.style.padding = '24px';
    modal.style.textAlign = 'center';
    
    modal.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; line-height: 1.5;">
            주말 회의를 선택하시겠습니까?
        </div>
        <div style="display: flex; gap: 10px; width: 100%;">
            <button id="btn-weekend-cancel" class="btn" style="flex: 1; height: 48px; border-radius: 12px; font-weight: 700; font-size: 14px; background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); cursor: pointer;">
                취소
            </button>
            <button id="btn-weekend-confirm" class="btn btn-primary" style="flex: 1; height: 48px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer;">
                선택하기
            </button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.classList.add('visible');
    }, 10);
    
    const cleanup = () => {
        overlay.classList.remove('visible');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    };
    
    document.getElementById('btn-weekend-cancel').addEventListener('click', () => {
        cleanup();
        if (onCancel) onCancel();
    });
    
    document.getElementById('btn-weekend-confirm').addEventListener('click', () => {
        cleanup();
        if (onConfirm) onConfirm();
    });
}

// 1. Data Definitions
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const SLOTS = [
    { label: '09:00 - 10:00', startHour: 9 },
    { label: '10:00 - 11:00', startHour: 10 },
    { label: '11:00 - 12:00', startHour: 11 },
    { label: '12:00 - 13:00', startHour: 12, isLunchTime: true }, // Lunch Block
    { label: '13:00 - 14:00', startHour: 13, isPostLunch: true }, // Post-lunch (Avoidance candidate)
    { label: '14:00 - 15:00', startHour: 14 },
    { label: '15:00 - 16:00', startHour: 15 },
    { label: '16:00 - 17:00', startHour: 16 },
    { label: '17:00 - 18:00', startHour: 17 }
];

// Participants configuration
let participants = [
    {
        id: 'p1',
        name: '김토스',
        role: 'required',
        enabled: true,
        avatarColor: '#3182f6',
        desc: '디자인1팀 / 팀장',
        constraints: []
    },
    {
        id: 'p2',
        name: '윤디자',
        role: 'required',
        enabled: false,
        avatarColor: '#24db67',
        desc: '디자인1팀 / 과장',
        constraints: [
            { day: 0, slot: 4, type: 'lunch', desc: '점심 직후 집중도 회복 희망 시간' },
            { day: 1, slot: 4, type: 'lunch', desc: '점심 직후 집중도 회복 희망 시간' },
            { day: 2, slot: 4, type: 'lunch', desc: '점심 직후 집중도 회복 희망 시간' },
            { day: 3, slot: 4, type: 'lunch', desc: '점심 직후 집중도 회복 희망 시간' }
        ]
    },
    {
        id: 'p3',
        name: '박디자',
        role: 'required',
        enabled: false,
        avatarColor: '#f04452',
        desc: '디자인1팀 / 대리',
        constraints: [
            { day: 2, slot: 0, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
            { day: 2, slot: 1, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
            { day: 2, slot: 2, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
            { day: 2, slot: 4, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
            { day: 2, slot: 5, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
            { day: 2, slot: 6, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
            { day: 2, slot: 7, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
            { day: 2, slot: 8, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' }
        ]
    },
    {
        id: 'p4',
        name: '정디자',
        role: 'required',
        enabled: false,
        avatarColor: '#a855f7',
        desc: '디자인1팀 / 주임',
        constraints: [
            { day: 0, slot: 5, type: 'busy', desc: '정기 주간 회의 (조정 불가)' },
            { day: 0, slot: 6, type: 'busy', desc: '정기 주간 회의 (조정 불가)' },
            { day: 3, slot: 1, type: 'busy', desc: '개발 스크럼 (조정 불가)' },
            { day: 3, slot: 2, type: 'busy', desc: '개발 스크럼 (조정 불가)' },
            { day: 1, slot: 6, type: 'busy', desc: '디자인 시스템 싱크', flexible: true }
        ]
    },
    {
        id: 'p5',
        name: '김마켓',
        role: 'optional',
        enabled: false,
        avatarColor: '#f97316',
        desc: '디자인1팀 / 사원',
        constraints: [
            { day: 1, slot: 0, type: 'busy', desc: '마케팅 대행사 미팅' },
            { day: 1, slot: 1, type: 'busy', desc: '마케팅 대행사 미팅' },
            { day: 3, slot: 0, type: 'busy', desc: '콘텐츠 검토 회의' },
            { day: 3, slot: 1, type: 'busy', desc: '콘텐츠 검토 회의' }
        ]
    },
    {
        id: 'p6',
        name: '한기획',
        role: 'optional',
        enabled: false,
        avatarColor: '#06b6d4',
        desc: '디자인1팀 / 인턴',
        constraints: [
            { day: 4, slot: 7, type: 'busy', desc: '개인 연구 집중 시간' },
            { day: 4, slot: 8, type: 'busy', desc: '개인 연구 집중 시간' }
        ]
    },
    {
        id: 'p7',
        name: '이플랫폼',
        role: 'optional',
        enabled: false,
        avatarColor: '#3182f6',
        desc: '디자인2팀 / 과장',
        constraints: [
            { day: 0, slot: 1, type: 'busy', desc: '플랫폼 운영 회의' },
            { day: 0, slot: 2, type: 'busy', desc: '플랫폼 운영 회의' }
        ]
    },
    {
        id: 'p8',
        name: '이디자',
        role: 'optional',
        enabled: false,
        avatarColor: '#24db67',
        desc: '디자인2팀 / 대리',
        constraints: [
            { day: 4, slot: 5, type: 'busy', desc: '디자인 피어 리뷰' }
        ]
    },
    {
        id: 'p9',
        name: '최개발',
        role: 'optional',
        enabled: false,
        avatarColor: '#a855f7',
        desc: '플랫폼개발팀 / 대리',
        constraints: [
            { day: 2, slot: 6, type: 'busy', desc: '인프라 점검' },
            { day: 2, slot: 7, type: 'busy', desc: '인프라 점검' }
        ]
    },
    {
        id: 'p10',
        name: '홍홍보',
        role: 'optional',
        enabled: false,
        avatarColor: '#f04452',
        desc: '브랜드홍보팀 / 주임',
        constraints: [
            { day: 3, slot: 5, type: 'busy', desc: '보도자료 배포 회의' }
        ]
    },
    {
        id: 'p11',
        name: '유플래너',
        role: 'optional',
        enabled: false,
        avatarColor: '#06b6d4',
        desc: '서비스기획팀 / 사원',
        constraints: [
            { day: 1, slot: 2, type: 'busy', desc: '백로그 그루밍' }
        ]
    },
    {
        id: 'p12',
        name: '강인사',
        role: 'optional',
        enabled: false,
        avatarColor: '#ff9800',
        desc: '피플팀 / 과장',
        constraints: [
            { day: 0, slot: 7, type: 'busy', desc: '인터뷰 배정' },
            { day: 0, slot: 8, type: 'busy', desc: '인터뷰 배정' }
        ]
    }
];

// Calendar busy slots for the 4 scenarios
let scheduleData = {};
let p1CustomSchedules = {}; // maps 'YYYY-MM-DD:dayIdx-slotIdx' key to { title: string, category: string, color: string }

function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDarkerColor(hex) {
    if (!hex || !hex.startsWith('#')) return '#1e5fcb';
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    
    let r_pct = r / 255;
    let g_pct = g / 255;
    let b_pct = b / 255;
    
    let max = Math.max(r_pct, g_pct, b_pct);
    let min = Math.min(r_pct, g_pct, b_pct);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r_pct: h = (g_pct - b_pct) / d + (g_pct < b_pct ? 6 : 0); break;
            case g_pct: h = (b_pct - r_pct) / d + 2; break;
            case b_pct: h = (r_pct - g_pct) / d + 4; break;
        }
        h /= 6;
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    let textL = Math.max(30, Math.min(l - 18, 42));
    return `hsl(${h}, ${s}%, ${textL}%)`;
}

function formatMentions(text) {
    if (!text) return '';
    if (text.includes('class="mention-tag"') || text.includes("class='mention-tag'")) {
        return text.replace(/(<span class="mention-tag"[^>]*>)@/gi, '$1');
    }
    let escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    return escaped.replace(/@([가-힣a-zA-Z0-9_]+)/g, (match, name) => {
        let color = '#3182f6'; // Default Toss blue
        
        // 1. Look in participants
        const pMatch = participants.find(p => p.name === name);
        if (pMatch && pMatch.avatarColor) {
            color = pMatch.avatarColor;
        } else {
            // 2. Look in PARTICIPANT_SCENARIO_ROSTER
            const scenarioMatch = PARTICIPANT_SCENARIO_ROSTER.find(p => p.name.replace(' · 나', '') === name);
            if (scenarioMatch && scenarioMatch.avatarColor) {
                color = scenarioMatch.avatarColor;
            }
        }
        
        // Convert hex to rgb for background transparency
        let rgb = '49, 130, 246';
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            rgb = `${r}, ${g}, ${b}`;
        }
        
        const textCol = getDarkerColor(color);
        return `<span class="mention-tag" style="display: inline-block; background-color: rgba(${rgb}, 0.08); color: ${textCol}; padding: 1.5px 8px; border-radius: 9999px; font-weight: 700; font-size: 9.5px; border: 1px solid rgba(${rgb}, 0.25); margin: 1.5px 3.5px; white-space: nowrap; vertical-align: middle;">${name}</span>`;
    });
}

function saveScheduleDataToLocalStorage() {
    localStorage.setItem('toss_schedule_data', JSON.stringify(scheduleData));
    localStorage.setItem('toss_p1_custom_schedules', JSON.stringify(p1CustomSchedules));
}

function loadScheduleDataFromLocalStorage() {
    const savedData = localStorage.getItem('toss_schedule_data');
    const savedCustom = localStorage.getItem('toss_p1_custom_schedules');
    
    if (savedData && savedCustom) {
        try {
            scheduleData = JSON.parse(savedData);
            p1CustomSchedules = JSON.parse(savedCustom);
            return true;
        } catch(e) {}
    }
    return false;
}

function syncFocusTimesToSchedules() {
    const monday = getMondayOf(selectedDate);
    const mondayStr = formatDate(monday);
    const excludes = getExcludeTimes();

    // 1. Remove any previous Focus Time slots from scheduleData[currentUserId] and p1CustomSchedules for this week
    if (scheduleData[currentUserId]) {
        scheduleData[currentUserId] = scheduleData[currentUserId].filter(key => {
            if (key.startsWith(`${mondayStr}:`)) {
                if (p1CustomSchedules[key] && p1CustomSchedules[key].title === '집중 시간') {
                    delete p1CustomSchedules[key];
                    return false;
                }
            }
            return true;
        });
    }

    // 2. Add new Focus Time slots based on the excludes list
    if (excludes && Array.isArray(excludes)) {
        excludes.forEach(exc => {
            const start = parseInt(exc.start);
            const end = parseInt(exc.end);
            
            // Loop over days of the week (Monday through Sunday, dayIdx 0 to 6)
            for (let day = 0; day < 7; day++) {
                // Loop over slots matching the exclusion hour range
                SLOTS.forEach((slot, slotIdx) => {
                    if (slot.startHour >= start && slot.startHour < end) {
                        const slotKey = `${mondayStr}:${day}-${slotIdx}`;
                        
                        if (!scheduleData[currentUserId]) {
                            scheduleData[currentUserId] = [];
                        }
                        if (!scheduleData[currentUserId].includes(slotKey)) {
                            scheduleData[currentUserId].push(slotKey);
                        }
                        p1CustomSchedules[slotKey] = {
                            title: '집중 시간',
                            category: 'focus',
                            color: '#8f5bf6'
                        };
                    }
                });
            }
        });
    }

    localStorage.setItem('toss_schedule_data', JSON.stringify(scheduleData));
    localStorage.setItem('toss_p1_custom_schedules', JSON.stringify(p1CustomSchedules));
}

function restoreScheduleData() {
    if (!loadScheduleDataFromLocalStorage()) {
        initializeDefaultScheduleData();
    }
    syncFocusTimesToSchedules();
}

function getKSTDate() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 9));
}

function getInitialDate() {
    const d = getKSTDate();
    const day = d.getDay();
    if (day === 0) { // Sunday
        d.setDate(d.getDate() + 1);
    } else if (day === 6) { // Saturday
        d.setDate(d.getDate() + 2);
    }
    return d;
}

const INITIAL_MONDAY_STR = formatDate(getMondayOf(getInitialDate()));

function initializeDefaultScheduleData() {
    const preset = SCENARIOS[currentScenario].busySlots;
    scheduleData = JSON.parse(JSON.stringify(preset));

    if (scheduleData[currentUserId]) {
        scheduleData[currentUserId] = scheduleData[currentUserId].map(key => {
            if (key.includes(':')) return key;
            return `${INITIAL_MONDAY_STR}:${key}`;
        });
    }

    p1CustomSchedules = {};
    const p1Busy = scheduleData[currentUserId] || [];
    p1Busy.forEach(slotKey => {
        const parts = slotKey.split(':');
        const relativeKey = parts[1] || parts[0];
        
        if (relativeKey === '0-0' || relativeKey === '0-1') {
            p1CustomSchedules[slotKey] = { title: '대행사 미팅', category: 'meeting', color: '#f97316' };
        } else if (relativeKey === '2-4' || relativeKey === '2-5' || relativeKey === '2-6') {
            p1CustomSchedules[slotKey] = { title: '삼성역 미팅 (외근)', category: 'out', color: '#f04452' };
        } else {
            p1CustomSchedules[slotKey] = { title: '개인 일정', category: 'work', color: '#3182f6' };
        }
    });

    // Restore user custom schedules (which includes confirmed meetings and custom edits)
    const userCustom = JSON.parse(localStorage.getItem('toss_user_custom_schedules') || '{}');
    Object.keys(userCustom).forEach(k => {
        if (!scheduleData[currentUserId]) scheduleData[currentUserId] = [];
        if (!scheduleData[currentUserId].includes(k)) {
            scheduleData[currentUserId].push(k);
        }
        p1CustomSchedules[k] = userCustom[k];
    });

    // Restore participant-specific confirmed slots from toss_busy_slots_${p.id}
    participants.forEach(p => {
        if (p.id === currentUserId) return;
        const key = `toss_busy_slots_${p.id}`;
        let list = [];
        try {
            const saved = localStorage.getItem(key);
            list = saved ? JSON.parse(saved) : [];
        } catch(e) {}
        
        if (!scheduleData[p.id]) scheduleData[p.id] = [];
        list.forEach(slot => {
            if (!scheduleData[p.id].includes(slot)) {
                scheduleData[p.id].push(slot);
            }
        });
    });

    saveScheduleDataToLocalStorage();
}

function resetP1CustomSchedules() {
    initializeDefaultScheduleData();
}

function getDaySchedules(dayIdx) {
    const busyList = scheduleData[currentUserId] || [];
    const mondayStr = formatDate(getMondayOf(selectedDate));
    const schedules = [];
    
    let slot = 0;
    while (slot < 9) {
        const slotKey = `${mondayStr}:${dayIdx}-${slot}`;
        const isLunch = SLOTS[slot].isLunchTime;
        const isBusy = busyList.includes(slotKey);
        
        if (isLunch && !isBusy) {
            schedules.push({ startSlot: slot, endSlot: slot + 1, isBusy: false, isLunchTime: true });
            slot++;
            continue;
        }
        
        if (!isBusy) {
            schedules.push({ startSlot: slot, endSlot: slot + 1, isBusy: false, isLunchTime: false });
            slot++;
            continue;
        }
        
        const custom = p1CustomSchedules[slotKey];
        let end = slot + 1;
        while (end < 9) {
            const nextKey = `${mondayStr}:${dayIdx}-${end}`;
            const nextIsLunch = SLOTS[end].isLunchTime;
            const nextIsBusy = busyList.includes(nextKey);
            
            if (nextIsLunch && !nextIsBusy) break;
            if (!nextIsBusy) break;
            
            const nextCustom = p1CustomSchedules[nextKey];
            const titleMatch = (custom && nextCustom) ? (custom.title === nextCustom.title && custom.category === nextCustom.category) : (!custom && !nextCustom);
            
            if (titleMatch) {
                end++;
            } else {
                break;
            }
        }
        
        schedules.push({ startSlot: slot, endSlot: end, isBusy: true, isLunchTime: false, custom });
        slot = end;
    }
    return schedules;
}

// 2. Scenario Presets
const SCENARIOS = {
    normal: {
        description: "시나리오 1: 기본 얼라인먼트 - 여유가 많으며 월/화요일에 모두 비어있는 100% 최적 시간이 존재합니다.",
        meetingDuration: '60',
        busySlots: {
            p1: ['0-0', '0-1', '2-4', '2-5', '2-6'],
            p2: ['0-1', '1-1', '1-2', '3-6', '4-1', '4-6'],
            p3: ['0-1', '0-2', '3-7'],
            p4: ['0-5', '0-6', '0-8', '1-6', '3-1', '3-2', '4-0'],
            p5: ['1-0', '1-1', '1-2', '3-0', '3-1', '4-1', '4-5'],
            p6: ['1-7', '2-5', '4-2', '4-7', '4-8']
        },
        homework: {} // WFH days mapping (not active)
    },
    tight: {
        description: "시나리오 2: 외근 및 이동 버퍼 - 외근이 겹치고, 외근 전후 '이동 버퍼 시간(30분)'을 보장하느라 조율이 타이트합니다.",
        meetingDuration: '60',
        busySlots: {
            p1: ['0-0', '0-1', '1-1', '1-2', '1-5', '2-1', '3-2', '3-5', '4-1', '4-2'],
            p2: ['0-1', '1-1', '1-2', '1-5', '2-5', '3-0', '3-7', '4-1', '4-2'],
            p3: ['0-1', '0-5', '1-2', '1-6', '3-1', '3-2', '3-5', '4-1', '4-5'], // Wednesday (2) is OOF
            p4: ['0-0', '0-5', '1-0', '1-1', '1-2', '1-6', '2-1', '2-7', '3-1', '3-2', '4-1', '4-5'],
            p5: ['0-1', '1-0', '1-1', '1-5', '2-5', '3-0', '3-1', '3-5', '4-0', '4-7'], // Tuesday & Thursday Morning WFH/Busy
            p6: ['0-5', '1-1', '1-2', '2-1', '3-2', '4-1', '4-7', '4-8']
        },
        travelBuffers: {
            p3: ['2-0', '2-4'] // Travel buffer slots
        }
    },
    impossible: {
        description: "시나리오 3: 3시간 워크숍 - 연속된 3시간(6칸)의 빈 시간 확보가 불가능하여, 1.5시간씩 '회의 분할 대안'을 제시합니다.",
        meetingDuration: '180', // 3 hours
        busySlots: {
            p1: ['0-0', '0-1', '0-5', '0-6', '1-5', '1-6', '2-1', '2-2', '3-5', '3-6', '4-1', '4-2'],
            p2: ['0-5', '0-6', '1-0', '1-1', '2-5', '2-6', '3-1', '3-2', '4-5', '4-6'],
            p3: ['0-1', '0-7', '1-5', '1-6', '3-5', '3-6', '4-1', '4-2'], // Wed OOF
            p4: ['0-0', '0-5', '0-6', '1-0', '1-1', '1-2', '2-0', '2-1', '3-1', '3-2', '3-5', '4-5', '4-6'],
            p5: ['0-5', '1-0', '1-1', '2-5', '3-0', '3-1', '4-1'],
            p6: ['0-1', '1-5', '1-6', '3-5', '4-7', '4-8']
        }
    },
    hybrid: {
        description: "시나리오 4: 하이브리드 재택 - 일부 팀원의 재택근무(WFH)로 인해 회의 성격이 온/오프라인 하이브리드로 자동 전환됩니다.",
        meetingDuration: '60',
        busySlots: {
            p1: ['0-0', '3-5', '3-6'],
            p2: ['1-1', '1-2', '4-1'],
            p3: ['0-1', '0-2', '3-7'],
            p4: ['0-5', '0-6', '3-1', '3-2', '1-6'],
            p5: ['1-0', '1-1', '3-0', '3-1', '4-5'],
            p6: ['4-7', '4-8', '2-5']
        },
        wfhDays: {
            p2: [0, 2], // Choi: Mon, Wed WFH
            p4: [3]     // Park: Thu WFH
        }
    }
};

let currentScenario = 'normal';
let currentViewMode = 'coordination'; // 'coordination' or 'my-schedule'
let selectedTimeSlots = []; // Array of slot indexes selected (for multi-slot mapping)
let currentRecommendations = [];
let currentPollState = null; // null, 'voting', 'completed'
let participantSelectedVotes = {};

const SIM_USERS = {
    'p1': { name: '김토스', email: 'toss@toss.im', role: '디자인1팀 / 팀장' },
    'p2': { name: '윤디자', email: 'toss2@toss2.im', role: '디자인1팀 / 과장' },
    'p3': { name: '박디자', email: 'park@toss.im', role: '디자인1팀 / 대리' },
    'p4': { name: '최개발', email: 'choi@toss.im', role: '디자인1팀 / 주임' }
};

let currentUserId = 'p1';
let currentMeetingRole = 'host'; // 'host' or 'participant'
let mockParticipantSession = null;
let participantVoteSubmitted = false;
let quickPollTimeoutId = null;
let hostConfirmationTimeoutId = null;

function syncProfileData(name, email, role) {
    // Find matching ID from email/name to update currentUserId dynamically
    let matchedId = 'p1';
    const cleanEmail = email.trim().toLowerCase();
    for (const [id, info] of Object.entries(SIM_USERS)) {
        if (info.email.toLowerCase() === cleanEmail || info.name === name || id === cleanEmail) {
            matchedId = id;
            break;
        }
    }
    currentUserId = matchedId;

    // Update Host participant details
    if (participants && participants[0]) {
        participants[0].name = name;
        participants[0].desc = role;
    }

    // Update My Page Text Fields
    const mypageUserName = document.getElementById('mypage-user-name');
    const mypageUserRole = document.getElementById('mypage-user-role');
    const mypageUserEmail = document.getElementById('mypage-user-email');
    if (mypageUserName) mypageUserName.innerText = name;
    if (mypageUserRole) mypageUserRole.innerText = role;
    if (mypageUserEmail) mypageUserEmail.innerText = email;

    // Update Avatars (First char)
    const badges = document.querySelectorAll('.quick-profile-badge');
    badges.forEach(b => {
        b.innerText = name.charAt(0);
    });

    // Update header user profiles
    const quickLoginName = document.getElementById('quick-login-name');
    const quickLoginEmail = document.getElementById('quick-login-email');
    if (quickLoginName) quickLoginName.innerText = name;
    if (quickLoginEmail) quickLoginEmail.innerText = role;

    // Update settings popover user info
    const settingsUserName = document.getElementById('settings-user-name');
    const settingsUserRole = document.getElementById('settings-user-role');
    if (settingsUserName) settingsUserName.innerText = name;
    if (settingsUserRole) settingsUserRole.innerText = role;

    // Update settings popover profile button text (first letter of name)
    const profiles = document.querySelectorAll('.btn-utility-profile');
    profiles.forEach(p => {
        p.innerText = name.charAt(0);
    });

    // Update personal calendar header title
    const personalCalendarTitle = document.getElementById('personal-calendar-title');
    if (personalCalendarTitle) {
        personalCalendarTitle.innerText = `${name}님의 일정`;
    }

    // Update setup wizard elements
    const wizCalTitle = document.getElementById('cal-section-title');
    if (wizCalTitle && currentViewMode === 'my-schedule') {
        wizCalTitle.innerText = `내 일정 편집 (${name})`;
    }

    // Re-render
    renderWorkspaceCalendar();
    renderParticipants();
    calculateRecommendations();
    renderCalendar();
}

function getActiveSession() {
    const sessData = localStorage.getItem('toss_shared_meeting_session');
    if (sessData) {
        try {
            return JSON.parse(sessData);
        } catch(e) {}
    }
    return null;
}

function syncSessionUI() {
    const configCard = document.getElementById('config-card-section');
    const readOnlyBadge = document.getElementById('participant-read-only-badge');
    const meetingNameInput = document.getElementById('meeting-name');
    const durationSelect = document.getElementById('meeting-duration');
    const durationSelector = document.getElementById('duration-selector');

    if (currentMeetingRole === 'participant') {
        // Sync inputs
        if (meetingNameInput && mockParticipantSession) {
            meetingNameInput.value = mockParticipantSession.title;
        }
        if (durationSelect && mockParticipantSession) {
            durationSelect.value = mockParticipantSession.duration;
        }
        
        if (configCard) configCard.classList.add('read-only');
        if (meetingNameInput) meetingNameInput.readOnly = true;
        
        // Lock duration selector buttons
        if (durationSelector) {
            const btns = durationSelector.querySelectorAll('button');
            btns.forEach(btn => {
                btn.style.pointerEvents = 'none';
                const val = btn.getAttribute('data-value');
                if (parseInt(val) === 60) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
    } else {
        // Host mode
        const session = getActiveSession();
        if (session && session.status === 'coordinating') {
            if (meetingNameInput) meetingNameInput.value = session.title;
            if (durationSelect) durationSelect.value = session.duration;
        }

        if (configCard) configCard.classList.remove('read-only');
        if (readOnlyBadge) readOnlyBadge.style.display = 'none';
        if (meetingNameInput) meetingNameInput.readOnly = false;
        if (durationSelector) {
            const btns = durationSelector.querySelectorAll('button');
            btns.forEach(btn => btn.style.pointerEvents = 'auto');
        }
    }
}
function getMondayOf(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

const today = getInitialDate();
let selectedDate = new Date(today);
let tempSelectedDate = new Date(today);
let currentDisplayedYear = today.getFullYear();
let currentDisplayedMonth = today.getMonth();
let startOffsetDay = getMondayOf(selectedDate).getDate();

// Recreate "삼성역 미팅 (외근)" (Wednesday 13-16) if missing
try {
    const tempDate = getInitialDate();
    const tempMonday = getMondayOf(tempDate);
    const tempMondayStr = formatDate(tempMonday);
    
    let currentSchedules = JSON.parse(localStorage.getItem('toss_schedule_data') || '{}');
    let currentCustom = JSON.parse(localStorage.getItem('toss_p1_custom_schedules') || '{}');
    let userCustom = JSON.parse(localStorage.getItem('toss_user_custom_schedules') || '{}');
    
    if (!currentSchedules['p1']) currentSchedules['p1'] = [];
    
    const targetSlots = ['2-4', '2-5', '2-6'];
    let needsRecreate = targetSlots.some(s => !currentSchedules['p1'].includes(`${tempMondayStr}:${s}`));
    
    if (needsRecreate) {
        targetSlots.forEach(s => {
            const key = `${tempMondayStr}:${s}`;
            if (!currentSchedules['p1'].includes(key)) {
                currentSchedules['p1'].push(key);
            }
            const meetingDetails = { title: '삼성역 미팅 (외근)', category: 'out', color: '#f04452' };
            currentCustom[key] = meetingDetails;
            userCustom[key] = meetingDetails;
        });
        
        localStorage.setItem('toss_schedule_data', JSON.stringify(currentSchedules));
        localStorage.setItem('toss_p1_custom_schedules', JSON.stringify(currentCustom));
        localStorage.setItem('toss_user_custom_schedules', JSON.stringify(userCustom));
    }
} catch(e) {
    console.error("Error recreating Samsung meeting:", e);
}

// Initialize with normal scenario
if (loadScheduleDataFromLocalStorage()) {
    // Force delete only Friday "연차" and "개인 일정" custom schedules, and remove from scheduleData[currentUserId]
    Object.keys(p1CustomSchedules).forEach(key => {
        if (key.includes(':4-') && (p1CustomSchedules[key].title === '연차' || p1CustomSchedules[key].title === '개인 일정')) {
            delete p1CustomSchedules[key];
            if (scheduleData[currentUserId]) {
                scheduleData[currentUserId] = scheduleData[currentUserId].filter(slotKey => slotKey !== key);
            }
        }
    });
    saveScheduleDataToLocalStorage();
} else {
    scheduleData = SCENARIOS[currentScenario].busySlots;
    resetP1CustomSchedules();
}

// Navigation & Back button History API support
function navigateBackToLanding() {
    const setupContainer = document.getElementById('workspace-landing');
    const dashboardContainer = document.getElementById('coordination-dashboard');
    if (setupContainer && dashboardContainer) {
        restoreScheduleData();
        currentMeetingRole = 'host';
        
        setupContainer.style.display = 'flex';
        dashboardContainer.style.display = 'none';
        document.body.classList.add('view-landing');
        
        if (renderWizardGridGlobal) renderWizardGridGlobal();
        renderWorkspaceCalendar();
        
        const wizSearchInput = document.getElementById('wiz-search-input');
        if (renderSearchResultsGlobal) {
            renderSearchResultsGlobal(wizSearchInput ? wizSearchInput.value : '');
        }
        
        if (!participantVoteSubmitted) {
            showMessagePopover();
        } else {
            hideMessagePopover(true);
        }
        
        if (location.hash !== '#landing') {
            history.replaceState({ page: 'landing' }, '', '#landing');
        }
        showToast("일정 수정 화면으로 돌아왔습니다.");
    }
}

window.addEventListener('popstate', (event) => {
    const state = event.state;
    if (state && state.page === 'landing') {
        navigateBackToLanding();
    } else if (location.hash === '#landing' || !location.hash) {
        navigateBackToLanding();
    } else if (state && state.page === 'dashboard') {
        const setupContainer = document.getElementById('workspace-landing');
        const dashboardContainer = document.getElementById('coordination-dashboard');
        if (setupContainer && dashboardContainer) {
            setupContainer.style.display = 'none';
            dashboardContainer.style.display = 'flex';
            document.body.classList.remove('view-landing');
            hideMessagePopover(true);
        }
    }
});

// 3. System States & DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Render Host's personal schedule on the Workspace page
function renderWorkspaceCalendar() {
    const grid = document.getElementById('my-workspace-calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Render spacer cell
    const corner = document.createElement('div');
    corner.className = 'grid-header';
    corner.innerText = '시간';
    corner.style.gridColumn = '1';
    corner.style.gridRow = '1';
    grid.appendChild(corner);

    const monday = getMondayOf(selectedDate);
    DAYS.forEach((day, visualDayIdx) => {
        const dayIdx = getInternalDayIdx(visualDayIdx);
        const header = document.createElement('div');
        header.className = 'grid-header';
        if (visualDayIdx === 0 || visualDayIdx === 6) {
            header.className += ' weekend-header';
        }
        header.style.gridColumn = (visualDayIdx + 2).toString();
        header.style.gridRow = '1';
        if (visualDayIdx === DAYS.length - 1) {
            header.style.borderRight = 'none';
        }
        
        const currentDayDate = new Date(monday);
        currentDayDate.setDate(monday.getDate() + (visualDayIdx - 1));
        
        const m = currentDayDate.getMonth() + 1;
        const d = currentDayDate.getDate();
        
        const todayObj = getKSTDate();
        const isToday = currentDayDate.getFullYear() === todayObj.getFullYear() &&
                        currentDayDate.getMonth() === todayObj.getMonth() &&
                        currentDayDate.getDate() === todayObj.getDate();
        if (isToday) {
            header.className += ' today-header';
        }
        
        header.innerHTML = `${day}<span>${m}월 ${d}일</span>`;
        grid.appendChild(header);
    });

    // Render time label cells
    SLOTS.forEach((slot, slotIdx) => {
        const timeCell = document.createElement('div');
        timeCell.className = 'time-col-cell';
        timeCell.innerText = slot.label;
        timeCell.style.gridColumn = '1';
        timeCell.style.gridRow = (slotIdx + 2).toString();
        grid.appendChild(timeCell);
    });

    // Render calendar cells day-by-day with vertical merging
    for (let visualDayIdx = 0; visualDayIdx < DAYS.length; visualDayIdx++) {
        const dayIdx = getInternalDayIdx(visualDayIdx);
        const daySchedules = getDaySchedules(dayIdx);
        daySchedules.forEach(sched => {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            if (visualDayIdx === 0 || visualDayIdx === 6) {
                cell.className += ' weekend-cell';
            }
            cell.setAttribute('data-day', dayIdx);
            cell.setAttribute('data-slot', sched.startSlot);
            cell.style.gridColumn = (visualDayIdx + 2).toString();
            cell.style.gridRow = `${sched.startSlot + 2} / ${sched.endSlot + 2}`;

            if (sched.isLunchTime) {
                cell.className += ' status-lunch';
                cell.innerHTML = `
                    <div class="busy-overlay status-lunch" style="font-size: 10px; color: var(--text-tertiary); font-weight: 600; display: flex; align-items: center; justify-content: center; height: 100%; user-select: none;">
                        점심시간
                    </div>
                `;
            } else if (sched.isBusy) {
                const custom = sched.custom;
                const catClass = custom ? `status-${custom.category}` : 'status-work';
                cell.className += ` status-busy ${catClass}`;
                
                const titleText = custom ? custom.title : '개인 일정';
                const memoText = (custom && custom.memo) ? custom.memo : '';
                cell.innerHTML = `
                    <div class="busy-overlay" style="position: absolute; top: 0; left: 0; padding: 6px; box-sizing: border-box; user-select: none; width: 100%; height: 100%; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 0px;">
                        <span style="font-size: 12px; font-weight: 700; color: inherit; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; text-align: left;">${titleText}</span>
                        ${memoText ? `<span class="memo-content" style="font-size: 10.5px; font-weight: 500; color: var(--text-secondary); text-align: left; display: block; width: 100%; line-height: 1.4; margin-top: 4px;">${formatMentions(memoText).replace(/\n(?=<span class="mention-tag")/g, '<div class="tag-spacer" style="height: 4.5px;"></div>').replace(/<br\s*\/?>\s*(?=<span class="mention-tag")/gi, '<div class="tag-spacer" style="height: 4.5px;"></div>').replace(/(<div>|<p>)\s*(?=<span class="mention-tag")/gi, '$1<div class="tag-spacer" style="height: 4.5px;"></div>').replace(/\n/g, '<br>')}</span>` : ''}
                    </div>
                `;
                cell.addEventListener('click', () => {
                    openScheduleEditPopover(cell, dayIdx, sched.startSlot);
                });
            } else {
                cell.addEventListener('click', () => {
                    openScheduleEditPopover(cell, dayIdx, sched.startSlot);
                });
            }
            grid.appendChild(cell);
        });
    }
}

// Setup Login Page functionality
function setupLoginPage() {
    const loginPage = document.getElementById('login-page');
    const workspaceLanding = document.getElementById('workspace-landing');
    const loginForm = document.getElementById('login-form');
    const quickLoginContainer = document.getElementById('quick-login-container');
    
    // Register hard refresh keydown listener to clear login profile on Cmd+Shift+R or Ctrl+Shift+R
    window.addEventListener('keydown', (e) => {
        const isR = e.key.toLowerCase() === 'r' || e.code === 'KeyR';
        const isCmdOrCtrl = e.metaKey || e.ctrlKey;
        const isShift = e.shiftKey;
        if (isCmdOrCtrl && isShift && isR) {
            localStorage.setItem('toss_hard_refresh_pending', 'true');
        }
    });

    if (loginForm && loginPage && workspaceLanding) {
        // Clear login details if hard refresh was requested
        const isHardRefresh = localStorage.getItem('toss_hard_refresh_pending') === 'true';
        if (isHardRefresh) {
            localStorage.removeItem('toss_hard_refresh_pending');
            localStorage.removeItem('toss_saved_login');
            localStorage.removeItem('toss_notifications_enabled');
            localStorage.removeItem('toss_shared_meeting_session');
            localStorage.removeItem('toss_session_invite_notification');
            localStorage.removeItem('toss_notifications_read');
            localStorage.removeItem('toss_participant_vote_submitted');
            localStorage.removeItem('toss_poll_complete_read');
            
            checkNotifications();
            
            loginPage.style.display = 'flex';
            workspaceLanding.style.display = 'none';
        } else {
            // Auto-login on normal refresh if login details exist
            const savedLogin = localStorage.getItem('toss_saved_login');
            if (savedLogin) {
                try {
                    const loginData = JSON.parse(savedLogin);
                    const email = loginData.email || 'toss';
                    doLogin(email);
                } catch(e) {
                    loginPage.style.display = 'flex';
                    workspaceLanding.style.display = 'none';
                }
            } else {
                loginPage.style.display = 'flex';
                workspaceLanding.style.display = 'none';
            }
        }
        
        const rememberedAccount = localStorage.getItem('toss_remembered_account');
        if (rememberedAccount && quickLoginContainer) {
            try {
                const loginData = JSON.parse(rememberedAccount);
                const quickLoginName = document.getElementById('quick-login-name');
                const quickLoginEmail = document.getElementById('quick-login-email');
                
                if (quickLoginName && quickLoginEmail) {
                    quickLoginName.innerText = loginData.name;
                    const isKim = loginData.name === '김토스' || loginData.email === 'toss@toss.im';
                    quickLoginEmail.innerText = isKim ? '디자인1팀 / 팀장' : loginData.email;
                    
                    const badge = quickLoginContainer.querySelector('.quick-profile-badge');
                    if (badge && loginData.name) {
                        badge.innerText = loginData.name.charAt(0);
                    }
                    
                    loginForm.style.display = 'none';
                    quickLoginContainer.style.display = 'flex';
                }
            } catch (e) {
                localStorage.removeItem('toss_remembered_account');
            }
        } else {
            loginForm.style.display = '';
            if (quickLoginContainer) quickLoginContainer.style.display = 'none';
        }

        const btnQuickLogin = document.getElementById('btn-quick-login');
        if (btnQuickLogin && quickLoginContainer) {
            btnQuickLogin.addEventListener('click', () => {
                const rememberedAccount = localStorage.getItem('toss_remembered_account');
                if (rememberedAccount) {
                    try {
                        const loginData = JSON.parse(rememberedAccount);
                        doLogin(loginData.email);
                    } catch (e) {
                        loginForm.style.display = '';
                        quickLoginContainer.style.display = 'none';
                    }
                }
            });
        }

        const btnSwitchAccount = document.getElementById('btn-switch-account');
        if (btnSwitchAccount) {
            btnSwitchAccount.addEventListener('click', () => {
                loginForm.style.display = '';
                if (quickLoginContainer) quickLoginContainer.style.display = 'none';
            });
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const usernameInput = document.getElementById('login-username');
            const username = usernameInput ? usernameInput.value.trim() : 'toss';
            
            doLogin(username);
        });

        function doLogin(username) {
            loginPage.style.display = 'none';
            workspaceLanding.style.display = 'flex';
            document.body.classList.add('view-landing');
            
            let displayName = '김토스';
            let roleStr = '디자인1팀 / 팀장';

            if (username && username.includes('@')) {
                const parts = username.split('@')[0];
                if (parts !== 'toss') displayName = parts;
            } else if (username && username !== 'toss') {
                displayName = username;
            }

            // Sync user data globally (saves to localStorage and updates UI)
            syncProfileData(displayName, username, roleStr);
            localStorage.setItem('toss_saved_login', JSON.stringify({ name: displayName, email: username, role: roleStr }));
            
            // Save to remembered account for quick login
            localStorage.setItem('toss_remembered_account', JSON.stringify({ name: displayName, email: username, role: roleStr }));

            renderWorkspaceCalendar();
            if (renderWizardGridGlobal) renderWizardGridGlobal();
            if (renderSearchResultsGlobal) renderSearchResultsGlobal('');
            
            history.replaceState({ page: 'landing' }, '', '#landing');
            
            showToast(`${displayName}님, 환영합니다.`);

            // After landing, surface the incoming coordination request (host: 이토스)
            setTimeout(() => { showMessagePopover(); }, 1600);
        }
    }
}

function initApp() {
    // Read saved login on startup to sync profile details
    const savedLogin = localStorage.getItem('toss_saved_login');
    if (savedLogin) {
        try {
            const loginData = JSON.parse(savedLogin);
            const name = loginData.name || '김토스';
            const email = loginData.email || 'toss@toss.im';
            const role = loginData.role || '디자인1팀 / 팀장';
            syncProfileData(name, email, role);
        } catch(e) {
            syncProfileData('김토스', 'toss@toss.im', '디자인1팀 / 팀장');
        }
    } else {
        syncProfileData('김토스', 'toss@toss.im', '디자인1팀 / 팀장');
    }

    syncSessionUI();
    checkNotifications();
    renderPopupCalendar();
    setupEventListeners();
    setupWizard();
    setupLoginPage();
    applyTheme();
    setupSchedulePopover();
    setupHeaderUtilities();
    setupMessagePopover();
    setupHostResponsePopover();
    if (localStorage.getItem('toss_saved_login')) {
        if (!location.hash || location.hash === '#dashboard') {
            history.replaceState({ page: 'landing' }, '', '#landing');
        }
    }
}

function setupHeaderUtilities() {
    updateHeaderSyncBadge();
    
    // 1. Theme Toggle via Settings switch
    const settingsThemeToggle = document.getElementById('settings-theme-toggle');
    if (settingsThemeToggle) {
        settingsThemeToggle.checked = document.body.classList.contains('dark-mode');
        settingsThemeToggle.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            if (isChecked) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            applyTheme();
            showToast(isChecked ? '다크 모드가 활성화되었습니다.' : '라이트 모드가 활성화되었습니다.');
        });
    }

    // 2. Notification Bell popover
    const bells = document.querySelectorAll('.btn-utility-bell');
    const notifPopover = document.getElementById('notification-popover');
    
    bells.forEach(bell => {
        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other popovers
            const settingsPopover = document.getElementById('settings-popover');
            if (settingsPopover) settingsPopover.style.display = 'none';
            const schedulePopover = document.getElementById('schedule-edit-popover');
            if (schedulePopover) schedulePopover.style.display = 'none';

            const isVisible = notifPopover.style.display === 'block';
            if (isVisible) {
                notifPopover.style.display = 'none';
            } else {
                notifPopover.style.display = 'block';
                // Position popover below the clicked bell button
                const rect = bell.getBoundingClientRect();
                notifPopover.style.top = `${rect.bottom + window.scrollY + 8}px`;
                notifPopover.style.left = `${rect.right - 280 + window.scrollX}px`; // align to right
            }
        });
    });

    // Mark all as read
    const btnClearNotif = document.getElementById('btn-clear-notifications');
    if (btnClearNotif) {
        btnClearNotif.addEventListener('click', (e) => {
            e.stopPropagation();
            localStorage.setItem('toss_notifications_read', 'true');
            checkNotifications();
            showToast('알림을 모두 읽음으로 표시했습니다.');
        });
    }

    // 3. Settings / Profile Popover
    const profiles = document.querySelectorAll('.btn-utility-profile');
    const settingsPopover = document.getElementById('settings-popover');

    profiles.forEach(profile => {
        profile.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other popovers
            if (notifPopover) notifPopover.style.display = 'none';
            const schedulePopover = document.getElementById('schedule-edit-popover');
            if (schedulePopover) schedulePopover.style.display = 'none';

            const isVisible = settingsPopover.style.display === 'block';
            if (isVisible) {
                settingsPopover.style.display = 'none';
            } else {
                settingsPopover.style.display = 'block';

                // Sync settings user details dynamically based on currentUserId
                const user = SIM_USERS[currentUserId];
                if (user) {
                    const settingsUserName = document.getElementById('settings-user-name');
                    const settingsUserRole = document.getElementById('settings-user-role');
                    if (settingsUserName) settingsUserName.innerText = user.name;
                    if (settingsUserRole) settingsUserRole.innerText = user.role;
                    
                    // Update letter badge of all profile buttons and popover badge
                    profiles.forEach(p => {
                        p.innerText = user.name.charAt(0);
                    });
                    const popoverBadge = settingsPopover.querySelector('.quick-profile-badge');
                    if (popoverBadge) popoverBadge.innerText = user.name.charAt(0);
                }

                // Position popover below the clicked profile button
                const rect = profile.getBoundingClientRect();
                settingsPopover.style.top = `${rect.bottom + window.scrollY + 8}px`;
                settingsPopover.style.left = `${rect.right - 260 + window.scrollX}px`; // align to right
            }
        });
    });

    // Toggle Switches Handlers
    // A. Sync Toggle
    const syncToggle = document.getElementById('settings-sync-toggle');
    if (syncToggle) {
        syncToggle.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            updateHeaderSyncBadge();
            showToast(isChecked ? 'Google Workspace 연동이 활성화되었습니다.' : 'Google Workspace 연동이 중단되었습니다.');
        });
    }

    // B. My Page Drawer Toggle & Interaction
    const btnOpenMypage = document.getElementById('btn-open-mypage-link');
    const mypageDrawer = document.getElementById('mypage-drawer');
    const mypageOverlay = document.getElementById('mypage-overlay');
    


    if (btnOpenMypage && mypageDrawer && mypageOverlay) {
        btnOpenMypage.addEventListener('click', (e) => {
            e.stopPropagation();
            // Hide settings popover
            const settingsPopover = document.getElementById('settings-popover');
            if (settingsPopover) settingsPopover.style.display = 'none';
            const schedulePopover = document.getElementById('schedule-edit-popover');
            if (schedulePopover) schedulePopover.style.display = 'none';

            // Sync drawer user details from localStorage
            const savedLogin = localStorage.getItem('toss_saved_login');
            if (savedLogin) {
                try {
                    const loginData = JSON.parse(savedLogin);
                    const name = loginData.name || '김토스';
                    const email = loginData.email || 'toss@toss.im';
                    const role = loginData.role || (name === '김토스' ? '디자인1팀 / 팀장' : '디자인1팀 / 팀원');
                    
                    syncProfileData(name, email, role);
                } catch(err) {}
            }

            // Close edit mode and open view mode
            const pView = document.getElementById('mypage-profile-view');
            const pEdit = document.getElementById('mypage-profile-edit');
            if (pView && pEdit) {
                pView.style.display = 'block';
                pEdit.style.display = 'none';
            }

            // Show drawer & overlay
            mypageDrawer.style.right = '0px';
            mypageOverlay.style.display = 'block';
            setTimeout(() => {
                mypageOverlay.style.opacity = '1';
            }, 10);
        });
    }

    // Profile Edit Mode toggles
    const btnEditProfile = document.getElementById('btn-edit-profile');
    const pView = document.getElementById('mypage-profile-view');
    const pEdit = document.getElementById('mypage-profile-edit');
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const btnCancelProfile = document.getElementById('btn-cancel-profile');

    const inputName = document.getElementById('input-mypage-name');
    const inputRole = document.getElementById('input-mypage-role');
    const inputEmail = document.getElementById('input-mypage-email');

    if (btnEditProfile && pView && pEdit) {
        btnEditProfile.addEventListener('click', () => {
            pView.style.display = 'none';
            pEdit.style.display = 'flex';

            const savedLogin = localStorage.getItem('toss_saved_login');
            if (savedLogin) {
                try {
                    const loginData = JSON.parse(savedLogin);
                    if (inputName) inputName.value = loginData.name || '김토스';
                    if (inputRole) inputRole.value = loginData.role || (loginData.name === '김토스' ? '디자인1팀 / 팀장' : '디자인1팀 / 팀원');
                    if (inputEmail) inputEmail.value = loginData.email || 'toss@toss.im';
                } catch(err) {}
            }
        });
    }

    if (btnSaveProfile && btnCancelProfile && pView && pEdit) {
        btnSaveProfile.addEventListener('click', () => {
            const name = inputName ? inputName.value.trim() : '김토스';
            const role = inputRole ? inputRole.value.trim() : '디자인1팀 / 팀장';
            const email = inputEmail ? inputEmail.value.trim() : 'toss@toss.im';

            if (!name) {
                showToast("이름을 입력해 주세요.");
                return;
            }

            syncProfileData(name, email, role);
            pView.style.display = 'block';
            pEdit.style.display = 'none';
            showToast("프로필이 수정되었습니다.");
        });

        btnCancelProfile.addEventListener('click', () => {
            pView.style.display = 'block';
            pEdit.style.display = 'none';
        });
    }

    // Collaboration settings dropdown change handlers
    const daysStartSel = document.getElementById('collab-days-start');
    const daysEndSel = document.getElementById('collab-days-end');
    const hoursStartSel = document.getElementById('collab-hours-start');
    const hoursEndSel = document.getElementById('collab-hours-end');

    if (daysStartSel && daysEndSel && hoursStartSel && hoursEndSel) {
        // Set initial values
        daysStartSel.value = localStorage.getItem('toss_collab_days_start') || '월';
        daysEndSel.value = localStorage.getItem('toss_collab_days_end') || '금';
        hoursStartSel.value = localStorage.getItem('toss_collab_hours_start') || '9';
        hoursEndSel.value = localStorage.getItem('toss_collab_hours_end') || '18';

        const updateCollabSettings = () => {
            localStorage.setItem('toss_collab_days_start', daysStartSel.value);
            localStorage.setItem('toss_collab_days_end', daysEndSel.value);
            localStorage.setItem('toss_collab_hours_start', hoursStartSel.value);
            localStorage.setItem('toss_collab_hours_end', hoursEndSel.value);

            calculateRecommendations();
            renderWorkspaceCalendar();
            renderCalendar();
            showToast("회의 선호 시간이 저장되었습니다.");
        };

        daysStartSel.addEventListener('change', updateCollabSettings);
        daysEndSel.addEventListener('change', updateCollabSettings);
        hoursStartSel.addEventListener('change', updateCollabSettings);
        hoursEndSel.addEventListener('change', updateCollabSettings);

        // Initialize Exclude Times UI
        const excludeTimesList = document.getElementById('exclude-times-list');
        const btnAddExcludeTime = document.getElementById('btn-add-exclude-time');

        if (excludeTimesList && btnAddExcludeTime) {
            let excludeTimes = JSON.parse(localStorage.getItem('toss_exclude_times')) || [
                { start: '16', end: '17' }
            ];

            const renderExcludeTimes = () => {
                excludeTimesList.innerHTML = '';
                excludeTimes.forEach((time, idx) => {
                    const item = document.createElement('div');
                    item.className = 'exclude-time-item';
                    item.style.display = 'flex';
                    item.style.gap = '8px';
                    item.style.alignItems = 'center';
                    
                    let startOptions = '';
                    for (let h = 9; h <= 17; h++) {
                        const hStr = h.toString();
                        const label = h < 10 ? `0${h}:00` : `${h}:00`;
                        startOptions += `<option value="${hStr}" ${time.start === hStr ? 'selected' : ''}>${label}</option>`;
                    }
                    
                    let endOptions = '';
                    for (let h = 10; h <= 18; h++) {
                        const hStr = h.toString();
                        const label = h < 10 ? `0${h}:00` : `${h}:00`;
                        endOptions += `<option value="${hStr}" ${time.end === hStr ? 'selected' : ''}>${label}</option>`;
                    }

                    item.innerHTML = `
                        <select class="exclude-time-start" data-index="${idx}" style="flex: 1; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 8px; background: var(--card-bg); color: var(--text-primary); font-size: 12px; outline: none; cursor: pointer; font-family: inherit; height: 32px;">
                            ${startOptions}
                        </select>
                        <span style="font-size: 12px; color: var(--text-tertiary);">~</span>
                        <select class="exclude-time-end" data-index="${idx}" style="flex: 1; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 8px; background: var(--card-bg); color: var(--text-primary); font-size: 12px; outline: none; cursor: pointer; font-family: inherit; height: 32px;">
                            ${endOptions}
                        </select>
                        <button type="button" class="btn-delete-exclude-time" data-index="${idx}" style="background: none; border: none; color: var(--color-red); font-size: 16px; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;" title="삭제">✕</button>
                    `;
                    excludeTimesList.appendChild(item);
                });
            };

            const saveExcludeTimes = () => {
                localStorage.setItem('toss_exclude_times', JSON.stringify(excludeTimes));
            };

            excludeTimesList.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                if (e.target.classList.contains('exclude-time-start')) {
                    excludeTimes[idx].start = e.target.value;
                } else if (e.target.classList.contains('exclude-time-end')) {
                    excludeTimes[idx].end = e.target.value;
                }
                saveExcludeTimes();
                syncFocusTimesToSchedules();
                calculateRecommendations();
                renderWorkspaceCalendar();
                renderCalendar();
                showToast("집중 시간이 설정되었습니다.");
            });

            excludeTimesList.addEventListener('click', (e) => {
                const deleteBtn = e.target.closest('.btn-delete-exclude-time');
                if (deleteBtn) {
                    const idx = parseInt(deleteBtn.getAttribute('data-index'));
                    excludeTimes.splice(idx, 1);
                    saveExcludeTimes();
                    syncFocusTimesToSchedules();
                    renderExcludeTimes();
                    calculateRecommendations();
                    renderWorkspaceCalendar();
                    renderCalendar();
                    showToast("집중 시간이 삭제되었습니다.");
                }
            });

            btnAddExcludeTime.addEventListener('click', () => {
                excludeTimes.push({ start: '16', end: '17' });
                saveExcludeTimes();
                syncFocusTimesToSchedules();
                renderExcludeTimes();
                calculateRecommendations();
                renderWorkspaceCalendar();
                renderCalendar();
                showToast("집중 시간이 추가되었습니다.");
            });

            renderExcludeTimes();
        }
    }

    const btnCloseMypage = document.getElementById('btn-close-mypage');
    if (btnCloseMypage && mypageDrawer && mypageOverlay) {
        const closeMypage = () => {
            mypageDrawer.style.right = '-400px';
            mypageOverlay.style.opacity = '0';
            setTimeout(() => {
                mypageOverlay.style.display = 'none';
            }, 300);
        };
        btnCloseMypage.addEventListener('click', closeMypage);
        mypageOverlay.addEventListener('click', closeMypage);
    }



    // C. Slack Toggle
    const slackToggle = document.getElementById('settings-slack-toggle');
    if (slackToggle) {
        slackToggle.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            updateHeaderSyncBadge();
            showToast(isChecked ? 'Slack 연동이 활성화되었습니다.' : 'Slack 연동이 해제되었습니다.');
        });
    }

    // D. Logout Action
    const btnLogout = document.getElementById('btn-settings-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('toss_saved_login');
            localStorage.removeItem('toss_notifications_enabled');
            localStorage.removeItem('toss_participant_vote_submitted');
            localStorage.removeItem('toss_poll_complete_read');
            localStorage.removeItem('toss_current_page');
            localStorage.removeItem('toss_current_meeting_role');
            localStorage.removeItem('toss_current_poll_state');
            localStorage.removeItem('toss_participants_state');
            localStorage.removeItem('toss_selected_slot_day');
            localStorage.removeItem('toss_selected_slot_idx');
            checkNotifications();
            
            // Close My Page drawer and hide overlay/dim immediately
            const mypageDrawer = document.getElementById('mypage-drawer');
            const mypageOverlay = document.getElementById('mypage-overlay');
            if (mypageDrawer) {
                mypageDrawer.style.right = '-400px';
            }
            if (mypageOverlay) {
                mypageOverlay.style.opacity = '0';
                mypageOverlay.style.display = 'none';
            }

            // Hide workspace, show login
            const loginPage = document.getElementById('login-page');
            const workspaceLanding = document.getElementById('workspace-landing');
            if (loginPage && workspaceLanding) {
                loginPage.style.display = 'flex';
                workspaceLanding.style.display = 'none';
                document.body.classList.remove('view-landing');
                
                // Clear input values
                const usernameInput = document.getElementById('login-username');
                const passwordInput = document.getElementById('login-password');
                if (usernameInput) usernameInput.value = '';
                if (passwordInput) passwordInput.value = '';
                
                // Switch back form display
                const loginForm = document.getElementById('login-form');
                const quickLoginContainer = document.getElementById('quick-login-container');
                if (loginForm) loginForm.style.display = '';
                if (quickLoginContainer) quickLoginContainer.style.display = 'none';
            }
            if (settingsPopover) settingsPopover.style.display = 'none';
            showToast('로그아웃되었습니다.');
        });
    }

    function updateHeaderSyncBadge() {
        const syncToggle = document.getElementById('settings-sync-toggle');
        const slackToggle = document.getElementById('settings-slack-toggle');
        
        const googleActive = syncToggle ? syncToggle.checked : true;
        const slackActive = slackToggle ? slackToggle.checked : true;
        
        const badge = document.querySelector('.badge-sync-status');
        if (badge) {
            if (googleActive && slackActive) {
                badge.innerHTML = `<span class="sync-dot" style="display: inline-block; width: 5px; height: 5px; background-color: var(--color-green); border-radius: 50%;"></span>Google · Slack 연결됨`;
                badge.style.opacity = '1';
            } else if (googleActive) {
                badge.innerHTML = `<span class="sync-dot" style="display: inline-block; width: 5px; height: 5px; background-color: var(--color-green); border-radius: 50%;"></span>Google Workspace 연결됨`;
                badge.style.opacity = '1';
            } else if (slackActive) {
                badge.innerHTML = `<span class="sync-dot" style="display: inline-block; width: 5px; height: 5px; background-color: var(--color-green); border-radius: 50%;"></span>Slack 연결됨`;
                badge.style.opacity = '1';
            } else {
                badge.innerHTML = `<span class="sync-dot" style="display: inline-block; width: 5px; height: 5px; background-color: #8b95a1; border-radius: 50%;"></span>연결 해제됨`;
                badge.style.opacity = '0.5';
            }
        }

    }

    // Global click listener to close popovers and deselect items on clicking outside
    document.addEventListener('click', (e) => {
        let clickedBell = false;
        bells.forEach(bell => {
            if (bell.contains(e.target)) clickedBell = true;
        });
        let clickedProfile = false;
        profiles.forEach(profile => {
            if (profile.contains(e.target)) clickedProfile = true;
        });

        if (notifPopover && !clickedBell && !notifPopover.contains(e.target)) {
            notifPopover.style.display = 'none';
        }
        if (settingsPopover && !clickedProfile && !settingsPopover.contains(e.target)) {
            settingsPopover.style.display = 'none';
        }

        // Deselect recommendation card and calendar cell when clicking outside
        const dashboard = document.getElementById('coordination-dashboard');
        if (dashboard && dashboard.style.display !== 'none') {
            const clickedCard = e.target.closest('.recommendation-card');
            const clickedCell = e.target.closest('.calendar-cell');
            const clickedDetail = e.target.closest('#detail-panel-content');
            const clickedPoll = e.target.closest('.recommendation-poll-card');
            const clickedModal = e.target.closest('.vote-preview-overlay') || e.target.closest('.vote-preview-modal');

            if (!clickedCard && !clickedCell && !clickedDetail && !clickedPoll && !clickedModal) {
                document.querySelectorAll('.recommendation-card').forEach(c => c.classList.remove('selected'));
                document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('status-selected'));
                
                const placeholder = document.querySelector('.detail-panel-placeholder');
                const content = document.getElementById('detail-panel-content');
                if (placeholder && content) {
                    placeholder.style.display = 'flex';
                    content.style.display = 'none';
                }
            }
        }
    });
}

function getFormattedDateString(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const padMonth = month < 10 ? `0${month}` : month;
    const padDay = day < 10 ? `0${day}` : day;
    
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    
    return `${year}.${padMonth}.${padDay} (${weekday})`;
}

function updateDatePickerTrigger() {
    const textSpan = document.getElementById('selected-date-text');
    if (textSpan) {
        textSpan.innerText = getFormattedDateString(selectedDate);
    }
}

function renderPopupCalendar() {
    const datesGrid = document.getElementById('cal-pop-dates');
    if (!datesGrid) return;
    
    // Update year/month headers in popup
    const yearSpan = document.querySelector('.title-year');
    const monthSpan = document.querySelector('.title-month');
    if (yearSpan) yearSpan.innerText = `${currentDisplayedYear}년`;
    if (monthSpan) monthSpan.innerText = `${currentDisplayedMonth + 1}월`;
    
    // Update the trigger display text
    updateDatePickerTrigger();
    
    datesGrid.innerHTML = '';
    
    // Generate dates dynamically (42 cells = 6 rows)
    const firstDay = new Date(currentDisplayedYear, currentDisplayedMonth, 1);
    const startDayOfWeek = firstDay.getDay(); // 0: Sun, 1: Mon, etc.
    const daysInMonth = new Date(currentDisplayedYear, currentDisplayedMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentDisplayedYear, currentDisplayedMonth, 0).getDate();
    
    const todayZero = getKSTDate();
    todayZero.setHours(0, 0, 0, 0);
    
    const totalCellsNeeded = startDayOfWeek + daysInMonth;
    const totalCells = totalCellsNeeded <= 35 ? 35 : 42;
    
    for (let i = 0; i < totalCells; i++) {
        let dayNum, cellMonth, cellYear, isCurrentMonth;
        
        if (i < startDayOfWeek) {
            // Previous month
            dayNum = daysInPrevMonth - startDayOfWeek + 1 + i;
            cellMonth = currentDisplayedMonth === 0 ? 11 : currentDisplayedMonth - 1;
            cellYear = currentDisplayedMonth === 0 ? currentDisplayedYear - 1 : currentDisplayedYear;
            isCurrentMonth = false;
        } else if (i < startDayOfWeek + daysInMonth) {
            // Current month
            dayNum = i - startDayOfWeek + 1;
            cellMonth = currentDisplayedMonth;
            cellYear = currentDisplayedYear;
            isCurrentMonth = true;
        } else {
            // Next month
            dayNum = i - startDayOfWeek - daysInMonth + 1;
            cellMonth = currentDisplayedMonth === 11 ? 0 : currentDisplayedMonth + 1;
            cellYear = currentDisplayedMonth === 11 ? currentDisplayedYear + 1 : currentDisplayedYear;
            isCurrentMonth = false;
        }
        
        const cellDate = new Date(cellYear, cellMonth, dayNum);
        const cellDateZero = new Date(cellDate);
        cellDateZero.setHours(0, 0, 0, 0);
        
        const isPast = cellDateZero < todayZero;
        
        const cell = document.createElement('div');
        cell.className = 'cal-pop-cell';
        
        const inner = document.createElement('div');
        inner.className = 'cal-pop-cell-inner';
        inner.innerText = dayNum;
        cell.appendChild(inner);
        
        if (!isCurrentMonth) {
            cell.classList.add('muted-date');
            inner.innerText = '';
            cell.style.pointerEvents = 'none';
            cell.style.cursor = 'default';
        }
        
        if (isCurrentMonth) {
            if (isPast) {
                cell.classList.add('muted-date');
                cell.style.cursor = 'not-allowed';
                cell.style.opacity = '0.2';
            } else {
                cell.classList.add('interactive-date');
                
                // Highlight committed selected date
                const isSelected = 
                    cellDate.getFullYear() === selectedDate.getFullYear() &&
                    cellDate.getMonth() === selectedDate.getMonth() &&
                    cellDate.getDate() === selectedDate.getDate();
                    
                if (isSelected) {
                    cell.classList.add('selected-date-temp');
                }
                
                cell.addEventListener('click', () => {
                    selectedDate = new Date(cellDate);
                    tempSelectedDate = new Date(cellDate);
                    
                    const monday = getMondayOf(selectedDate);
                    startOffsetDay = monday.getDate();
                    
                    // Collapse calendar popup
                    const trig = document.getElementById('date-picker-trigger');
                    const pop = document.getElementById('calendar-popup');
                    if (trig) {
                        trig.setAttribute('aria-expanded', 'false');
                        trig.classList.remove('active');
                    }
                    if (pop) {
                        pop.style.display = 'none';
                    }
                    
                    renderPopupCalendar();
                    calculateRecommendations();
                    renderCalendar();
                });
            }
        }
        
        datesGrid.appendChild(cell);
    }
}

function isDayPassed(dayIdx) {
    const monday = getMondayOf(selectedDate);
    const targetDate = new Date(monday);
    const offset = (dayIdx === 6) ? -1 : dayIdx;
    targetDate.setDate(monday.getDate() + offset);
    targetDate.setHours(0, 0, 0, 0);

    const today = getKSTDate();
    today.setHours(0, 0, 0, 0);

    return targetDate < today;
}

function getExcludeTimes() {
    try {
        const stored = localStorage.getItem('toss_exclude_times');
        return stored ? JSON.parse(stored) : [{ start: '16', end: '17' }];
    } catch (e) {
        return [{ start: '16', end: '17' }];
    }
}

function isSlotExcluded(startHour) {
    const excludes = getExcludeTimes();
    if (!excludes || !Array.isArray(excludes)) return false;
    return excludes.some(exc => {
        const start = parseInt(exc.start);
        const end = parseInt(exc.end);
        return startHour >= start && startHour < end;
    });
}

// 4. Recommendation Engine (Phase 2 - Multi-slot Consecutive search)
function calculateRecommendations() {
    syncSessionUI();
    const session = getActiveSession();
    if (!session) {
        currentPollState = null;
    } else {
        if (session.status === 'confirmed') {
            currentPollState = null;
        } else {
            const voteKeys = Object.keys(session.votes || {});
            if (voteKeys.length > 0) {
                currentPollState = 'completed';
            }
        }
    }
    const recommendations = [];
    const enabledParticipants = participants.filter(p => p.enabled);
    const requiredList = enabledParticipants.filter(p => p.role === 'required');
    
    // Duration mapping
    const durationMin = parseInt(document.getElementById('meeting-duration').value);
    
    // Calculate how many slots are needed (each slot is 1 hour, i.e., 60 mins)
    let slotsNeeded = Math.ceil(durationMin / 60);
    if (slotsNeeded < 1) slotsNeeded = 1;

    const roster = (currentMeetingRole === 'participant') ? PARTICIPANT_SCENARIO_ROSTER : enabledParticipants;

    if (currentMeetingRole !== 'participant' && requiredList.length === 0) {
        renderRecommendationsList([], slotsNeeded);
        updateSummaryText("필수 참석자를 선택해 주세요.");
        return;
    }

    // Loop over days
    for (let day = 0; day < DAYS.length; day++) {
        if (isDayPassed(day)) continue;
        // Loop over starting slots
        for (let startSlot = 0; startSlot <= SLOTS.length - slotsNeeded; startSlot++) {
            
            // Check if any slot in sequence crosses lunch time
            let crossesLunch = false;
            for (let i = 0; i < slotsNeeded; i++) {
                if (SLOTS[startSlot + i].isLunchTime) {
                    crossesLunch = true;
                    break;
                }
            }
            if (crossesLunch) continue;

            // Check if any slot in sequence falls outside collaboration hours or days
            let outsideCollab = false;
            for (let i = 0; i < slotsNeeded; i++) {
                if (!isWithinCollab(day, startSlot + i)) {
                    outsideCollab = true;
                    break;
                }
            }
            if (outsideCollab) continue;

            let requiredConflict = false;
            
            const details = {
                available: new Set(),
                busy: new Set(),
                lunchAvoid: new Set(),
                outside: new Set(),
                flexibleBusy: new Set(),
                travelBuffered: new Set()
            };
            
            const reasons = [];

            // Evaluate each participant for the entire slot sequence
            roster.forEach(p => {
                let isBusyAny = false;
                let isFlexibleAny = false;
                let isOutAny = false;
                let isLunchAny = false;
                let hasTravelBufferAny = false;
                let constraintDesc = '';

                for (let i = 0; i < slotsNeeded; i++) {
                    const currentSlotIdx = startSlot + i;
                    const slotKey = p.id === currentUserId ? `${formatDate(getMondayOf(selectedDate))}:${day}-${currentSlotIdx}` : `${day}-${currentSlotIdx}`;
                    const isBusy = (scheduleData[p.id] || []).includes(slotKey);
                    const constraint = p.constraints ? p.constraints.find(c => c.day === day && c.slot === currentSlotIdx) : null;
                    const hasTravelBuffer = currentScenario === 'tight' && 
                                           SCENARIOS.tight.travelBuffers?.[p.id]?.includes(`${day}-${currentSlotIdx}`);

                    if (isBusy) {
                        if (constraint && constraint.flexible) {
                            isFlexibleAny = true;
                            constraintDesc = constraint.desc;
                        } else {
                            isBusyAny = true;
                        }
                    } else if (constraint) {
                        if (constraint.type === 'lunch') {
                            isLunchAny = true;
                        } else if (constraint.type === 'out') {
                            isOutAny = true;
                        }
                    } else if (hasTravelBuffer) {
                        hasTravelBufferAny = true;
                    }
                }

                // Categorize based on the worst status found (matching calendar grid availability ratio logic exactly)
                if (isBusyAny) {
                    if (p.role === 'required') {
                        requiredConflict = true;
                    }
                    details.busy.add(p);
                    reasons.push(`${p.name}님 일정 바쁨`);
                } else if (isOutAny) {
                    if (p.role === 'required') {
                        requiredConflict = true;
                    }
                    details.outside.add(p);
                    reasons.push(`${p.name}님 외근 중`);
                } else if (isLunchAny) {
                    if (p.role === 'required') {
                        requiredConflict = true;
                    }
                    details.lunchAvoid.add(p);
                    reasons.push(`${p.name}님 점심시간`);
                } else if (hasTravelBufferAny) {
                    if (p.role === 'required') {
                        requiredConflict = true;
                    }
                    details.travelBuffered.add(p);
                    reasons.push(`${p.name}님 이동 시간 버퍼`);
                } else if (isFlexibleAny) {
                    details.flexibleBusy.add(p);
                    reasons.push(`${p.name}님의 유연한 일정(${constraintDesc}) 조정 필요`);
                } else {
                    details.available.add(p);
                }
            });
            if (currentMeetingRole !== 'participant' && requiredConflict) continue;

            const totalEnabled = roster.length;
            const unavailableCount = details.busy.size + details.outside.size + details.lunchAvoid.size + details.travelBuffered.size;
            const availCount = totalEnabled - unavailableCount;
            
            // Score matches availability ratio exactly
            const finalScore = Math.max(10, Math.min(100, Math.round((availCount / totalEnabled) * 100)));

            recommendations.push({
                day,
                startSlot,
                slotsNeeded,
                score: finalScore,
                reasons: [...new Set(reasons)].slice(0, 2),
                details: {
                    available: Array.from(details.available),
                    busy: Array.from(details.busy),
                    lunchAvoid: Array.from(details.lunchAvoid),
                    outside: Array.from(details.outside),
                    flexibleBusy: Array.from(details.flexibleBusy),
                    travelBuffered: Array.from(details.travelBuffered)
                }
            });
        }
    }

    // Sort by score/votes
    recommendations.sort((a, b) => {
        // 1. Available count descending
        const availA = a.details.available.length;
        const availB = b.details.available.length;
        if (availB !== availA) return availB - availA;

        // 2. Score descending
        if (b.score !== a.score) return b.score - a.score;

        // 3. Day (date) ascending
        if (a.day !== b.day) return a.day - b.day;

        // 4. Time slot ascending
        return a.startSlot - b.startSlot;
    });

    // Filter recommendations based on weekend preference (prioritize weekdays)
    const hasWeekdayRec = recommendations.some(rec => rec.day >= 0 && rec.day <= 4);
    let finalRecs = recommendations;
    if (hasWeekdayRec) {
        finalRecs = recommendations.filter(rec => rec.day >= 0 && rec.day <= 4);
    }

    currentRecommendations = finalRecs;
    renderRecommendationsList(finalRecs, slotsNeeded);
    updateSummary(finalRecs);
}

// Render recommendations
function renderRecommendationsList(recs, slotsNeeded) {
    const container = document.getElementById('recommendations-container');
    container.innerHTML = '';

    // Trigger fallback Split-session if it's a long meeting and score is low or empty
    const durationMin = parseInt(document.getElementById('meeting-duration').value);
    if ((recs.length === 0 || recs[0].score < 50) && durationMin >= 90) {
        renderSplitSessionFallback(container, durationMin);
        return;
    }

    // Normal empty fallback
    if (recs.length === 0 || recs[0].score < 40) {
        renderFallbackUI(container);
        return;
    }

    // Top 3
    const topRecs = recs.slice(0, 3);
    topRecs.forEach((rec, idx) => {
        const card = document.createElement('div');
        card.className = `recommendation-card ${(idx === 0 && currentMeetingRole !== 'participant' && currentPollState === 'completed') ? 'primary-rec' : ''}`;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        
        // Date formatting
        let dateText = `${getDayName(rec.day)}요일 `;
        if (rec.slotsNeeded === 1) {
            dateText += SLOTS[rec.startSlot].label;
        } else {
            const startTime = SLOTS[rec.startSlot].label.split(' - ')[0];
            const endTime = SLOTS[rec.startSlot + rec.slotsNeeded - 1].label.split(' - ')[1];
            dateText += `${startTime} - ${endTime}`;
        }

        let reasonSummary = '';
        const rosterCount = (currentMeetingRole === 'participant') ? PARTICIPANT_SCENARIO_ROSTER.length : participants.filter(p => p.enabled).length;
        if (rec.score === 100) {
            reasonSummary = `${rosterCount}명 모두 참석 가능`;
        } else if (rec.score >= 90) {
            reasonSummary = "대부분이 가능한 시간이에요";
        } else if (rec.score >= 70) {
            reasonSummary = "일정 조정이 필요한 시간이에요";
        } else {
            reasonSummary = "참석 가능한 인원이 적어요";
        }

        // Check if there are WFH participants on this day (Scenario 4)
        let isHybridMeeting = false;
        const wfhMembers = [];
        if (currentScenario === 'hybrid' && SCENARIOS.hybrid.wfhDays) {
            participants.filter(p => p.enabled).forEach(p => {
                if (SCENARIOS.hybrid.wfhDays[p.id]?.includes(rec.day)) {
                    isHybridMeeting = true;
                    wfhMembers.push(p.name);
                }
            });
        }
        
        if (isHybridMeeting) {
            reasonSummary = `💻 재택 근무자(${wfhMembers.join(', ')})가 있어 하이브리드 화상 회의로 권장됩니다.`;
        }

        let avatarsHTML = '';
        rec.details.available.forEach(p => {
            avatarsHTML += `<span class="avatar-status-item"><span class="status-check">✓</span> ${p.name}</span>`;
        });
        rec.details.outside.forEach(p => {
            avatarsHTML += `<span class="avatar-status-item"><span class="status-warn">✈</span> ${p.name}(외근)</span>`;
        });
        rec.details.lunchAvoid.forEach(p => {
            avatarsHTML += `<span class="avatar-status-item"><span class="status-warn">☕</span> ${p.name}(회복)</span>`;
        });
        rec.details.flexibleBusy.forEach(p => {
            avatarsHTML += `<span class="avatar-status-item"><span class="status-warn">⟳</span> ${p.name}(조정)</span>`;
        });
        rec.details.travelBuffered.forEach(p => {
            avatarsHTML += `<span class="avatar-status-item"><span class="status-warn">⌛</span> ${p.name}(이동)</span>`;
        });
        rec.details.busy.forEach(p => {
            avatarsHTML += `<span class="avatar-status-item"><span class="status-danger">✕</span> ${p.name}(불참)</span>`;
        });

        // Set voting states styling and badge
        let voteBadgeHTML = '';
        // (participant mode fills in a vote button; host 'completed' state fills in a confirm button)
        let buttonHTML = '';
        
        if (currentMeetingRole === 'participant' && mockParticipantSession) {
            // Participant mode recommendation card design: identical to host's coordination phase (no vote count badge inside the card)
            voteBadgeHTML = '';
            buttonHTML = '';
        } else {
            // Host Mode
            if (currentPollState === 'completed') {
                let voteCount = 0;
                let voters = [];
                if (idx === 0) {
                    voteCount = 5;
                    voters = ['이', '박', '최', '정', '강'];
                } else if (idx === 1) {
                    voteCount = 3;
                    voters = ['최', '정', '강'];
                } else if (idx === 2) {
                    voteCount = 1;
                    voters = ['박'];
                }
                
                voteBadgeHTML = `
                    <div class="vote-badge">
                        <span class="vote-check">✓</span>
                        <span>${voteCount}명 선택</span>
                    </div>
                `;
                
                buttonHTML = '';
            }
        }

        card.innerHTML = `
            <div class="score-badge">
                <span class="score-value">${rec.score}</span>
                <span class="score-lbl">적합도</span>
            </div>
            <div class="rec-body">
                <div class="rec-time-badge">${dateText}</div>
                <div class="rec-reason">${reasonSummary}</div>
                ${voteBadgeHTML}
            </div>
            <div class="rec-action">
                ${buttonHTML}
            </div>
        `;

        // Card action event listeners
        const actButton = card.querySelector('.btn-book-rec');
        if (actButton) {
            actButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card default select action
                if (rec.day === 5 || rec.day === 6) {
                    showWeekendConfirmPopup(() => {
                        if (currentMeetingRole === 'participant') {
                            toggleParticipantVote(rec.day, rec.startSlot);
                        } else if (currentPollState === 'completed') {
                            confirmMeeting(rec.day, rec.startSlot, rec.slotsNeeded);
                        } else {
                            selectSlotsInCalendar(rec.day, rec.startSlot, rec.slotsNeeded);
                            openBookingDialog(rec.day, rec.startSlot, rec, rec.slotsNeeded);
                        }
                    });
                } else {
                    if (currentMeetingRole === 'participant') {
                        toggleParticipantVote(rec.day, rec.startSlot);
                    } else if (currentPollState === 'completed') {
                        confirmMeeting(rec.day, rec.startSlot, rec.slotsNeeded);
                    } else {
                        // Normal booking flow
                        selectSlotsInCalendar(rec.day, rec.startSlot, rec.slotsNeeded);
                        openBookingDialog(rec.day, rec.startSlot, rec, rec.slotsNeeded);
                    }
                }
            });
        }

        card.addEventListener('click', () => {
            const isAlreadySelected = card.classList.contains('selected');
            
            // Remove selected class from all cards
            container.querySelectorAll('.recommendation-card').forEach(c => c.classList.remove('selected'));
            // Remove calendar selection
            document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('status-selected'));

            const placeholder = document.querySelector('.detail-panel-placeholder');
            const content = document.getElementById('detail-panel-content');

            if (isAlreadySelected) {
                if (placeholder && content) {
                    placeholder.style.display = 'flex';
                    content.style.display = 'none';
                }
            } else {
                if (rec.day === 5 || rec.day === 6) {
                    showWeekendConfirmPopup(() => {
                        card.classList.add('selected');
                        selectSlotsInCalendar(rec.day, rec.startSlot, rec.slotsNeeded);
                        showSlotDetailsPanel(rec.day, rec.startSlot, []);
                    });
                } else {
                    card.classList.add('selected');
                    selectSlotsInCalendar(rec.day, rec.startSlot, rec.slotsNeeded);
                    showSlotDetailsPanel(rec.day, rec.startSlot, []);
                }
            }
        });

        container.appendChild(card);
    });



    // Append Poll Card at the end of the recommendations row
    if (recs.length > 0 && recs[0].score >= 40) {
        if (currentMeetingRole !== 'participant') {
            const pollCard = document.createElement('div');
            // Host Mode
            if (currentPollState === null) {
                pollCard.className = 'recommendation-poll-card';
                pollCard.id = 'btn-start-poll';
                pollCard.innerHTML = `
                    <img src="images/airplane.png" alt="ask all" style="width: 24px; height: 24px; object-fit: contain; flex-shrink: 0;">
                    <span style="font-size: 13px; font-weight: 700; color: var(--color-blue);">모두에게 물어보기</span>
                `;
                pollCard.addEventListener('click', (e) => {
                    e.stopPropagation();
                    sendVoteRequest();
                });
            } else if (currentPollState === 'voting') {
                pollCard.className = 'recommendation-poll-card polling';
                pollCard.style.cursor = 'default';
                pollCard.style.opacity = '0.8';
                pollCard.innerHTML = `
                    <span class="poll-spinner" style="width: 20px; height: 20px; border: 2.5px solid var(--color-blue); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block;"></span>
                    <span style="font-size: 13px; font-weight: 700; margin-top: 4px; color: var(--color-blue);">투표 취합 중...</span>
                `;
            } else if (currentPollState === 'completed') {
                pollCard.className = 'recommendation-poll-card completed';
                pollCard.style.border = '1px solid rgba(49, 130, 246, 0.3)';
                pollCard.style.backgroundColor = 'rgba(49, 130, 246, 0.06)';
                pollCard.style.color = 'var(--color-blue)';
                pollCard.style.cursor = 'default';
                pollCard.innerHTML = `
                    <img src="images/check.png" alt="completed" style="width: 24px; height: 24px; object-fit: contain; flex-shrink: 0;">
                    <span style="font-size: 13px; font-weight: 700; color: var(--color-blue);">투표 취합 완료</span>
                `;
            }
            container.appendChild(pollCard);
        } else {
            // Participant Mode: Render an invisible spacer so that the 3 recommendation cards have the exact same width as in Host Mode!
            const spacer = document.createElement('div');
            spacer.className = 'recommendation-poll-card';
            spacer.style.visibility = 'hidden';
            spacer.style.pointerEvents = 'none';
            container.appendChild(spacer);
        }
    }
}

function toggleParticipantAvailability(day, startSlot) {
    if (participantVoteSubmitted) return;
    const slotKey = `${day}-${startSlot}`;
    if (participantSelectedVotes[slotKey]) {
        delete participantSelectedVotes[slotKey];
    } else {
        participantSelectedVotes[slotKey] = 'available';
    }
    refreshParticipantSlotUI(day, startSlot);
}

function toggleParticipantPreference(day, startSlot) {
    if (participantVoteSubmitted) return;
    const slotKey = `${day}-${startSlot}`;
    if (participantSelectedVotes[slotKey] === 'preferred') {
        participantSelectedVotes[slotKey] = 'available';
    } else {
        participantSelectedVotes[slotKey] = 'preferred';
    }
    refreshParticipantSlotUI(day, startSlot);
}

function refreshParticipantSlotUI(day, startSlot) {
    renderCalendar();
    
    // Re-render slot details panel to refresh action button states
    const cellDetails = [];
    PARTICIPANT_SCENARIO_ROSTER.forEach(p => {
        if (p.id === 'p1') {
            cellDetails.push({ name: p.name, role: p.role || 'required', status: 'free', desc: '나' });
        } else {
            const slotKeyToCheck = `${day}-${startSlot}`;
            const isBusy = (scheduleData[p.id] || []).includes(slotKeyToCheck);
            cellDetails.push({ name: p.name, role: p.role || 'optional', status: isBusy ? 'busy' : 'free', desc: isBusy ? '일정 있음' : '비어있음' });
        }
    });
    showSlotDetailsPanel(day, startSlot, cellDetails);
}

function updateParticipantSubmitAllButton() {
    const submitBtn = document.getElementById('btn-participant-submit-all');
    if (!submitBtn) return;
    
    if (participantVoteSubmitted) {
        submitBtn.disabled = true;
        submitBtn.innerText = "제출 완료";
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'default';
        return;
    }

    const count = Object.keys(participantSelectedVotes).length;
    if (count > 0) {
        submitBtn.disabled = false;
        submitBtn.innerText = `시간 선택 완료하고 전달하기 (${count}개 선택됨)`;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        submitBtn.style.backgroundColor = 'var(--color-blue)';
    } else {
        submitBtn.disabled = true;
        submitBtn.innerText = "시간 선택 완료하고 전달하기";
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'default';
        submitBtn.style.backgroundColor = 'var(--text-tertiary)';
    }
}

function submitAllParticipantVotes() {
    // Show a beautiful confirmation overlay
    let overlay = document.getElementById('vote-submit-confirm-overlay');
    if (overlay) overlay.remove();
    
    // Build summary text of selected votes
    let selectionsHTML = '';
    const sortedKeys = Object.keys(participantSelectedVotes).sort((a, b) => {
        const typeA = participantSelectedVotes[a];
        const typeB = participantSelectedVotes[b];
        if (typeA === typeB) return 0;
        if (typeA === 'preferred') return -1;
        return 1;
    });
    
    sortedKeys.forEach(k => {
        const voteType = participantSelectedVotes[k];
        const parts = k.split('-');
        const dayIdx = parseInt(parts[0]);
        const slotIdx = parseInt(parts[1]);
        const dateText = `${getDayName(dayIdx)}요일 ${SLOTS[slotIdx].label}`;
        
        const badgeHTML = voteType === 'preferred' 
            ? `<span style="font-size: 13px; font-weight: 700; color: #ff9800; display: flex; align-items: center; gap: 4px;">⭐ 선호</span>`
            : `<span style="font-size: 13px; font-weight: 700; color: var(--color-blue);">선택한 시간</span>`;
            
        selectionsHTML += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background-color: var(--bg-color); border-radius: 10px; margin-top: 8px;">
                ${badgeHTML}
                <span style="font-size: 13px; color: var(--text-secondary);">${dateText}</span>
            </div>
        `;
    });

    overlay = document.createElement('div');
    overlay.id = 'vote-submit-confirm-overlay';
    overlay.className = 'vote-preview-overlay';
    overlay.innerHTML = `
        <div class="vote-preview-modal" style="width: 360px; max-width: 90vw; background-color: var(--card-bg); border-radius: 20px; padding: 24px; box-sizing: border-box; display: flex; flex-direction: column;">
            <div class="vote-preview-head" style="gap: 8px; display: flex; flex-direction: column;">
                <span class="vote-preview-title" style="font-size: 18px; font-weight: 700; color: var(--text-primary); line-height: 1.4; text-align: center; display: block;">선택한 시간을 전달할까요?</span>
                <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.45; margin: 0; text-align: center;">선택하신 시간이 주최자에게 전달됩니다.</p>
                <div style="margin-top: 12px; max-height: 180px; overflow-y: auto; text-align: left;">
                    ${selectionsHTML}
                </div>
            </div>
            <div style="display: flex; gap: 8px; width: 100%; margin-top: 24px;">
                <button type="button" class="btn btn-secondary" id="btn-confirm-submit-cancel" style="flex: 1; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-color); background-color: var(--card-bg); color: var(--text-primary);">취소</button>
                <button type="button" class="btn btn-primary" id="btn-confirm-submit-send" style="flex: 1; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 600; background-color: var(--color-blue); color: #ffffff; border: none; cursor: pointer;">전달하기</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    
    const closeOverlay = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 250);
    };

    document.getElementById('btn-confirm-submit-cancel').addEventListener('click', closeOverlay);
    
    document.getElementById('btn-confirm-submit-send').addEventListener('click', () => {
        closeOverlay();
        
        // Save user's selected votes into mockParticipantSession.votes and preferences
        if (mockParticipantSession) {
            if (!mockParticipantSession.votes) mockParticipantSession.votes = {};
            if (!mockParticipantSession.preferences) mockParticipantSession.preferences = {};
            
            // Clear previous p1 votes
            Object.keys(mockParticipantSession.votes).forEach(k => {
                const a = mockParticipantSession.votes[k];
                const j = a.indexOf('p1');
                if (j >= 0) a.splice(j, 1);
            });
            Object.keys(mockParticipantSession.preferences).forEach(k => {
                const a = mockParticipantSession.preferences[k];
                const j = a.indexOf('p1');
                if (j >= 0) a.splice(j, 1);
            });
            
            // Add user's new votes and preferences
            Object.keys(participantSelectedVotes).forEach(k => {
                const voteType = participantSelectedVotes[k];
                if (voteType === 'available' || voteType === 'preferred') {
                    if (!mockParticipantSession.votes[k]) mockParticipantSession.votes[k] = [];
                    if (!mockParticipantSession.votes[k].includes('p1')) {
                        mockParticipantSession.votes[k].push('p1');
                    }
                }
                if (voteType === 'preferred') {
                    if (!mockParticipantSession.preferences[k]) mockParticipantSession.preferences[k] = [];
                    if (!mockParticipantSession.preferences[k].includes('p1')) {
                        mockParticipantSession.preferences[k].push('p1');
                    }
                }
            });
        }
        
        participantVoteSubmitted = true;
        
        // Hide the submit container
        const submitContainer = document.getElementById('participant-submit-container');
        if (submitContainer) submitContainer.style.display = 'none';
        
        // Show complete message popup
        showParticipantCompleteModal();
        
        // Refresh views to lock voting and update header
        calculateRecommendations();
        renderParticipants();
        renderCalendar();
        updateSummary([]);
    });
}

function submitParticipantVotes(day, startSlot) {
    // Show a beautiful confirmation overlay
    let overlay = document.getElementById('vote-submit-confirm-overlay');
    if (overlay) overlay.remove();
    
    overlay = document.createElement('div');
    overlay.id = 'vote-submit-confirm-overlay';
    overlay.className = 'vote-preview-overlay';
    overlay.innerHTML = `
        <div class="vote-preview-modal">
            <div class="vote-preview-head" style="gap: 8px; display: flex; flex-direction: column;">
                <span class="vote-preview-title" style="font-size: 18px; font-weight: 700; color: var(--text-primary); line-height: 1.4;">가능한 시간을 전달할까요?</span>
                <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.45; margin: 0;">주최자가 모든 참석자의 일정을 확인한 뒤 회의 시간을 확정할 예정입니다.</p>
            </div>
            <div style="display: flex; gap: 8px; width: 100%; margin-top: 24px;">
                <button type="button" class="btn btn-secondary" id="btn-confirm-submit-cancel" style="flex: 1; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-color); background-color: var(--card-bg); color: var(--text-primary);">취소</button>
                <button type="button" class="btn btn-primary" id="btn-confirm-submit-send" style="flex: 1; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 600; background-color: var(--color-blue); color: #ffffff; border: none; cursor: pointer;">전달하기</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    
    const closeOverlay = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 250);
    };

    document.getElementById('btn-confirm-submit-cancel').addEventListener('click', closeOverlay);
    
    document.getElementById('btn-confirm-submit-send').addEventListener('click', () => {
        closeOverlay();
        
        // Save user's selected slot
        if (mockParticipantSession) {
            if (!mockParticipantSession.votes) mockParticipantSession.votes = {};
            // Single choice: clear previous p1 votes first
            Object.keys(mockParticipantSession.votes).forEach(k => {
                const a = mockParticipantSession.votes[k];
                const j = a.indexOf('p1');
                if (j >= 0) a.splice(j, 1);
            });
            
            // Add vote for the chosen slot
            const slotKey = `${day}-${startSlot}`;
            if (!mockParticipantSession.votes[slotKey]) mockParticipantSession.votes[slotKey] = [];
            mockParticipantSession.votes[slotKey].push('p1');
        }
        
        participantVoteSubmitted = true;
        
        // Show complete message popup
        showParticipantCompleteModal();
        
        // Refresh views to lock voting and update header
        calculateRecommendations();
        renderParticipants();
        renderCalendar();
        updateSummary([]);

        // Re-open details panel for the chosen slot in disabled state
        const cellDetails = [];
        PARTICIPANT_SCENARIO_ROSTER.forEach(p => {
            const hasVoted = (mockParticipantSession.votes[`${day}-${startSlot}`] || []).includes(p.id);
            if (hasVoted) {
                cellDetails.push({ name: p.name, role: p.id === 'host' ? 'required' : 'optional', status: 'free', desc: '찬성 투표 완료' });
            } else {
                cellDetails.push({ name: p.name, role: p.id === 'host' ? 'required' : 'optional', status: 'busy', desc: '미선택 / 대기 중' });
            }
        });
        showSlotDetailsPanel(day, startSlot, cellDetails);
    });
}

function showParticipantCompleteModal() {
    let overlay = document.getElementById('vote-complete-modal-overlay');
    if (overlay) overlay.remove();
    
    overlay = document.createElement('div');
    overlay.id = 'vote-complete-modal-overlay';
    overlay.className = 'vote-preview-overlay';
    overlay.innerHTML = `
        <div class="vote-preview-modal" style="text-align: center; padding: 32px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <img src="images/envelope.png" alt="complete" style="width: 56px; height: 56px; object-fit: contain; flex-shrink: 0; margin-bottom: 16px;">
            <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">응답이 전달되었어요.</h3>
            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 24px 0;">회의 시간이 확정되면<br>알림으로 안내해드릴게요.</p>
            <button type="button" class="btn btn-primary" id="btn-complete-modal-close" style="width: 100%; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 600; background-color: var(--color-blue); color: #ffffff; border: none; cursor: pointer;">확인</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    
    document.getElementById('btn-complete-modal-close').addEventListener('click', () => {
        overlay.classList.remove('visible');
        setTimeout(() => {
            overlay.remove();
            
            // Navigate back to the personal calendar (schedule management) landing screen
            const setupContainer = document.getElementById('workspace-landing');
            const dashboardContainer = document.getElementById('coordination-dashboard');
            if (setupContainer && dashboardContainer) {
                // Restore default schedule data so coordinate slots are cleared
                restoreScheduleData();
                currentMeetingRole = 'host';
                
                setupContainer.style.display = 'flex';
                dashboardContainer.style.display = 'none';
                document.body.classList.add('view-landing');
                
                // Refresh wizard tags, personal calendar
                if (renderWizardGridGlobal) renderWizardGridGlobal();
                renderWorkspaceCalendar();
                history.pushState({ page: 'landing' }, '', '#landing');
                showToast("일정 관리 화면으로 돌아왔습니다.");
            }
            
            // Trigger simulated confirmation notification popover
            simulateHostConfirmationPopover();
        }, 250);
    });
}

function simulateHostConfirmationPopover(confirmedTime) {
    if (hostConfirmationTimeoutId) {
        clearTimeout(hostConfirmationTimeoutId);
    }
    // Don't show if the "디자인&개발 협업 미팅" has already been accepted and added to the calendar
    const userCustom = JSON.parse(localStorage.getItem('toss_user_custom_schedules') || '{}');
    const isAlreadyAccepted = Object.values(userCustom).some(details => details.title === '디자인&개발 협업 미팅') || 
                              Object.values(p1CustomSchedules || {}).some(details => details.title === '디자인&개발 협업 미팅');
    if (isAlreadyAccepted) return;

    hostConfirmationTimeoutId = setTimeout(() => {
        hostConfirmationTimeoutId = null;
        const pop = document.getElementById('message-popover');
        if (!pop) return;
        
        
        
        // Design & Development Collaboration Meeting is always confirmed at Friday 10:00 - 11:00 (Day 4, Slot 1)
        const optimalSlot = confirmedTime || { day: 4, startSlot: 1 };
            
        const dayIdx = optimalSlot.day;
        const slotIdx = optimalSlot.startSlot;
        const dayLabel = getDayName(dayIdx);
        const timeLabel = SLOTS[slotIdx].label.split(' - ')[0];
        
        // Update popover structure to represent confirmed meeting notice
        pop.className = 'message-popover confirmed-notif';
        pop.innerHTML = `
            <div class="message-popover-header">
                <div class="message-popover-avatar" style="background: rgba(139, 92, 246, 0.12) !important; color: #8b5cf6 !important; background-image: none !important;">이</div>
                <div class="message-popover-meta">
                    <span class="message-popover-sender">이토스</span>
                    <span class="message-popover-time">방금 전</span>
                </div>
                <span class="message-popover-tag" style="background-color: rgba(34, 197, 94, 0.1); color: #22c55e;">회의 확정</span>
            </div>
            <div class="message-popover-body">
                <span class="message-popover-title">디자인&개발 협업 미팅</span>
                <span class="message-popover-desc">회의가 ${dayLabel}요일 ${timeLabel}로 최종 확정되었습니다.<br>확인하여 캘린더에 일정을 추가하세요.</span>
            </div>
            <div class="message-popover-cta">
                <span>내 캘린더에 추가</span>
                <span class="message-popover-arrow">→</span>
            </div>
        `;
        
        // Clone element to reset event listeners cleanly
        const newPop = pop.cloneNode(true);
        pop.parentNode.replaceChild(newPop, pop);
        
        newPop.style.display = 'flex';
        void newPop.offsetWidth;
        newPop.classList.add('visible');
        
        newPop.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            newPop.classList.remove('visible');
            setTimeout(() => { newPop.style.display = 'none'; }, 400);
            
            // Add to calendar database
            const mondayStr = formatDate(getMondayOf(selectedDate));
            const fullKey = `${mondayStr}:${dayIdx}-${slotIdx}`;
            if (!scheduleData[currentUserId]) scheduleData[currentUserId] = [];
            if (!scheduleData[currentUserId].includes(fullKey)) {
                scheduleData[currentUserId].push(fullKey);
            }
            p1CustomSchedules[fullKey] = { title: "디자인&개발 협업 미팅", category: 'meeting', color: '#3182f6' };
            
            // Record key and details to local storage to persist across default preset resets
            const confirmedKeys = JSON.parse(localStorage.getItem('toss_confirmed_meeting_keys') || '[]');
            const confirmedDetails = JSON.parse(localStorage.getItem('toss_confirmed_meetings_details') || '{}');
            const userCustom = JSON.parse(localStorage.getItem('toss_user_custom_schedules') || '{}');
            const details = { title: "디자인&개발 협업 미팅", category: 'meeting', color: '#3182f6' };
            
            if (!confirmedKeys.includes(fullKey)) {
                confirmedKeys.push(fullKey);
            }
            confirmedDetails[fullKey] = details;
            userCustom[fullKey] = details;
            
            localStorage.setItem('toss_confirmed_meeting_keys', JSON.stringify(confirmedKeys));
            localStorage.setItem('toss_confirmed_meetings_details', JSON.stringify(confirmedDetails));
            localStorage.setItem('toss_user_custom_schedules', JSON.stringify(userCustom));
            
            saveScheduleDataToLocalStorage();
            renderWorkspaceCalendar();
            
            showToast("회의 일정이 내 캘린더에 등록되었습니다.");
            
            // Reset popover back to original setup listener
            setupMessagePopover();
        });
    }, 3500);
}

// Host action: show a preview of the request participants will receive, then "send" it.
function sendVoteRequest() {
    const meetingName = document.getElementById('meeting-name').value.trim() || '새 회의';

    // Build the preview overlay
    let overlay = document.getElementById('vote-request-preview-overlay');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'vote-request-preview-overlay';
    overlay.className = 'vote-preview-overlay';
    overlay.innerHTML = `
        <div class="vote-preview-modal">
            <div class="vote-preview-head" style="gap: 8px;">
                <span class="vote-preview-title" style="font-size: 18px; font-weight: 700; color: var(--text-primary); line-height: 1.4;">일정 선택을 요청할까요?</span>
                <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.45; margin: 0;">참석자는 아래 알림을 받고 가능한 시간을 선택합니다.</p>
            </div>

            <!-- Mock of the message popover the participants will receive -->
            <div style="display: flex; flex-direction: column;">
                <div class="vote-preview-card">
                    <div class="message-popover-header">
                        <div class="message-popover-avatar" style="background: rgba(49, 130, 246, 0.12) !important; color: #3182f6 !important; background-image: none !important;">김</div>
                        <div class="message-popover-meta">
                            <span class="message-popover-sender">김토스</span>
                            <span class="message-popover-time">방금 전</span>
                        </div>
                        <span class="message-popover-tag">일정 확인</span>
                    </div>
                    <div class="message-popover-body">
                        <span class="message-popover-title">${meetingName}</span>
                        <span class="message-popover-desc">회의 일정을 정하는 중이에요.<br>가능한 시간을 선택해주세요.</span>
                    </div>
                    <div class="message-popover-cta">
                        <span>일정 선택하기</span>
                        <span class="message-popover-arrow">→</span>
                    </div>
                </div>
            </div>

            <div class="vote-preview-actions">
                <button type="button" class="vote-preview-cancel" id="vote-preview-cancel">취소</button>
                <button type="button" class="vote-preview-send" id="vote-preview-send">요청 보내기</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    const close = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 250);
    };

    overlay.querySelector('#vote-preview-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    overlay.querySelector('#vote-preview-send').addEventListener('click', () => {
        close();
        showToast('참석자에게 일정 선택 요청을 보냈습니다.');
        
        // Immediately redirect host back to the personal calendar (landing) page
        const setupContainer = document.getElementById('workspace-landing');
        const dashboardContainer = document.getElementById('coordination-dashboard');
        if (setupContainer && dashboardContainer) {
            setupContainer.style.display = 'flex';
            dashboardContainer.style.display = 'none';
            document.body.classList.add('view-landing');
            history.pushState({ page: 'landing' }, '', '#landing');
        }
        
        // Reset wizard inputs and deselect templates
        const btnReset = document.getElementById('btn-wiz-reset');
        if (btnReset) btnReset.click();
        
        // Ensure Lee Toss's popover message remains visible (or re-shown if hidden)
        showMessagePopover();
        
        // Kick off the collection simulation
        startQuickPoll();
    });
}

function startQuickPoll() {
    const durationMin = parseInt(document.getElementById('meeting-duration').value);
    let slotsNeeded = Math.ceil(durationMin / 60);
    if (slotsNeeded < 1) slotsNeeded = 1;

    currentPollState = 'voting';
    renderRecommendationsList(currentRecommendations, slotsNeeded);

    if (quickPollTimeoutId) {
        clearTimeout(quickPollTimeoutId);
    }

    // Increase delay to 3.5s to feel more realistic and allow stacking notifications
    quickPollTimeoutId = setTimeout(() => {
        quickPollTimeoutId = null;
        currentPollState = 'completed';
        
        // Create a shared session if none exists, pre-populated with mock votes
        let session = getActiveSession();
        if (!session) {
            const nameVal = document.getElementById('meeting-name').value.trim() || '디자인1팀 회의';
            session = {
                id: 'session-' + Date.now(),
                title: nameVal,
                duration: durationMin,
                hostId: 'p1',
                status: 'coordinating',
                participants: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
                votes: {},
                confirmedTime: null
            };
        }
        
        // Pre-populate mock votes for top recommendations
        if (currentRecommendations.length > 0) {
            const rec0 = currentRecommendations[0];
            session.votes[`${rec0.day}-${rec0.startSlot}`] = ['p2', 'p3', 'p4', 'p5', 'p6']; // 5 votes
        }
        if (currentRecommendations.length > 1) {
            const rec1 = currentRecommendations[1];
            session.votes[`${rec1.day}-${rec1.startSlot}`] = ['p3', 'p4', 'p5']; // 3 votes
        }
        if (currentRecommendations.length > 2) {
            const rec2 = currentRecommendations[2];
            session.votes[`${rec2.day}-${rec2.startSlot}`] = ['p4']; // 1 vote
        }
        
        localStorage.setItem('toss_shared_meeting_session', JSON.stringify(session));
        localStorage.setItem('toss_session_invite_notification', 'true');
        
        // Fire storage sync
        window.dispatchEvent(new Event('storage'));
        
        calculateRecommendations();
        renderCalendar();
        
        // Show host completed response popover above Lee Toss popover
        showHostResponsePopover();
        
        showToast('참석자 응답이 모두 도착했습니다.');
    }, 3500);
}

function confirmMeeting(day, startSlot, slotsNeeded) {
    const session = getActiveSession();
    if (!session) return;

    // Set session status to confirmed
    session.status = 'confirmed';
    session.confirmedTime = { day, startSlot, slotsNeeded };
    localStorage.setItem('toss_shared_meeting_session', JSON.stringify(session));

    // Automatically book this schedule for all participants!
    const slotKeysToBook = [];
    for (let i = 0; i < slotsNeeded; i++) {
        slotKeysToBook.push(`${day}-${startSlot + i}`);
    }

    // Save this meeting into each user's schedules in localStorage
    session.participants.forEach(pId => {
        const key = `toss_busy_slots_${pId}`;
        let list = [];
        try {
            const saved = localStorage.getItem(key);
            list = saved ? JSON.parse(saved) : [];
        } catch(e) {}
        
        slotKeysToBook.forEach(sk => {
            if (!list.includes(sk)) list.push(sk);
        });
        localStorage.setItem(key, JSON.stringify(list));
    });

    // Also update current active scheduleData for host (date-specific)
    const mondayStr = formatDate(getMondayOf(selectedDate));
    const confirmedKeys = JSON.parse(localStorage.getItem('toss_confirmed_meeting_keys') || '[]');
    const confirmedDetails = JSON.parse(localStorage.getItem('toss_confirmed_meetings_details') || '{}');
    const userCustom = JSON.parse(localStorage.getItem('toss_user_custom_schedules') || '{}');

    slotKeysToBook.forEach(sk => {
        const fullKey = `${mondayStr}:${sk}`;
        if (!scheduleData[currentUserId]) scheduleData[currentUserId] = [];
        if (!scheduleData[currentUserId].includes(fullKey)) scheduleData[currentUserId].push(fullKey);
        
        const details = { title: session.title, category: 'work', color: '#3182f6' };
        p1CustomSchedules[fullKey] = details;
        
        if (!confirmedKeys.includes(fullKey)) confirmedKeys.push(fullKey);
        confirmedDetails[fullKey] = details;
        userCustom[fullKey] = details;
    });

    localStorage.setItem('toss_confirmed_meeting_keys', JSON.stringify(confirmedKeys));
    localStorage.setItem('toss_confirmed_meetings_details', JSON.stringify(confirmedDetails));
    localStorage.setItem('toss_user_custom_schedules', JSON.stringify(userCustom));
    saveScheduleDataToLocalStorage();

    // Notify other tabs
    window.dispatchEvent(new Event('storage'));

    // Show toast and re-render
    const whenLabel = `${getDayName(day)}요일 ${SLOTS[startSlot].label.split(' - ')[0]}~`;
    showToast(`회의가 확정되었습니다. ${whenLabel}`);

    // Record confirmation so it appears in the notification center
    try {
        localStorage.setItem('toss_last_confirmed_meeting', JSON.stringify({
            title: session.title,
            when: whenLabel
        }));
    } catch (e) {}
    
    // Clear session
    localStorage.removeItem('toss_shared_meeting_session');
    
    // Reset Setup Wizard inputs for next meeting
    const wizName = document.getElementById('wiz-meeting-name');
    if (wizName) wizName.value = '';
    
    // Deselect template chips
    document.querySelectorAll('.wiz-template-chip').forEach(c => c.classList.remove('active'));

    const wizBtns = document.querySelectorAll('#wiz-duration-selector .duration-segment-btn');
    if (wizBtns.length > 0) {
        wizBtns.forEach(b => b.classList.remove('active'));
        const wizBtn1h = document.querySelector('#wiz-duration-selector .duration-segment-btn[data-value="60"]');
        if (wizBtn1h) wizBtn1h.classList.add('active');
    }
    const wizCustWrap = document.getElementById('wiz-custom-duration-wrapper');
    if (wizCustWrap) wizCustWrap.style.display = 'none';

    // Reset Dashboard inputs
    const mName = document.getElementById('meeting-name');
    if (mName) mName.value = '';
    const durBtns = document.querySelectorAll('#duration-selector .duration-segment-btn');
    if (durBtns.length > 0) {
        durBtns.forEach(b => b.classList.remove('active'));
        const durBtn1h = document.querySelector('#duration-selector .duration-segment-btn[data-value="60"]');
        if (durBtn1h) durBtn1h.classList.add('active');
    }
    const customWrapper = document.getElementById('custom-duration-wrapper');
    if (customWrapper) customWrapper.style.display = 'none';
    const durationSelect = document.getElementById('meeting-duration');
    if (durationSelect) durationSelect.value = '60';

    // Reset participants (only host added/enabled)
    participants.forEach(p => {
        p.added = p.id === 'p1';
        p.enabled = p.added;
    });

    if (renderWizardGridGlobal) renderWizardGridGlobal();
    if (renderSearchResultsGlobal) renderSearchResultsGlobal('');

    // Transition back
    currentPollState = null;
    participantVoteSubmitted = false;
    
    const setupContainer = document.getElementById('workspace-landing');
    const dashboardContainer = document.getElementById('coordination-dashboard');
    if (setupContainer && dashboardContainer) {
        setupContainer.style.display = 'flex';
        dashboardContainer.style.display = 'none';
        document.body.classList.add('view-landing');
        history.pushState({ page: 'landing' }, '', '#landing');
    }
    
    renderWorkspaceCalendar();
    renderParticipants();
    calculateRecommendations();
    renderCalendar();
    checkNotifications();
}

function enterParticipantView() {
    // Switch role to participant
    currentMeetingRole = 'participant';
    participantVoteSubmitted = false;
    participantSelectedVotes = {};

    // Hide the submit container (submission is now handled via detail panel button)
    const submitContainer = document.getElementById('participant-submit-container');
    if (submitContainer) {
        submitContainer.style.display = 'none';
    }

    // Hide any notification badges & popovers
    document.querySelectorAll('.bell-red-badge').forEach(badge => badge.style.display = 'none');
    const notifPopover = document.getElementById('notification-popover');
    if (notifPopover) notifPopover.style.display = 'none';

    // Hide the bottom-left message popover once acted upon
    hideMessagePopover(true);
    if (currentPollState === 'completed') {
        showHostResponsePopover();
    }

    // Setup realistic scenario schedule data for participant view
    const mondayStr = formatDate(getMondayOf(selectedDate));
    scheduleData['host'] = ['0-0', '0-1', '0-2', '0-4', '0-5', '0-8', '1-1', '1-2', '1-6', '2-0', '2-2', '2-4', '2-7', '3-2', '3-4', '4-0', '4-2', '4-5'];
    scheduleData['p1']   = ['0-1', '0-8', '1-0', '1-5', '1-6', '2-1', '2-4', '2-8', '3-1', '3-2', '3-5', '3-6', '3-8', '4-0', '4-4', '4-5', '4-6'].map(k => `${mondayStr}:${k}`);
    scheduleData['p2']   = ['0-0', '0-2', '0-7', '0-8', '1-0', '1-1', '1-4', '1-7', '1-8', '2-2', '2-5', '2-6', '2-7', '3-4', '3-5', '3-6', '4-2', '4-4', '4-8'];
    scheduleData['p3']   = ['0-6', '1-5', '1-6', '1-8', '2-5', '3-0', '3-4', '3-6', '3-7', '4-0', '4-4', '4-5', '4-6', '4-8'];
    scheduleData['p4']   = ['0-2', '0-4', '0-5', '0-6', '0-7', '1-4', '1-8', '2-4', '2-8', '3-1', '3-2', '3-6', '3-7', '4-0', '4-2', '4-5'];

    // Setup mock coordination session (only if not already voting on it)
    if (!mockParticipantSession) {
        mockParticipantSession = {
            title: "디자인&개발 협업 미팅",
            duration: 60,
            host: "이토스",
            votes: {
                "1-5": ["host", "p2", "p4"], // Tuesday 14:00 - 15:00 (3 votes)
                "3-5": ["host", "p3", "p4"], // Thursday 14:00 - 15:00 (3 votes)
                "3-8": ["host", "p2", "p3", "p4"], // Thursday 17:00 - 18:00 (4 votes)
                "4-1": ["p2", "p3"]          // Friday 10:00 - 11:00 (2 votes)
            },
            preferences: {
                "1-5": ["p4"],
                "3-5": ["p3"],
                "3-8": ["p2", "p3"],
                "4-1": ["p2"]
            }
        };
    }

    // Sync sidebar values
    const meetingNameInput = document.getElementById('meeting-name');
    if (meetingNameInput) meetingNameInput.value = mockParticipantSession.title;
    const durationSelect = document.getElementById('meeting-duration');
    if (durationSelect) durationSelect.value = mockParticipantSession.duration;

    // Transition to dashboard (participant view)
    const setupContainer = document.getElementById('workspace-landing');
    const dashboardContainer = document.getElementById('coordination-dashboard');
    if (setupContainer && dashboardContainer) {
        setupContainer.style.display = 'none';
        dashboardContainer.style.display = 'flex';
        document.body.classList.remove('view-landing');
        history.pushState({ page: 'dashboard' }, '', '#dashboard');
        showToast(`'${mockParticipantSession.title}' 조율방에 입장했습니다.`);
    }

    calculateRecommendations();
    renderCalendar();
    renderParticipants();
}

// Show / hide the bottom-left message popover
function showMessagePopover() {
    const pop = document.getElementById('message-popover');
    if (!pop) return;
    // Don't re-show if the user is already a participant in this session
    if (currentMeetingRole === 'participant') return;
    
    // Don't show if the "디자인&개발 협업 미팅" has already been accepted and added to the calendar
    const userCustom = JSON.parse(localStorage.getItem('toss_user_custom_schedules') || '{}');
    const isAlreadyAccepted = Object.values(userCustom).some(details => details.title === '디자인&개발 협업 미팅') || 
                              Object.values(p1CustomSchedules || {}).some(details => details.title === '디자인&개발 협업 미팅');
    if (isAlreadyAccepted) return;
    
    pop.style.display = 'flex';
    // force reflow so the transition plays
    void pop.offsetWidth;
    pop.classList.add('visible');
}


function hideMessagePopover(immediate) {
    const pop = document.getElementById('message-popover');
    if (!pop) return;
    pop.classList.remove('visible');
    if (immediate) {
        pop.style.display = 'none';
    } else {
        setTimeout(() => { pop.style.display = 'none'; }, 400);
    }
}

function setupMessagePopover() {
    const pop = document.getElementById('message-popover');
    if (!pop) return;
    const go = (e) => {
        if (e) e.stopPropagation();
        enterParticipantView();
    };
    pop.addEventListener('click', go);
    pop.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); }
    });
}

function showHostResponsePopover() {
    const pop = document.getElementById('host-response-popover');
    if (!pop) return;
    
    const session = getActiveSession();
    if (!session) return;
    if (session) {
        const senderSpan = pop.querySelector('.message-popover-sender');
        if (senderSpan) senderSpan.innerText = session.title;
        
        const avatar = pop.querySelector('.message-popover-avatar');
        if (avatar) {
            avatar.style.backgroundColor = 'var(--color-blue)';
            avatar.style.color = '#ffffff';
            avatar.innerText = '✓';
        }
    }
    
    pop.style.display = 'flex';
    void pop.offsetWidth;
    pop.classList.add('visible');
}

function hideHostResponsePopover(immediate) {
    const pop = document.getElementById('host-response-popover');
    if (!pop) return;
    pop.classList.remove('visible');
    if (immediate) {
        pop.style.display = 'none';
    } else {
        setTimeout(() => { pop.style.display = 'none'; }, 400);
    }
}

function setupHostResponsePopover() {
    const pop = document.getElementById('host-response-popover');
    if (!pop) return;
    const go = (e) => {
        if (e) e.stopPropagation();
        
        // Restore schedule data to revert any participant mode modifications
        restoreScheduleData();
        
        // Enter host dashboard in 'completed' state
        currentMeetingRole = 'host';
        currentPollState = 'completed';
        
        // Keep participant popover visible/re-show it
        showMessagePopover();
        
        const setupContainer = document.getElementById('workspace-landing');
        const dashboardContainer = document.getElementById('coordination-dashboard');
        if (setupContainer && dashboardContainer) {
            setupContainer.style.display = 'none';
            dashboardContainer.style.display = 'flex';
            document.body.classList.remove('view-landing');
            history.pushState({ page: 'dashboard' }, '', '#dashboard');
        }
        
        // Hide popover
        hideHostResponsePopover();
        
        // Restore session details (title, duration, participants) from localStorage
        const session = getActiveSession();
        if (session) {
            // Restore meeting name
            const mName = document.getElementById('meeting-name');
            if (mName) mName.value = session.title;
            
            // Restore duration
            const durationSelect = document.getElementById('meeting-duration');
            if (durationSelect) {
                durationSelect.value = session.duration;
                // Sync segment buttons
                const durBtns = document.querySelectorAll('#duration-selector .duration-segment-btn');
                durBtns.forEach(b => {
                    b.classList.remove('active');
                    if (parseInt(b.getAttribute('data-value')) === session.duration) {
                        b.classList.add('active');
                    }
                });
            }
            
            // Restore active participants
            participants.forEach(p => {
                const inSession = session.participants.includes(p.id);
                p.added = inSession;
                p.enabled = inSession;
            });
        }
        
        // Ensure recommendations list and calendar are correctly rendered
        calculateRecommendations();
        renderCalendar();
        renderParticipants();
        
        showToast("응답 취합이 완료되었습니다.");
    };
    
    pop.addEventListener('click', go);
    pop.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); }
    });
}

function checkNotifications() {
    const listContainer = document.getElementById('notification-list-container');
    const redBadges = document.querySelectorAll('.bell-red-badge');

    if (!listContainer) return;

    // Check if notifications have been cleared (read)
    const isRead = localStorage.getItem('toss_notifications_read') === 'true';

    // Update red badges
    redBadges.forEach(badge => {
        badge.style.display = isRead ? 'none' : 'block';
    });

    if (isRead) {
        listContainer.innerHTML = `
            <div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 12px;">
                새로운 알림이 없습니다.
            </div>`;
        return;
    }

    const notifs = [
        {
            dotColor: '#3182f6',
            text: '이토스(디자인2팀)님에게 회의 요청이 도착했습니다.',
            time: '방금 전'
        },
        {
            dotColor: '#3182f6',
            text: 'toss align 2.0 업데이트가 완료되었습니다.',
            time: '15분 전'
        },
        {
            dotColor: '#3182f6',
            text: 'Google Calendar 동기화가 완료되었습니다.',
            time: '1시간 전'
        }
    ];

    listContainer.innerHTML = notifs.map((n, idx) => {
        const isLast = idx === notifs.length - 1;
        const borderStyle = isLast ? '' : 'border-bottom: 1px solid var(--border-color);';
        return `
            <div class="notification-item-card" style="display: flex; gap: 10px; padding: 12px 16px; ${borderStyle} transition: background-color 0.2s; cursor: pointer;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${n.dotColor}; margin-top: 5px; flex-shrink: 0;"></div>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-size: 12px; color: var(--text-primary); line-height: 1.4;">${n.text}</span>
                    <span style="font-size: 10px; color: var(--text-secondary);">${n.time}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateSummary(recs) {
    const textNode = document.getElementById('summary-text');
    if (!textNode) return;

    if (currentMeetingRole === 'participant') {
        if (mockParticipantSession && mockParticipantSession.status === 'confirmed') {
            textNode.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-size: 15px; font-weight: 700; color: #22c55e;">🎉 회의 시간이 최종 확정되었습니다!</span>
                    <span style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">목요일 17:00 - 18:00 (디자인&개발 협업 미팅)</span>
                </div>
            `;
        } else if (participantVoteSubmitted) {
            textNode.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-size: 15px; font-weight: 700; color: var(--text-primary);">가능한 시간을 전달했어요.</span>
                    <span style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">주최자가 모든 참석자의 일정을 확인한 뒤 회의 시간을 확정할 예정입니다.</span>
                </div>
            `;
        } else {
            textNode.innerHTML = `<span style="font-size: 15px; font-weight: 700; color: var(--text-primary);">참석 가능한 시간을 선택해주세요.</span>`;
        }
        return;
    }

    if (currentPollState !== 'completed') {
        textNode.innerText = "참석자들의 가능한 시간을 확인하고, 가장 적합한 회의 시간을 찾아보세요.";
        return;
    }

    if (recs.length === 0 || recs[0].score < 40) {
        textNode.innerText = "⚠️ 조건에 맞는 일정이 없어 대안 제시 모델이 활성화되었습니다.";
        return;
    }

    const best = recs[0];
    const dayText = getDayName(best.day);
    
    // Format duration label
    let timeText = `${SLOTS[best.startSlot].label.split(' - ')[0]}`;
    if (best.slotsNeeded === 1) {
        timeText += ` - ${SLOTS[best.startSlot].label.split(' - ')[1]}`;
    } else {
        timeText += ` - ${SLOTS[best.startSlot + best.slotsNeeded - 1].label.split(' - ')[1]}`;
    }

    const targetDate = new Date(getMondayOf(selectedDate));
    targetDate.setDate(targetDate.getDate() + best.day);
    const month = targetDate.getMonth() + 1;
    const dateVal = targetDate.getDate();
    const dayName = getDayName(best.day);

    textNode.innerHTML = `가장 적합한 회의 시간은 <strong>${month}월 ${dateVal}일(${dayName}요일) ${timeText}</strong>입니다.`;
}

function updateSummaryText(text) {
    document.getElementById('summary-text').innerText = text;
}

// Roster for the PARTICIPANT scenario (a meeting hosted by 이토스, where 김토스 is just an attendee)
const PARTICIPANT_SCENARIO_ROSTER = [
    { id: 'host', name: '이토스', desc: '디자인2팀 / 팀장', avatarColor: '#8b5cf6', kind: 'host', constraints: [] },
    { id: 'p1',   name: '김토스', desc: '디자인1팀 / 팀장 · 나', avatarColor: '#3182f6', kind: 'me', constraints: [] },
    { id: 'p2',   name: '박개발', desc: '코어개발팀 / 수석개발자', avatarColor: '#24db67', kind: 'peer', constraints: [{ day: 3, slot: 4, type: 'lunch', desc: '집중도 회복 희망 시간' }] },
    { id: 'p3',   name: '최마케터', desc: '브랜드마케팅팀 / 파트장', avatarColor: '#f04452', kind: 'peer', constraints: [] },
    { id: 'p4',   name: '강기획', desc: '서비스기획팀 / PM', avatarColor: '#a855f7', kind: 'peer', constraints: [] }
];

// Has 김토스 (p1) already cast a vote in the participant session?
function myVoteCount() {
    if (!mockParticipantSession || !mockParticipantSession.votes) return 0;
    return Object.values(mockParticipantSession.votes)
        .filter(arr => Array.isArray(arr) && arr.includes('p1')).length;
}

function renderParticipantsAsAttendee() {
    const listContainer = document.getElementById('participants-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    PARTICIPANT_SCENARIO_ROSTER.forEach(p => {
        // Did this person already vote?
        let voted = false;
        if (mockParticipantSession && mockParticipantSession.votes) {
            voted = Object.values(mockParticipantSession.votes)
                .some(arr => Array.isArray(arr) && arr.includes(p.id));
        }
        if (p.kind === 'me') voted = participantVoteSubmitted;

        let badge = '';
        if (p.kind === 'host') badge = ' <span class="host-text-badge">(주최자)</span>';
        else if (p.kind === 'me') badge = ' <span class="host-text-badge" style="color: var(--color-blue);">(나)</span>';

        // status chip: 주최자는 상태 표시 안 함, 나머지는 투표 완료/대기
        let statusChip = '';
        if (p.kind !== 'host') {
            statusChip = voted
                ? `<span class="vote-status voted" style="font-size: 11px; font-weight: 700; color: #12b886; background-color: rgba(18,184,134,0.1); padding: 4px 10px; border-radius: 8px; white-space: nowrap;">투표 완료</span>`
                : `<span class="vote-status pending" style="font-size: 11px; font-weight: 700; color: var(--text-tertiary); background-color: rgba(139,149,161,0.1); padding: 4px 10px; border-radius: 8px; white-space: nowrap;">대기 중</span>`;
        } else {
            statusChip = `<span class="vote-status" style="font-size: 11px; font-weight: 700; color: #8b5cf6; background-color: rgba(139,92,246,0.1); padding: 4px 10px; border-radius: 8px; white-space: nowrap;">확정 권한</span>`;
        }

        const item = document.createElement('div');
        item.className = 'participant-item';
        item.setAttribute('data-id', p.id);
        item.innerHTML = `
            <div class="avatar" style="background-color: ${p.avatarColor}20; color: ${p.avatarColor};">
                ${p.name[0]}
            </div>
            <div class="participant-info">
                <div class="participant-name-wrapper">
                    <span class="participant-name">${p.name}${badge}</span>
                </div>
                <div class="participant-constraint-tag">${p.desc}</div>
            </div>
            <div class="attendance-buttons">${statusChip}</div>
        `;
        listContainer.appendChild(item);
    });

    const countEl = document.getElementById('participant-count');
    if (countEl) countEl.textContent = PARTICIPANT_SCENARIO_ROSTER.length;
}

function renderParticipants() {
    // Participant scenario: show 이토스's roster with vote statuses, no host controls.
    if (currentMeetingRole === 'participant') {
        renderParticipantsAsAttendee();
        return;
    }

    const listContainer = document.getElementById('participants-list');
    listContainer.innerHTML = '';
    
    let activeCount = 0;

    participants.filter(p => p.added).forEach(p => {
        if (p.enabled) activeCount++;

        const item = document.createElement('div');
        item.className = 'participant-item';
        item.setAttribute('data-id', p.id);

        let constraintLabel = '정상 일정';
        let hasNotice = false;
        
        if (p.constraints.length > 0) {
            const types = [...new Set(p.constraints.map(c => c.type))];
            if (types.includes('out')) {
                constraintLabel = '특정 요일 외근';
                hasNotice = true;
            } else if (types.includes('lunch')) {
                constraintLabel = '집중도 회복 희망';
                hasNotice = true;
            } else if (types.includes('busy')) {
                constraintLabel = '정기 회의 보유';
            }
        }

        item.innerHTML = `
            <div class="avatar" style="background-color: ${p.avatarColor}20; color: ${p.avatarColor};">
                ${p.name[0]}
            </div>
            <div class="participant-info">
                <div class="participant-name-wrapper">
                    <span class="participant-name">${p.name}${p.id === 'p1' ? ' <span class="host-text-badge">(주최자)</span>' : ''}</span>
                </div>
                <div class="participant-constraint-tag">
                    ${p.desc || constraintLabel}
                </div>
            </div>
            <div class="attendance-buttons">
                <button type="button" class="btn-role-toggle role-required ${p.role === 'required' ? 'active' : ''}">필수</button>
                <button type="button" class="btn-role-toggle role-optional ${p.role === 'optional' ? 'active' : ''}">선택</button>
            </div>
        `;

        const reqBtn = item.querySelector('.role-required');
        const optBtn = item.querySelector('.role-optional');

        reqBtn.addEventListener('click', () => {
            if (p.role !== 'required') {
                p.role = 'required';
                renderParticipants();
                calculateRecommendations();
                renderCalendar();
            }
        });

        optBtn.addEventListener('click', () => {
            if (p.role !== 'optional') {
                p.role = 'optional';
                renderParticipants();
                calculateRecommendations();
                renderCalendar();
            }
        });

        listContainer.appendChild(item);
    });

    document.getElementById('participant-count').innerText = participants.filter(p => p.added).length;
}

// Fallback UI for generic conflicts
function renderFallbackUI(container) {
    const fallbackCard = document.createElement('div');
    fallbackCard.className = 'card fallback-warning-container';
    
    let adviceHTML = `
        <div class="fallback-warning">
            <div>
                <div class="fallback-warning-title">⚠️ 일치하는 일정이 없습니다</div>
                <p>참석 대상을 줄이거나 회의 설정을 변경하여 대안을 찾을 수 있습니다.</p>
            </div>
        </div>
        <div class="fallback-resolutions">
            <button id="btn-fallback-exclude-opt" class="btn btn-secondary" style="margin-top: 12px; width:100%; text-align:left;">
                💡 <strong>대안 1:</strong> 선택 참석자 전원 제외하고 빈 시간 보기
            </button>
            <button id="btn-fallback-shorten" class="btn btn-secondary" style="margin-top: 8px; width:100%; text-align:left;">
                💡 <strong>대안 2:</strong> 회의 시간을 30분으로 단축하기
            </button>
        </div>
    `;
    
    fallbackCard.innerHTML = adviceHTML;
    container.appendChild(fallbackCard);

    document.getElementById('btn-fallback-exclude-opt').addEventListener('click', () => {
        participants.forEach(p => {
            if (p.role === 'optional') p.enabled = false;
        });
        renderParticipants();
        calculateRecommendations();
        renderCalendar();
        showToast("선택 참석자를 제외하고 재조율했습니다.");
    });

    document.getElementById('btn-fallback-shorten').addEventListener('click', () => {
        document.getElementById('meeting-duration').value = '30';
        calculateRecommendations();
        showToast("회의 시간을 30분으로 줄였습니다.");
    });
}

// Split-session fallback suggestion for long meetings
function renderSplitSessionFallback(container, durationMin) {
    const card = document.createElement('div');
    card.className = 'card fallback-warning-container';
    
    // Find two split sessions (e.g. if 3h, split to 1.5h and 1.5h, which is 2 slots and 2 slots)
    // We will simulate finding the top 2 best independent 1.5h blocks
    const halfSlotsNeeded = durationMin >= 180 ? 2 : 1; // 3h workshop -> split to 1.5h (2 slots) and 1.5h (2 slots)
    const halfDurationMin = halfSlotsNeeded * 60;

    // Run a mini recommendation lookup for half size
    const subRecs = [];
    const enabledParticipants = participants.filter(p => p.enabled);

    for (let day = 0; day < DAYS.length; day++) {
        for (let startSlot = 0; startSlot <= SLOTS.length - halfSlotsNeeded; startSlot++) {
            let crossesLunch = false;
            for (let i = 0; i < halfSlotsNeeded; i++) {
                if (SLOTS[startSlot + i].isLunchTime) crossesLunch = true;
            }
            if (crossesLunch) continue;

            let score = 100;
            let requiredConflict = false;

            for (let i = 0; i < halfSlotsNeeded; i++) {
                enabledParticipants.forEach(p => {
                    const slotKey = p.id === currentUserId ? `${formatDate(getMondayOf(selectedDate))}:${day}-${startSlot + i}` : `${day}-${startSlot + i}`;
                    const isBusy = (scheduleData[p.id] || []).includes(slotKey);
                    if (isBusy && p.role === 'required' && !p.constraints.some(c => c.day === day && c.slot === startSlot + i && c.flexible)) {
                        requiredConflict = true;
                    }
                });
            }

            if (requiredConflict) continue;
            subRecs.push({ day, startSlot });
        }
    }

    // Select top 2 unique times (on weekdays first if possible)
    const weekdaySubRecs = subRecs.filter(s => s.day >= 0 && s.day <= 4);
    let finalSubRecs = weekdaySubRecs.length >= 2 ? weekdaySubRecs : subRecs;

    let session1 = finalSubRecs[0];
    let session2 = finalSubRecs.find(s => s.day !== session1?.day) || finalSubRecs[1];

    if (!session1 || !session2) {
        card.innerHTML = `
            <div class="fallback-warning" style="background-color: var(--color-red-light); color: var(--color-red);">
                <div class="fallback-warning-title">🚨 워크숍을 잡을 일정이 아예 없습니다</div>
                <p>필수 참석자들의 일정이 너무 밀집해 있어 회의 분할조차 불가능합니다. 동료들의 일정을 정리해 주세요.</p>
            </div>
        `;
        container.appendChild(card);
        return;
    }

    const time1 = `${getDayName(session1.day)}요일 ${SLOTS[session1.startSlot].label.split(' - ')[0]} - ${SLOTS[session1.startSlot + halfSlotsNeeded - 1].label.split(' - ')[1]}`;
    const time2 = `${getDayName(session2.day)}요일 ${SLOTS[session2.startSlot].label.split(' - ')[0]} - ${SLOTS[session2.startSlot + halfSlotsNeeded - 1].label.split(' - ')[1]}`;

    card.innerHTML = `
        <div class="fallback-warning" style="background-color: var(--color-blue-light); color: var(--color-blue); border-color: rgba(49, 130, 246, 0.2);">
            <div>
                <div class="fallback-warning-title">💡 ${durationMin/60}시간 연속 일정이 없습니다. 분할 회의를 추천해요!</div>
                <p>일정을 <strong>${halfDurationMin/60}시간씩 2회</strong>로 나누어 진행하면 모두가 참석할 수 있습니다.</p>
            </div>
        </div>
        <div class="split-option-box" style="margin-top: 14px; background:var(--bg-color); padding: 14px; border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
            <div style="font-weight:700; margin-bottom:8px; font-size:13px; color:var(--text-primary);">추천 분할 일정</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-bottom: 6px;">📍 <strong>1세션 (${halfDurationMin/60}h):</strong> ${time1}</div>
            <div style="font-size:12px; color:var(--text-secondary);">📍 <strong>2세션 (${halfDurationMin/60}h):</strong> ${time2}</div>
        </div>
        <button id="btn-confirm-split" class="btn btn-primary" style="width: 100%; margin-top: 12px; padding:10px;">
            두 세션 모두 예약 요청하기 (슬랙 알림 동시 전송)
        </button>
    `;
    
    container.appendChild(card);

    document.getElementById('btn-confirm-split').addEventListener('click', () => {
        // Book both slots
        const slots1 = Array.from({length: halfSlotsNeeded}, (_, i) => `${session1.day}-${session1.startSlot + i}`);
        const slots2 = Array.from({length: halfSlotsNeeded}, (_, i) => `${session2.day}-${session2.startSlot + i}`);
        
        participants.forEach(p => {
            if (p.enabled) {
                if (!scheduleData[p.id]) scheduleData[p.id] = [];
                slots1.forEach(s => !scheduleData[p.id].includes(s) && scheduleData[p.id].push(s));
                slots2.forEach(s => !scheduleData[p.id].includes(s) && scheduleData[p.id].push(s));
            }
        });

        calculateRecommendations();
        renderCalendar();
        showToast("분할 회의가 등록되었습니다.");
    });
}

// 5. Calendar Grid Render (Phase 2 Heatmap Style)
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Always show all DAYS.length days
    grid.style.gridTemplateColumns = `100px repeat(${DAYS.length}, minmax(0, 1fr))`;

    // Render spacer cell
    const corner = document.createElement('div');
    corner.className = 'grid-header';
    corner.innerText = '시간';
    corner.style.gridColumn = '1';
    corner.style.gridRow = '1';
    grid.appendChild(corner);

    const monday = getMondayOf(selectedDate);
    DAYS.forEach((day, visualDayIdx) => {
        const dayIdx = getInternalDayIdx(visualDayIdx);
        const header = document.createElement('div');
        header.className = 'grid-header';
        if (visualDayIdx === 0 || visualDayIdx === 6) {
            header.className += ' weekend-header';
        }
        if (isDayPassed(dayIdx)) {
            header.className += ' status-passed-header';
        }
        header.style.gridColumn = (visualDayIdx + 2).toString();
        header.style.gridRow = '1';
        if (visualDayIdx === DAYS.length - 1) {
            header.style.borderRight = 'none';
        }
        
        const currentDayDate = new Date(monday);
        currentDayDate.setDate(monday.getDate() + (visualDayIdx - 1));
        
        const m = currentDayDate.getMonth() + 1;
        const d = currentDayDate.getDate();
        
        const todayObj = getKSTDate();
        const isToday = currentDayDate.getFullYear() === todayObj.getFullYear() &&
                        currentDayDate.getMonth() === todayObj.getMonth() &&
                        currentDayDate.getDate() === todayObj.getDate();
        if (isToday) {
            header.className += ' today-header';
        }
        
        header.innerHTML = `${day}<span>${m}월 ${d}일</span>`;
        grid.appendChild(header);
    });

    // Render time label cells
    SLOTS.forEach((slot, slotIdx) => {
        const timeCell = document.createElement('div');
        timeCell.className = 'time-col-cell';
        timeCell.innerText = slot.label;
        timeCell.style.gridColumn = '1';
        timeCell.style.gridRow = (slotIdx + 2).toString();
        grid.appendChild(timeCell);
    });

    if (currentViewMode === 'my-schedule') {
        // Render calendar cells day-by-day with vertical merging
        for (let visualDayIdx = 0; visualDayIdx < DAYS.length; visualDayIdx++) {
            const dayIdx = getInternalDayIdx(visualDayIdx);
            const daySchedules = getDaySchedules(dayIdx);
            daySchedules.forEach(sched => {
                const cell = document.createElement('div');
                cell.className = 'calendar-cell';
                if (visualDayIdx === 0 || visualDayIdx === 6) {
                    cell.className += ' weekend-cell';
                }
                cell.setAttribute('data-day', dayIdx);
                cell.setAttribute('data-slot', sched.startSlot);
                cell.style.gridColumn = (visualDayIdx + 2).toString();
                cell.style.gridRow = `${sched.startSlot + 2} / ${sched.endSlot + 2}`;

                if (isDayPassed(dayIdx)) {
                    cell.className += ' status-passed-day';
                }

                if (sched.isLunchTime) {
                    cell.className += ' status-lunch';
                    cell.innerHTML = `
                        <div class="cell-content" style="display: flex; align-items: center; justify-content: center; height: 100%;">
                            <span style="color: var(--text-tertiary); font-size: 10px; font-weight: 600;">점심시간</span>
                        </div>
                    `;
                } else if (sched.isBusy) {
                    const custom = sched.custom;
                    const catClass = custom ? `status-${custom.category}` : 'status-work';
                    cell.className += ` status-busy ${catClass}`;
                    
                    const titleText = custom ? custom.title : '개인 일정';
                    const memoText = (custom && custom.memo) ? custom.memo : '';
                    cell.innerHTML = `
                        <div class="busy-overlay" style="position: absolute; top: 0; left: 0; padding: 6px; box-sizing: border-box; user-select: none; width: 100%; height: 100%; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 0px;">
                            <span style="font-size: 12px; font-weight: 700; color: inherit; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; text-align: left;">${titleText}</span>
                            ${memoText ? `<span class="memo-content" style="font-size: 10.5px; font-weight: 500; color: var(--text-secondary); text-align: left; display: block; width: 100%; line-height: 1.4; margin-top: 4px;">${formatMentions(memoText).replace(/\n(?=<span class="mention-tag")/g, '<div class="tag-spacer" style="height: 4.5px;"></div>').replace(/<br\s*\/?>\s*(?=<span class="mention-tag")/gi, '<div class="tag-spacer" style="height: 4.5px;"></div>').replace(/(<div>|<p>)\s*(?=<span class="mention-tag")/gi, '$1<div class="tag-spacer" style="height: 4.5px;"></div>').replace(/\n/g, '<br>')}</span>` : ''}
                        </div>
                    `;
                    if (memoText) {
                        cell.setAttribute('title', `${titleText}\n\n${memoText}`);
                    } else {
                        cell.setAttribute('title', titleText);
                    }
                } else {
                    cell.className += ' status-free';
                    if (!isWithinCollab(dayIdx, sched.startSlot)) {
                        cell.className += ' outside-collab';
                        cell.innerHTML = `
                            <div class="cell-content" style="color: var(--text-tertiary); font-size: 10px; font-weight: 500; display: flex; align-items: center; justify-content: center; height: 100%; opacity: 0.5;">
                                <span>비협업 시간</span>
                            </div>
                        `;
                    } else {
                        cell.innerHTML = `
                            <div class="cell-content" style="color: var(--text-tertiary); font-size: 10px; font-weight: 500; display: flex; align-items: center; justify-content: center; height: 100%;">
                                <span>+ 일정 추가</span>
                            </div>
                        `;
                    }
                }

                if (visualDayIdx === DAYS.length - 1) {
                    cell.style.borderRight = 'none';
                }

                // Only bind click listener for editing if the day is not passed
                if (!isDayPassed(dayIdx)) {
                    cell.addEventListener('click', () => {
                        if (isWithinCollab(dayIdx, sched.startSlot) || sched.isBusy) {
                            openScheduleEditPopover(cell, dayIdx, sched.startSlot);
                        }
                    });
                }

                grid.appendChild(cell);
            });
        }
        return;
    }

    // Rows (coordination mode)
    const enabledParticipants = participants.filter(p => p.enabled);
    if (enabledParticipants.length === 0 && currentMeetingRole !== 'participant') {
        const emptyCard = document.createElement('div');
        emptyCard.style.gridColumn = '1 / span 8';
        emptyCard.style.gridRow = '2 / span 9';
        emptyCard.style.display = 'flex';
        emptyCard.style.flexDirection = 'column';
        emptyCard.style.alignItems = 'center';
        emptyCard.style.justifyContent = 'center';
        emptyCard.style.gap = '12px';
        emptyCard.style.color = 'var(--text-tertiary)';
        emptyCard.style.fontSize = '14px';
        emptyCard.style.fontWeight = '600';
        emptyCard.style.background = 'var(--bg-color)';
        emptyCard.style.textAlign = 'center';
        emptyCard.innerHTML = `
            <span style="font-size: 28px;">👥</span>
            <span>선택된 회의 참석자가 없습니다.<br><span style="font-size: 11px; font-weight: 500; color: var(--text-tertiary); margin-top: 4px; display: block;">왼쪽 동료 목록에서 참석자를 활성화해 주세요.</span></span>
        `;
        grid.appendChild(emptyCard);
        return;
    }

    SLOTS.forEach((slot, slotIdx) => {
        for (let visualDayIdx = 0; visualDayIdx < DAYS.length; visualDayIdx++) {
            const dayIdx = getInternalDayIdx(visualDayIdx);
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            if (visualDayIdx === 0 || visualDayIdx === 6) {
                cell.className += ' weekend-cell';
            }
            cell.setAttribute('data-day', dayIdx);
            cell.setAttribute('data-slot', slotIdx);
            cell.style.gridColumn = (visualDayIdx + 2).toString();
            cell.style.gridRow = (slotIdx + 2).toString();

            let availableCount = 0;
            let totalEnabled = 0;
            const cellDetails = [];
            let busyCount = 0;
            let outCount = 0;
            let lunchCount = 0;
            let bufferCount = 0;

            const roster = (currentMeetingRole === 'participant') ? PARTICIPANT_SCENARIO_ROSTER : enabledParticipants;
            totalEnabled = roster.length;

            roster.forEach(p => {
                const slotKey = p.id === currentUserId ? `${formatDate(getMondayOf(selectedDate))}:${dayIdx}-${slotIdx}` : `${dayIdx}-${slotIdx}`;
                const isBusy = (scheduleData[p.id] || []).includes(slotKey);
                const constraint = p.constraints ? p.constraints.find(c => c.day === dayIdx && c.slot === slotIdx) : null;
                const hasTravelBuffer = currentScenario === 'tight' && SCENARIOS.tight.travelBuffers?.[p.id]?.includes(`${dayIdx}-${slotIdx}`);

                if (isBusy) {
                    busyCount++;
                    cellDetails.push({ name: p.name, role: p.role || (p.id === 'host' ? 'required' : 'optional'), status: 'busy', desc: constraint ? constraint.desc : '일정 있음' });
                } else if (constraint && constraint.type === 'out') {
                    outCount++;
                    cellDetails.push({ name: p.name, role: p.role || (p.id === 'host' ? 'required' : 'optional'), status: 'out', desc: constraint.desc });
                } else if (constraint && constraint.type === 'lunch') {
                    lunchCount++;
                    cellDetails.push({ name: p.name, role: p.role || (p.id === 'host' ? 'required' : 'optional'), status: 'lunch', desc: constraint.desc });
                } else if (hasTravelBuffer) {
                    bufferCount++;
                    cellDetails.push({ name: p.name, role: p.role || (p.id === 'host' ? 'required' : 'optional'), status: 'buffer', desc: '이동 시간 버퍼 권장' });
                } else {
                    cellDetails.push({ name: p.name, role: p.role || (p.id === 'host' ? 'required' : 'optional'), status: 'free', desc: '비어있음' });
                }
            });
            availableCount = totalEnabled - busyCount - outCount - lunchCount - bufferCount;
            const isLunch = slot.isLunchTime;
            
            let cellHTMLContent = '';
            if (isLunch) {
                cell.className += ' status-lunch';
                cellHTMLContent = `<span style="font-size: 11px; font-weight: 600; line-height: 1; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; height: 100%;">점심시간</span>`;
            } else {
                if (isDayPassed(dayIdx)) {
                    cell.className += ' status-passed-day';
                    cellHTMLContent = `<span style="font-size: 15px; font-weight: 700; line-height: 1; color: var(--text-tertiary); display: flex; align-items: center; justify-content: center; height: 100%;">${availableCount}/${totalEnabled}</span>`;
                } else {
                    if (availableCount === totalEnabled && totalEnabled > 0) {
                        cell.className += ' status-heatmap-100';
                    } else if (availableCount >= totalEnabled - 1 && totalEnabled > 1) {
                        cell.className += ' status-heatmap-high';
                    } else if (availableCount >= totalEnabled - 2 && totalEnabled > 2) {
                        cell.className += ' status-heatmap-med';
                    } else {
                        cell.className += ' status-heatmap-low';
                    }

                    cellHTMLContent = `<span style="font-size: 15px; font-weight: 700; line-height: 1; display: flex; align-items: center; justify-content: center; height: 100%;">${availableCount}/${totalEnabled}</span>`;
                }
            }


            // Set native tooltip showing detailed participant availability
            cell.setAttribute('title', `참석 가능 : ${availableCount}명\n회의 중 : ${busyCount}명\n외근 : ${outCount}명\n자리 비움 : ${lunchCount + bufferCount}명`);

            // Check if this is the confirmed slot in participant view
            let isConfirmedSlot = false;
            if (currentMeetingRole === 'participant' && 
                mockParticipantSession && 
                mockParticipantSession.status === 'confirmed' &&
                mockParticipantSession.confirmedTime &&
                mockParticipantSession.confirmedTime.day === dayIdx &&
                mockParticipantSession.confirmedTime.startSlot === slotIdx) {
                isConfirmedSlot = true;
            }

            if (isConfirmedSlot) {
                cell.className = 'calendar-cell';
                cell.style.backgroundColor = '#3182f6';
                cell.style.color = '#ffffff';
                cell.style.cursor = 'default';
                cellHTMLContent = `<span style="font-size: 13px; font-weight: 700; color: #ffffff; display: flex; align-items: center; justify-content: center; height: 100%; gap: 3px;">✅ 확정</span>`;
            }

            // Check if this cell belongs to the BEST slot (the top recommendation)
            let isBestSlot = false;
            if (!isConfirmedSlot && currentMeetingRole !== 'participant' && currentPollState === 'completed' && currentRecommendations && currentRecommendations.length > 0) {
                const best = currentRecommendations[0];
                if (best.score >= 50 && dayIdx === best.day && slotIdx >= best.startSlot && slotIdx < best.startSlot + best.slotsNeeded) {
                    isBestSlot = true;
                }
            }

            const bestBadgeHTML = isBestSlot ? `<div class="best-badge-cell" style="position: absolute; top: 4px; right: 4px; background-color: #ffffff; color: #3182f6; border: 1px solid rgba(49, 130, 246, 0.24); font-size: 8px; font-weight: 800; padding: 1.5px 3.5px; border-radius: 4px; line-height: 1; z-index: 2; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">추천</div>` : '';

            // Render ratio only (no helperText!)
            const contentDiv = document.createElement('div');
            contentDiv.className = 'cell-content';
            contentDiv.style.position = 'relative';
            contentDiv.style.width = '100%';
            contentDiv.style.height = '100%';
            contentDiv.style.display = 'flex';
            contentDiv.style.alignItems = 'center';
            contentDiv.style.justifyContent = 'center';
            contentDiv.innerHTML = `
                ${bestBadgeHTML}
                ${cellHTMLContent}
            `;
            cell.appendChild(contentDiv);

            if (visualDayIdx === DAYS.length - 1) {
                cell.style.borderRight = 'none';
            }

            if (!isDayPassed(dayIdx)) {
                cell.addEventListener('click', () => {
                    if (dayIdx === 5 || dayIdx === 6) {
                        showWeekendConfirmPopup(() => {
                            selectSlotsInCalendar(dayIdx, slotIdx, getSelectedSlotsNeeded());
                            showSlotDetailsPanel(dayIdx, slotIdx, cellDetails);
                        });
                    } else {
                        selectSlotsInCalendar(dayIdx, slotIdx, getSelectedSlotsNeeded());
                        showSlotDetailsPanel(dayIdx, slotIdx, cellDetails);
                    }
                });
            }

            grid.appendChild(cell);
        }
    });
}

// Highlight selections in calendar (Phase 2 Consecutive Selection wrap)
function selectSlotsInCalendar(day, startSlot, slotsCount) {
    const coordGrid = document.getElementById('calendar-grid');
    if (!coordGrid) return;

    // Clear previous cell highlight classes
    coordGrid.querySelectorAll('.calendar-cell').forEach(c => {
        c.classList.remove('status-selected', 'status-viewing', 'highlight-row', 'highlight-col');
    });

    // Clear previous header highlight classes
    coordGrid.querySelectorAll('.grid-header, .time-col-cell').forEach(h => {
        h.classList.remove('highlight-header');
    });

    for (let i = 0; i < slotsCount; i++) {
        const slotIdx = startSlot + i;
        
        // Highlight row of selected slot
        coordGrid.querySelectorAll(`.calendar-cell[data-slot="${slotIdx}"]`).forEach(c => {
            c.classList.add('highlight-row');
        });

        // Highlight selected cell
        const cell = coordGrid.querySelector(`.calendar-cell[data-day="${day}"][data-slot="${slotIdx}"]`);
        if (cell) {
            cell.classList.add('status-selected');
        }
    }

    // Highlight column of selected day
    coordGrid.querySelectorAll(`.calendar-cell[data-day="${day}"]`).forEach(c => {
        c.classList.add('highlight-col');
    });

    // Highlight column header (day header)
    const activeColIdx = day + 2;
    const colHeader = Array.from(coordGrid.querySelectorAll('.grid-header')).find(gh => gh.style.gridColumn === `${activeColIdx}`);
    if (colHeader) {
        colHeader.classList.add('highlight-header');
    }
}

function getSelectedSlotsNeeded() {
    const durationMin = parseInt(document.getElementById('meeting-duration').value);
    let slotsNeeded = Math.ceil(durationMin / 60);
    if (slotsNeeded < 1) slotsNeeded = 1;
    return slotsNeeded;
}

// 6. Side Detail Panel Hydration (Phase 2 Visual improvement)
function showSlotDetailsPanel(day, startSlot, details) {
    const placeholder = document.querySelector('.detail-panel-placeholder');
    const content = document.getElementById('detail-panel-content');
    
    placeholder.style.display = 'none';
    content.style.display = 'flex';

    const slotsNeeded = getSelectedSlotsNeeded();
    let timeText = `${getDayName(day)}요일 `;
    if (slotsNeeded === 1) {
        timeText += SLOTS[startSlot].label;
    } else {
        const startTime = SLOTS[startSlot].label.split(' - ')[0];
        const endTime = SLOTS[startSlot + slotsNeeded - 1].label.split(' - ')[1];
        timeText += `${startTime} - ${endTime}`;
    }

    let btnText = '이 시간으로 예약하기';
    if (currentMeetingRole === 'participant') {
        btnText = "이 시간으로 응답하기";
    } else if (currentPollState === 'completed') {
        btnText = '이 시간으로 확정하기';
    }

    let actionHTML = `<button id="btn-book-from-detail" class="btn btn-primary btn-book-detail">${btnText}</button>`;
    if (currentMeetingRole === 'participant') {
        const slotKey = `${day}-${startSlot}`;
        const currentVote = participantSelectedVotes[slotKey]; // undefined, 'available', 'preferred'
        
        if (participantVoteSubmitted) {
            actionHTML = `
                <div style="margin-top: auto; padding-top: 16px; text-align: center;">
                    <span style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">이미 일정을 제출하였습니다.</span>
                </div>
            `;
        } else {
            const mainText = '이 시간으로 응답하기';
            const mainBg = 'var(--color-blue)';
            const mainColor = '#ffffff';
            const mainBorder = 'none';
            
            actionHTML = `
                <div style="margin-top: auto; padding-top: 16px; display: flex; flex-direction: column; gap: 8px; width: 100%;">
                    <button class="btn" id="btn-toggle-available" style="width: 100%; padding: 12px; font-size: 13px; font-weight: 700; border-radius: 12px; background-color: ${mainBg}; color: ${mainColor}; border: ${mainBorder}; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;">
                        ${mainText}
                    </button>
                </div>
            `;
        }
    }

    content.innerHTML = `
        <h3>선택한 시간 정보</h3>
        <div class="detail-panel-time">${timeText} (${slotsNeeded * 60}분 회의)</div>
        
        <div class="detail-member-list" role="list">
            <!-- Populated member rows -->
        </div>
        
        ${actionHTML}
    `;

    const list = content.querySelector('.detail-member-list');
    const roster = (currentMeetingRole === 'participant') ? PARTICIPANT_SCENARIO_ROSTER : participants.filter(p => p.enabled);

    roster.forEach(p => {
        // Collect states across the duration
        let status = 'free';
        let desc = '참석 가능';
        let classLabel = '';

        for (let i = 0; i < slotsNeeded; i++) {
            const slot = startSlot + i;
            const slotKey = p.id === currentUserId ? `${formatDate(getMondayOf(selectedDate))}:${day}-${slot}` : `${day}-${slot}`;
            const isBusy = (scheduleData[p.id] || []).includes(slotKey);
            const constraint = p.constraints ? p.constraints.find(c => c.day === day && c.slot === slot) : null;
            const hasTravelBuffer = currentScenario === 'tight' && SCENARIOS.tight.travelBuffers?.[p.id]?.includes(`${day}-${slot}`);
            
            if (isBusy) {
                if (p.id === currentUserId) {
                    const custom = p1CustomSchedules[slotKey];
                    status = (custom && custom.category === 'out') ? 'out' : 'busy';
                    desc = custom ? custom.title : '바쁨 (조정 불가)';
                    classLabel = (custom && custom.category === 'focus') ? 'status-focus' : ((custom && custom.category === 'out') ? 'status-out' : 'status-busy');
                } else if (constraint && constraint.flexible) {
                    status = 'flexible';
                    desc = `유연한 일정(${constraint.desc})`;
                    classLabel = 'status-lunch';
                } else {
                    status = 'busy';
                    desc = constraint ? constraint.desc : '바쁨 (조정 불가)';
                    classLabel = 'status-busy';
                }
            } else if (constraint) {
                if (constraint.type === 'lunch') {
                    status = 'lunch';
                    desc = '집중도 회복 희망 시간';
                    classLabel = 'status-lunch';
                } else if (constraint.type === 'out') {
                    status = 'out';
                    desc = '외근 중 (온라인 참석)';
                    classLabel = 'status-out';
                }
            } else if (hasTravelBuffer) {
                status = 'buffer';
                desc = '외근 이동 버퍼 시간 권장';
                classLabel = 'status-lunch';
            }
        }

        // Add WFH notice (Scenario 4)
        const isWFH = currentScenario === 'hybrid' && SCENARIOS.hybrid.wfhDays?.[p.id]?.includes(day);
        if (isWFH) {
            desc = `재택근무 중 (온라인 화상 참석)`;
            if (status === 'free') {
                status = 'wfh';
                classLabel = 'status-out';
            }
        }

        const isUnavailable = (status === 'busy' || status === 'out' || status === 'lunch');
        let statusText = '가능';
        let badgeStyle = 'background-color: rgba(49, 130, 246, 0.1); color: #3182f6;';

        if (isUnavailable) {
            let reason = '다른 일정';
            for (let i = 0; i < slotsNeeded; i++) {
                const slot = startSlot + i;
                const slotKey = p.id === currentUserId ? `${formatDate(getMondayOf(selectedDate))}:${day}-${slot}` : `${day}-${slot}`;
                
                if (p.id === currentUserId && p1CustomSchedules[slotKey]) {
                    const customTitle = p1CustomSchedules[slotKey].title;
                    if (customTitle.includes('집중 시간') || customTitle.includes('집중')) {
                        reason = '집중 시간';
                        break;
                    }
                    if (customTitle.includes('외근')) {
                        reason = '외근';
                        break;
                    }
                    if (customTitle.includes('연차') || customTitle.includes('휴가')) {
                        reason = '연차';
                        break;
                    }
                    reason = customTitle;
                    break;
                }
                
                const constraint = p.constraints ? p.constraints.find(c => c.day === day && c.slot === slot) : null;
                if (constraint) {
                    const desc = constraint.desc || '';
                    if (desc.includes('집중 시간') || desc.includes('집중')) {
                        reason = '집중 시간';
                        break;
                    }
                    if (desc.includes('외근') || constraint.type === 'out') {
                        reason = '외근';
                        break;
                    }
                    if (desc.includes('연차') || desc.includes('휴가') || desc.includes('OOF')) {
                        reason = '연차';
                        break;
                    }
                    if (desc.includes('점심') || constraint.type === 'lunch') {
                        reason = '점심시간';
                        break;
                    }
                }

                if (p.id === 'p3' && day === 2 && (currentScenario === 'tight' || currentScenario === 'impossible')) {
                    reason = '연차';
                    break;
                }
            }

            statusText = '불가';
            if (reason === '집중 시간') {
                badgeStyle = 'background-color: rgba(143, 91, 246, 0.1); color: #8f5bf6;';
            } else if (reason === '외근') {
                badgeStyle = 'background-color: rgba(249, 115, 22, 0.1); color: #f97316;';
            } else if (reason === '연차') {
                badgeStyle = 'background-color: rgba(240, 68, 82, 0.1); color: #f04452;';
            } else {
                badgeStyle = 'background-color: rgba(240, 68, 82, 0.1); color: #f04452;';
            }
        }
        
        const itemClass = isUnavailable ? 'status-busy' : 'status-available';

        const row = document.createElement('div');
        row.className = `detail-member-item ${itemClass}`;
        row.innerHTML = `
            <div class="avatar" style="background-color: ${p.avatarColor}15; color: ${p.avatarColor}; width: 28px; height: 28px; font-size:11px;">
                ${p.name[0]}
            </div>
            <div style="flex-grow: 1;">
                <div style="font-size:12px; font-weight:700; color: var(--text-primary); text-align: left;">${p.name}</div>
            </div>
            <span class="detail-member-status" style="${badgeStyle}">${statusText}</span>
        `;
        list.appendChild(row);
    });

    if (currentMeetingRole === 'participant') {
        const btnToggleAvail = document.getElementById('btn-toggle-available');
        
            btnToggleAvail.onclick = () => {
                participantSelectedVotes = {};
                const slotKey = `${day}-${startSlot}`;
                participantSelectedVotes[slotKey] = 'available';
                submitAllParticipantVotes();
            };
        updateParticipantSubmitAllButton();
        return;
    }

    // Check if required conflict is present to disable booking button
    const hasRequiredConflict = (currentMeetingRole === 'participant') ? false : details.some(d => d.role === 'required' && d.status === 'busy' && d.desc.indexOf('유연') === -1);
    const bookBtn = document.getElementById('btn-book-from-detail');
    
    if (currentMeetingRole === 'participant' && mockParticipantSession && mockParticipantSession.status === 'confirmed') {
        bookBtn.disabled = true;
        bookBtn.innerText = "최종 확정 완료 (내 캘린더에 저장됨)";
        bookBtn.style.opacity = '1';
        bookBtn.style.backgroundColor = '#22c55e';
        bookBtn.style.color = '#ffffff';
        bookBtn.style.border = 'none';
        bookBtn.style.cursor = 'default';
    } else if (currentMeetingRole === 'participant' && participantVoteSubmitted) {
        bookBtn.disabled = true;
        bookBtn.innerText = "주최자의 확정을 기다리고 있습니다.";
        bookBtn.style.opacity = '0.5';
        bookBtn.style.cursor = 'default';
    } else if (hasRequiredConflict) {
        bookBtn.disabled = true;
        bookBtn.innerText = "필수 참석자 일정 충돌로 예약 불가";
        bookBtn.style.opacity = '0.5';
    } else {
        bookBtn.disabled = false;
        bookBtn.style.opacity = '1';
        bookBtn.style.cursor = 'pointer';
        bookBtn.onclick = () => {
            if (currentMeetingRole === 'participant') {
                submitParticipantVotes(day, startSlot);
            } else if (currentPollState === 'completed') {
                confirmMeeting(day, startSlot, slotsNeeded);
            } else {
                const scoreItem = currentRecommendations.find(r => r.day === day && r.startSlot === startSlot) || {
                    score: 80,
                    details: {
                        busy: details.filter(d => d.status === 'busy').map(d => participants.find(p => p.name === d.name)),
                        lunchAvoid: details.filter(d => d.status === 'lunch').map(d => participants.find(p => p.name === d.name)),
                        outside: details.filter(d => d.status === 'out').map(d => participants.find(p => p.name === d.name)),
                        flexibleBusy: details.filter(d => d.status === 'flexible').map(d => participants.find(p => p.name === d.name)),
                        travelBuffered: details.filter(d => d.status === 'buffer').map(d => participants.find(p => p.name === d.name))
                    }
                };
                openBookingDialog(day, startSlot, scoreItem, slotsNeeded);
            }
        };
    }
}

// 7. Booking Confirmation dialog
function openBookingDialog(day, slot, recData, slotsNeeded = 1) {
    selectedTimeSlots = Array.from({length: slotsNeeded}, (_, i) => `${day}-${slot + i}`);
    
    const dialog = document.getElementById('booking-dialog');
    const meetingNameInput = document.getElementById('meeting-name');
    
    document.getElementById('confirm-meeting-name').innerText = meetingNameInput.value || "팀 회의";
    
    // Time label formatting
    let timeLabel = `2026년 7월 ${6 + day}일(${getDayName(day)}) `;
    if (slotsNeeded === 1) {
        timeLabel += SLOTS[slot].label;
    } else {
        const startTime = SLOTS[slot].label.split(' - ')[0];
        const endTime = SLOTS[slot + slotsNeeded - 1].label.split(' - ')[1];
        timeLabel += `${startTime} - ${endTime}`;
    }
    document.getElementById('confirm-time').innerText = timeLabel;

    // Breakdown
    const enabled = participants.filter(p => p.enabled);
    const reqTotal = enabled.filter(p => p.role === 'required').length;
    const optTotal = enabled.filter(p => p.role === 'optional').length;

    const busyReq = recData.details.busy.filter(p => p.role === 'required').length;
    const busyOpt = recData.details.busy.filter(p => p.role === 'optional').length;

    const attendingReq = reqTotal - busyReq;
    const attendingOpt = optTotal - busyOpt;

    document.getElementById('confirm-participants').innerText = 
        `필수 ${attendingReq}/${reqTotal}명, 선택 ${attendingOpt}/${optTotal}명 참석 예정 (${Math.round((attendingReq + attendingOpt)/(reqTotal + optTotal)*100)}% 참석)`;

    // Notices list
    const noticesContainer = document.getElementById('confirm-notices-container');
    const noticesList = document.getElementById('confirm-notices');
    noticesList.innerHTML = '';

    const warnings = [];
    
    if (recData.details.lunchAvoid.length > 0) {
        warnings.push("☕ 집중도 회복 루틴 시간을 배려하여 조율되었습니다.");
    }

    recData.details.outside.forEach(p => {
        warnings.push(`✈ <strong>${p.name}</strong>님이 외근 중이므로 화상 회의(Google Meet) 연결이 추가됩니다.`);
    });

    recData.details.flexibleBusy.forEach(p => {
        warnings.push(`⟳ <strong>${p.name}</strong>님의 기존 유연 일정(${p.name === '박개발' ? '디자인 시스템 싱크' : '일정'})이 연동되어 자동 조정됩니다.`);
    });

    recData.details.travelBuffered.forEach(p => {
        warnings.push(`⌛ <strong>${p.name}</strong>님의 외근 이동 경로 시간(30분 버퍼)을 차단하여 일정을 보호합니다.`);
    });

    if (warnings.length > 0) {
        noticesContainer.style.display = 'block';
        warnings.forEach(w => {
            const li = document.createElement('li');
            li.innerHTML = w;
            noticesList.appendChild(li);
        });
    } else {
        noticesContainer.style.display = 'none';
    }

    dialog.showModal();
}

let toastTimer = null;
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = message;
    
    toast.classList.remove('show');
    void toast.offsetWidth; // force reflow to restart transition
    toast.classList.add('show');
    
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

// 9. Theme Management (Light/Dark Mode)
function applyTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    const settingsThemeToggle = document.getElementById('settings-theme-toggle');
    if (settingsThemeToggle) {
        settingsThemeToggle.checked = isDark;
    }
}

// 10. Event Listeners setup
function setupEventListeners() {
    const legacyThemeToggle = document.getElementById('btn-theme-toggle');
    if (legacyThemeToggle) {
        legacyThemeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            applyTheme();
        });
    }

    // Date Picker Trigger Event Listener
    const trigger = document.getElementById('date-picker-trigger');
    const calendarContainer = document.getElementById('calendar-popup');
    if (trigger && calendarContainer) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            trigger.setAttribute('aria-expanded', !isExpanded);
            trigger.classList.toggle('active');
            if (!isExpanded) {
                tempSelectedDate = new Date(selectedDate); // Sync temp date
                currentDisplayedYear = selectedDate.getFullYear();
                currentDisplayedMonth = selectedDate.getMonth();
                renderPopupCalendar();
                
                // Position popup dynamically relative to trigger!
                const rect = trigger.getBoundingClientRect();
                calendarContainer.style.top = `${rect.bottom + window.scrollY + 8}px`;
                calendarContainer.style.left = `${rect.left + window.scrollX}px`;
            }
            calendarContainer.style.display = isExpanded ? 'none' : 'block';
        });
        
        // Close calendar popover when clicking outside
        document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target) && !calendarContainer.contains(e.target)) {
                trigger.setAttribute('aria-expanded', 'false');
                trigger.classList.remove('active');
                calendarContainer.style.display = 'none';
            }
        });

        // Prev month navigator
        document.getElementById('btn-prev-month').addEventListener('click', (e) => {
            e.stopPropagation();
            currentDisplayedMonth--;
            if (currentDisplayedMonth < 0) {
                currentDisplayedMonth = 11;
                currentDisplayedYear--;
            }
            renderPopupCalendar();
        });

        // Next month navigator
        document.getElementById('btn-next-month').addEventListener('click', (e) => {
            e.stopPropagation();
            currentDisplayedMonth++;
            if (currentDisplayedMonth > 11) {
                currentDisplayedMonth = 0;
                currentDisplayedYear++;
            }
            renderPopupCalendar();
        });

        // Today, Cancel, Confirm footer action listeners removed since the footer was deleted.
    }

    // Reset button
    const btnResetPart = document.getElementById('btn-reset-participants');
    if (btnResetPart) {
        btnResetPart.addEventListener('click', () => {
            participants.forEach(p => {
                p.enabled = true;
                p.role = p.id === 'p5' || p.id === 'p6' ? 'optional' : 'required';
            });
            
            // Restore constraints
            participants.find(p => p.id === 'p3').constraints = [
                { day: 2, slot: 0, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
                { day: 2, slot: 1, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
                { day: 2, slot: 2, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
                { day: 2, slot: 4, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
                { day: 2, slot: 5, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
                { day: 2, slot: 6, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
                { day: 2, slot: 7, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' },
                { day: 2, slot: 8, type: 'out', desc: '수요일 외근 (이동 및 현장 근무)' }
            ];

            // Restore scenario variables
            scheduleData = SCENARIOS[currentScenario].busySlots;
            resetP1CustomSchedules();

            // Reset detail panel
            document.querySelector('.detail-panel-placeholder').style.display = 'flex';
            document.getElementById('detail-panel-content').style.display = 'none';

            selectedDate = new Date(today);
            tempSelectedDate = new Date(today);
            currentDisplayedYear = today.getFullYear();
            currentDisplayedMonth = today.getMonth();
            startOffsetDay = getMondayOf(selectedDate).getDate();
            
            if (trigger && calendarContainer) {
                trigger.setAttribute('aria-expanded', 'false');
                trigger.classList.remove('active');
                calendarContainer.style.display = 'none';
            }

            // Reset duration segmented buttons to 1 hour
            const durBtns = document.querySelectorAll('.duration-segment-btn');
            if (durBtns.length > 0) {
                durBtns.forEach(b => b.classList.remove('active'));
                const btns1h = document.querySelectorAll('.duration-segment-btn[data-value="60"]');
                btns1h.forEach(b => b.classList.add('active'));
            }
            const custWrap = document.getElementById('custom-duration-wrapper');
            if (custWrap) custWrap.style.display = 'none';
            const durSel = document.getElementById('meeting-duration');
            if (durSel) {
                durSel.value = '60';
            }
            
            // Reset View Mode
            currentViewMode = 'coordination';
            const toggleBtnText = document.getElementById('btn-toggle-text');
            if (toggleBtnText) toggleBtnText.innerText = '내 일정 관리';
            const toggleBtn = document.getElementById('btn-toggle-my-schedule');
            if (toggleBtn) toggleBtn.style.borderColor = 'var(--border-color)';
            const rSec = document.querySelector('.recommendations-section');
            if (rSec) rSec.style.display = 'block';
            const cTitle = document.getElementById('cal-section-title');
            if (cTitle) cTitle.innerText = '참석 가능 현황';

            // Reset Setup Wizard inputs
            const wizName = document.getElementById('wiz-meeting-name');
            if (wizName) wizName.value = '팀 얼라인먼트 (Alignment)';
            const wizBtns = document.querySelectorAll('#wiz-duration-selector .duration-segment-btn');
            if (wizBtns.length > 0) {
                wizBtns.forEach(b => b.classList.remove('active'));
                const wizBtn1h = document.querySelector('#wiz-duration-selector .duration-segment-btn[data-value="60"]');
                if (wizBtn1h) wizBtn1h.classList.add('active');
            }
            const wizCustWrap = document.getElementById('wiz-custom-duration-wrapper');
            if (wizCustWrap) wizCustWrap.style.display = 'none';
            participants.forEach(p => {
                p.added = p.id === 'p1';
                p.enabled = p.added;
            });
            if (renderWizardGridGlobal) renderWizardGridGlobal();
            if (renderSearchResultsGlobal) renderSearchResultsGlobal('');
            const wizSearch = document.getElementById('wiz-search-input');
            if (wizSearch) wizSearch.value = '';
            
            // Also show workspace landing again and hide coordination dashboard
            const setupContainer = document.getElementById('workspace-landing');
            const dashboardContainer = document.getElementById('coordination-dashboard');
            if (setupContainer && dashboardContainer) {
                setupContainer.style.display = 'flex';
                dashboardContainer.style.display = 'none';
            }

            renderParticipants();
            renderWorkspaceCalendar();
            renderPopupCalendar();
            calculateRecommendations();
            renderCalendar();
            showToast("참석자 설정을 초기화했습니다.");
        });
    }

    document.getElementById('meeting-name').addEventListener('input', () => {
        const titleVal = document.getElementById('meeting-name').value.trim();
        const session = getActiveSession();
        if (session) {
            session.title = titleVal;
            localStorage.setItem('toss_shared_meeting_session', JSON.stringify(session));
        }
        calculateRecommendations();
    });
    
    // Custom Duration Selector Wiring (Segmented tabs & custom input)
    let isTypingDuration = false;
    
    const durationButtons = document.querySelectorAll('#duration-selector .duration-segment-btn');
    const customWrapper = document.getElementById('custom-duration-wrapper');
    const customInput = document.getElementById('custom-duration-input');
    const durationSelect = document.getElementById('meeting-duration');
    
    if (durationButtons.length > 0 && durationSelect) {
        durationButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                durationButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const val = btn.getAttribute('data-value');
                if (val === 'custom') {
                    customWrapper.style.display = 'block';
                    const customVal = parseInt(customInput.value) || 90;
                    
                    let option = durationSelect.querySelector(`option[value="${customVal}"]`);
                    if (!option) {
                        option = document.createElement('option');
                        option.value = customVal;
                        option.text = `${customVal}분`;
                        durationSelect.appendChild(option);
                    }
                    durationSelect.value = customVal;
                } else {
                    customWrapper.style.display = 'none';
                    durationSelect.value = val;
                }
                durationSelect.dispatchEvent(new Event('change'));
            });
        });
    }

    if (customInput && durationSelect) {
        customInput.addEventListener('input', () => {
            let customVal = parseInt(customInput.value);
            if (!customVal || customVal < 10) return;
            
            if (customVal > 480) customVal = 480;
            
            let option = durationSelect.querySelector(`option[value="${customVal}"]`);
            if (!option) {
                option = document.createElement('option');
                option.value = customVal;
                option.text = `${customVal}분`;
                durationSelect.appendChild(option);
            }
            
            isTypingDuration = true;
            durationSelect.value = customVal;
            durationSelect.dispatchEvent(new Event('change'));
            isTypingDuration = false;
        });
    }

    document.getElementById('meeting-duration').addEventListener('change', () => {
        const val = parseInt(document.getElementById('meeting-duration').value);
        
        // Update session duration if active session exists
        const session = getActiveSession();
        if (session) {
            session.duration = val;
            localStorage.setItem('toss_shared_meeting_session', JSON.stringify(session));
        }
        
        // Sync segmented control buttons
        if (!isTypingDuration) {
            const wrap = document.getElementById('custom-duration-wrapper');
            const inp = document.getElementById('custom-duration-input');
            const wizWrap = document.getElementById('wiz-custom-duration-wrapper');
            const wizInp = document.getElementById('wiz-custom-duration-input');
            
            const btns = document.querySelectorAll('#duration-selector .duration-segment-btn, #wiz-duration-selector .duration-segment-btn');
            if (btns.length > 0) {
                btns.forEach(b => b.classList.remove('active'));
                
                const matchedBtns = document.querySelectorAll(`#duration-selector .duration-segment-btn[data-value="${val}"], #wiz-duration-selector .duration-segment-btn[data-value="${val}"]`);
                if (matchedBtns.length > 0) {
                    matchedBtns.forEach(btn => btn.classList.add('active'));
                    if (wrap) wrap.style.display = 'none';
                    if (wizWrap) wizWrap.style.display = 'none';
                } else {
                    // Custom value
                    const customBtns = document.querySelectorAll('#duration-selector .duration-segment-btn[data-value="custom"], #wiz-duration-selector .duration-segment-btn[data-value="custom"]');
                    customBtns.forEach(btn => btn.classList.add('active'));
                    if (wrap) wrap.style.display = 'block';
                    if (inp) inp.value = val;
                    if (wizWrap) wizWrap.style.display = 'block';
                    if (wizInp) wizInp.value = val;
                }
            }
        }
        
        const badge = document.getElementById('duration-badge');
        if (badge) {
            if (val >= 60) {
                const hrs = val / 60;
                badge.innerText = `${Number(hrs.toFixed(1))}시간 회의`;
            } else {
                badge.innerText = `${val}분 회의`;
            }
        }
        
        calculateRecommendations();
        renderCalendar();
    });

    // dialog buttons
    const dialog = document.getElementById('booking-dialog');
    
    document.getElementById('btn-dialog-cancel').addEventListener('click', () => {
        dialog.close();
    });

    dialog.querySelector('.btn-close-dialog').addEventListener('click', () => {
        dialog.close();
    });

    document.getElementById('btn-dialog-confirm').addEventListener('click', () => {
        dialog.close();
        
        if (currentPollState === 'completed') {
            if (selectedTimeSlots.length > 0) {
                const parts = selectedTimeSlots[0].split('-');
                const day = parseInt(parts[0]);
                const startSlot = parseInt(parts[1]);
                const slotsNeeded = selectedTimeSlots.length;
                confirmMeeting(day, startSlot, slotsNeeded);
            }
            return;
        }
        
        // Add selected slots to calendar database
        if (selectedTimeSlots.length > 0) {
            participants.forEach(p => {
                if (p.enabled) {
                    if (!scheduleData[p.id]) scheduleData[p.id] = [];
                    selectedTimeSlots.forEach(slotKey => {
                        if (!scheduleData[p.id].includes(slotKey)) {
                            scheduleData[p.id].push(slotKey);
                        }
                    });
                }
            });
        }
        
        // Reset detail panel
        document.querySelector('.detail-panel-placeholder').style.display = 'flex';
        document.getElementById('detail-panel-content').style.display = 'none';

        calculateRecommendations();
        renderCalendar();
        
        showToast("일정이 등록되었습니다.");
    });

    // My Schedule View Mode Toggle
    const btnToggle = document.getElementById('btn-toggle-my-schedule');
    const toggleText = document.getElementById('btn-toggle-text');
    const recSection = document.querySelector('.recommendations-section');
    const calTitle = document.getElementById('cal-section-title');
    
    if (btnToggle) {
        btnToggle.addEventListener('click', () => {
            if (currentViewMode === 'coordination') {
                currentViewMode = 'my-schedule';
                if (toggleText) toggleText.innerText = '회의 조율로 돌아가기';
                btnToggle.style.borderColor = '#f04452'; // Toss Red
                if (recSection) recSection.style.display = 'none';
                if (calTitle) calTitle.innerText = '내 일정 편집 (김토스)';
                
                document.querySelector('.detail-panel-placeholder').style.display = 'flex';
                document.getElementById('detail-panel-content').style.display = 'none';
            } else {
                currentViewMode = 'coordination';
                if (toggleText) toggleText.innerText = '내 일정 관리';
                btnToggle.style.borderColor = 'var(--border-color)';
                if (recSection) recSection.style.display = 'block';
                if (calTitle) calTitle.innerText = '참석 가능 현황';
            }
            
            renderCalendar();
            calculateRecommendations();
        });
    }
}

// 7. Progressive Wizard Setup Page
let renderWizardGridGlobal = null;
let renderSearchResultsGlobal = null;

function setupWizard() {
    // Programmatically initialize added property if not already set
    participants.forEach(p => {
        if (p.added === undefined) {
            p.added = p.enabled;
        }
    });

    const wizDurationButtons = document.querySelectorAll('#wiz-duration-selector .duration-segment-btn');
    const wizCustomWrapper = document.getElementById('wiz-custom-duration-wrapper');
    const wizCustomInput = document.getElementById('wiz-custom-duration-input');
    const wizSubmitBtn = document.getElementById('btn-wiz-submit');
    const wizMeetingNameInput = document.getElementById('wiz-meeting-name');
    
    const searchTrigger = document.getElementById('btn-wiz-search-trigger');
    const searchPopup = document.getElementById('wiz-search-popup');
    const searchClose = document.getElementById('btn-wiz-search-close');
    const wizSearchInput = document.getElementById('wiz-search-input');
    const wizSearchResults = document.getElementById('wiz-search-results');
    
    // 1. Duration selection tabs in Wizard
    if (wizDurationButtons.length > 0) {
        wizDurationButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                wizDurationButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const val = btn.getAttribute('data-value');
                if (val === 'custom') {
                    if (wizCustomWrapper) wizCustomWrapper.style.display = 'block';
                } else {
                    if (wizCustomWrapper) wizCustomWrapper.style.display = 'none';
                }
            });
        });
    }
    
    // Helper to render selected colleagues in 2-column grid format
    const wizParticipantsGrid = document.getElementById('wiz-participants-grid');
    function renderWizardGrid() {
        if (!wizParticipantsGrid) return;
        wizParticipantsGrid.innerHTML = '';
        
        participants.filter(p => p.added).forEach(p => {
            const card = document.createElement('div');
            card.className = `wiz-participant-item checked ${p.id === 'p1' ? 'disabled-check' : ''}`;
            card.setAttribute('data-id', p.id);
            
            const isHost = p.id === 'p1';
            card.innerHTML = `
                <div class="wiz-avatar-wrapper" style="position: relative; display: inline-block;">
                    <span class="wiz-avatar-color" style="background-color: ${p.avatarColor}20; width: 32px; height: 32px; border-radius: 50%; color: ${p.avatarColor}; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; user-select: none;">
                        ${p.name[0]}
                    </span>
                    ${isHost ? `
                    <span class="wiz-host-badge" style="position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; background-color: var(--color-green); border: 1.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 8px; font-weight: bold; line-height: 1; user-select: none; box-sizing: border-box;">✓</span>
                    ` : ''}
                </div>
                <div class="wiz-info">
                    <span class="wiz-name">${p.name}</span>
                    <span class="wiz-role">${p.desc}</span>
                </div>
                <span class="wiz-remove-btn" title="제거">×</span>
            `;
            
            // Remove click listener
            if (p.id !== 'p1') {
                const removeAction = (e) => {
                    e.stopPropagation();
                    p.added = false;
                    p.enabled = false;
                    renderWizardGrid();
                    renderSearchResults(wizSearchInput ? wizSearchInput.value : '');
                };
                
                card.addEventListener('click', removeAction);
                const closeBtn = card.querySelector('.wiz-remove-btn');
                if (closeBtn) closeBtn.addEventListener('click', removeAction);
            }
            
            wizParticipantsGrid.appendChild(card);
        });
    }
    
    // Helper to render search results in popup dropdown
    function renderSearchResults(query = '') {
        if (!wizSearchResults) return;
        wizSearchResults.innerHTML = '';
        
        const q = query.trim().toLowerCase();
        
        const filtered = participants.filter(p => {
            if (p.id === 'p1') return false;
            if (q === '') return true; // show all when query is empty
            return matchKorean(p.name, q) || matchKorean(p.desc, q);
        });
        
        if (filtered.length === 0) {
            const noResult = document.createElement('div');
            noResult.className = 'wiz-search-item';
            noResult.style.cursor = 'default';
            noResult.style.color = 'var(--text-tertiary)';
            noResult.style.justifyContent = 'center';
            noResult.innerText = '검색 결과가 없습니다.';
            wizSearchResults.appendChild(noResult);
            return;
        }
        
        filtered.forEach(p => {
            const item = document.createElement('div');
            item.className = `wiz-search-item ${p.added ? 'selected' : ''}`;
            item.setAttribute('data-id', p.id);
            
            item.innerHTML = `
                <div class="wiz-search-item-left">
                    <div class="wiz-avatar-color" style="background-color: ${p.avatarColor}20; width: 32px; height: 32px; font-size: 13px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: ${p.avatarColor}; font-weight: 700; user-select: none;">
                        ${p.name[0]}
                    </div>
                    <div class="wiz-search-item-info">
                        <span class="wiz-search-item-name">${p.name}</span>
                        <span class="wiz-search-item-dept">${p.desc}</span>
                    </div>
                </div>
                <div class="wiz-search-item-check">✓</div>
            `;
            
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                p.added = !p.added;
                p.enabled = p.added;
                renderWizardGrid();
                renderSearchResults(wizSearchInput ? wizSearchInput.value : '');
            });
            
            wizSearchResults.appendChild(item);
        });
    }
    
    // Toggle Search Popup card display
    if (searchTrigger && searchPopup) {
        searchTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const visible = searchPopup.style.display === 'block';
            searchPopup.style.display = visible ? 'none' : 'block';
            if (!visible && wizSearchInput) {
                wizSearchInput.value = '';
                renderSearchResults('');
                wizSearchInput.focus();
            }
        });
    }
    
    if (searchClose && searchPopup) {
        searchClose.addEventListener('click', (e) => {
            e.stopPropagation();
            searchPopup.style.display = 'none';
        });
    }
    
    // Close search popup when clicking outside the card
    document.addEventListener('click', (e) => {
        if (searchPopup && !searchPopup.contains(e.target) && e.target !== searchTrigger) {
            searchPopup.style.display = 'none';
        }
    });
    
    // Bind search input events
    if (wizSearchInput) {
        wizSearchInput.addEventListener('input', () => {
            renderSearchResults(wizSearchInput.value);
        });
    }
    
    // Assign global references for reset syncing
    renderWizardGridGlobal = renderWizardGrid;
    renderSearchResultsGlobal = renderSearchResults;
    
    // Initial Render for Wizard Grid list and Search Results
    renderWizardGrid();
    renderSearchResults('');
    
    // 3. Submit button triggers sync and dashboard activation
    if (wizSubmitBtn) {
        wizSubmitBtn.addEventListener('click', () => {
            // Restore schedule data to revert any participant mode modifications
            restoreScheduleData();
            
            // This is the HOST scenario — 김토스 is creating & hosting the meeting.
            currentMeetingRole = 'host';
            mockParticipantSession = null;
            currentPollState = null;
            const readOnlyBadge = document.getElementById('participant-read-only-badge');
            if (readOnlyBadge) readOnlyBadge.style.display = 'none';

            // Sync Meeting Name
            let nameVal = '새 회의';
            if (wizMeetingNameInput) {
                nameVal = wizMeetingNameInput.value.trim() || '새 회의';
                document.getElementById('meeting-name').value = nameVal;
            }
            
            // Sync Duration
            const activeBtn = document.querySelector('#wiz-duration-selector .duration-segment-btn.active');
            const durationSelect = document.getElementById('meeting-duration');
            let durationVal = 60;
            if (activeBtn && durationSelect) {
                const val = activeBtn.getAttribute('data-value');
                if (val === 'custom') {
                    durationVal = parseInt(wizCustomInput.value) || 90;
                } else {
                    durationVal = parseInt(val);
                }
                
                let option = durationSelect.querySelector(`option[value="${durationVal}"]`);
                if (!option) {
                    option = document.createElement('option');
                    option.value = durationVal;
                    option.text = `${durationVal}분`;
                    durationSelect.appendChild(option);
                }
                durationSelect.value = durationVal;
                durationSelect.dispatchEvent(new Event('change'));
            }

            // Create shared meeting session if host
            if (currentUserId === 'p1') {
                const newSession = {
                    id: 'session-' + Date.now(),
                    title: nameVal,
                    duration: durationVal,
                    hostId: 'p1',
                    status: 'coordinating',
                    participants: participants.filter(p => p.enabled).map(p => p.id),
                    votes: {},
                    confirmedTime: null
                };
                localStorage.setItem('toss_shared_meeting_session', JSON.stringify(newSession));
                localStorage.setItem('toss_session_invite_notification', 'true');
                
                // Enable notifications on applying the setup wizard!
                localStorage.setItem('toss_notifications_enabled', 'true');
                checkNotifications();

                window.dispatchEvent(new Event('storage'));
            }
            
            // Redraw dashboard
            renderParticipants();
            calculateRecommendations();
            renderCalendar();
            
            // Transition containers
            const setupContainer = document.getElementById('workspace-landing');
            const dashboardContainer = document.getElementById('coordination-dashboard');
            
            if (setupContainer && dashboardContainer) {
                setupContainer.style.display = 'none';
                dashboardContainer.style.display = 'flex';
                document.body.classList.remove('view-landing');
                hideMessagePopover(true);
                history.pushState({ page: 'dashboard' }, '', '#dashboard');
                showToast("추천 시간을 찾았습니다.");
            }
        });
    }
    
    // Global Template Application Popup logic
    const applyDialog = document.getElementById('template-apply-dialog');
    const applyTplTitle = document.getElementById('apply-tpl-title');
    const applyTplSelectedList = document.getElementById('apply-tpl-selected-list');
    const btnCancelApply = document.getElementById('btn-cancel-apply');
    const btnSubmitApply = document.getElementById('btn-submit-apply');
    const btnCloseApply = document.getElementById('btn-close-apply-dialog');

    // Popup Search controls
    const btnTplSearchTrigger = document.getElementById('btn-tpl-search-trigger');
    const tplSearchPopup = document.getElementById('tpl-search-popup');
    const tplSearchInput = document.getElementById('tpl-search-input');
    const btnTplSearchClose = document.getElementById('btn-tpl-search-close');
    const tplSearchResults = document.getElementById('tpl-search-results');

    let currentPendingTemplate = null;
    let popupSelectedIds = [];

    function openTemplateApplyDialog(tplName, defaultAttendeeIds, onApply) {
        if (!applyDialog) return;
        
        applyTplTitle.innerText = tplName;
        popupSelectedIds = [...defaultAttendeeIds];
        
        currentPendingTemplate = {
            name: tplName,
            onApply: onApply
        };

        renderTplApplyList();
        
        // Hide popup search if it was open
        if (tplSearchPopup) tplSearchPopup.style.display = 'none';

        applyDialog.style.display = 'flex';
    }

    function renderTplApplyList() {
        if (!applyTplSelectedList) return;
        applyTplSelectedList.innerHTML = '';
        
        // Host (p1, 김토스) is always included at the top
        const allList = ['p1', ...popupSelectedIds];

        allList.forEach(id => {
            const p = participants.find(part => part.id === id);
            if (!p) return;
            
            const isHost = id === 'p1';
            const card = document.createElement('div');
            
            card.className = `wiz-participant-item checked ${isHost ? 'disabled-check' : ''}`;
            card.setAttribute('data-id', id);
            
            card.innerHTML = `
                <div class="wiz-avatar-wrapper" style="position: relative; display: inline-block;">
                    <span class="wiz-avatar-color" style="background-color: ${p.avatarColor}20; width: 32px; height: 32px; border-radius: 50%; color: ${p.avatarColor}; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; user-select: none;">
                        ${p.name[0]}
                    </span>
                    ${isHost ? `
                    <span class="wiz-host-badge" style="position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; background-color: var(--color-green); border: 1.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 8px; font-weight: bold; line-height: 1; user-select: none; box-sizing: border-box;">✓</span>
                    ` : ''}
                </div>
                <div class="wiz-info">
                    <span class="wiz-name">${p.name}</span>
                    <span class="wiz-role">${p.desc}</span>
                </div>
                <span class="wiz-remove-btn" title="제거">✕</span>
            `;
            
            if (!isHost) {
                const removeAction = (e) => {
                    e.stopPropagation();
                    popupSelectedIds = popupSelectedIds.filter(sid => sid !== id);
                    renderTplApplyList();
                };
                card.addEventListener('click', removeAction);
                const closeBtn = card.querySelector('.wiz-remove-btn');
                if (closeBtn) closeBtn.addEventListener('click', removeAction);
            }
            
            applyTplSelectedList.appendChild(card);
        });
    }

    // Popup search handlers
    if (btnTplSearchTrigger && tplSearchPopup) {
        btnTplSearchTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            tplSearchPopup.style.display = 'block';
            if (tplSearchInput) {
                tplSearchInput.value = '';
                tplSearchInput.focus();
                renderTplSearchResults('');
            }
        });
    }

    if (btnTplSearchClose) {
        btnTplSearchClose.addEventListener('click', (e) => {
            e.stopPropagation();
            tplSearchPopup.style.display = 'none';
        });
    }

    if (tplSearchInput) {
        tplSearchInput.addEventListener('input', (e) => {
            renderTplSearchResults(e.target.value);
        });
    }

    // Close search popup if clicked outside
    document.addEventListener('click', (e) => {
        if (tplSearchPopup && !tplSearchPopup.contains(e.target) && e.target !== btnTplSearchTrigger) {
            tplSearchPopup.style.display = 'none';
        }
    });

    function renderTplSearchResults(query) {
        if (!tplSearchResults) return;
        tplSearchResults.innerHTML = '';
        
        const term = query.toLowerCase().trim();
        const filtered = participants.filter(p => {
            // Exclude host p1 and already selected ones in the popup
            if (p.id === 'p1' || popupSelectedIds.includes(p.id)) return false;
            if (!term) return true;
            return matchKorean(p.name, term) || matchKorean(p.desc, term);
        });

        if (filtered.length === 0) {
            tplSearchResults.innerHTML = '<p style="font-size: 12px; color: var(--text-tertiary); text-align: center; margin: 12px 0;">검색 결과가 없습니다.</p>';
            return;
        }

        filtered.forEach(p => {
            const item = document.createElement('div');
            item.className = 'wiz-search-item';
            
            item.innerHTML = `
                <div class="wiz-search-item-left">
                    <div class="wiz-avatar-color" style="background-color: ${p.avatarColor}20; width: 32px; height: 32px; font-size: 13px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: ${p.avatarColor}; font-weight: 700; user-select: none;">
                        ${p.name[0]}
                    </div>
                    <div class="wiz-search-item-info">
                        <span class="wiz-search-item-name">${p.name}</span>
                        <span class="wiz-search-item-dept">${p.desc}</span>
                    </div>
                </div>
            `;
            
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                popupSelectedIds.push(p.id);
                renderTplApplyList();
                tplSearchPopup.style.display = 'none';
            });
            tplSearchResults.appendChild(item);
        });
    }

    const closeApplyDialog = () => {
        if (applyDialog) applyDialog.style.display = 'none';
        document.querySelectorAll('.wiz-template-chip').forEach(c => c.classList.remove('active'));
    };
    if (btnCancelApply) btnCancelApply.addEventListener('click', closeApplyDialog);
    if (btnCloseApply) btnCloseApply.addEventListener('click', closeApplyDialog);
    if (applyDialog) {
        applyDialog.addEventListener('click', (e) => {
            if (e.target === applyDialog) closeApplyDialog();
        });
    }

    if (btnSubmitApply) {
        btnSubmitApply.addEventListener('click', () => {
            if (!currentPendingTemplate) return;
            currentPendingTemplate.onApply(popupSelectedIds);
            applyDialog.style.display = 'none';
        });
    }
    
    // 4. Back button from dashboard to Wizard
    const backBtn = document.getElementById('btn-back-to-setup');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            history.pushState({ page: 'landing' }, '', '#landing');
            navigateBackToLanding();
        });
    }

    // 5. Week navigation in Workspace Landing
    const prevWeekBtn = document.getElementById('btn-wiz-prev-week');
    const nextWeekBtn = document.getElementById('btn-wiz-next-week');
    const weekLabel = document.getElementById('wiz-week-label');
    const wizDateRangeText = document.getElementById('wiz-date-range-text');
    
    function updateWizWeekUI() {
        if (!selectedDate) return;
        const monday = getMondayOf(selectedDate);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() - 1);
        const saturday = new Date(monday);
        saturday.setDate(monday.getDate() + 5);
        
        const year = sunday.getFullYear();
        const month = sunday.getMonth() + 1;
        
        const firstDayOfMonth = new Date(year, sunday.getMonth(), 1);
        const dayOfWeekOfFirst = firstDayOfMonth.getDay() || 7;
        const dayOfMonth = sunday.getDate();
        const weekNum = Math.ceil((dayOfMonth + dayOfWeekOfFirst - 1) / 7);
        
        if (weekLabel) {
            const y1 = sunday.getFullYear();
            const m1 = sunday.getMonth() + 1;
            const d1 = sunday.getDate();
            const y2 = saturday.getFullYear();
            const m2 = saturday.getMonth() + 1;
            const d2 = saturday.getDate();
            
            let labelText = '';
            if (y1 === y2) {
                if (m1 === m2) {
                    labelText = `${y1}년 ${m1}월 ${d1}일 - ${d2}일`;
                } else {
                    labelText = `${y1}년 ${m1}월 ${d1}일 - ${m2}월 ${d2}일`;
                }
            } else {
                labelText = `${y1}년 ${m1}월 ${d1}일 - ${y2}년 ${m2}월 ${d2}일`;
            }
            weekLabel.innerText = labelText;
        }
        
        if (wizDateRangeText) {
            const m1 = sunday.getMonth() + 1;
            const d1 = sunday.getDate();
            const m2 = saturday.getMonth() + 1;
            const d2 = saturday.getDate();
            const pad = (n) => n.toString().padStart(2, '0');
            wizDateRangeText.innerText = `${year}.${pad(m1)}.${pad(d1)} (일) ~ ${pad(m2)}.${pad(d2)} (토)`;
        }
        
        const dashboardTrigger = document.getElementById('date-picker-trigger');
        if (dashboardTrigger) {
            const m1 = sunday.getMonth() + 1;
            const d1 = sunday.getDate();
            const m2 = saturday.getMonth() + 1;
            const d2 = saturday.getDate();
            const pad = (n) => n.toString().padStart(2, '0');
            dashboardTrigger.innerText = `${year}.${pad(m1)}.${pad(d1)} (일) ~ ${pad(m2)}.${pad(d2)} (토)`;
        }
    }
    
    // Assign global/local references to initialize text
    updateWizWeekUI();
    
    if (prevWeekBtn && nextWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            selectedDate.setDate(selectedDate.getDate() - 7);
            renderWorkspaceCalendar();
            updateWizWeekUI();
            calculateRecommendations();
            renderCalendar();
        });
        
        nextWeekBtn.addEventListener('click', () => {
            selectedDate.setDate(selectedDate.getDate() + 7);
            renderWorkspaceCalendar();
            updateWizWeekUI();
            calculateRecommendations();
            renderCalendar();
        });
    }

    // 6. Quick Template Selection & Custom templates creation
    const templatesRow = document.getElementById('wiz-templates-row');
    const btnAddTemplate = document.getElementById('btn-add-template');
    const tplDialog = document.getElementById('custom-template-dialog');
    const tplCloseBtn = document.getElementById('btn-close-template-dialog');
    const tplCancelBtn = document.getElementById('btn-cancel-template');
    const tplForm = document.getElementById('template-creation-form');
    const tplPartList = document.getElementById('tpl-participants-list');
    
    // Bind template chip action (helper function)
    function bindTemplateChip(chip, tplName, defaultAttendeeIds, onApply) {
        chip.addEventListener('click', () => {
            const isActive = chip.classList.contains('active');
            document.querySelectorAll('.wiz-template-chip').forEach(c => c.classList.remove('active'));
            
            if (isActive) {
                const btnReset = document.getElementById('btn-wiz-reset');
                if (btnReset) btnReset.click();
            } else {
                chip.classList.add('active');
                onApply(defaultAttendeeIds);
            }
        });
    }

    // 1. Template LocalStorage persistence and dynamic rendering helper
    let customTemplates = [];

    function saveTemplates() {
        localStorage.setItem('toss_align_templates', JSON.stringify(customTemplates));
    }

    function createTemplateChip(tpl) {
        const customChip = document.createElement('button');
        customChip.type = 'button';
        customChip.className = 'wiz-template-chip';
        customChip.setAttribute('data-type', 'custom');
        customChip.style.position = 'relative';
        customChip.style.paddingRight = '28px';
        customChip.style.whiteSpace = 'nowrap';
        
        const iconHtml = tpl.name === '1:1 면담'
            ? `<img src="images/chat_bubble.png" class="wiz-tpl-icon no-invert" alt="chat">`
            : `<img src="images/bookmark.png" class="wiz-tpl-icon" alt="bookmark">`;

        customChip.innerHTML = `
            <span>${iconHtml}${tpl.name}</span>
            <span class="wiz-tpl-delete-btn" style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; background-color: rgba(0,0,0,0.06); color: var(--text-secondary); border-radius: 50%; font-size: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s;" title="템플릿 삭제">✕</span>
        `;
        
        const deleteBtn = customChip.querySelector('.wiz-tpl-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (customChip.classList.contains('active')) {
                    const btnReset = document.getElementById('btn-wiz-reset');
                    if (btnReset) btnReset.click();
                }
                customChip.remove();
                
                customTemplates = customTemplates.filter(t => t.name !== tpl.name);
                saveTemplates();
                showToast(`'${tpl.name}' 템플릿이 삭제되었습니다.`);
            });
        }

        bindTemplateChip(customChip, tpl.name, tpl.attendeeIds, (finalIds) => {
            const wizMeetingNameInput = document.getElementById('wiz-meeting-name');
            if (wizMeetingNameInput) wizMeetingNameInput.value = tpl.name;
            
            const segmentBtn = document.querySelector(`#wiz-duration-selector .duration-segment-btn[data-value="${tpl.duration}"]`);
            if (segmentBtn) {
                segmentBtn.click();
            } else {
                const customSeg = document.querySelector(`#wiz-duration-selector .duration-segment-btn[data-value="custom"]`);
                if (customSeg) customSeg.click();
                const wizCustomInp = document.getElementById('wiz-custom-duration-input');
                if (wizCustomInp) {
                    wizCustomInp.value = tpl.duration;
                    wizCustomInp.dispatchEvent(new Event('change'));
                }
            }
            
            participants.forEach(p => {
                p.added = (p.id === 'p1' || finalIds.includes(p.id));
                p.enabled = p.added;
            });
            renderWizardGrid();
            renderSearchResults(wizSearchInput ? wizSearchInput.value : '');
        });

        const templatesRow = document.getElementById('wiz-templates-row');
        if (templatesRow) {
            const chip1on1 = templatesRow.querySelector('.wiz-template-chip[data-type="1on1"]');
            if (chip1on1) {
                templatesRow.insertBefore(customChip, chip1on1);
            } else {
                const btnAddTemplate = document.getElementById('btn-add-template');
                templatesRow.insertBefore(customChip, btnAddTemplate);
            }
        }
    }

    function initTemplates() {
        const saved = localStorage.getItem('toss_align_templates');
        if (saved === null) {
            customTemplates = [];
            saveTemplates();
        } else {
            try {
                customTemplates = JSON.parse(saved);
                // Exclude any legacy design1 template that might have been saved in localStorage
                customTemplates = customTemplates.filter(t => t.name !== '디자인1팀 회의');
                saveTemplates();
            } catch (e) {
                customTemplates = [];
            }
        }
        
        // Render built-in "디자인1팀 회의" template dynamically on load!
        createTemplateChip({ name: '디자인1팀 회의', duration: 60, attendeeIds: ['p2', 'p3', 'p4', 'p5', 'p6'] });
        
        customTemplates.forEach(createTemplateChip);
    }

    // Initialize templates on startup
    initTemplates();

    // Default template: 1:1 meeting
    const chip1on1 = document.querySelector('.wiz-template-chip[data-type="1on1"]');
    if (chip1on1) {
        bindTemplateChip(chip1on1, '1:1 면담', [], (selectedIds) => {
            const wizMeetingNameInput = document.getElementById('wiz-meeting-name');
            if (wizMeetingNameInput) wizMeetingNameInput.value = '1:1 면담';
            const btn60 = document.querySelector('#wiz-duration-selector .duration-segment-btn[data-value="60"]');
            if (btn60) btn60.click();
            participants.forEach(p => {
                p.added = (p.id === 'p1');
                p.enabled = p.added;
            });
            renderWizardGrid();
            renderSearchResults(wizSearchInput ? wizSearchInput.value : '');
        });
    }

    // Setup wizard reset button handler
    const btnWizReset = document.getElementById('btn-wiz-reset');
    if (btnWizReset) {
        btnWizReset.addEventListener('click', () => {
            if (quickPollTimeoutId) {
                clearTimeout(quickPollTimeoutId);
                quickPollTimeoutId = null;
            }
            if (hostConfirmationTimeoutId) {
                clearTimeout(hostConfirmationTimeoutId);
                hostConfirmationTimeoutId = null;
            }
            // 1. Deselect template chips
            document.querySelectorAll('.wiz-template-chip').forEach(c => c.classList.remove('active'));

            // 2. Reset meeting name input
            const wizMeetingNameInput = document.getElementById('wiz-meeting-name');
            if (wizMeetingNameInput) wizMeetingNameInput.value = '';

            // 3. Reset duration selector to default (60 minutes / 1시간)
            const btn60 = document.querySelector('#wiz-duration-selector .duration-segment-btn[data-value="60"]');
            if (btn60) {
                btn60.click();
            } else {
                const customWrapper = document.getElementById('wiz-custom-duration-wrapper');
                if (customWrapper) customWrapper.style.display = 'none';
            }

            // 4. Clean up attendees: keep ONLY host p1
            participants.forEach(p => {
                const isHost = p.id === 'p1';
                p.added = isHost;
                p.enabled = isHost;
            });

            // 5. Render grids and inputs
            renderWizardGrid();
            renderSearchResults(wizSearchInput ? wizSearchInput.value : '');

            // 6. Recalculate recommendation and update calendar view
            calculateRecommendations();
            renderCalendar();
        });
    }

    // Custom Template Dialog Logic (Add template popup)
    let addTplSelectedIds = [];
    const tplAddSearchTrigger = document.getElementById('btn-tpl-add-search-trigger');
    const tplAddSearchPopup = document.getElementById('tpl-add-search-popup');
    const tplAddSearchInput = document.getElementById('tpl-add-search-input');
    const tplAddSearchClose = document.getElementById('btn-tpl-add-search-close');
    const tplAddSearchResults = document.getElementById('tpl-add-search-results');
    const tplAddSelectedList = document.getElementById('tpl-add-selected-list');

    function renderTplAddList() {
        if (!tplAddSelectedList) return;
        tplAddSelectedList.innerHTML = '';
        
        // Host is always at the top
        const allList = ['p1', ...addTplSelectedIds];
        allList.forEach(id => {
            const p = participants.find(part => part.id === id);
            if (!p) return;
            
            const isHost = id === 'p1';
            const card = document.createElement('div');
            
            card.className = `wiz-participant-item checked ${isHost ? 'disabled-check' : ''}`;
            card.setAttribute('data-id', id);
            
            card.innerHTML = `
                <div class="wiz-avatar-wrapper" style="position: relative; display: inline-block;">
                    <span class="wiz-avatar-color" style="background-color: ${p.avatarColor}20; width: 32px; height: 32px; border-radius: 50%; color: ${p.avatarColor}; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; user-select: none;">
                        ${p.name[0]}
                    </span>
                    ${isHost ? `
                    <span class="wiz-host-badge" style="position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; background-color: var(--color-green); border: 1.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 8px; font-weight: bold; line-height: 1; user-select: none; box-sizing: border-box;">✓</span>
                    ` : ''}
                </div>
                <div class="wiz-info">
                    <span class="wiz-name">${p.name}</span>
                    <span class="wiz-role">${p.desc}</span>
                </div>
                <span class="wiz-remove-btn" title="제거">✕</span>
            `;
            
            if (!isHost) {
                const removeAction = (e) => {
                    e.stopPropagation();
                    addTplSelectedIds = addTplSelectedIds.filter(sid => sid !== id);
                    renderTplAddList();
                };
                card.addEventListener('click', removeAction);
                const closeBtn = card.querySelector('.wiz-remove-btn');
                if (closeBtn) closeBtn.addEventListener('click', removeAction);
            }
            tplAddSelectedList.appendChild(card);
        });
    }

    function renderTplAddSearchResults(query) {
        if (!tplAddSearchResults) return;
        tplAddSearchResults.innerHTML = '';
        
        const q = query.trim().toLowerCase();
        // Exclude host p1 and already selected attendees
        const list = participants.filter(p => p.id !== 'p1' && !addTplSelectedIds.includes(p.id));
        const filtered = list.filter(p => matchKorean(p.name, q) || matchKorean(p.desc, q));
        
        if (filtered.length === 0) {
            const item = document.createElement('div');
            item.style.padding = '8px 12px';
            item.style.fontSize = '12px';
            item.style.color = 'var(--text-tertiary)';
            item.innerText = '검색 결과가 없습니다.';
            tplAddSearchResults.appendChild(item);
            return;
        }

        filtered.forEach(p => {
            const item = document.createElement('div');
            item.className = 'wiz-search-item';
            
            item.innerHTML = `
                <div class="wiz-search-item-left">
                    <div class="wiz-avatar-color" style="background-color: ${p.avatarColor}20; width: 32px; height: 32px; font-size: 13px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: ${p.avatarColor}; font-weight: 700; user-select: none;">
                        ${p.name[0]}
                    </div>
                    <div class="wiz-search-item-info">
                        <span class="wiz-search-item-name">${p.name}</span>
                        <span class="wiz-search-item-dept">${p.desc}</span>
                    </div>
                </div>
            `;
            
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                addTplSelectedIds.push(p.id);
                renderTplAddList();
                renderTplAddSearchResults(tplAddSearchInput ? tplAddSearchInput.value : '');
            });
            
            tplAddSearchResults.appendChild(item);
        });
    }

    // Duration selector logic for custom template popup
    const tplAddDurationSelector = document.getElementById('tpl-add-duration-selector');
    const tplAddCustomWrapper = document.getElementById('tpl-add-custom-duration-wrapper');
    const tplAddCustomInput = document.getElementById('tpl-add-custom-duration-input');
    
    if (tplAddDurationSelector) {
        const btns = tplAddDurationSelector.querySelectorAll('.duration-segment-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const val = btn.getAttribute('data-value');
                if (val === 'custom') {
                    if (tplAddCustomWrapper) tplAddCustomWrapper.style.display = 'block';
                    if (tplAddCustomInput) {
                        tplAddCustomInput.value = '90'; // Default custom duration
                        tplAddCustomInput.focus();
                    }
                } else {
                    if (tplAddCustomWrapper) tplAddCustomWrapper.style.display = 'none';
                }
            });
        });
    }

    if (tplAddCustomInput) {
        tplAddCustomInput.addEventListener('input', () => {
            let val = parseInt(tplAddCustomInput.value);
            if (val > 480) {
                tplAddCustomInput.value = 480;
            }
        });
        tplAddCustomInput.addEventListener('blur', () => {
            let val = parseInt(tplAddCustomInput.value);
            if (!val || val < 10) {
                tplAddCustomInput.value = 10;
            }
        });
    }

    if (btnAddTemplate) {
        btnAddTemplate.addEventListener('click', () => {
            const meetingName = document.getElementById('wiz-meeting-name').value.trim();
            if (!meetingName) {
                showToast("회의 이름을 입력해 주세요.");
                const nameInput = document.getElementById('wiz-meeting-name');
                if (nameInput) {
                    nameInput.focus();
                    nameInput.style.transition = 'all 0.2s';
                    nameInput.style.borderColor = 'var(--color-blue)';
                    setTimeout(() => {
                        nameInput.style.borderColor = '';
                    }, 1000);
                }
                return;
            }

            const activeBtn = document.querySelector('#wiz-duration-selector .duration-segment-btn.active');
            let duration = 60;
            if (activeBtn) {
                const val = activeBtn.getAttribute('data-value');
                if (val === 'custom') {
                    duration = parseInt(document.getElementById('wiz-custom-duration-input').value) || 90;
                } else {
                    duration = parseInt(val) || 60;
                }
            }

            const selectedIds = participants.filter(p => p.added && p.id !== 'p1').map(p => p.id);
            const newTpl = { name: meetingName, duration, attendeeIds: selectedIds };

            const existingIdx = customTemplates.findIndex(t => t.name === meetingName);
            if (existingIdx !== -1) {
                customTemplates[existingIdx] = newTpl;
                saveTemplates();
                
                const existingChips = document.querySelectorAll('.wiz-template-chip');
                existingChips.forEach(c => {
                    const span = c.querySelector('span');
                    if (span && span.innerText.includes(meetingName)) {
                        c.remove();
                    }
                });
                createTemplateChip(newTpl);
                showToast(`'${meetingName}' 템플릿이 업데이트되었습니다.`);
            } else {
                customTemplates.push(newTpl);
                saveTemplates();
                createTemplateChip(newTpl);
                showToast(`'${meetingName}' 템플릿이 저장되었습니다.`);
            }
        });
    }

    // 7. Date Picker Trigger
    const wizDatePickerTrigger = document.getElementById('wiz-date-picker-trigger');
    if (wizDatePickerTrigger) {
        wizDatePickerTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const calendarPopup = document.getElementById('calendar-popup');
            if (calendarPopup) {
                const rect = wizDatePickerTrigger.getBoundingClientRect();
                calendarPopup.style.top = `${rect.bottom + window.scrollY + 8}px`;
                calendarPopup.style.left = `${rect.left + window.scrollX}px`;
                calendarPopup.style.display = calendarPopup.style.display === 'block' ? 'none' : 'block';
            }
        });
    }
}

// Helpers for Calendar Schedule Customization Popover
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
}

function openScheduleEditPopover(cell, dayIdx, slotIdx) {
    const mondayStr = formatDate(getMondayOf(selectedDate));
    const slotKey = `${mondayStr}:${dayIdx}-${slotIdx}`;
    const custom = p1CustomSchedules[slotKey];
    if (custom && (custom.category === 'focus' || custom.title === '집중 시간')) {
        showToast("집중 시간은 마이페이지에서 변경해 주세요.");
        return;
    }

    const popover = document.getElementById('schedule-edit-popover');
    if (!popover) return;
    
    const rect = cell.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    // Display popover
    popover.style.display = 'block';
    const popoverWidth = popover.offsetWidth || 320;
    const popoverHeight = popover.offsetHeight || 240;
    
    // Position adjacent to the cell (prefer right side, fallback to left side)
    let leftPos = rect.right + scrollX + 12;
    let topPos = rect.top + scrollY + (rect.height - popoverHeight) / 2;
    
    // Fallback to left side if it overflows the right edge
    if (leftPos + popoverWidth > window.innerWidth - 12) {
        leftPos = rect.left + scrollX - popoverWidth - 12;
        popover.classList.remove('arrow-left');
        popover.classList.add('arrow-right');
    } else {
        popover.classList.remove('arrow-right');
        popover.classList.add('arrow-left');
    }
    
    // Bounds check for top and bottom of screen
    if (topPos < scrollY + 12) {
        topPos = scrollY + 12;
    }
    if (topPos + popoverHeight > scrollY + window.innerHeight - 12) {
        topPos = scrollY + window.innerHeight - popoverHeight - 12;
    }
    
    popover.style.top = topPos + 'px';
    popover.style.left = leftPos + 'px';
    
    // Position the arrow vertically to align with the vertical center of the cell
    const arrowTop = (rect.top + scrollY + rect.height / 2) - topPos;
    popover.style.setProperty('--arrow-top', `${arrowTop}px`);
    
    const busyList = scheduleData[currentUserId] || [];
    const isBusy = busyList.includes(slotKey);
    
    const titleInput = document.getElementById('schedule-title-input');
    const deleteBtn = document.getElementById('btn-delete-schedule');
    const saveBtn = document.getElementById('btn-save-schedule');
    const popoverTitle = document.getElementById('schedule-popover-title');
    
    const daySelect = document.getElementById('schedule-day-select');
    const startSelect = document.getElementById('schedule-start-select');
    const endSelect = document.getElementById('schedule-end-select');
    
    if (titleInput) {
        titleInput.value = isBusy ? (custom ? custom.title : '개인 일정') : '';
        titleInput.focus();
    }
    
    const memoInput = document.getElementById('schedule-memo-input');
    if (memoInput) {
        let val = isBusy ? (custom && custom.memo ? custom.memo : '') : '';
        val = val.replace(/(<span class="mention-tag"[^>]*>)@/gi, '$1');
        memoInput.innerHTML = val;
    }
    
    if (popoverTitle) {
        popoverTitle.innerText = isBusy ? '일정 수정' : '일정 추가';
    }
    
    const cancelBtn = document.getElementById('btn-cancel-schedule');
    if (saveBtn) {
        saveBtn.innerText = isBusy ? '저장' : '추가';
    }
    
    if (deleteBtn) {
        deleteBtn.style.display = isBusy ? 'block' : 'none';
    }
    if (cancelBtn) {
        cancelBtn.style.display = isBusy ? 'none' : 'block';
    }
    
    // Populate and sync Time Select fields
    if (startSelect && endSelect) {
        startSelect.value = slotIdx;
        
        // If there's an existing schedule range, we can try to guess/read its full span
        if (isBusy && custom) {
            let maxContiguousEnd = slotIdx + 1;
            for (let s = slotIdx + 1; s < 9; s++) {
                const checkKey = `${mondayStr}:${dayIdx}-${s}`;
                const checkCustom = p1CustomSchedules[checkKey];
                if (busyList.includes(checkKey) && checkCustom && checkCustom.title === custom.title && checkCustom.category === custom.category) {
                    maxContiguousEnd = s + 1;
                } else {
                    break;
                }
            }
            endSelect.value = maxContiguousEnd;
        } else {
            endSelect.value = slotIdx + 1;
        }
    }
    
    const chips = popover.querySelectorAll('.category-chip');
    const activeCategory = isBusy ? (custom ? custom.category : 'work') : 'work';
    
    chips.forEach(chip => {
        const cat = chip.getAttribute('data-category');
        const color = chip.getAttribute('data-color');
        
        if (cat === activeCategory) {
            chip.classList.add('active');
            chip.style.border = `1.5px solid ${color}`;
            chip.style.background = `rgba(${hexToRgb(color)}, 0.08)`;
            chip.style.color = color;
            chip.style.fontWeight = '700';
        } else {
            chip.classList.remove('active');
            chip.style.border = `1.5px solid var(--border-color)`;
            chip.style.background = `var(--bg-color)`;
            chip.style.color = `var(--text-secondary)`;
            chip.style.fontWeight = '600';
        }
    });
    
    popover.setAttribute('data-active-day', dayIdx);
    popover.setAttribute('data-active-slot', slotIdx);
}

function setupSchedulePopover() {
    const popover = document.getElementById('schedule-edit-popover');
    if (!popover) return;
    
    const closeBtn = document.getElementById('btn-close-schedule-popover');
    const cancelBtn = document.getElementById('btn-cancel-schedule');
    const saveBtn = document.getElementById('btn-save-schedule');
    const deleteBtn = document.getElementById('btn-delete-schedule');
    const titleInput = document.getElementById('schedule-title-input');
    const chips = popover.querySelectorAll('.category-chip');
    
    const closePopover = () => {
        popover.style.display = 'none';
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closePopover);
    if (cancelBtn) cancelBtn.addEventListener('click', closePopover);
    
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => {
                c.classList.remove('active');
                c.style.border = `1.5px solid var(--border-color)`;
                c.style.background = `var(--bg-color)`;
                c.style.color = `var(--text-secondary)`;
                c.style.fontWeight = '600';
            });
            
            chip.classList.add('active');
            const color = chip.getAttribute('data-color');
            chip.style.border = `1.5px solid ${color}`;
            chip.style.background = `rgba(${hexToRgb(color)}, 0.08)`;
            chip.style.color = color;
            chip.style.fontWeight = '700';
        });
    });
    
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const oldDayIdx = parseInt(popover.getAttribute('data-active-day'));
            const oldSlotIdx = parseInt(popover.getAttribute('data-active-slot'));
            const mondayStr = formatDate(getMondayOf(selectedDate));
            const oldSlotKey = `${mondayStr}:${oldDayIdx}-${oldSlotIdx}`;
            
            const title = titleInput.value.trim() || '개인 일정';
            const activeChip = popover.querySelector('.category-chip.active');
            const category = activeChip ? activeChip.getAttribute('data-category') : 'work';
            const color = activeChip ? activeChip.getAttribute('data-color') : '#3182f6';
            
            const memoInput = document.getElementById('schedule-memo-input');
            let memo = memoInput ? memoInput.innerHTML.trim() : '';
            const cleanText = memo.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
            if (cleanText.length === 0) {
                memo = '';
            }
            
            const startSelect = document.getElementById('schedule-start-select');
            const endSelect = document.getElementById('schedule-end-select');
            
            const startSlot = parseInt(startSelect.value);
            const endSlot = parseInt(endSelect.value);
            
            if (startSlot >= endSlot) {
                showToast("종료 시간은 시작 시간보다 늦어야 합니다.");
                return;
            }
            
            const newDayIdx = oldDayIdx; // Day is constant from clicked column
            if (!scheduleData[currentUserId]) scheduleData[currentUserId] = [];
            
            const userCustom = JSON.parse(localStorage.getItem('toss_user_custom_schedules') || '{}');

            // 1. Remove old selection if it was already busy
            const oldCustom = p1CustomSchedules[oldSlotKey];
            if (oldCustom) {
                let s = oldSlotIdx;
                while (s >= 0) {
                    const key = `${mondayStr}:${oldDayIdx}-${s}`;
                    if (p1CustomSchedules[key] && p1CustomSchedules[key].title === oldCustom.title) {
                        scheduleData[currentUserId] = scheduleData[currentUserId].filter(k => k !== key);
                        delete p1CustomSchedules[key];
                        delete userCustom[key];
                        s--;
                    } else {
                        break;
                    }
                }
                s = oldSlotIdx + 1;
                while (s < 9) {
                    const key = `${mondayStr}:${oldDayIdx}-${s}`;
                    if (p1CustomSchedules[key] && p1CustomSchedules[key].title === oldCustom.title) {
                        scheduleData[currentUserId] = scheduleData[currentUserId].filter(k => k !== key);
                        delete p1CustomSchedules[key];
                        delete userCustom[key];
                        s++;
                    } else {
                        break;
                    }
                }
            }
            
            // 2. Add the new specified range
            for (let s = startSlot; s < endSlot; s++) {
                const newKey = `${mondayStr}:${newDayIdx}-${s}`;
                if (!scheduleData[currentUserId].includes(newKey)) {
                    scheduleData[currentUserId].push(newKey);
                }
                const details = { title, category, color, memo };
                p1CustomSchedules[newKey] = details;
                userCustom[newKey] = details;
            }
            
            localStorage.setItem('toss_user_custom_schedules', JSON.stringify(userCustom));
            saveScheduleDataToLocalStorage();
            closePopover();
            renderWorkspaceCalendar();
            renderCalendar();
            calculateRecommendations();
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const oldDayIdx = parseInt(popover.getAttribute('data-active-day'));
            const oldSlotIdx = parseInt(popover.getAttribute('data-active-slot'));
            const mondayStr = formatDate(getMondayOf(selectedDate));
            const oldSlotKey = `${mondayStr}:${oldDayIdx}-${oldSlotIdx}`;
            
            const userCustom = JSON.parse(localStorage.getItem('toss_user_custom_schedules') || '{}');
            let confirmedKeys = JSON.parse(localStorage.getItem('toss_confirmed_meeting_keys') || '[]');
            const confirmedDetails = JSON.parse(localStorage.getItem('toss_confirmed_meetings_details') || '{}');

            const oldCustom = p1CustomSchedules[oldSlotKey];
            if (oldCustom) {
                let s = oldSlotIdx;
                while (s >= 0) {
                    const key = `${mondayStr}:${oldDayIdx}-${s}`;
                    if (p1CustomSchedules[key] && p1CustomSchedules[key].title === oldCustom.title) {
                        scheduleData[currentUserId] = scheduleData[currentUserId].filter(k => k !== key);
                        delete p1CustomSchedules[key];
                        delete userCustom[key];
                        confirmedKeys = confirmedKeys.filter(k => k !== key);
                        delete confirmedDetails[key];
                        s--;
                    } else {
                        break;
                    }
                }
                s = oldSlotIdx + 1;
                while (s < 9) {
                    const key = `${mondayStr}:${oldDayIdx}-${s}`;
                    if (p1CustomSchedules[key] && p1CustomSchedules[key].title === oldCustom.title) {
                        scheduleData[currentUserId] = scheduleData[currentUserId].filter(k => k !== key);
                        delete p1CustomSchedules[key];
                        delete userCustom[key];
                        confirmedKeys = confirmedKeys.filter(k => k !== key);
                        delete confirmedDetails[key];
                        s++;
                    } else {
                        break;
                    }
                }
            } else {
                if (scheduleData[currentUserId]) {
                    scheduleData[currentUserId] = scheduleData[currentUserId].filter(s => s !== oldSlotKey);
                }
                delete p1CustomSchedules[oldSlotKey];
                delete userCustom[oldSlotKey];
                confirmedKeys = confirmedKeys.filter(k => k !== oldSlotKey);
                delete confirmedDetails[oldSlotKey];
            }

            // Clean up toss_busy_slots_${p.id} for all participants!
            participants.forEach(p => {
                const pKey = `toss_busy_slots_${p.id}`;
                let pList = [];
                try {
                    const saved = localStorage.getItem(pKey);
                    pList = saved ? JSON.parse(saved) : [];
                } catch(e) {}
                const relativeSlot = `${oldDayIdx}-${oldSlotIdx}`;
                pList = pList.filter(s => s !== relativeSlot);
                localStorage.setItem(pKey, JSON.stringify(pList));
            });
            
            localStorage.setItem('toss_user_custom_schedules', JSON.stringify(userCustom));
            localStorage.setItem('toss_confirmed_meeting_keys', JSON.stringify(confirmedKeys));
            localStorage.setItem('toss_confirmed_meetings_details', JSON.stringify(confirmedDetails));
            saveScheduleDataToLocalStorage();
            closePopover();
            renderWorkspaceCalendar();
            renderCalendar();
            calculateRecommendations();
        });
    }
    


    // Autocomplete logic for mentions ('@') with Choseong (initial consonant) matching
    const memoInput = document.getElementById('schedule-memo-input');
    const autoList = document.getElementById('mention-autocomplete-list');
    
    if (memoInput && autoList) {
        let activeIdx = -1;
        let filteredMembers = [];
        let queryWord = '';
        
        function getChoseong(str) {
            const choseongs = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
            let result = "";
            for (let i = 0; i < str.length; i++) {
                const code = str.charCodeAt(i) - 0xAC00;
                if (code >= 0 && code <= 11172) {
                    result += choseongs[Math.floor(code / 588)];
                } else {
                    result += str.charAt(i);
                }
            }
            return result;
        }
        
        function getAllTeamMembers() {
            const list = [];
            const seen = new Set();
            
            // Add from participants array
            participants.forEach(p => {
                const name = p.name;
                if (!seen.has(name)) {
                    seen.add(name);
                    list.push({ name: name, avatarColor: p.avatarColor || '#3182f6' });
                }
            });
            
            // Add from PARTICIPANT_SCENARIO_ROSTER
            PARTICIPANT_SCENARIO_ROSTER.forEach(p => {
                const cleanName = p.name.replace(' · 나', ''); // clean name
                if (!seen.has(cleanName)) {
                    seen.add(cleanName);
                    list.push({ name: cleanName, avatarColor: p.avatarColor || '#3182f6' });
                }
            });
            
            return list;
        }

        function getSelectionTextBeforeCursor() {
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const container = range.startContainer;
                if (container.nodeType === Node.TEXT_NODE) {
                    const text = container.textContent;
                    const offset = range.startOffset;
                    return text.substring(0, offset);
                }
            }
            return '';
        }

        function renderAutocompleteList() {
            autoList.innerHTML = '';
            if (filteredMembers.length === 0) {
                autoList.style.display = 'none';
                return;
            }
            
            filteredMembers.forEach((m, idx) => {
                const item = document.createElement('div');
                item.className = 'mention-item' + (idx === activeIdx ? ' active' : '');
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.gap = '8px';
                item.style.padding = '6px 10px';
                item.style.cursor = 'pointer';
                item.style.fontSize = '11px';
                item.style.fontWeight = '600';
                item.style.color = 'var(--text-primary)';
                item.style.transition = 'background-color 0.15s';
                
                const initials = m.name.charAt(0);
                
                item.innerHTML = `
                    <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${m.avatarColor}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; flex-shrink: 0;">${initials}</div>
                    <span style="font-size: 11px; font-weight: 600; color: var(--text-primary); text-align: left;">${m.name}</span>
                `;
                
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                });
                
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectMember(m.name);
                });
                
                autoList.appendChild(item);
            });
            
            autoList.style.display = 'block';
        }

        function selectMember(name) {
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const container = range.startContainer;
                if (container.nodeType === Node.TEXT_NODE) {
                    const text = container.textContent;
                    const offset = range.startOffset;
                    const textBefore = text.substring(0, offset);
                    
                    const atIndex = textBefore.lastIndexOf('@');
                    if (atIndex !== -1) {
                        const beforeText = text.substring(0, atIndex);
                        
                        container.textContent = beforeText;
                        
                        let color = '#3182f6';
                        const pMatch = participants.find(p => p.name === name);
                        if (pMatch && pMatch.avatarColor) {
                            color = pMatch.avatarColor;
                        } else {
                            const scenarioMatch = PARTICIPANT_SCENARIO_ROSTER.find(p => p.name.replace(' · 나', '') === name);
                            if (scenarioMatch && scenarioMatch.avatarColor) {
                                color = scenarioMatch.avatarColor;
                            }
                        }
                        
                        let rgb = '49, 130, 246';
                        if (color.startsWith('#')) {
                            const hex = color.replace('#', '');
                            const r = parseInt(hex.substring(0, 2), 16);
                            const g = parseInt(hex.substring(2, 4), 16);
                            const b = parseInt(hex.substring(4, 6), 16);
                            rgb = `${r}, ${g}, ${b}`;
                        }
                        
                        const textCol = getDarkerColor(color);
                        const pill = document.createElement('span');
                        pill.className = 'mention-tag';
                        pill.contentEditable = 'false';
                        pill.style.cssText = `display: inline-block; background-color: rgba(${rgb}, 0.08); color: ${textCol}; padding: 1.5px 8px; border-radius: 9999px; font-weight: 700; font-size: 9.5px; border: 1px solid rgba(${rgb}, 0.25); margin: 2.5px 5px; vertical-align: middle; white-space: nowrap;`;
                        pill.innerText = name;
                        
                        const spaceNode = document.createTextNode('\u00A0');
                        
                        const parent = container.parentNode;
                        const nextSibling = container.nextSibling;
                        parent.insertBefore(pill, nextSibling);
                        parent.insertBefore(spaceNode, nextSibling);
                        
                        const newRange = document.createRange();
                        newRange.setStartAfter(spaceNode);
                        newRange.setEndAfter(spaceNode);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    }
                }
            }
            
            autoList.style.display = 'none';
            activeIdx = -1;
            memoInput.focus();
        }

        memoInput.addEventListener('input', (e) => {
            const textBeforeCaret = getSelectionTextBeforeCursor();
            const match = textBeforeCaret.match(/@([^\s]*)$/);
            if (match) {
                queryWord = match[1];
                const allMembers = getAllTeamMembers();
                
                const queryLower = queryWord.toLowerCase();
                const queryChoseong = getChoseong(queryLower);
                
                filteredMembers = allMembers.filter(m => {
                    const nameLower = m.name.toLowerCase();
                    if (nameLower.includes(queryLower)) return true;
                    
                    const nameChoseong = getChoseong(nameLower);
                    if (nameChoseong.includes(queryChoseong)) return true;
                    
                    return false;
                });
                
                activeIdx = filteredMembers.length > 0 ? 0 : -1;
                renderAutocompleteList();
            } else {
                autoList.style.display = 'none';
                filteredMembers = [];
                activeIdx = -1;
            }
        });

        memoInput.addEventListener('keydown', (e) => {
            if (autoList.style.display === 'block') {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    activeIdx = (activeIdx + 1) % filteredMembers.length;
                    renderAutocompleteList();
                    const activeItem = autoList.children[activeIdx];
                    if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    activeIdx = (activeIdx - 1 + filteredMembers.length) % filteredMembers.length;
                    renderAutocompleteList();
                    const activeItem = autoList.children[activeIdx];
                    if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
                } else if (e.key === 'Enter') {
                    if (activeIdx !== -1 && filteredMembers[activeIdx]) {
                        e.preventDefault();
                        selectMember(filteredMembers[activeIdx].name);
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    autoList.style.display = 'none';
                    activeIdx = -1;
                }
            }
        });

        // Trigger manual pill completion when user spacebars/enters after typing full tag
        memoInput.addEventListener('keyup', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    const container = range.startContainer;
                    if (container.nodeType === Node.TEXT_NODE) {
                        const text = container.textContent;
                        const offset = range.startOffset;
                        const textBefore = text.substring(0, offset - 1);
                        
                        const words = textBefore.split(/[\s\u00A0]+/);
                        const lastWord = words[words.length - 1];
                        if (lastWord && lastWord.startsWith('@')) {
                            const name = lastWord.substring(1);
                            const allMembers = getAllTeamMembers();
                            const member = allMembers.find(m => m.name === name);
                            if (member) {
                                const atIndex = textBefore.lastIndexOf(lastWord);
                                if (atIndex !== -1) {
                                    const beforeText = text.substring(0, atIndex);
                                    
                                    container.textContent = beforeText;
                                    
                                    const color = member.avatarColor;
                                    let rgb = '49, 130, 246';
                                    if (color.startsWith('#')) {
                                        const hex = color.replace('#', '');
                                        const r = parseInt(hex.substring(0, 2), 16);
                                        const g = parseInt(hex.substring(2, 4), 16);
                                        const b = parseInt(hex.substring(4, 6), 16);
                                        rgb = `${r}, ${g}, ${b}`;
                                    }
                                    
                                    const textCol = getDarkerColor(color);
                                    const pill = document.createElement('span');
                                    pill.className = 'mention-tag';
                                    pill.contentEditable = 'false';
                                    pill.style.cssText = `display: inline-block; background-color: rgba(${rgb}, 0.08); color: ${textCol}; padding: 1.5px 8px; border-radius: 9999px; font-weight: 700; font-size: 9.5px; border: 1px solid rgba(${rgb}, 0.25); margin: 2.5px 5px; vertical-align: middle; white-space: nowrap;`;
                                    pill.innerText = name;
                                    
                                    const spaceNode = document.createTextNode('\u00A0');
                                    
                                    const parent = container.parentNode;
                                    const nextSibling = container.nextSibling;
                                    parent.insertBefore(pill, nextSibling);
                                    parent.insertBefore(spaceNode, nextSibling);
                                    
                                    const newRange = document.createRange();
                                    newRange.setStartAfter(spaceNode);
                                    newRange.setEndAfter(spaceNode);
                                    sel.removeAllRanges();
                                    sel.addRange(newRange);
                                }
                            }
                        }
                    }
                }
            }
        });

        // Hide list on clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!autoList.contains(e.target) && e.target !== memoInput) {
                autoList.style.display = 'none';
                activeIdx = -1;
            }
        });
    }

    // Close if clicked outside
    document.addEventListener('click', (e) => {
        if (popover.style.display === 'block') {
            const isClickInside = popover.contains(e.target);
            const clickedCell = e.target.closest('.calendar-cell');
            if (!isClickInside && !clickedCell) {
                closePopover();
            }
        }
    });
}
