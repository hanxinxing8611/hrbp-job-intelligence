const http = require('http')

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ message: 'Hello from server!' }))
})

server.listen(3001, () => {
  console.log('Server running on http://localhost:3001')
})
