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

    // receive message from server and log to client
    server.on('data', (buffer) => {
      this.log(Message.fromJSON(buffer).toString())
      // if user was rejected by server then disconnect from client
      if (Message.fromJSON(buffer).command === 'connect' && Message.fromJSON(buffer).contents.substring(0, 5) === 'Error') {
        let command = 'disconnectdup'
        server.end(new Message({ username, command }).toJSON() + '\n')
      }
    })

    server.on('end', () => {
      cli.exec('exit')
    })
  })
  .action(function (input, callback) {
    // regular expression produces array of strings from space delimited string
    let [ command, ...rest ] = words(input, /[^\s]+/g)
    let contents = rest.join(' ')

    let commandFound = false
    // send message to server using JSON
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
    } else { // invalid command entered - use last good command
      // parsed command was actually part of contents
      contents = command + ' ' + contents
      command = lastCommand
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
