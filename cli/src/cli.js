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
    })

    server.on('end', () => {
      cli.exec('exit')
    })
  })
  .action(function (input, callback) {
    let [ command, ...rest ] = words(input, /[^,]+/g)
    const contents = rest.join(' ')

    let commandFound = false
    if (command === 'disconnect') {
      server.end(new Message({ username, command }).toJSON() + '\n')
    } else if (command === 'echo') {
      server.write(new Message({ username, command, contents }).toJSON() + '\n')
      lastCommand = command
      commandFound = true
    } else if (command === 'users') {
      server.write(new Message({ username, command, contents }).toJSON() + '\n')
      lastCommand = command
      commandFound = true
    } else if (command === 'broadcast') {
      server.write(new Message({ username, command, contents }).toJSON() + '\n')
      lastCommand = command
      commandFound = true
    } else if (command.charAt(0) === '@') {
      server.write(new Message({ username, command, contents }).toJSON() + '\n')
      lastCommand = command
      commandFound = true
    }
    if (!commandFound) {
      command = lastCommand
      const [...rest] = words(input, /[^,]+/g)
      const contents = rest.join(' ')
      server.write(new Message({ username, command, contents }).toJSON() + '\n')
      if (command === 'echo') {
        server.write(new Message({ username, command, contents }).toJSON() + '\n')
      } else if (command === 'users') {
        server.write(new Message({ username, command, contents }).toJSON() + '\n')
      } else if (command === 'broadcast') {
        server.write(new Message({ username, command, contents }).toJSON() + '\n')
      } else if (command.charAt(0) === '@') {
        server.write(new Message({ username, command, contents }).toJSON() + '\n')
      }
    }

    callback()
  })
