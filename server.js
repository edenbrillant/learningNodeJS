var express = require('express')
var bodyParer = require('body-parser')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongoose = require('mongoose')

mongoose.Promise = Promise
const dbUrl = require('./dburl').url

app.use(express.static(__dirname))
app.use(bodyParer.json())
app.use(bodyParer.urlencoded({extended: false}))

var Message = mongoose.model('Message', {
    name: String,
    message: String
})

app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages)
    })
    
})

app.get('/messages/:user', (req, res) => {
    var user = req.params.user
    Message.find({name: user}, (err, messages) => {
        res.send(messages)
    })
    
})

app.post('/messages', async (req, res) => {
    
    try{
        var message = new Message(req.body)
        var savedMessage = await message.save()

        console.log('saved')

        var censored = await Message.findOne({message: 'badword'})

        if(censored){
            await Message.remove({_id: censored.id})
        }
        else{
            io.emit('message', req.body)
        }
        res.sendStatus(200)

    } catch(err){
        res.sendStatus(500)
        return console.error(err)
    } finally {
        console.log('message post called')
    }
    
})

io.on('connection', (socket) => {
    console.log('a user connected')
})

mongoose.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
    console.log('mongodb connection', err)
})

var server = http.listen(3000, () => {
    console.log('server is listening on port', server.address().port)
})
