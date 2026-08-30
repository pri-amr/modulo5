import { sanitizeInput } from "@/utils/sanitizeInput";

describe("sanitizeInput", () => {
    it("recorta espacios y escapa contenido HTML potencialmente peligroso", () => {
        const raw = '  <script>alert("hola")</script>  ';

        const sanitized = sanitizeInput(raw);

        expect(sanitized).not.toContain("<script>");
        expect(sanitized).toBe(
            "&lt;script&gt;alert(&quot;hola&quot;)&lt;/script&gt;"
        );
    });
});
