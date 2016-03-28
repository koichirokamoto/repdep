'use strict';

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

/* get path to package.json */
const sourceDir = process.argv.length === 3 ? process.argv[2] : __dirname;
const packageDir = path.join(path.resolve(sourceDir));
const packageJson = path.join(packageDir, 'package.json');
const nodeModules = path.join(packageDir, 'node_modules');

/**
 * @param prop property in package.json
 * @param json package.json's object
 */
const createInstallCommand = (prop, json) => {
  let command = 'npm install';

  if (prop === 'dependencies') {
    if (!(Object.keys(json).length > 0)) return [];
    command += ' --save';
  } else if (prop == 'devDependencies') {
    if (!(Object.keys(json).length > 0)) return [];
    command += ' --save-dev';
  }

  return command.split(' ').concat(Object.keys(json));
}

/**
 * @param cmdArray array of command
 */
const batchedSpawn = (cmdArray) => {
  if (cmdArray.length > 0) {
    cmdArray.forEach(cmd => {
      if (cmd.length <= 0) return;
      const inst = child_process.spawn(cmd[0], cmd.slice(1));
      inst.stdout.on('data', (data) => {
        console.log(`${data}`);
      });
      inst.on('close', (code) => {
        if (code === 0) {
          console.log('install is successfully finished.');
        } else {
          console.log('install is failed.');
        }
      });
      console.log('processing install...');
    });
  }
};

/**
 * main process
 */
const main = () => {
  fs.readFile(packageJson, (err, data) => {
    if (err) throw err;
    const json = JSON.parse(data);
    let dependencies = {};
    let devDependencies = {};

    if (json.hasOwnProperty('dependencies')) {
      dependencies = json['dependencies'];
      json['dependencies'] = {};
    }

    if (json.hasOwnProperty('devDependencies')) {
      devDependencies = json['devDependencies'];
      json['devDependencies'] = {};
    }

    fs.renameSync(packageJson, packageJson + '.old');

    fs.writeFileSync(packageJson, JSON.stringify(json));

    child_process.execSync('rm -rif ' + nodeModules);
    console.log('node_modules is successfully deleted.');

    batchedSpawn([createInstallCommand('dependencies', dependencies),
      createInstallCommand('devDependencies', devDependencies)]);
  })
};

main();
