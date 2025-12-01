#!/usr/bin/env node

/**
 * Script para facilitar el despliegue manual a Firebase Hosting
 * 
 * Uso:
 *   npm run deploy
 * 
 * O ejecutar directamente:
 *   node deploy.js
 */

import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';

const log = {
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠'), msg),
};

async function deploy() {
  try {
    log.info('Iniciando despliegue a Firebase Hosting...\n');

    // 1. Verificar que existe firebase.json
    if (!fs.existsSync('firebase.json')) {
      log.error('firebase.json no encontrado');
      process.exit(1);
    }
    log.success('firebase.json encontrado');

    // 2. Verificar que existe dist/
    if (!fs.existsSync('dist')) {
      log.warning('dist/ no encontrado. Compilando proyecto...\n');
      log.info('Ejecutando: npm run build');
      execSync('npm run build', { stdio: 'inherit' });
    } else {
      log.success('dist/ encontrado');
    }

    // 3. Desplegar a Firebase
    log.info('\nEjecutando: firebase deploy --only hosting\n');
    execSync('firebase deploy --only hosting', { stdio: 'inherit' });

    log.success('\n✓ Despliegue completado exitosamente');
    log.info('URL: https://pos-restaurant-54706.web.app');
    log.info('\nTu aplicación está en vivo en Firebase Hosting.');

  } catch (error) {
    log.error('\nError durante el despliegue');
    console.error(error);
    process.exit(1);
  }
}

deploy();
