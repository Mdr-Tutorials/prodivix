import { Command } from 'commander';

export const createBuildCommand = (): Command =>
  new Command('build').description('build PIR → React').action(() => {
    console.log('build 命令已连接');
  });
