const {createHash} = require('node:crypto');
const fileSystem = require('node:fs/promises');
const path = require('node:path');
const {parse} = require('parse5');

const LOCAL_ASSET_ORIGIN = 'https://static.invalid';

function createScriptHash(content) {
    const digest = createHash('sha256').update(content).digest('base64');

    return `sha256-${digest}`;
}

function getAttributes(element) {
    const attributes = element.attrs || [];

    return Object.fromEntries(attributes.map(({name, value}) => [name, value]));
}

function collectElements(node) {
    const elements = [];

    if (node.tagName) {
        elements.push(node);
    }

    for (const childNode of node.childNodes || []) {
        elements.push(...collectElements(childNode));
    }

    return elements;
}

function isScriptPreload(element, attributes) {
    if (element.tagName !== 'link') {
        return false;
    }

    const isClassicScriptPreload = attributes.rel === 'preload' && attributes.as === 'script';
    const isModulePreload = attributes.rel === 'modulepreload';

    return isClassicScriptPreload || isModulePreload;
}

function resolveScriptFile(scriptSource, htmlFilename, outputDirectory) {
    const relativePagePath = path.relative(outputDirectory, htmlFilename).split(path.sep).join('/');
    const pageUrl = `${LOCAL_ASSET_ORIGIN}/${relativePagePath}`;
    const scriptUrl = new URL(scriptSource, pageUrl);

    if (scriptUrl.origin !== LOCAL_ASSET_ORIGIN || scriptUrl.search || scriptUrl.hash) {
        throw new Error(`Expected a local script file in ${htmlFilename}: ${scriptSource}`);
    }

    const decodedPathname = decodeURIComponent(scriptUrl.pathname);
    const scriptFilename = path.resolve(outputDirectory, `.${decodedPathname}`);
    const directoryPrefix = `${path.resolve(outputDirectory)}${path.sep}`;

    if (!scriptFilename.startsWith(directoryPrefix)) {
        throw new Error(`Script path escapes export directory: ${scriptSource}`);
    }

    return scriptFilename;
}

function createAttributeEdit(element, attributeName, attributeValue, html) {
    const location = element.sourceCodeLocation;
    const existingAttribute = location.attrs?.[attributeName];
    const attributeText = `${attributeName}="${attributeValue}"`;

    if (existingAttribute) {
        return {
            start: existingAttribute.startOffset,
            end: existingAttribute.endOffset,
            text: attributeText,
        };
    }

    const openingTag = location.startTag || location;
    // Keep attributes before the closing slash on tags ending in />.
    const closingLength = html[openingTag.endOffset - 2] === '/' ? 2 : 1;
    const insertionOffset = openingTag.endOffset - closingLength;

    return {
        start: insertionOffset,
        end: insertionOffset,
        text: ` ${attributeText}`,
    };
}

async function collectScriptChanges(elements, html, htmlFilename, outputDirectory) {
    const scriptHashes = new Set();
    const scriptAttributeEdits = [];

    for (const element of elements) {
        const attributes = getAttributes(element);
        const isScript = element.tagName === 'script';
        let scriptSource;

        if (isScript) {
            scriptSource = attributes.src;
        } else if (isScriptPreload(element, attributes)) {
            scriptSource = attributes.href;
        }

        if (scriptSource !== undefined) {
            const scriptFilename = resolveScriptFile(scriptSource, htmlFilename, outputDirectory);
            const scriptContent = await fileSystem.readFile(scriptFilename);
            const scriptHash = createScriptHash(scriptContent);

            scriptHashes.add(scriptHash);
            scriptAttributeEdits.push(createAttributeEdit(element, 'integrity', scriptHash, html));
            // Opaque-origin sandboxed frames need CORS for integrity-checked resources.
            scriptAttributeEdits.push(createAttributeEdit(element, 'crossorigin', 'anonymous', html));
        } else if (isScript) {
            const location = element.sourceCodeLocation;

            if (!location.endTag) {
                throw new Error(`Unclosed script in ${htmlFilename}`);
            }

            const scriptContent = html.slice(
                location.startTag.endOffset,
                location.endTag.startOffset,
            );

            scriptHashes.add(createScriptHash(scriptContent));
        }
    }

    return {scriptHashes, scriptAttributeEdits};
}

function createPolicy(scriptHashes) {
    const allowedHashes = [...scriptHashes].map((scriptHash) => `'${scriptHash}'`).join(' ');
    const directives = [
        `script-src ${allowedHashes} 'strict-dynamic'`,
        "object-src 'none'",
        "base-uri 'none'",
    ];

    return directives.join('; ');
}

function createMetadataEdits(elements, html, htmlFilename, policy) {
    const headElement = elements.find((element) => element.tagName === 'head');
    const headLocation = headElement?.sourceCodeLocation;

    if (!headLocation?.startTag) {
        throw new Error(`Missing explicit head element in ${htmlFilename}`);
    }

    const edits = [];
    let charsetDeclaration = '';

    for (const element of elements) {
        if (element.tagName !== 'meta') {
            continue;
        }

        const attributes = getAttributes(element);
        const location = element.sourceCodeLocation;
        const isExistingPolicy =
            attributes['http-equiv']?.toLowerCase() === 'content-security-policy';

        if (attributes.charset) {
            charsetDeclaration = html.slice(location.startOffset, location.endOffset);
        }

        // Replace existing metadata so rerunning the script does not duplicate it.
        if (attributes.charset || isExistingPolicy) {
            edits.push({start: location.startOffset, end: location.endOffset, text: ''});
        }
    }

    const policyMetaTag = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
    const insertionOffset = headLocation.startTag.endOffset;

    // Keep the charset within the first 1024 bytes and the policy before all resources.
    edits.push({
        start: insertionOffset,
        end: insertionOffset,
        text: charsetDeclaration + policyMetaTag,
    });

    return edits;
}

function applyHtmlEdits(html, edits) {
    // Work backwards so earlier offsets stay valid. Remove before inserting at the same offset.
    const orderedEdits = [...edits].sort((firstEdit, secondEdit) => {
        return secondEdit.start - firstEdit.start || secondEdit.end - firstEdit.end;
    });

    // Preserve original script bytes: reserializing HTML could invalidate their hashes.
    let updatedHtml = html;

    for (const edit of orderedEdits) {
        const beforeEdit = updatedHtml.slice(0, edit.start);
        const afterEdit = updatedHtml.slice(edit.end);

        updatedHtml = beforeEdit + edit.text + afterEdit;
    }

    return updatedHtml;
}

async function addContentSecurityPolicy(html, htmlFilename, outputDirectory) {
    const document = parse(html, {sourceCodeLocationInfo: true});
    const elements = collectElements(document);
    const {scriptHashes, scriptAttributeEdits} = await collectScriptChanges(
        elements,
        html,
        htmlFilename,
        outputDirectory,
    );
    const policy = createPolicy(scriptHashes);
    const metadataEdits = createMetadataEdits(elements, html, htmlFilename, policy);

    return applyHtmlEdits(html, [...scriptAttributeEdits, ...metadataEdits]);
}

async function collectHtmlFiles(directory) {
    const htmlFiles = [];
    const entries = await fileSystem.readdir(directory, {withFileTypes: true});

    for (const entry of entries) {
        const filename = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            const nestedHtmlFiles = await collectHtmlFiles(filename);

            htmlFiles.push(...nestedHtmlFiles);
        } else if (entry.isFile() && filename.endsWith('.html')) {
            htmlFiles.push(filename);
        }
    }

    return htmlFiles;
}

async function build() {
    const outputDirectory = path.resolve('out');
    const htmlFiles = await collectHtmlFiles(outputDirectory);

    if (htmlFiles.length === 0) {
        throw new Error(`No exported HTML found in ${outputDirectory}`);
    }

    // Validate every page and asset before changing any exported files.
    const updatedPages = await Promise.all(
        htmlFiles.map(async (filename) => {
            const originalHtml = await fileSystem.readFile(filename, 'utf8');
            const updatedHtml = await addContentSecurityPolicy(
                originalHtml,
                filename,
                outputDirectory,
            );

            return {filename, updatedHtml};
        }),
    );

    for (const {filename, updatedHtml} of updatedPages) {
        await fileSystem.writeFile(filename, updatedHtml);
    }

    process.stdout.write(`Added hash-based CSP to ${htmlFiles.length} exported HTML pages.\n`);
}

build().catch((error) => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
});
