/**
 * Simple ora replacement for CommonJS compatibility
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
      process.stdout.write(`✓ ${text || this.text}\n`);
      this.isSpinning = false;
    }
    return this;
  }

  fail(text) {
    if (this.isSpinning) {
      process.stdout.write(`✗ ${text || this.text}\n`);
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
