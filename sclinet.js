// ！！！！很重要 应用系统间的3种通信方式   1. socket   2.共享内存   3.共享外存   本质上都是这3种方式

// 1.在数据处理程序中引入 socket.io-client 
var io = require('socket.io-client');
const async = require('async');
const moment = require('moment');
const redis = require('redis');

const {client,ip,pgPool} = require('./redis/index');

const domain = require('domain');
const debug = require('debug')('socket-client:main');

const user = require('./user');  // 处理数据，检测处理


var origin = io.connect(ip+'/', {reconnect: true});
var chatroom = io.connect(ip+'/chatroom', {reconnect: true});
var live = io.connect(ip+'/live', {reconnect: true});
var vod = io.connect(ip+'/vod', {reconnect: true});
var wechat = io.connect(ip+'/wechat', {reconnect: true});
var broadcast = io.connect(ip+'/broadcast', {reconnect: true});




var namBox = {
    ['/root']:origin,
    ['/chatroom']:chatroom,
    ['/live']:live,
    ['/vod']:vod,
    ['/wechat']:wechat,
    ['/broadcast']:broadcast
};

var reqDomain = domain.create();
reqDomain.on('error',function(err){
    console.log(err);
    try {
      var killTimer = setTimeout(function() {
          process.exit(1);
      },100);
      killTimer.unref();  
    } catch (e) {
      console.log('error when exit',e.stack);
    }
});


reqDomain.run(function(){
    compute();
});


process.on('uncaughtException',function(err) {
    console.log(err);
    try {
        var killTimer = setTimeout(function(){
            process.exit(1);
        },100)
    }catch (e) {
        console.log('error when exit',e.stack);
    }
});

function compute() {
    client.llen('message',function(error,count){
        if(error){
            console.log(error)
        }else{
            if(count) {
                popLogs();
                process.nextTick(compute);
            } else {
                setTimeout(function() {
                    compute();
                },100);
            }
        }
    })
}

function popLogs() {
    var time = moment().unix();
    console.log('---dealStart---',time);
    client.rpop('message',function(err,result){
        if(err){
            console.log(err);
        } else {
            var result = JSON.parse(result);
            try {
                var cid = result.cid
            } catch(e) {
                console.log('empty data cid',result);
                return;
            }
            // console.log('empty data cid',result);
            console.log('start'+'nsp:'+cid+'time:'+time);
            async.waterfall([
                function(done) {
                    user.messageDirty({msg:result.msg},function(err,res){
                        done(err,res);
                    })
                },
                function(res,done) {
                    user.messageValidate({msg:result.msg},function(err,res){
                        done(err,res);
                    });
                }
            ],function(err,res){
                   if(err) {
                       console.log('err!!!!',err,result);
                       namBox[cid].emit('messageError',err);
                   } else {
                    console.log(cid)
                       if(namBox[cid]) {
                        pgPool('INSERT INTO demo(message,createTime) values(?,?)',[result.msg,moment().unix()],function(err,results){
                            //do something
                            console.log('result.msg',result.msg)
                            if(err){
                                console.log(err)
                            }else {
                                namBox[cid].emit('redisCome', results.rows[0].out);
                                console.log(results.rows[0].out)
                            }                    
                        })
                       }
                   }
            })
            
        }
    })
}

// 2.用socket.io-client 模拟了一个，连接到主程序io中的客户端
// var socket = io.connect(ip+'/live', {reconnect: true}); 

// 3.通过这个模拟的客户端，与主程序通信
// socket.emit('redisCome', result);
