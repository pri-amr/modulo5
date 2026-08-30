const HTML_ESCAPES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
};

const escapeHtml = (value: string): string =>
    value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

export const sanitizeInput = (value: string): string =>
    escapeHtml(value.trim());
