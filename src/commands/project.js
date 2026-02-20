const inquirer = require('inquirer');
const chalk = require('chalk');
const project = require('../core/project');
const { main: startMcpServer } = require('../mcp/server');
const { startUiServer } = require('../ui/server');

const projectCommand = {
  command: 'project',
  description: 'Manage project tracking (Issues, ADRs, Log)',
  action: async () => {
    // This will be handled by subcommands if we use commander properly.
    // However, the current src/index.js has a simplified way to handle commands.
    // I will need to adjust src/index.js or handle subcommands here.
    console.log(chalk.blue('Project Tracking CLI'));
    console.log('Use "vibe project init" to start.');
  }
};

// I will define subcommands as separate exports or handle them in the action.
// Given how src/index.js works, I might need to register them individually or
// modify src/index.js to support subcommands.

// Let's look at src/index.js again.
// It registers each cmd.command.

const initProjectCommand = {
  command: 'project-init',
  description: 'Initialize project tracking structure',
  action: async () => {
    await project.initProject();
    console.log(chalk.green('✓ Project tracking structure initialized in .project/'));
  }
};

const createIssueCommand = {
  command: 'issue-create <title>',
  description: 'Create a new issue',
  action: async (title) => {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'description', message: 'Issue description:' },
      { type: 'list', name: 'status', message: 'Initial status:', choices: project.ISSUE_STATUSES, default: 'backlog' }
    ]);
    const filePath = await project.createIssue(title, answers.description, answers.status);
    console.log(chalk.green(`✓ Issue created: ${filePath}`));
  }
};

const moveIssueCommand = {
  command: 'issue-move <fileName> <currentStatus> <newStatus>',
  description: 'Move an issue to a new status',
  action: async (fileName, currentStatus, newStatus) => {
    try {
      const filePath = await project.moveIssue(fileName, currentStatus, newStatus);
      console.log(chalk.green(`✓ Issue moved to: ${filePath}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }
};

const createAdrCommand = {
  command: 'adr-create <title>',
  description: 'Create a new ADR',
  action: async (title) => {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'decision', message: 'Decision:' },
      { type: 'input', name: 'status', message: 'Status:', default: 'proposed' }
    ]);
    const filePath = await project.createADR(title, answers.decision, answers.status);
    console.log(chalk.green(`✓ ADR created: ${filePath}`));
  }
};

const startMcpCommand = {
  command: 'project-mcp',
  description: 'Start the Project Tracking MCP server (STDIO)',
  action: async () => {
    await startMcpServer();
  }
};

const startUiCommand = {
  command: 'project-ui',
  description: 'Start the Project Tracking Web UI',
  action: async () => {
    await startUiServer();
  }
};

module.exports = [
  initProjectCommand,
  createIssueCommand,
  moveIssueCommand,
  createAdrCommand,
  startMcpCommand,
  startUiCommand
];
