/**
 * Vercel Serverless Function: POST /api/lead
 * Подключается через файл api/lead.js в корне квиза (Vercel ищет функции только в папке api/).
 */
'use strict';

const { handleLead } = require('../lib/lead');

module.exports = async function (req, res) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }

  const result = await handleLead({ method: req.method, origin: req.headers.origin, body });
  Object.keys(result.headers).forEach((k) => res.setHeader(k, result.headers[k]));
  if (result.body === null) {
    res.status(result.status).end();
  } else {
    res.status(result.status).json(result.body);
  }
};
