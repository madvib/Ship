const fs = require('fs-extra');
const path = require('path');

const PROJECT_DIR = '.project';
const ADR_DIR = path.join(PROJECT_DIR, 'ADR');
const ISSUES_DIR = path.join(PROJECT_DIR, 'Issues');
const TEMPLATES_DIR = path.join(PROJECT_DIR, 'templates');
const ISSUE_STATUSES = ['backlog', 'blocked', 'done', 'in-progress'];

const DEFAULT_TEMPLATES = {
  'issue.md': `---
title: {{title}}
status: {{status}}
created: {{createdAt}}
links: []
---

# {{title}}

## Description
{{description}}

## Tasks
- [ ] Initial task

## Links
-
`,
  'adr.md': `---
title: {{title}}
status: {{status}}
date: {{date}}
links: []
---

# ADR: {{title}}

## Context
What is the problem we are solving?

## Decision
What is the decision we made?

## Status
{{status}}

## Consequences
What are the consequences of this decision?
`,
  'log_header.md': `# Project Log

| Date | Agent | Action | Details |
|------|-------|--------|---------|
`
};

const sanitizeFileName = (name) => {
  return name.replace(/[\\/]/g, '_');
};

const getTemplate = async (name) => {
  const customPath = path.join(TEMPLATES_DIR, name);
  if (await fs.pathExists(customPath)) {
    return await fs.readFile(customPath, 'utf8');
  }
  return DEFAULT_TEMPLATES[name];
};

const initProject = async () => {
  await fs.ensureDir(PROJECT_DIR);
  await fs.ensureDir(ADR_DIR);
  for (const status of ISSUE_STATUSES) {
    await fs.ensureDir(path.join(ISSUES_DIR, status));
  }

  const readmePath = path.join(PROJECT_DIR, 'README.md');
  if (!(await fs.pathExists(readmePath))) {
    await fs.writeFile(readmePath, '# Project Tracking\n\nManaged by vibe-cli.');
  }

  const logPath = path.join(PROJECT_DIR, 'log.md');
  if (!(await fs.pathExists(logPath))) {
    const header = await getTemplate('log_header.md');
    await fs.writeFile(logPath, header);
  }
};

const ejectTemplates = async () => {
  await fs.ensureDir(TEMPLATES_DIR);
  const ejected = [];
  for (const [name, content] of Object.entries(DEFAULT_TEMPLATES)) {
    const dest = path.join(TEMPLATES_DIR, name);
    if (!(await fs.pathExists(dest))) {
      await fs.writeFile(dest, content);
      ejected.push(dest);
    }
  }
  return ejected;
};

const createIssue = async (title, description, status = 'backlog') => {
  if (!ISSUE_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const fileName = sanitizeFileName(`${title.toLowerCase().replace(/\s+/g, '-')}.md`);
  const filePath = path.join(ISSUES_DIR, status, fileName);

  const template = await getTemplate('issue.md');
  let content = template
    .replace(/{{title}}/g, title)
    .replace(/{{description}}/g, description)
    .replace(/{{status}}/g, status)
    .replace(/{{createdAt}}/g, new Date().toISOString());

  await fs.writeFile(filePath, content);
  return filePath;
};

const moveIssue = async (issueFileName, currentStatus, newStatus) => {
  if (!ISSUE_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  const fileName = sanitizeFileName(issueFileName);
  const oldPath = path.join(ISSUES_DIR, currentStatus, fileName);
  const newPath = path.join(ISSUES_DIR, newStatus, fileName);

  if (!(await fs.pathExists(oldPath))) {
    throw new Error(`Issue not found: ${oldPath}`);
  }

  let content = await fs.readFile(oldPath, 'utf8');
  content = content.replace(/status: .*/, `status: ${newStatus}`);

  await fs.move(oldPath, newPath);
  await fs.writeFile(newPath, content);
  return newPath;
};

const createADR = async (title, decision, status = 'proposed') => {
  const fileName = sanitizeFileName(`${title.toLowerCase().replace(/\s+/g, '-')}.md`);
  const filePath = path.join(ADR_DIR, fileName);

  const template = await getTemplate('adr.md');
  let content = template
    .replace(/{{title}}/g, title)
    .replace(/{{status}}/g, status)
    .replace(/{{date}}/g, new Date().toISOString());

  await fs.writeFile(filePath, content);
  return filePath;
};

const addLink = async (filePath, targetPath) => {
  if (!(await fs.pathExists(filePath))) throw new Error(`File not found: ${filePath}`);

  let content = await fs.readFile(filePath, 'utf8');
  // Simple regex to find links array in frontmatter
  const linksMatch = content.match(/links: \[(.*)\]/);
  if (linksMatch) {
    const currentLinks = linksMatch[1].split(',').map(l => l.trim()).filter(l => l);
    if (!currentLinks.includes(`"${targetPath}"`)) {
      currentLinks.push(`"${targetPath}"`);
      content = content.replace(/links: \[.*\]/, `links: [${currentLinks.join(', ')}]`);
      await fs.writeFile(filePath, content);
    }
  }
};

const logAction = async (agent, action, details) => {
  const logPath = path.join(PROJECT_DIR, 'log.md');
  const date = new Date().toISOString();
  // Ensure we have a header if the file somehow doesn't exist
  if (!(await fs.pathExists(logPath))) {
    await initProject();
  }
  const entry = `| ${date} | ${agent} | ${action} | ${details} |\n`;
  await fs.appendFile(logPath, entry);
};

const listIssues = async () => {
  const issues = [];
  for (const status of ISSUE_STATUSES) {
    const statusDir = path.join(ISSUES_DIR, status);
    if (await fs.pathExists(statusDir)) {
      const files = await fs.readdir(statusDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          issues.push({ file, status });
        }
      }
    }
  }
  return issues;
};

module.exports = {
  PROJECT_DIR,
  ADR_DIR,
  ISSUES_DIR,
  TEMPLATES_DIR,
  ISSUE_STATUSES,
  initProject,
  ejectTemplates,
  createIssue,
  moveIssue,
  createADR,
  addLink,
  logAction,
  listIssues,
  sanitizeFileName,
};
