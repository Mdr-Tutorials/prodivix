import { Command } from 'commander';

export const createExportCommand = (): Command =>
  new Command('export').description('export static site').action(() => {
    console.log('export 命令已连接');
  });
