export type Language = 'en' | 'ko';

export const translations = {
    en: {
        appTitle: 'TodoApp',
        appSubtitle: 'A simple, fast, and elegant way to manage your tasks.',
        inputPlaceholder: 'What needs to be done?',
        searchPlaceholder: 'Search...',
        filterAll: 'All',
        filterToday: 'Today',
        shortcuts: 'Shortcuts: &uarr;&darr; to navigate, [space] to toggle, [e] to edit, [del] to delete.',
        addTodoHint: 'Press [Enter] in the input field to add a new todo.',
        importTitle: 'Import from AI Conversation',
        importBody: "Paste your conversation with the AI below. We'll extract the tasks for you.",
        importBtn: 'Import Tasks',
        pasteBtn: 'Paste from Clipboard',
        closeBtn: 'Close',
        toastAdded: 'Todo added successfully!',
        toastDeleted: 'Todo deleted.',
        toastUpdated: 'Todo updated.',
        toastImported: (count: number) => `Imported ${count} tasks!`,
        toastNoTasks: 'No tasks found in the text.',
        toastPasteFirst: 'Please paste some text first.',
        emptyState: 'No todos found. Try a different filter or create a new one!',
        themeToggleLabel: 'Toggle dark mode',
        langToggleLabel: 'Switch to Korean',
        importLabel: 'Import from AI',
        settingsTitle: 'Settings',
        apiKeyLabel: 'OpenAI API Key',
        apiKeyHint: 'Required for image and PDF analysis.',
        saveBtn: 'Save',
        dropZoneHint: 'Or drag & drop image/PDF here',
        browseBtn: 'Browse Files',
        detailDescription: 'Description',
        detailSource: 'Source',
        viewDetails: 'View Details',
        previewTitle: 'Source Preview'
    },
    ko: {
        appTitle: '투두앱',
        appSubtitle: '당신의 할 일을 관리하는 심플하고 우아한 방법.',
        inputPlaceholder: '무엇을 해야 하나요?',
        searchPlaceholder: '검색...',
        filterAll: '전체',
        filterToday: '오늘',
        shortcuts: '단축키: &uarr;&darr; 이동, [스페이스] 완료, [e] 수정, [del] 삭제.',
        addTodoHint: '입력창에서 [Enter]를 눌러 할 일을 추가하세요.',
        importTitle: 'AI 대화에서 가져오기',
        importBody: 'AI와의 대화 내용을 아래에 붙여넣으세요. 할 일을 자동으로 추출해 드립니다.',
        importBtn: '할 일 가져오기',
        pasteBtn: '클립보드에서 붙여넣기',
        closeBtn: '닫기',
        toastAdded: '할 일이 추가되었습니다!',
        toastDeleted: '할 일이 삭제되었습니다.',
        toastUpdated: '할 일이 수정되었습니다.',
        toastImported: (count: number) => `${count}개의 할 일을 가져왔습니다!`,
        toastNoTasks: '텍스트에서 할 일을 찾을 수 없습니다.',
        toastPasteFirst: '먼저 텍스트를 붙여넣어 주세요.',
        emptyState: '할 일이 없습니다. 필터를 변경하거나 새로 만들어보세요!',
        themeToggleLabel: '다크 모드 전환',
        langToggleLabel: '영어로 전환',
        importLabel: 'AI에서 가져오기',
        settingsTitle: '설정',
        apiKeyLabel: 'OpenAI API 키',
        apiKeyHint: '이미지 및 PDF 분석을 위해 필요합니다.',
        saveBtn: '저장',
        dropZoneHint: '또는 이미지/PDF를 여기로 드래그하세요',
        browseBtn: '파일 찾기',
        detailDescription: '상세 설명',
        detailSource: '출처',
        viewDetails: '자세히 보기',
        previewTitle: '원본 미리보기'
    }
};

const LANG_STORAGE_KEY = 'todo-app-lang';

export const getLanguage = (): Language => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language;
    if (saved) return saved;
    return 'ko'; // Default to Korean as requested
};

export const setLanguage = (lang: Language) => {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
};

export const t = (key: keyof typeof translations['en']): string => {
    const lang = getLanguage();
    let value = translations[lang][key];

    // Debugging: Log if key is missing
    if (!value) {
        console.warn(`Missing translation for key: ${key} in language: ${lang}`);
    }

    // Fallback to English if missing in current language
    if (!value && lang !== 'en') {
        value = translations['en'][key];
    }

    if (typeof value === 'function') {
        return value(0); // Default for function types if called without args, though usually called directly
    }
    return (value as string) || key;
};

// Helper for dynamic strings
export const tDynamic = (key: keyof typeof translations['en'], ...args: any[]): string => {
    const lang = getLanguage();
    const value = translations[lang][key];
    if (typeof value === 'function') {
        return (value as any)(...args);
    }
    return value as string;
}
