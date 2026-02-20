const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const MarkdownIt = require('markdown-it');
const project = require('../core/project');

const md = new MarkdownIt();
const app = express();
const PORT = process.env.PORT || 3000;

const stripFrontmatter = (content) => {
  if (content.startsWith('---')) {
    const endOfFrontmatter = content.indexOf('---', 3);
    if (endOfFrontmatter !== -1) {
      return content.substring(endOfFrontmatter + 3).trim();
    }
  }
  return content;
};

app.get('/', async (req, res) => {
  try {
    const issues = await project.listIssues();
    const adrFiles = await fs.pathExists(project.ADR_DIR) ? await fs.readdir(project.ADR_DIR) : [];
    const logContent = await fs.pathExists(path.join(project.PROJECT_DIR, 'log.md'))
      ? await fs.readFile(path.join(project.PROJECT_DIR, 'log.md'), 'utf8')
      : '';

    let html = `
      <html>
        <head>
          <title>Project Tracker</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { border-bottom: 2px solid #eee; }
            .status-group { margin-bottom: 20px; }
            .status-title { font-weight: bold; text-transform: capitalize; background: #f4f4f4; padding: 5px 10px; }
            ul { list-style: none; padding: 0; }
            li { padding: 5px 10px; border-bottom: 1px solid #eee; }
            .log { background: #f9f9f9; padding: 10px; border: 1px solid #ddd; overflow-x: auto; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Project Tracker</h1>

          <h2>Issues</h2>
    `;

    for (const status of project.ISSUE_STATUSES) {
      const statusIssues = issues.filter(i => i.status === status);
      html += `
        <div class="status-group">
          <div class="status-title">${status}</div>
          <ul>
            ${statusIssues.map(i => `<li><a href="/issue/${status}/${i.file}">${i.file}</a></li>`).join('') || '<li>None</li>'}
          </ul>
        </div>
      `;
    }

    html += `
          <h2>ADRs</h2>
          <ul>
            ${adrFiles.filter(f => f.endsWith('.md')).map(f => `<li><a href="/adr/${f}">${f}</a></li>`).join('') || '<li>None</li>'}
          </ul>

          <h2>Log</h2>
          <div class="log">
            ${md.render(logContent)}
          </div>
        </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/issue/:status/:file', async (req, res) => {
  try {
    const { status, file } = req.params;
    if (!project.ISSUE_STATUSES.includes(status)) {
        return res.status(400).send('Invalid status');
    }
    const sanitizedFile = project.sanitizeFileName(file);
    const filePath = path.join(project.ISSUES_DIR, status, sanitizedFile);
    let content = await fs.readFile(filePath, 'utf8');
    content = stripFrontmatter(content);
    res.send(`
      <html>
        <head><style>body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }</style></head>
        <body>
          <a href="/">Back to Dashboard</a>
          ${md.render(content)}
        </body>
      </html>
    `);
  } catch (error) {
    res.status(404).send('Issue not found');
  }
});

app.get('/adr/:file', async (req, res) => {
  try {
    const { file } = req.params;
    const sanitizedFile = project.sanitizeFileName(file);
    const filePath = path.join(project.ADR_DIR, sanitizedFile);
    let content = await fs.readFile(filePath, 'utf8');
    content = stripFrontmatter(content);
    res.send(`
      <html>
        <head><style>body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }</style></head>
        <body>
          <a href="/">Back to Dashboard</a>
          ${md.render(content)}
        </body>
      </html>
    `);
  } catch (error) {
    res.status(404).send('ADR not found');
  }
});

const startUiServer = async () => {
  app.listen(PORT, () => {
    console.log(`✓ Web UI server running at http://localhost:${PORT}`);
  });
};

module.exports = { startUiServer };
