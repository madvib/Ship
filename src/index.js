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
  .description('AI-assisted feature development CLI')
  .version('1.0.0');

let commands = [
  initCommand,
  newCommand,
  listCommand,
  generateCommand,
  showCommand,
  configCommand,
  deleteCommand,
];

if (Array.isArray(projectCommands)) {
  commands = commands.concat(projectCommands);
} else {
  commands.push(projectCommands);
}

commands.forEach(cmd => {
  program.command(cmd.command)
    .description(cmd.description)
    .action(cmd.action);
});

program.parse(process.argv);
