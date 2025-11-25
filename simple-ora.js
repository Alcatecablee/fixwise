/**
 * NeuroLint - Simple ora replacement for CommonJS compatibility
 * 
 * Copyright (c) 2025 NeuroLint
 * Licensed under the Business Source License 1.1
 * 
 * Use Limitation: You may not use this software to provide a commercial
 * SaaS offering that competes with NeuroLint's code transformation services.
 * 
 * Change Date: 2029-11-22
 * Change License: GPL-3.0-or-later
 * 
 * For commercial licensing: clivemakazhu@gmail.com
 * Full license: https://github.com/Alcatecablee/Neurolint/blob/main/LICENSE
 */

class SimpleSpinner {
  constructor(text) {
    this.text = text;
    this.isSpinning = false;
  }

  start() {
    this.isSpinning = true;
    process.stdout.write(`${this.text}...\n`);
    return this;
  }

  succeed(text) {
    if (this.isSpinning) {
      process.stdout.write(`[OK] ${text || this.text}\n`);
      this.isSpinning = false;
    }
    return this;
  }

  fail(text) {
    if (this.isSpinning) {
      process.stdout.write(`[ERROR] ${text || this.text}\n`);
      this.isSpinning = false;
    }
    return this;
  }

  warn(text) {
    if (this.isSpinning) {
      process.stdout.write(`⚠ ${text || this.text}\n`);
      this.isSpinning = false;
    }
    return this;
  }

  info(text) {
    if (this.isSpinning) {
      process.stdout.write(`ℹ ${text || this.text}\n`);
      this.isSpinning = false;
    }
    return this;
  }

  stop() {
    this.isSpinning = false;
    return this;
  }
}

module.exports = (text) => new SimpleSpinner(text);
