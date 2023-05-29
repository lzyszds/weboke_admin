const express = require('express')
const path = require('path')
const server = express()
const adminRouter = require('./router/router')
const bodyParser = require("body-parser");



// 解析以 application/json 和 application/x-www-form-urlencoded 提交的数据
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
server.use(jsonParser)
server.use(urlencodedParser)

server.use((req, res, next) => {
  // res.header('Access-Control-Allow-Origin', '*')
  // res.header('Content-Type', 'application/json;charset=utf-8')
  //验证发送过来的数据是否为json格式,如果不是则将其转换成字符串
  if (req.headers['content-type'] === 'application/x-www-form-urlencoded;charset=UTF-8') {
    req.body = JSON.parse(req.body.para)
  }
  if (!req.body && typeof req.body === 'string') return res.send({ code: 204, message: '发送的参数错误' })
  next()
})

server.use('/admin', adminRouter)

server.use('/public', express.static('public'));//将文件设置成静态
server.listen(1027, () => {
  console.log('Server is running at http://localhost:1027')
})
