import { fetchNcpSessionSkills } from './utils/ncp-session.utils';
import { goUsbAiClient } from './managers/client.manager';

vi.mock('./managers/client.manager', () => ({
  goUsbAiClient: {
    sessions: {
      listSkills: vi.fn()
    }
  }
}));

describe('api/ncp-session', () => {
  beforeEach(() => {
    vi.mocked(goUsbAiClient.sessions.listSkills).mockReset();
    vi.mocked(goUsbAiClient.sessions.listSkills).mockResolvedValue({
      sessionId: 'session-1',
      total: 0,
      refs: [],
      records: []
    });
  });

  it('does not send an empty projectRoot query when no override is provided', async () => {
    await fetchNcpSessionSkills('session-1', { projectRoot: null });

    expect(goUsbAiClient.sessions.listSkills).toHaveBeenCalledWith('session-1', { projectRoot: null });
  });

  it('sends projectRoot only when the override is non-empty', async () => {
    await fetchNcpSessionSkills('session-1', { projectRoot: ' /tmp/project-alpha ' });

    expect(goUsbAiClient.sessions.listSkills).toHaveBeenCalledWith('session-1', {
      projectRoot: ' /tmp/project-alpha '
    });
  });
});
