import { dateNowString, timeNowSeconds } from "../calculations"

var browser = require("webextension-polyfill")

export const SPLIT_PATH = /\\|\//g

let port = undefined

export function connectionOpened() {
    console.log("Connected")
}

export function connectionClosed() {
    console.log("Connection Lost")
}

export function messagingConnected(port_) {
    console.log("Messaging Connected: ", port_)
    port = port_

    port.onDisconnect.addListener(messagingDisconnected)
}

function messagingDisconnected(port_) {
    console.log("Messaging Disconnected: ", port_)

    if (port === port_) {
        port = undefined
    }
}

export async function dataFetched(event) {
    console.log(event)
    const listen_status = (await browser.storage.local.get("listen_status"))["listen_status"]
    if (listen_status === false) {
        return
    }

    // Start by getting a timestamp for accuracy
    const time = timeNowSeconds()
    const date = dateNowString()

    // Parse provided data
    const data = JSON.parse(event.data)
    console.log("Recieved Socket Data: ", data)
    
    // Lines will have a valid process path and sentence
    if (!data.hasOwnProperty("process_path") || !data.hasOwnProperty("sentence")) {
        return
    }

    let process_path = data["process_path"]
    const line = data["sentence"]

    // Only consider at max the last three sections of the path
    const path_segments = process_path.split(SPLIT_PATH)
    process_path = path_segments.slice(Math.max(0, path_segments.length - 3)).join("\/")

    await port.postMessage({
        "line": line,
        "process_path": process_path,
        "date": date,
        "time": time
    })
}
