package com.cooksys.assessment.server;

import java.io.BufferedReader;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.Socket;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.cooksys.assessment.model.Message;
import com.fasterxml.jackson.databind.ObjectMapper;

public class ClientHandler implements Runnable {
	private Logger log = LoggerFactory.getLogger(ClientHandler.class);
	// maps user names to connection info
	public static Map<String, Socket> clientList = new HashMap<>();

	private Socket socket;

	public ClientHandler(Socket socket) {
		super();
		this.socket = socket;
	}

	public void run() {
		try {

			ObjectMapper mapper = new ObjectMapper();
			BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
			PrintWriter writer = new PrintWriter(new OutputStreamWriter(socket.getOutputStream()));

			while (!socket.isClosed()) {
				String raw = reader.readLine();
				Message message = mapper.readValue(raw, Message.class);
				// put timestamp in messages
				Timestamp timestamp = new Timestamp(System.currentTimeMillis());
				message.setTimestamp(timestamp.toString());
		
				String response;
				
				// sends a dm to another chat user
				if (message.getCommand().charAt(0) == '@') {
					log.info("user <{}> message <{}> to <{}>", message.getUsername(), message.getContents(), message.getCommand());
					// check if receiver of message is connected - substring to ignore '@' at start of command (name)
					if (clientList.containsKey(message.getCommand().substring(1))) {
						PrintWriter dmWriter = new PrintWriter(new OutputStreamWriter((clientList.get(message.getCommand().substring(1))).getOutputStream()));
						response = mapper.writeValueAsString(message);
						dmWriter.write(response);
						dmWriter.flush();
					} else {
						// send error message if name was typed incorrectly or is no longer connected
						message.setContents(message.getCommand() + " is not a valid user");
						response = mapper.writeValueAsString(message);
						writer.write(response);
						writer.flush();
					}
				}
				
				switch (message.getCommand()) {
					case "connect":
						// check if username is already in use
						if (clientList.containsKey(message.getUsername())) {
							log.info("user <{}> rejected", message.getUsername());
							message.setContents("Error: <" + message.getUsername() + "> is already in use. Please choose another username.");
							response = mapper.writeValueAsString(message);
							writer.write(response);
							writer.flush();
						} else {
							log.info("user <{}> connected", message.getUsername());
							// add user to hashmap
							clientList.put(message.getUsername(), this.socket);
							message.setContents("Success");
							// tell all connected clients about new client
							for (Socket value : clientList.values()) {
								PrintWriter conWriter = new PrintWriter(new OutputStreamWriter((value).getOutputStream()));
								response = mapper.writeValueAsString(message);
								conWriter.write(response);
								conWriter.flush();
							}
						}
						break;
					case "disconnect":
						this.socket.close();
						log.info("user <{}> disconnected", message.getUsername());
						clientList.remove(message.getUsername());
						// tell all connected clients about disconnect
						for (Socket value : clientList.values()) {
							PrintWriter disconWriter = new PrintWriter(new OutputStreamWriter((value).getOutputStream()));
							response = mapper.writeValueAsString(message);
							disconWriter.write(response);
							disconWriter.flush();
						}
						break;
					case "disconnectdup":
						// used when duplicate name attempts to connect
						this.socket.close();
						break;
					case "echo":
						log.info("user <{}> echoed message <{}>", message.getUsername(), message.getContents());
						response = mapper.writeValueAsString(message);
						writer.write(response);
						writer.flush();
						break;
					case "users":
						log.info("user <{}> listed users", message.getUsername());
						// get list of connected clients and format output with newline char
						List<String> userNames = new ArrayList<String>(clientList.keySet());
						String outNameList = "";
						for (String name : userNames) {
							outNameList += "\n" + "<" + name + ">";
						}
						message.setContents(outNameList);
						response = mapper.writeValueAsString(message);
						writer.write(response);
						writer.flush();
						break;
					case "broadcast":
						log.info("user <{}> broadcast <{}>", message.getUsername(), message.getContents());
						// send same message to all connected clients
						for (Socket value : clientList.values()) {
					        PrintWriter bcastWriter = new PrintWriter(new OutputStreamWriter((value).getOutputStream()));
					        response = mapper.writeValueAsString(message);
					        bcastWriter.write(response);
					        bcastWriter.flush();
					      }
						break;
				}
			}

		} catch (IOException e) {
			log.error("Something went wrong :/", e);
		}
	}

}
