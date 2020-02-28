const url = 'ws://100.115.92.198:8080';
const ui = document.querySelector('#ui');
let poll = null;

const socks = [];

window.socks = socks;
window.sockCreate = () => socks.push(createSock());

socks.push(createSock());
socks.push(createSock());

function createSock() {
    const ws = new WebSocket(url);
    const uuid = socks.length;
    const el = document.createElement('div');
    const input = document.createElement('input');

    el.id = 'x' + uuid;
    el.classList.add('sock', 'sock-' + uuid);

    ui.append(el);
    el.append(input);

    input.onkeydown = e => sendmessage(e, ws);
    ws.onclose = e => {
        console.log('CLOSE', e);
    };
    ws.onopen = e => {
        const {data} = e;
        console.log('OPEN', uuid, e);
    };
    ws.onmessage = e => {
        const text = document.createElement('div');
        let string = "";
        let {data} = e;

        if(typeof data !== "string") {
            console.warn("data not string", data);
            return;
        }

        if (/^hello/i.test(data)) {
            const [_, sid] = data.match(/@(.*)$/);

            string += (">>>>>> SID:" + sid + "<br>");
            ws.sid = sid;
            el.append(text);
        }

        string += uuid + '>' + data.replace(/([;:@])/g, '$1 ');
        text.innerHTML = string;

        el.append(text);
        console.log(uuid, e.data);
    };

    return ws;
}
function sendmessage(e, ws) {
    const {target, code} = e;
    const text = target.value;
    const id = `id=${ws.sid}&`;

    if (/enter/i.test(code) && text && text.length > 2) {
        e.target.value = '';
        ws.send(id + text);
        return;
    }
}
