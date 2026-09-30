export interface ServerStatus {
  online: boolean;
  players: number;
  maxPlayers: number;
  version: string;
  provider: string;
}

export interface GameServerProvider {
  status(): Promise<ServerStatus>;
  command(command: string): Promise<{ accepted: boolean; message: string }>;
}

/** Provider temporaneo: evita di simulare una connessione finché RCON/plugin non sono disponibili. */
class MockGameServerProvider implements GameServerProvider {
  async status(): Promise<ServerStatus> {
    return { online: false, players: 0, maxPlayers: 0, version: 'Evrima', provider: 'non configurato' };
  }
  async command(_command: string) {
    return { accepted: false, message: 'Configura un provider RCON o plugin prima di inviare comandi.' };
  }
}

// Sostituire questa istanza con RconGameServerProvider quando avrai host/password RCON.
export const gameServer: GameServerProvider = new MockGameServerProvider();
