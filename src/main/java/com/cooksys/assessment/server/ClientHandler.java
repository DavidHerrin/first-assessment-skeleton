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
				Timestamp timestamp = new Timestamp(System.currentTimeMillis());
				message.setTimestamp(timestamp.toString());
				log.info("command <{}> sent", message.getCommand());
				String response;
				
				if (message.getCommand().charAt(0) == '@') {
			//		String[] chopCommand = message.getCommand().split("[@]", 2);
					log.info("user <{}> message <{}> to <{}>", message.getUsername(), message.getContents(), message.getCommand());
					if (clientList.containsKey(message.getCommand().substring(1))) {
			//			message.setContents(chopCommand[1]);
						PrintWriter dmWriter = new PrintWriter(new OutputStreamWriter((clientList.get(message.getCommand().substring(1))).getOutputStream()));
						response = mapper.writeValueAsString(message);
						dmWriter.write(response);
						dmWriter.flush();
					} else {
						message.setContents(message.getUsername() + " is not a valid user");
						response = mapper.writeValueAsString(message);
						writer.write(response);
						writer.flush();
					}
				}
				
				switch (message.getCommand()) {
					case "connect":
						log.info("user <{}> connected", message.getUsername());
						clientList.put(message.getUsername(), this.socket);
					    for (Socket value : clientList.values()) {
					        PrintWriter conWriter = new PrintWriter(new OutputStreamWriter((value).getOutputStream()));
					        response = mapper.writeValueAsString(message);
					        conWriter.write(response);
					        conWriter.flush();
					      }
						break;
					case "disconnect":
						log.info("user <{}> disconnected", message.getUsername());
						clientList.remove(message.getUsername());
						this.socket.close();
						for (Socket value : clientList.values()) {
					        PrintWriter disconWriter = new PrintWriter(new OutputStreamWriter((value).getOutputStream()));
					        response = mapper.writeValueAsString(message);
					        disconWriter.write(response);
					        disconWriter.flush();
					      }
						break;
					case "echo":
						log.info("user <{}> echoed message <{}>", message.getUsername(), message.getContents());
						response = mapper.writeValueAsString(message);
						writer.write(response);
						writer.flush();
						break;
					case "users":
						log.info("user <{}> users", message.getUsername());
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
