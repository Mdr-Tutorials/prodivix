import {
  DebugSession,
  InitializedEvent,
  TerminatedEvent,
  Thread,
} from '@vscode/debugadapter';
import type { DebugProtocol } from '@vscode/debugprotocol';

export class PIRDebugSession extends DebugSession {
  protected initializeRequest(
    response: DebugProtocol.InitializeResponse
  ): void {
    response.body = {
      supportsConfigurationDoneRequest: true,
      supportsTerminateRequest: true,
    };
    this.sendResponse(response);
    this.sendEvent(new InitializedEvent());
  }

  protected launchRequest(response: DebugProtocol.LaunchResponse): void {
    this.sendResponse(response);
  }

  protected configurationDoneRequest(
    response: DebugProtocol.ConfigurationDoneResponse
  ): void {
    this.sendResponse(response);
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
    response.body = { threads: [new Thread(1, 'PIR Runtime')] };
    this.sendResponse(response);
  }

  protected disconnectRequest(
    response: DebugProtocol.DisconnectResponse
  ): void {
    this.sendResponse(response);
    this.sendEvent(new TerminatedEvent());
  }

  protected terminateRequest(response: DebugProtocol.TerminateResponse): void {
    this.sendResponse(response);
    this.sendEvent(new TerminatedEvent());
  }
}

export const startDebugAdapter = () => DebugSession.run(PIRDebugSession);

if (require.main === module) {
  startDebugAdapter();
}
