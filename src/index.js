const { Command } = require('commander');
const initCommand = require('./commands/init');
const newCommand = require('./commands/new');
const listCommand = require('./commands/list');
const generateCommand = require('./commands/generate');
const showCommand = require('./commands/show');
const configCommand = require('./commands/config');
const deleteCommand = require('./commands/delete');
const projectCommands = require('./commands/project');

const program = new Command();

program
  .name('vibe')
  .description('AI-assisted project tracking and feature development CLI')
  .version('1.0.0');

const registerCommand = (parent, cmd) => {
  const command = parent.command(cmd.command)
    .description(cmd.description)
    .action(cmd.action);

  if (cmd.subcommands && Array.isArray(cmd.subcommands)) {
    cmd.subcommands.forEach(sub => registerCommand(command, sub));
  }
};

const commands = [
  initCommand,
  newCommand,
  listCommand,
  generateCommand,
  showCommand,
  configCommand,
  deleteCommand,
  ...projectCommands
];

commands.forEach(cmd => registerCommand(program, cmd));

program.parse(process.argv);
