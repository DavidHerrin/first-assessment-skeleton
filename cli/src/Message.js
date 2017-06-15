export class Message {
  static fromJSON (buffer) {
    return new Message(JSON.parse(buffer.toString()))
  }

  constructor ({ username, command, contents, timestamp }) {
    this.username = username
    this.command = command
    this.contents = contents
    this.timestamp = timestamp
  }

  toJSON () {
    return JSON.stringify({
      username: this.username,
      command: this.command,
      contents: this.contents,
      timestamp: this.timestamp
    })
  }

  toString () {
    const chalk = require('chalk')
    if (this.command === 'connect') {
      if (this.contents.substring(0, 5) === 'Error') {
        return (chalk.yellow)(`${this.timestamp}: ${this.contents}`)
      } else {
        return (chalk.yellow)(`${this.timestamp}: <${this.username}> has connected`)
      }
    }

    if (this.command === 'disconnect') {
      return (chalk.yellow)(`${this.timestamp}: <${this.username}> has disconnected`)
    }

    if (this.command === 'echo') {
      return (chalk.red)(`${this.timestamp}: <${this.username}> (echo): ${this.contents}`)
    }

    if (this.command === 'users') {
      return (chalk.blue)(`${this.timestamp}: currently connected users: ${this.contents}`)
    }

    if (this.command === 'broadcast') {
      return (chalk.magenta)(`${this.timestamp} <${this.username}> (all): ${this.contents}`)
    }

    if (this.command.charAt(0) === '@') {
      return (chalk.cyan)(`${this.timestamp} <${this.username}> (whisper): ${this.contents}`)
    }

    return this.contents
  }
}
