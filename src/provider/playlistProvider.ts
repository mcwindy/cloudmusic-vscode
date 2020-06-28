import {
  Command,
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
} from "vscode";
import { PlaylistContent, PlaylistItem } from "../constant/type";
import { AccountManager } from "../api/accountManager";
import { PlaylistManager } from "../api/playlistManager";

export class PlaylistProvider
  implements TreeDataProvider<PlaylistItemTreeItem | PlaylistContentTreeItem> {
  private _onDidChangeTreeData: EventEmitter<
    PlaylistItemTreeItem | PlaylistContentTreeItem | undefined | void
  > = new EventEmitter<
    PlaylistItemTreeItem | PlaylistContentTreeItem | undefined | void
  >();

  readonly onDidChangeTreeData: Event<
    PlaylistItemTreeItem | PlaylistContentTreeItem | undefined | void
  > = this._onDidChangeTreeData.event;

  private accountManager: AccountManager = AccountManager.getInstance();
  private playlistManager: PlaylistManager = PlaylistManager.getInstance();

  constructor() {}

  refresh(element?: PlaylistItemTreeItem): void {
    if (element) {
      this._onDidChangeTreeData.fire(element);
    } else {
      this._onDidChangeTreeData.fire();
    }
  }

  getTreeItem(
    element: PlaylistItemTreeItem | PlaylistContentTreeItem
  ): TreeItem {
    return element;
  }

  getChildren(
    element?: PlaylistItemTreeItem | PlaylistContentTreeItem
  ): Thenable<PlaylistItemTreeItem[] | PlaylistContentTreeItem[]> {
    return element
      ? Promise.resolve(this.getPlaylistContent(element.item.id))
      : Promise.resolve(this.getPlaylistItem());
  }

  private async getPlaylistContent(
    id: number
  ): Promise<PlaylistContentTreeItem[]> {
    const songs = await this.playlistManager.tracks(id);
    return songs.map((song) => {
      return new PlaylistContentTreeItem(
        song.name,
        song,
        TreeItemCollapsibleState.None
      );
    });
  }

  private async getPlaylistItem(): Promise<PlaylistItemTreeItem[]> {
    const playlists = await this.accountManager.playlist();
    return playlists.map((playlist) => {
      return new PlaylistItemTreeItem(
        playlist.name,
        playlist,
        TreeItemCollapsibleState.Collapsed
      );
    });
  }
}

export class PlaylistItemTreeItem extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly item: PlaylistItem,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly command?: Command
  ) {
    super(label, collapsibleState);
  }

  get tooltip(): string {
    const { description, playCount, subscribedCount, trackCount } = this.item;
    return `
    ${description ? description : ""}
    ${trackCount}
    ${playCount}
    ${subscribedCount}
    `;
  }

  contextValue = "PlaylistItemTreeItem";
}

class PlaylistContentTreeItem extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly item: PlaylistContent,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly command?: Command
  ) {
    super(label, collapsibleState);
  }

  get tooltip(): string {
    return ``;
  }

  contextValue = "PlaylistContentTreeItem";
}
