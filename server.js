let express = require('express');

let app = express();
let http = require('http').Server(app);
let path = require('path');
let io = require('socket.io')(http);
let redis = require('socket.io-redis');
let { client } = require('./redis/index');
let moment = require('moment');
 // 传入服务器，初始化socket实列
app.use(express.static(path.join(__dirname, 'public')));


io.adapter(redis({host:'localhost',port:6379}));

var nameBox = ['/chatroom','/live','/vod','/wechat','/broadcast'];

for(var item in nameBox){
  var nsp = io.of(nameBox[item])   // io.of  初始化命名空间
  socketMain(nsp,nameBox[item])
}

function socketMain(nsp,roomName) {
  nsp.on('connection',function (socket) {
      console.log('a user connected')
      socket.on('disconnect', function(){
          console.log('user disconnected');
      });
      socket.on('chat message', function(msg){
          var data = {"socketid":socket.id,"cid":roomName,"msg":msg,createTime:moment().unix()};
          client.lpush('message',JSON.stringify(data),redis.print) // 存入redis
          console.log('message: ' + msg);
      });
      /*接收redis发来的消息*/
      socket.on('redisCome',function (data) {
        console.log('-------------redisCome',data.msg);
        try{
            var msg = data.msg
        }catch(e){
            var msg = '';
        }
        console.log(data);
        nsp.emit('message.add',msg);
      });

      /*接收redis错误信息返回*/
      socket.on('messageError',function(err){
        console.log('messageError');
        try{
            nsp.emit('message.error',err.msg);
        }catch(e){

        }
      });

  })
}


//    io.emit(foo); //会触发所有客户端用户的foo事件
//    socket.emit(foo); //只触发当前客户端用户的foo事件
//    socket.broadcast.emit(foo); //触发除了当前客户端用户的其他用户的foo事件
// io.on('connection', function(socket){
//     console.log('a user connected');
//     socket.on('chat message', function(msg){
//         io.emit('chat message', msg);
//         console.log('msg',msg)
//       });
//     });


http.listen(3000);
console.log('app is running at port 3000');