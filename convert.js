const fs = require('fs');
const path = require('path');

function styleStringToObjectString(styleString) {
    if (!styleString) return '{}';
    const rules = styleString.split(';');
    const obj = {};
    for (const rule of rules) {
        if (!rule.trim()) continue;
        const parts = rule.split(':');
        if (parts.length < 2) continue;
        const key = parts[0].trim();
        const val = parts.slice(1).join(':').trim();
        const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        obj[camelKey] = val.replace(/"/g, "'");
    }
    return JSON.stringify(obj);
}

function htmlToJsx(html) {
    let jsx = html;
    
    jsx = jsx.replace(/class="/g, 'className="');
    jsx = jsx.replace(/for="/g, 'htmlFor="');
    
    jsx = jsx.replace(/style="([^"]*)"/g, (match, styleString) => {
        return `style={${styleStringToObjectString(styleString)}}`;
    });
    
    jsx = jsx.replace(/<img([^>]*)>/g, (match, inner) => {
        if (inner.endsWith('/')) return match;
        return `<img${inner} />`;
    });
    jsx = jsx.replace(/<input([^>]*)>/g, (match, inner) => {
        if (inner.endsWith('/')) return match;
        return `<input${inner} />`;
    });
    jsx = jsx.replace(/<br>/g, '<br />');
    jsx = jsx.replace(/<hr>/g, '<hr />');
    
    jsx = jsx.replace(/onclick="[^"]*"/g, 'onClick={() => {}}');
    jsx = jsx.replace(/onmouseover="[^"]*"/g, 'onMouseOver={() => {}}');
    jsx = jsx.replace(/onmouseout="[^"]*"/g, 'onMouseOut={() => {}}');
    
    jsx = jsx.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    const bodyMatch = jsx.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
        jsx = bodyMatch[1];
    }
    
    jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');
    
    // Remove bad characters that break JSX like unescaped < or >
    // Wait, let's keep it simple.
    
    return `<>\n${jsx}\n</>`;
}

function convert(inputFile, outputDir, componentName) {
    const htmlPath = path.join(__dirname, '..', inputFile);
    if (!fs.existsSync(htmlPath)) return;
    const html = fs.readFileSync(htmlPath, 'utf-8');
    
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
    if (styleMatch) {
        const css = styleMatch[1];
        const globalsPath = path.join(__dirname, 'app', 'globals.css');
        fs.appendFileSync(globalsPath, `\n/* Styles from ${inputFile} */\n${css}\n`);
    }
    
    const jsx = htmlToJsx(html);
    
    const pageTsx = `'use client';\n\nimport Link from 'next/link';\nimport { useState, useEffect } from 'react';\n\nexport default function ${componentName}() {\n  return (\n    ${jsx}\n  );\n}`;
    
    const outPath = path.join(__dirname, 'app', outputDir);
    if (!fs.existsSync(outPath)) {
        fs.mkdirSync(outPath, { recursive: true });
    }
    fs.writeFileSync(path.join(outPath, 'page.tsx'), pageTsx);
    console.log(`Converted ${inputFile}`);
}

convert('admin.html', 'admin', 'AdminDashboard');
convert('technician.html', 'technician', 'TechnicianDashboard');
