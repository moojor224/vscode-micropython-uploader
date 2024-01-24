/**
 * @type {Object}
 * @property {function} getState
 * @property {function} setState
 * @property {function} postMessage
 */
let vscode = acquireVsCodeApi();
console.log("vscodeapi", vscode);
// vscode.postMessage({
//     a: 1,
//     b: 2
// });

let form = createElement("form");
let div = createElement("div").add(form);
function makeSerialTable(ports) {
    form.innerHTML = "";
    form.add(
        createElement("table", { classList: "ports" }).add(
            createElement("thead").add(
                createElement("label").add(
                    createElement("td"),
                    createElement("td", { innerHTML: "Port Name" }),
                    createElement("td", { innerHTML: "Friendly Name" }),
                    createElement("td", { innerHTML: "VID" }),
                    createElement("td", { innerHTML: "PID" })
                )
            ),
            createElement("tbody").add(
                ...ports.sort(dynamicSort("portName")).map(port =>
                    createElement("label").add(
                        createElement("td").add(
                            createElement("input", {
                                type: "radio",
                                value: port.portName,
                                name: "selected_port"
                            })
                        ),
                        createElement("td", { innerHTML: port.portName || "" }),
                        createElement("td", { innerHTML: port.friendlyName || "" }),
                        createElement("td", { innerHTML: port.vid || "" }),
                        createElement("td", { innerHTML: port.pid || "" })
                    )
                ),
            )
        )
    );
}


window.addEventListener("message",
    /**
     * @param  {MessageEvent} m
     */
    function (m) {
        console.log("received message from extension", m);
        let { message, data } = m.data;
        if (message === "serialPortsList") {
            // div.innerHTML = (JSON.stringify(data));
            makeSerialTable(data);
        }
    });

let loadButton = createElement("button", {
    innerHTML: "load serial ports list"
});

let pickButton = createElement("button", {
    innerHTML: "get chosen port",
    onclick: function () {
        console.log("picking");
        let formData = new FormData(form);
        console.log(formData.get("selected_port"));
    }
});

loadButton.addEventListener("click", function () {
    vscode.postMessage({
        message: "getSerialPorts"
    });
});

document.body.add(loadButton, pickButton, div);