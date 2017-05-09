// NBK.io Bots [Server] by NEL99
const WebSocket = require("ws");
const Port = 8081;
const Socket_io = require("socket.io")(Port);
const Fs = require("fs");
const Socks = require("socks");
const Proxies = Fs.readFileSync("proxies.txt", "utf8").split("\n");
const Bots = [];
const Decrypt = require("atob");
var ServerIP = "";
var ClientX = 0;
var ClientY = 0;

function SendPacket(ws, packet){
	if(ws && ws.readyState !== WebSocket.OPEN) return;
	if(ws && ws.readyState == WebSocket.OPEN){
		ws.send(packet);
	}
}

function CreateAgent(id){
	var proxy = Proxies[~~(id / 2)].split(":");
	return new Socks.Agent({
		proxy: {
		    ipaddress: proxy[0],
		    port: parseInt(proxy[1]),
		    type: 5 
		}
	});
}

Socket_io.on("connection", (socket) => {
	console.log("[INFO]: WELCOME TO NBK.io BOTS BY NEL99");
	console.log("[INFO]: CLIENT CONNECTED");
	socket.on("serverIP", (server) => {
		ServerIP = server.ip;
	});
	socket.on("clientPosition", (client) => {
		ClientX = client.x;
		ClientY = client.y;
	});
	socket.on("split", () => {
		for(let i = 0; i < Bots.length; i++){
			Bots[i].SendAction("split");
		}
	});
	socket.on("eject", () => {
		for(let i = 0; i < Bots.length; i++){
			Bots[i].SendAction("eject");
		}
	});
});

class Cell {
	constructor(id){
		this.id = id;
		this.ws = null;
		this.CellName = null;
		this.headers = {
			'Origin': 'http://nbk.io',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
			'Accept-Language': 'pl-PL,pl;q=0.8,en-US;q=0.6,en;q=0.4,es-ES',
			'Accept-Encoding': 'gzip, deflate, sdch'
		};
		this.ConnectCell(ServerIP);
	}
	SendAction(action){
		if(action == "split"){
			SendPacket(this.ws, new Buffer([17]));
		}
		if(action == "eject"){
			SendPacket(this.ws, new Buffer([21]));
		}
	}
	ConnectCell(ip){
		this.ws = new WebSocket(ip, {
			headers: this.headers,
			agent: CreateAgent(this.id)
		});
		this.ws.binaryType = "nodebuffer";
		this.ws.onopen = this.Open.bind(this);
		this.ws.onerror = this.Error.bind(this);
	}
	SpawnCell(name){
		let buf = new Buffer(1 + 2 * name.length);
		buf.writeUInt8(0, 0);
		for(let i = 0; i < name.length; i++) buf.writeUInt16LE(name.charCodeAt(i), 1 + 2 * i);
		return buf
	}
	MoveCell(x, y){
		let buf = new Buffer(13);
		buf.writeUInt8(16, 0);
		buf.writeInt32LE(x, 1);
		buf.writeInt32LE(y, 5);
		buf.writeUInt32LE(0, 9);
		return buf
	}
	Open(){
		this.CellName = ["\x54\x6B\x56\x4D\x4F\x54\x6B\x67\x51\x6B\x39\x55\x49\x48\x77\x67"];
		this.CellName = this.CellName[0];
		SendPacket(this.ws, new Buffer([254, 5, 0, 0, 0]));
		SendPacket(this.ws, new Buffer([255, 0, 0, 0, 0]));
		setInterval(function(){
			SendPacket(this.ws, this.SpawnCell(Decrypt(this.CellName) + this.id));
		}.bind(this), 1000);
		setInterval(function(){
			SendPacket(this.ws, this.MoveCell(ClientX, ClientY));
		}.bind(this), 100);
	}
	Error(){
		setTimeout(function(){
			this.ConnectCell(ServerIP);
		}.bind(this), 1000);
	}
}

setTimeout(() => {
	for(let id = 0; id < Proxies.length * 2; id++){
	    Bots.push(new Cell(id));
    }
    console.log("[INFO]: BOTS CONNECTED");
}, 2000);