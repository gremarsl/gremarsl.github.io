#!/bin/bash
# Build gradient-map.html from gradient-map.md
# Usage: ./build.sh
# Converts markdown to HTML and wraps it in the site template.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MD_FILE="$SCRIPT_DIR/gradient-map.md"
HTML_FILE="$SCRIPT_DIR/gradient-map.html"

if [ ! -f "$MD_FILE" ]; then
    echo "Error: $MD_FILE not found"
    exit 1
fi

# Convert markdown body to HTML using pandoc
BODY=$(pandoc "$MD_FILE" \
    --from markdown \
    --to html5 \
    --no-highlight \
    2>/dev/null)

if [ $? -ne 0 ]; then
    echo "Error: pandoc conversion failed"
    exit 1
fi

# Extract the first h1 for the page title (fallback to default)
TITLE=$(echo "$BODY" | tr '\n' ' ' | grep -o '<h1[^>]*>[^<]*' | head -1 | sed 's/<h1[^>]*>//')
TITLE="${TITLE:-How is the Gradient Map Created?}"

# Build the full HTML page matching the site template
cat > "$HTML_FILE" << HTMLEOF
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <meta name="description"
        content="How elevation data and gradient maps work — from NASA's Digital Elevation Model to browser-rendered terrain visualisations.">
    <meta name="author" content="Marcel Utermann">
    <title>${TITLE} – Marcel Utermann</title>
    <link rel="stylesheet" href="../style.css">
</head>

<body>
    <header>
        <nav class="navmenu">
            <div class="nav-brand">
                <a href="../index.html">Marcel Utermann</a>
            </div>
            <div class="navlink">
                <a href="../index.html">About</a>
                <a href="../writings.html" class="current">Writings</a>
                <a href="../contact.html">Contact</a>
            </div>
        </nav>
    </header>

    <main>
        <article>
${BODY}
        </article>
    </main>

    <footer>
        <p style="text-align: center; font-size: 0.9rem; color: var(--text-muted); margin: 0;">
            © 2026 Marcel Utermann. Questions or feedback?
            <a href="https://github.com/gremarsl/gremarsl.github.io/issues" target="_blank" rel="noopener">Open a GitHub
                Issue</a>.
        </p>
        <p id="last-updated"
            style="text-align: center; font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;"></p>
        <script>
            const lastUpdate = new Date(document.lastModified);
            document.getElementById('last-updated').textContent =
                "Last updated: " + lastUpdate.toLocaleDateString();
        </script>
    </footer>
</body>

</html>
HTMLEOF

echo "✓ Built: $HTML_FILE"
echo "  Title: $TITLE"
echo "  Size:  $(wc -c < "$HTML_FILE") bytes"
