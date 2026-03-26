#!/usr/bin/env node

const { startServer } = require('../src/server');

const PORT = process.env.PORT || 8787;

startServer(PORT);
