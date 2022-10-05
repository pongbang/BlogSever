var app = require('./app');
var http = require('http');
let webSocketServer = http.Server(app)
let socketIo = require('socket.io')
let io = socketIo(webSocketServer, { transports: ['websocket'] })
let { formatDate } = require('./core/util/util')

const users = {}

io.on('connection', (socket) => {
  //socket 对象就是 建立连接的会话对象
  //监听client客户端emit的message事件
  console.log('连接已经建立', `id:${socket.id}`)

  socket.on('online', ({ uid, nikname }) => {
    if (users[uid]) {
      //如果uid存在 说明已登录 
      users[uid].socket.disconnect()
    }
    users[uid] = {
      uid,
      nikname,
      socket: socket,
    }
    socket.uid = uid
    socket.ghost = false
  })

  //进入聊天室
  socket.on('enterChat', ({ uid = createTempId(), nikname }) => {
    //广播用户昵称进入聊天室
    io.sockets.emit('logged', nikname)
    //如果已登录用户
    if (users[uid]) {
      return
    }

    users[uid] = {
      uid,
      nikname,
      socket: socket,
    }
    socket.uid = uid
    socket.ghost = true
  })
  //离开聊天室
  socket.on('leaveChat', () => {
    let uid = socket.uid
    //如果是游客断开连接
    if (socket.ghost) {
      socket.disconnect()
      console.log('清除游客')
      //清除游客users
      delete users[uid]
    }
    io.sockets.emit('logout', users[uid]?.nikname)
  })
  //如果客户端断开连接
  socket.on('disconnect', () => {
    let uid = socket.uid
    delete users[uid]
  })

  socket.on('send', (msg) => {
    let nikname = users[socket['uid']]['nikname']
    console.log(socket.uid, Object.keys(users))
    socket.broadcast.emit('chat', {
      nikname,
      msg: msg,
      time: formatDate()
    })
  })

})

function createTempId () {
  return Date.now() + Math.random().toString(36).slice(-6)
}

webSocketServer.listen(8888, () => {
  console.log('websocket聊天室开启 端口8888')
})

module.exports = webSocketServer


/*
io socket服务对象
io.sockets 接入的socket - client客户端的所有会话对象
io.close 关闭socket服务
events
  io.on 监听事件
    connection client客户端建立ws连接
    disconnect client客户端断开ws连接
    disconnecting 断开中

  io.emit 触发事件
    自定义事件
socket 会话对象
  socket.id 会话id
  socket.client 会话客户端对象
  socket.send([…args][, ack])
    socket.emit('message',data)
    socket.on('message',(data)=>{

    })
  //监听事件
  socket.on('事件名称',(data)=>{
    //事件回调 data接收到的信息
  })
  //触发事件
  socket.emit('事件名称',信息)

  io.sockets.emit()
    向所有与socketIO server建立连接的客户端socket会话广播信息
  socket.broadcast.emit()
    该属性触发事件发出将仅向除了 发送方 以外的所有 客户端会话 广播事件数据。
*/
/*
  文字在线聊天室
  客户端
    昵称
      登录用户 (userInfo.nikname)
      未登录
        输入昵称
        建立连接
    信息输入
      input
    信息展示
      信息列表
        他人信息
        自身信息
        信息日期
        昵称
  服务端
    用户列表 clientList
      name:nikname
      socket:socket
*/
/*
  0. 登录或者进入聊天室建立会话
  1. 匿名和登录用户都可以使用聊天室
  2. 登录用户重复登录会关闭会话
  3. 用户退出聊天室不关闭会话

on
  1. online 用户登录 ({uid,nikename})
      创建user项 uid nikname socket
        user[uid]={
          id:uid,
          nikename
        }
        socket.uid = uid
        socket.ghost = false
  2. enterChat 进入聊天室 ({uid,nikename})
      1. 如果用户已登录 users[uid]
      2. 如果为游客 ({nikname})
        创建一个临时ID
        user[tempId] ={
          id:tempId,
          nikename
        }
        socket.uid = uid
        socket.ghost = true
  3. leaveChat 退出聊天室
        1. 如果是游客
          socket.disconnect
        2. 如果是用户
          广播用户离开聊天室
  4. 客户端断开连接
       delete users[socket.id]
        
*/