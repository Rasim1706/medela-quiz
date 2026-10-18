/**
 * Netlify Function: POST /.netlify/functions/lead
 * В netlify.toml настроен редирект /api/lead → сюда, поэтому во фронтенде тот же endpoint '/api/lead'.
 */
'use strict';

const { handleLead } = require('../../lib/lead');

exports.handler = async function (event) {
  let body = null;
  try { body = JSON.parse(event.body || 'null'); } catch (e) { body = null; }

  const result = await handleLead({ method: event.httpMethod, origin: event.headers.origin, body });
  return {
    statusCode: result.status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, result.headers),
    body: result.body === null ? '' : JSON.stringify(result.body)
  };
};
