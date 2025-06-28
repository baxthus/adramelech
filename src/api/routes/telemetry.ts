import Elysia from 'elysia';

export default new Elysia({
  prefix: 'telemetry',
  tags: ['telemetry'],
  websocket: {
    idleTimeout: 30 + 10, // 30 seconds + 10 seconds grace period
    maxPayloadLength: 1024 * 1024, // 1 MB
  },
}).ws('/latency', {
  open(ws) {
    ws.subscribe('latency');

    ws.send({
      type: 'connected',
      message: 'Connection established',
    });
  },

  message(ws, message) {
    ws.send({
      type: 'ack',
      data: message,
    });
  },

  close(ws) {
    ws.unsubscribe('latency');
  },
});
