#!/usr/bin/env node

const { parse } = require("./parse");
const { uuid } = require("./uuid")

console.log(typeof parse);

const WebSocket = require('ws');
const wsoptions = {port: 8080, clientTracking: true};
const wss = new WebSocket.Server(wsoptions);

const clients = [];
const rooms = {lobby: {}};


// wss.on('connection', connection);
wss.on('connection', (socket, request) => {
    console.log("new connection")
    return new Client(wss, socket, request, rooms);
})

class Client {
    constructor (connection, socket, request, rooms) {
        const { remoteAddress } = request.connection;
        const [ ipAddr ] = remoteAddress.match(/(\d+\.\d+\.\d+\.\d+)/);
        const id = uuid();

        this.id = id;
        this.ws = socket;
        this.conn = connection;
        this.request = request;
        this.ipAddr = ipAddr;
        this.room = "lobby"


        //
        this.parse = parse.bind(this);
        this.message = this.message.bind(this);

        const greeting = `hello ${ipAddr}@${id}`;

        socket.on("message", this.message);
        this.send(greeting);
    }


    message (payload) {
        console.log(this.parse);
        const object = this.parse(payload);
        const {key, value, to} = object;

        console.log(object);
    }

    send (string) {
        this.ws.send(string)
    }

}

function incoming(message, ws, svr) {
    // the message structure is querystring
    //

    echo(message);

    const object = parse(message);
    const {key, value, to} = object;

    switch (key) {
        case 'list':
            ws.send(list(value));
            break;

        case 'create':
            ws.send(create(value));
            ws.send(join(value, ws));
            break;

        case 'join':
            ws.send(join(value, ws));
            break;

        case 'say':
            // the value needs to recipients and a message
            // @value   String  text message
            // @to      CSV     session ids
            ws.send(say(value, to, ws, svr));
            break;

        default:
            console.log('Unknown', message);
            break;
    }
}


function say(text, to = "", ws, svr) {
    // the value needs to recipients and a message
    // @value   String  text message
    // @to      CSV     session ids
    const recp = to.split(/,/g);
    const kill = [];
    clients.forEach(client => {
        // if the client is not ready add to kill list
        const {conn} = client;
        if (conn.readyState !== 1) {
            conn.terminate();
            console.log("terminated", conn.uuid);
            return;
        }

        // don't talk to self
        if(conn === ws) return false;

        // find the id and send a messge
        console.log("saying", client.conn.readyState);
        client.conn.send(`key=msg&from=${ws.uuid}&value=${text}`);
    });
}

function echo(s) {
    console.log('LOG', s);
    return s;
}

function list(name = null) {
    // list the players in the room
    if (name && rooms[name]) {
        echo('list players executed ' + name);
        const users = Object.entries(rooms[name])
            .filter(([key, sock]) => {
                return sock.readyState === 1;
            })
            .map(([key, sock]) => key);

        return 'room:' + name + ';players:' + users.join(';');
    }

    // default lists all the rooms
    echo('list executed ' + name);
    const keys = Object.keys(rooms);
    return 'rooms:' + keys.join(';');
}

function create(name) {
    rooms[name] = rooms[name] || {};
    return 'created:' + name;
}

function join(name, ws) {
    const index = rooms[name] ? name : null;
    echo('join executed:' + name + '=' + index + '' + ws.uuid);
    if (!index) return `error:join;404;${name};${index}`;
    rooms[name][ws.uuid] = ws;

    const keys = Object.keys(rooms[name]);
    if (keys.length - 1) {
        keys.filter(o => o !== ws.uuid).forEach(user => {
            rooms[name][user].send('info:' + ws.uuid + ' has joined');
        });
    }

    return 'joined:' + name + ';count=' + keys.length;
}

