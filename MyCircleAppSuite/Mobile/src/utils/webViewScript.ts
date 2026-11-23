/**
 * Serializes a value into a JavaScript literal that is safe to embed inside an
 * inline <script> tag. JSON.stringify alone still emits `</script>`, which can
 * terminate the script element before the browser parses the literal.
 */
export const serializeForInlineScript = (value: unknown): string =>
    JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
