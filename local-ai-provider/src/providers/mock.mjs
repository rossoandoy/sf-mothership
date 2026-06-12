export const mockProvider = {
  id: 'mock',

  async complete(request) {
    const task = typeof request.task === 'string' ? request.task : 'unknown-task';
    const prompt = typeof request.prompt === 'string' ? request.prompt : '';
    const firstLine = prompt.split('\n').find((line) => line.trim())?.trim() ?? 'no prompt';

    return {
      content: [
        `[mock:${task}]`,
        firstLine,
        'This is a deterministic Local AI Provider response for development.',
      ].join('\n'),
      model: 'mock-local-ai',
    };
  },
};
