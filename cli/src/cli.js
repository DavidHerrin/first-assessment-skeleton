import vorpal from 'vorpal'
import { words } from 'lodash'
import { connect } from 'net'
import { Message } from './Message'

export const cli = vorpal()

let username
let server
let host
let port
let lastCommand = 'notCommand'

cli
  .delimiter(cli.chalk['yellow']('ftd~$'))

cli
  .mode('connect <username> <host> <port>')
  .delimiter(cli.chalk['green']('connected>'))
  .init(function (args, callback) {
    username = args.username
    host = args.host
    port = args.port
//    server = connect({ host: 'localhost', port: 8080 }, () => {
    server = connect({ host: host, port: port }, () => {
      server.write(new Message({ username, command: 'connect' }).toJSON() + '\n')
      callback()
    })

    server.on('data', (buffer) => {
      this.log(Message.fromJSON(buffer).toString())
      if (Message.fromJSON(buffer).command === 'connect' && Message.fromJSON(buffer).contents.substring(0, 5) === 'Error') {
        cli.exec('exit')
      }
    })

    server.on('end', () => {
      cli.exec('exit')
    })
  })
  .action(function (input, callback) {
    let [ command, ...rest ] = words(input, /[^\s]+/g)
    let contents = rest.join(' ')

    this.log(`Command <${command}>  contents <${contents}>  user <${username}>`)

    let commandFound = false
    if (command === 'disconnect') {
      server.end(new Message({ username, command }).toJSON() + '\n')
      commandFound = true
    } else if (command === 'echo') {
      server.write(new Message({ username, command, contents }).toJSON() + '\n')
      commandFound = true
    } else if (command === 'users') {
      server.write(new Message({ username, command, contents }).toJSON() + '\n')
      commandFound = true
    } else if (command === 'broadcast') {
      server.write(new Message({ username, command, contents }).toJSON() + '\n')
      commandFound = true
    } else if (command.charAt(0) === '@') {
      server.write(new Message({ username, command, contents }).toJSON() + '\n')
      commandFound = true
    }

    if (commandFound) {
      lastCommand = command
    } else {
      contents = command + ' ' + contents
      command = lastCommand
  //    this.log(`Command <${command}>  contents <${contents}>  user <${username}>`)
      if (command === 'echo') {
        server.write(new Message({ username, command, contents }).toJSON() + '\n')
      } else if (command === 'users') {
        server.write(new Message({ username, command, contents }).toJSON() + '\n')
      } else if (command === 'broadcast') {
        server.write(new Message({ username, command, contents }).toJSON() + '\n')
      } else if (command.charAt(0) === '@') {
        server.write(new Message({ username, command, contents }).toJSON() + '\n')
      } else {
        this.log(`Command <${command}> was not recognized`)
      }
    }

    callback()
  })
