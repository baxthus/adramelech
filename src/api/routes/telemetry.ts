import Elysia from 'elysia';

export default new Elysia({
  prefix: 'telemetry',
  tags: ['telemetry'],
  websocket: {
    idleTimeout: 30,
    maxPayloadLength: 1024 * 1024, // 1 MB
    backpressureLimit: 1024 * 1024 * 16, // 16 MB
    closeOnBackpressureLimit: false,
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
