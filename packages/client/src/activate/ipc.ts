import { IPC, State, ipc, ipcB } from "../util";
import type { IPCBroadcastMsg, IPCServerMsg } from "@cloudmusic/shared";
import { ButtonManager } from "../manager";
import { IPCEvent } from "@cloudmusic/shared";
import type { PlayTreeItemData } from "../treeview";
import { QueueProvider } from "../treeview";
import { commands } from "vscode";
import { fork } from "child_process";
import { resolve } from "path";

const ipcHandler = (data: IPCServerMsg) => {
  switch (data.t) {
    case IPCEvent.Play.end:
      if (State.repeat) void IPC.load();
      else void commands.executeCommand("cloudmusic.next");
      break;
    case IPCEvent.Play.load:
      State.loading = false;
      break;
    case IPCEvent.Play.pause:
      ButtonManager.buttonPlay(false);
      break;
    case IPCEvent.Play.play:
      ButtonManager.buttonPlay(true);
      break;
    case IPCEvent.Play.volume:
      ButtonManager.buttonVolume(data.level);
      break;
  }
};

const ipcBHandler = (data: IPCBroadcastMsg) => {
  switch (data.t) {
    case IPCEvent.Play.repeat:
      ButtonManager.buttonRepeat(data.r);
      break;
    case IPCEvent.Queue.add:
      QueueProvider.addRaw(data.items as PlayTreeItemData[], data.index);
      break;
    case IPCEvent.Queue.clear:
      QueueProvider.clear();
      break;
    case IPCEvent.Queue.delete:
      QueueProvider.delete(data.id);
      break;
    case IPCEvent.Queue.new:
      QueueProvider.newRaw(data.items as PlayTreeItemData[], data.id);
      break;
    case IPCEvent.Queue.play:
      QueueProvider.top(data.id);
      break;
    case IPCEvent.Queue.shift:
      QueueProvider.shift(data.index);
      break;
    case IPCEvent.Queue.sort:
      QueueProvider.sort(data.type, data.order);
      break;
  }
};

export async function initIPC(): Promise<void> {
  try {
    const firstTry = await Promise.all([
      ipc.connect(ipcHandler),
      ipcB.connect(ipcBHandler),
    ]);
    if (firstTry.includes(false)) throw Error;
    return;
  } catch {}
  fork(resolve(__dirname, "server.js"), { detached: true, silent: true });
  try {
    const secondTry = await Promise.all([
      ipc.connect(ipcHandler),
      ipcB.connect(ipcBHandler),
    ]);
    if (secondTry.includes(false)) throw Error;
  } catch (err) {
    console.error(err);
  }
}
