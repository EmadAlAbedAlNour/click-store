export const respondWithServiceResult = (res, result, options = {}) => {
  if (!result || typeof result !== 'object') {
    return res.status(500).json({ error: 'Invalid service response' });
  }

  const parsedStatus = Number(result.status);
  const status = Number.isFinite(parsedStatus) && parsedStatus > 0
    ? parsedStatus
    : result.ok
      ? 200
      : 500;

  if (!result.ok) {
    if (result.sendStatus) {
      return res.sendStatus(status);
    }

    const requestedKey = result.key || result.messageKey || options.errorKey || 'error';
    const responseKey = requestedKey === 'message' ? 'message' : 'error';
    return res.status(status).json({ [responseKey]: result.error || 'Unexpected error' });
  }

  return res.status(status).json(result.data);
};

export const respondWithCaughtError = (res, error, fallbackMessage = 'Unexpected error') => {
  const parsedStatus = Number(error?.status);
  const status = Number.isFinite(parsedStatus) && parsedStatus > 0 ? parsedStatus : 500;
  const message = typeof error?.message === 'string' && error.message.trim()
    ? error.message
    : fallbackMessage;

  return res.status(status).json({ error: message });
};
