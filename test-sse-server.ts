import express from 'express';
const app = express();
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write('data: {"status": "step 1"}\n\n');
  setTimeout(() => {
    res.write('data: {"status": "step 2"}\n\n');
    res.write('data: {"done": true}\n\n');
    res.end();
  }, 100);
});
const s = app.listen(3002, () => {
  fetch('http://localhost:3002/stream').then(async r => {
     const reader = r.body?.getReader();
     if(reader) {
       const decoder = new TextDecoder();
       while(true) {
         const {done, value} = await reader.read();
         if(done) break;
         console.log("CHUNK:", decoder.decode(value));
       }
     }
     s.close();
  });
});
