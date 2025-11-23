export class AIParser {
    /**
     * Parses a raw string and extracts potential todo items.
     * Supports:
     * - Markdown checklists: - [ ] Task
     * - Bullet points: * Task, - Task
     * - Numbered lists: 1. Task
     * - "Todo:" prefix
     */
    static parseTasks(text: string): string[] {
        const lines = text.split('\n');
        const tasks: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // 1. Markdown Checklists: - [ ] Task, - [x] Task
            const checkboxMatch = trimmed.match(/^-\s*\[[ xX]?\]\s+(.+)$/);
            if (checkboxMatch) {
                tasks.push(checkboxMatch[1].trim());
                continue;
            }

            // 2. Explicit "Todo:" prefix
            if (trimmed.toLowerCase().startsWith('todo:')) {
                tasks.push(trimmed.substring(5).trim());
                continue;
            }

            // 3. Bullet points with "strong" action verbs or context (heuristic)
            // Matches: - Task, * Task
            const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
            if (bulletMatch) {
                tasks.push(bulletMatch[1].trim());
                continue;
            }

            // 4. Numbered lists
            // Matches: 1. Task
            const numberMatch = trimmed.match(/^\d+\.\s+(.+)$/);
            if (numberMatch) {
                tasks.push(numberMatch[1].trim());
                continue;
            }
        }

        return tasks;
    }
}
