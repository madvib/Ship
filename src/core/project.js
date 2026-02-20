const fs = require('fs-extra');
const path = require('path');

const PROJECT_DIR = '.project';
const ADR_DIR = path.join(PROJECT_DIR, 'ADR');
const ISSUES_DIR = path.join(PROJECT_DIR, 'Issues');
const ISSUE_STATUSES = ['backlog', 'blocked', 'done', 'in-progress'];

const ISSUE_TEMPLATE = `---
title: {{title}}
status: {{status}}
created: {{createdAt}}
---

# {{title}}

## Description
{{description}}

## Tasks
- [ ] Initial task

## Links
-
`;

const ADR_TEMPLATE = `---
title: {{title}}
status: {{status}}
date: {{date}}
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
`;

const LOG_TEMPLATE = `# Project Log

| Date | Agent | Action | Details |
|------|-------|--------|---------|
`;

const sanitizeFileName = (name) => {
  return name.replace(/[\\/]/g, '_');
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
    await fs.writeFile(logPath, LOG_TEMPLATE);
  }
};

const createIssue = async (title, description, status = 'backlog') => {
  if (!ISSUE_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const fileName = sanitizeFileName(`${title.toLowerCase().replace(/\s+/g, '-')}.md`);
  const filePath = path.join(ISSUES_DIR, status, fileName);

  let content = ISSUE_TEMPLATE
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

  let content = ADR_TEMPLATE
    .replace(/{{title}}/g, title)
    .replace(/{{status}}/g, status)
    .replace(/{{date}}/g, new Date().toISOString());

  await fs.writeFile(filePath, content);
  return filePath;
};

const logAction = async (agent, action, details) => {
  const logPath = path.join(PROJECT_DIR, 'log.md');
  const date = new Date().toISOString();
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
  ISSUE_STATUSES,
  ISSUE_TEMPLATE,
  ADR_TEMPLATE,
  LOG_TEMPLATE,
  initProject,
  createIssue,
  moveIssue,
  createADR,
  logAction,
  listIssues,
  sanitizeFileName,
};
